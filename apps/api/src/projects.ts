import { D1ProjectStore, D1RepositoryStore, D1TaskStore } from "@cubo/database";
import { importInputSchema, projectInputSchema, projectUpdateSchema } from "@cubo/shared";
import { Hono } from "hono";
import { z } from "zod";
import { dispatchOutbox } from "./app";
import { ownerAuthorized } from "./auth";
import { containsSecret } from "./content-safety";
import type { Env } from "./env";
import { registerProviderRoutes } from "./project-providers";
import { generateProjectKey } from "./repository-keys";

export const projectRoutes = new Hono<{ Bindings: Env; Variables: { runnerId: string } }>();
projectRoutes.use("*", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  await next();
});
registerProviderRoutes(projectRoutes);
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
projectRoutes.get("/:id/repository", async (c) => {
  await new D1ProjectStore(c.env.DB).find(c.req.param("id"));
  const store = new D1RepositoryStore(c.env.DB),
    key = await store.key(c.req.param("id"));
  return c.json({
    key: key
      ? {
          id: key.id,
          publicKey: key.publicKey,
          fingerprint: key.fingerprint,
          createdAt: key.createdAt,
        }
      : null,
    encryptionConfigured: Boolean(c.env.PROJECT_ENCRYPTION_KEY),
    snapshot: await store.latest(c.req.param("id")),
    tasks: await store.tasks(c.req.param("id")),
  });
});
projectRoutes.post("/:id/repository-key", async (c) => {
  const project = await new D1ProjectStore(c.env.DB).find(c.req.param("id"));
  if (!project.repository)
    return c.json({ error: "Añade un repositorio al crear el proyecto." }, 409);
  if (!c.env.PROJECT_ENCRYPTION_KEY)
    return c.json({ error: "Cifrado de conexiones pendiente de configurar." }, 503);
  const key = await generateProjectKey(c.env.DB, project.id, c.env.PROJECT_ENCRYPTION_KEY);
  return c.json({
    key: {
      id: key.id,
      publicKey: key.publicKey,
      fingerprint: key.fingerprint,
      createdAt: key.createdAt,
    },
  });
});
projectRoutes.post("/:id/import", async (c) => {
  const project = await new D1ProjectStore(c.env.DB).find(c.req.param("id"));
  const input = z
    .object({ access: z.enum(["PUBLIC", "SSH"]) })
    .strict()
    .safeParse(await c.req.json());
  const key = z.uuid().safeParse(c.req.header("Idempotency-Key"));
  if (!input.success || !key.success)
    return c.json({ error: "Acceso o clave de importación inválidos." }, 400);
  if (!project.repository) return c.json({ error: "El proyecto no tiene repositorio." }, 409);
  const connection =
    input.data.access === "SSH" ? await new D1RepositoryStore(c.env.DB).key(project.id) : null;
  if (input.data.access === "SSH" && (!connection || !c.env.PROJECT_ENCRYPTION_KEY))
    return c.json({ error: "Configura la deploy key del proyecto antes de importar." }, 409);
  const task = await new D1TaskStore(c.env.DB).createTask(
    key.data,
    importInputSchema.parse({
      type: "REPOSITORY_IMPORT",
      projectId: project.id,
      repository: project.repository,
      access: input.data.access,
      keyId: connection?.id ?? null,
    }),
  );
  await dispatchOutbox(c.env);
  return c.json({ task }, 202);
});
