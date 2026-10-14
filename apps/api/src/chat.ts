import {
  D1ChatStore,
  D1ProjectStore,
  D1RepositoryStore,
  D1TaskStore,
  StoreError,
} from "@cubo/database";
import {
  type ChatTurnContext,
  chatMessageSchema,
  chatTurnInputSchema,
  conversationInputSchema,
  conversationUpdateSchema,
} from "@cubo/shared";
import { repositoryContextRole } from "@cubo/shared/repository-safety";
import { Hono } from "hono";
import { z } from "zod";
import { OpenRouterProvider } from "../../../packages/providers/src/openrouter";
import { dispatchOutbox } from "./app";
import { ownerAuthorized } from "./auth";
import { containsSecret } from "./content-safety";
import type { Env } from "./env";
import { providerConnection } from "./project-providers";

export const chatRoutes = new Hono<{ Bindings: Env; Variables: { runnerId: string } }>();
chatRoutes.use("*", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  const projectId = c.req.query("project");
  if (projectId !== undefined) {
    if (!z.uuid().safeParse(projectId).success) return c.json({ error: "Proyecto inválido." }, 400);
    await new D1ProjectStore(c.env.DB).find(projectId);
  }
  await next();
});
chatRoutes.get("/", async (c) =>
  c.json({ conversations: await new D1ChatStore(c.env.DB, c.req.query("project") ?? null).list() }),
);
// Owner navigation metadata only. Reading messages still requires the immutable project scope.
chatRoutes.get("/recent", async (c) =>
  c.json({ conversations: await new D1ChatStore(c.env.DB).recent() }),
);
chatRoutes.post("/", async (c) => {
  const key = z.uuid().safeParse(c.req.header("Idempotency-Key"));
  const input = conversationInputSchema.safeParse(await c.req.json());
  if (!key.success || !input.success)
    return c.json({ error: "Título o clave de creación inválidos." }, 400);
  if (containsSecret(input.data.title, c.env))
    return c.json({ error: "No incluyas credenciales en el chat." }, 400);
  return c.json(
    {
      conversation: await new D1ChatStore(c.env.DB, c.req.query("project") ?? null).create(
        key.data,
        input.data.title,
      ),
    },
    201,
  );
});
chatRoutes.get("/:id", async (c) =>
  c.json(await new D1ChatStore(c.env.DB, c.req.query("project") ?? null).detail(c.req.param("id"))),
);
chatRoutes.post("/:id/turn", async (c) => {
  const projectId = c.req.query("project");
  if (!projectId) throw new StoreError(400, "Abre un chat de proyecto para usar un proveedor.");
  const input = z
    .object({ content: z.string().trim().min(1).max(2000), model: z.string().min(1).max(180) })
    .strict()
    .safeParse(await c.req.json());
  const key = z.uuid().safeParse(c.req.header("Idempotency-Key"));
  if (!input.success || !key.success) throw new StoreError(400, "Mensaje o modelo inválido.");
  if (containsSecret(input.data.content, c.env))
    throw new StoreError(400, "No incluyas credenciales en el chat.");
  const store = new D1ChatStore(c.env.DB, projectId),
    detail = await store.detail(c.req.param("id"));
  const tasks = new D1TaskStore(c.env.DB),
    existing = await tasks.findTask(key.data);
  if (existing) {
    if (
      !("type" in existing.input) ||
      existing.input.type !== "CHAT_TURN" ||
      existing.input.projectId !== projectId ||
      existing.input.conversationId !== detail.conversation.id ||
      existing.input.model !== input.data.model ||
      detail.messages.find((m) => m.id === key.data)?.content !== input.data.content
    )
      throw new StoreError(409, "La clave corresponde a otro turno.");
    return c.json({ task: existing }, 202);
  }
  if (await store.activeTurn(detail.conversation.id))
    throw new StoreError(409, "Espera o detén el turno activo.");
  if (detail.messages.length > 198)
    throw new StoreError(429, "El chat alcanzó su límite de mensajes.");
  const connection = await providerConnection(c.env.DB, projectId);
  if (!connection || !c.env.PROJECT_ENCRYPTION_KEY)
    throw new StoreError(409, "Configura OpenRouter en este proyecto.");
  if (
    await c.env.DB.prepare(
      "SELECT 1 FROM tasks WHERE error='UNEXPECTED_PROVIDER_COST' AND json_extract(input,'$.projectId')=? AND json_extract(input,'$.provider')='openrouter' LIMIT 1",
    )
      .bind(projectId)
      .first()
  )
    throw new StoreError(
      409,
      "OpenRouter detenido para este proyecto por coste inesperado. Requiere revisión antes de continuar.",
    );
  let free = false;
  try {
    free = (await new OpenRouterProvider().freeModels()).some((m) => m.id === input.data.model);
  } catch {
    throw new StoreError(503, "No se pudo verificar el catálogo gratuito.");
  }
  if (!free) throw new StoreError(400, "Solo se permiten modelos gratuitos verificados.");
  const project = await new D1ProjectStore(c.env.DB).find(projectId),
    snapshot = await new D1RepositoryStore(c.env.DB).latest(projectId);
  const sources =
    snapshot?.files
      .filter((f) => repositoryContextRole(f.path))
      .map((f) => `${f.path}${f.truncated ? " (extracto)" : ""}:\n${f.content}`)
      .join("\n\n") ?? "";
  const system = `Eres el asistente de texto de Cubo para el proyecto ${project.name}. Este turno usa una API sin herramientas. No afirmes haber ejecutado comandos, editado archivos ni publicado cambios. El contexto importado es de solo lectura.\nInstrucciones adicionales:\n${project.instructions}\nMemoria adicional:\n${project.memory}\nDocumentos del repositorio ${snapshot?.revision ?? "sin importar"}:\n${sources}`;
  const history: ChatTurnContext["messages"] = [];
  let remaining = 12000 - input.data.content.length;
  for (const message of [...detail.messages].reverse()) {
    if (message.content.length > remaining) break;
    history.unshift({ role: message.role, content: message.content });
    remaining -= message.content.length;
  }
  const context: ChatTurnContext = {
    projectVersion: project.version,
    repositoryRevision: snapshot?.revision ?? null,
    messages: [
      { role: "system", content: system },
      ...history,
      { role: "user", content: input.data.content },
    ],
  };
  const task = await tasks.createTask(
    key.data,
    chatTurnInputSchema.parse({
      type: "CHAT_TURN",
      projectId,
      conversationId: detail.conversation.id,
      userMessageId: key.data,
      keyId: connection.id,
      provider: "openrouter",
      model: input.data.model,
    }),
    context,
  );
  await dispatchOutbox(c.env);
  return c.json({ task }, 202);
});
chatRoutes.put("/:id", async (c) => {
  const input = conversationUpdateSchema.safeParse(await c.req.json());
  if (!input.success) return c.json({ error: "Configuración de conversación inválida." }, 400);
  if (containsSecret(input.data.title, c.env))
    return c.json({ error: "No incluyas credenciales en el chat." }, 400);
  return c.json({
    conversation: await new D1ChatStore(c.env.DB, c.req.query("project") ?? null).update(
      c.req.param("id"),
      input.data.version,
      input.data.title,
      input.data.pinned,
    ),
  });
});
chatRoutes.delete("/:id", async (c) => {
  const input = z
    .object({ version: z.number().int().positive() })
    .strict()
    .safeParse(await c.req.json());
  if (!input.success) return c.json({ error: "Versión de conversación inválida." }, 400);
  await new D1ChatStore(c.env.DB, c.req.query("project") ?? null).remove(
    c.req.param("id"),
    input.data.version,
  );
  return c.json({ ok: true });
});
chatRoutes.post("/:id/messages", async (c) => {
  const key = z.uuid().safeParse(c.req.header("Idempotency-Key"));
  const input = chatMessageSchema.safeParse(await c.req.json());
  if (!key.success || !input.success)
    return c.json({ error: "Mensaje o clave inválidos. Máximo 2000 caracteres." }, 400);
  if (containsSecret(input.data.content, c.env))
    return c.json({ error: "No incluyas credenciales en el chat." }, 400);
  return c.json(
    await new D1ChatStore(c.env.DB, c.req.query("project") ?? null).append(
      c.req.param("id"),
      key.data,
      input.data.content,
    ),
    201,
  );
});
