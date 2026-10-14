import { D1ChatStore, D1ProjectStore } from "@cubo/database";
import { chatMessageSchema, conversationInputSchema, conversationUpdateSchema } from "@cubo/shared";
import { Hono } from "hono";
import { z } from "zod";
import { ownerAuthorized } from "./auth";
import { containsSecret } from "./content-safety";
import type { Env } from "./env";

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
