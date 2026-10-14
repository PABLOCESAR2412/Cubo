import { D1ProjectStore, StoreError } from "@cubo/database";
import type { Hono } from "hono";
import { z } from "zod";
import { OpenRouterProvider } from "../../../packages/providers/src/openrouter";
import type { Env } from "./env";
import { decryptSecret, encryptSecret } from "./secret-vault";

interface Connection {
  id: string;
  project_id: string;
  ciphertext: string;
  iv: string;
  created_at: string;
}
export async function providerConnection(
  db: D1Database,
  projectId: string,
): Promise<Connection | null> {
  return db
    .prepare(
      "SELECT id,project_id,ciphertext,iv,created_at FROM project_provider_keys WHERE project_id=? AND provider='openrouter'",
    )
    .bind(projectId)
    .first<Connection>();
}
export async function providerKey(env: Env, projectId: string, keyId: string): Promise<string> {
  const row = await providerConnection(env.DB, projectId);
  if (!row || row.id !== keyId || !env.PROJECT_ENCRYPTION_KEY)
    throw new StoreError(403, "Conexión de proveedor no autorizada.");
  return decryptSecret(row, env.PROJECT_ENCRYPTION_KEY, `${projectId}:openrouter:${row.id}`);
}
export function registerProviderRoutes(
  routes: Hono<{ Bindings: Env; Variables: { runnerId: string } }>,
): void {
  routes.get("/:id/providers/openrouter", async (c) => {
    const project = await new D1ProjectStore(c.env.DB).find(c.req.param("id"));
    const row = await providerConnection(c.env.DB, project.id),
      provider = new OpenRouterProvider();
    const blocked = await c.env.DB.prepare(
      "SELECT 1 FROM tasks WHERE error='UNEXPECTED_PROVIDER_COST' AND json_extract(input,'$.projectId')=? AND json_extract(input,'$.provider')='openrouter' LIMIT 1",
    )
      .bind(project.id)
      .first();
    let quota = null,
      models: Awaited<ReturnType<OpenRouterProvider["freeModels"]>> = [],
      catalogAvailable = false;
    try {
      models = await provider.freeModels();
      catalogAvailable = true;
    } catch {
      /* Provider outages must not invent model availability. */
    }
    if (row && c.env.PROJECT_ENCRYPTION_KEY) {
      try {
        quota = await provider.quota(await providerKey(c.env, project.id, row.id));
      } catch {
        /* Keep unknown quota explicit. */
      }
    }
    return c.json({
      provider: "openrouter",
      blockedReason: blocked ? "UNEXPECTED_PROVIDER_COST" : null,
      configured: Boolean(row),
      encryptionConfigured: Boolean(c.env.PROJECT_ENCRYPTION_KEY),
      models,
      catalogAvailable,
      quota,
      freeOnly: true,
    });
  });
  routes.put("/:id/providers/openrouter", async (c) => {
    const project = await new D1ProjectStore(c.env.DB).find(c.req.param("id"));
    if (!c.env.PROJECT_ENCRYPTION_KEY)
      throw new StoreError(503, "Cifrado pendiente de configurar.");
    const input = z
      .object({ key: z.string().regex(/^sk-or-v1-[A-Za-z0-9_-]{16,200}$/) })
      .strict()
      .safeParse(await c.req.json());
    if (!input.success) throw new StoreError(400, "Clave OpenRouter inválida.");
    const active = await c.env.DB.prepare(
      "SELECT 1 FROM tasks WHERE json_extract(input,'$.projectId')=? AND json_extract(input,'$.type')='CHAT_TURN' AND status IN ('QUEUED','RUNNING') LIMIT 1",
    )
      .bind(project.id)
      .first();
    if (active)
      throw new StoreError(409, "Detén los turnos del proyecto antes de cambiar la clave.");
    try {
      await new OpenRouterProvider().quota(input.data.key);
    } catch {
      throw new StoreError(400, "OpenRouter no pudo validar esta clave. No se guardó.");
    }
    const id = crypto.randomUUID(),
      encrypted = await encryptSecret(
        input.data.key,
        c.env.PROJECT_ENCRYPTION_KEY,
        `${project.id}:openrouter:${id}`,
      );
    await c.env.DB.prepare(
      "INSERT INTO project_provider_keys(id,project_id,provider,ciphertext,iv,created_at) VALUES(?,?,'openrouter',?,?,?) ON CONFLICT(project_id,provider) DO UPDATE SET id=excluded.id,ciphertext=excluded.ciphertext,iv=excluded.iv,created_at=excluded.created_at",
    )
      .bind(id, project.id, encrypted.ciphertext, encrypted.iv, new Date().toISOString())
      .run();
    return c.json({ configured: true });
  });
}
