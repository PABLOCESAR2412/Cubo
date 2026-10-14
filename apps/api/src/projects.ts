import { D1ProjectStore } from "@cubo/database";
import { projectInputSchema, projectUpdateSchema } from "@cubo/shared";
import { Hono } from "hono";
import { z } from "zod";
import { ownerAuthorized } from "./auth";
import { containsSecret } from "./content-safety";
import type { Env } from "./env";

export const projectRoutes = new Hono<{ Bindings: Env; Variables: { runnerId: string } }>();
projectRoutes.use("*", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  await next();
});
projectRoutes.get("/", async (c) =>
  c.json({ projects: await new D1ProjectStore(c.env.DB).list() }),
);
projectRoutes.get("/:id", async (c) =>
  c.json({ project: await new D1ProjectStore(c.env.DB).find(c.req.param("id")) }),
);
projectRoutes.post("/", async (c) => {
  const key = z.uuid().safeParse(c.req.header("Idempotency-Key"));
  const input = projectInputSchema.safeParse(await c.req.json());
  if (!key.success || !input.success)
    return c.json({ error: "Nombre, URL HTTPS de GitHub o clave inválidos." }, 400);
  if (containsSecret(`${input.data.name}\n${input.data.repository ?? ""}`, c.env))
    return c.json({ error: "No incluyas credenciales en el proyecto." }, 400);
  return c.json(
    {
      project: await new D1ProjectStore(c.env.DB).create(
        key.data,
        input.data.name,
        input.data.repository,
      ),
    },
    201,
  );
});
projectRoutes.put("/:id", async (c) => {
  const input = projectUpdateSchema.safeParse(await c.req.json());
  if (!input.success)
    return c.json(
      { error: "Datos inválidos. Instrucciones y memoria: máximo 3000 caracteres cada una." },
      400,
    );
  if (
    containsSecret([input.data.name, input.data.instructions, input.data.memory].join("\n"), c.env)
  )
    return c.json({ error: "No incluyas credenciales en instrucciones ni memoria." }, 400);
  return c.json({
    project: await new D1ProjectStore(c.env.DB).update(
      c.req.param("id"),
      input.data.version,
      input.data.name,
      input.data.instructions,
      input.data.memory,
    ),
  });
});
projectRoutes.delete("/:id", async (c) => {
  const input = z
    .object({ version: z.number().int().positive() })
    .strict()
    .safeParse(await c.req.json());
  if (!input.success) return c.json({ error: "Versión inválida." }, 400);
  await new D1ProjectStore(c.env.DB).remove(c.req.param("id"), input.data.version);
  return c.json({ ok: true });
});
