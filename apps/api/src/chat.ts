import { D1ChatStore } from "@cubo/database";
import { chatMessageSchema, conversationInputSchema, conversationUpdateSchema } from "@cubo/shared";
import { Hono } from "hono";
import { z } from "zod";
import { ownerAuthorized } from "./auth";
import type { Env } from "./env";

export const chatRoutes = new Hono<{ Bindings: Env; Variables: { runnerId: string } }>();
chatRoutes.use("*", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  await next();
});
function containsSecret(text: string, env: Env): boolean {
  return (
    [env.GITHUB_TOKEN, env.OWNER_PASSWORD, env.SESSION_SECRET].some(
      (value) => !!value && text.includes(value),
    ) ||
    /(?:github_pat_|gh[pousr]_|sk-(?:proj-)?)[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
      text,
    )
  );
}
chatRoutes.get("/", async (c) => c.json({ conversations: await new D1ChatStore(c.env.DB).list() }));
chatRoutes.post("/", async (c) => {
  const key = z.uuid().safeParse(c.req.header("Idempotency-Key"));
  const input = conversationInputSchema.safeParse(await c.req.json());
  if (!key.success || !input.success)
    return c.json({ error: "Título o clave de creación inválidos." }, 400);
  if (containsSecret(input.data.title, c.env))
    return c.json({ error: "No incluyas credenciales en el chat." }, 400);
  return c.json(
    { conversation: await new D1ChatStore(c.env.DB).create(key.data, input.data.title) },
    201,
  );
});
chatRoutes.get("/:id", async (c) =>
  c.json(await new D1ChatStore(c.env.DB).detail(c.req.param("id"))),
);
chatRoutes.put("/:id", async (c) => {
  const input = conversationUpdateSchema.safeParse(await c.req.json());
  if (!input.success) return c.json({ error: "Configuración de conversación inválida." }, 400);
  if (containsSecret(input.data.title, c.env))
    return c.json({ error: "No incluyas credenciales en el chat." }, 400);
  return c.json({
    conversation: await new D1ChatStore(c.env.DB).update(
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
  await new D1ChatStore(c.env.DB).remove(c.req.param("id"), input.data.version);
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
    await new D1ChatStore(c.env.DB).append(c.req.param("id"), key.data, input.data.content),
    201,
  );
});
