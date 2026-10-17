import { D1ProjectStore, StoreError } from "@cubo/database";
import {
  type ChatProviderAdapter,
  GeminiProvider,
  GroqProvider,
  NvidiaProvider,
  OpenRouterProvider,
} from "@cubo/providers";
import {
  type FreeModel,
  type ProviderQuota,
  type SupportedProvider,
  supportedProviders,
} from "@cubo/shared";
import { Hono } from "hono";
import { z } from "zod";
import { ownerAuthorized } from "./auth";
import type { Env } from "./env";
import { decryptSecret, encryptSecret } from "./secret-vault";

interface Connection {
  id: string;
  project_id: string | null;
  ciphertext: string;
  iv: string;
  created_at: string;
}

export function getProviderAdapter(provider: SupportedProvider): ChatProviderAdapter {
  switch (provider) {
    case "gemini":
      return new GeminiProvider();
    case "groq":
      return new GroqProvider();
    case "nvidia":
      return new NvidiaProvider();
    case "openrouter":
    default:
      return new OpenRouterProvider();
  }
}

export function validateProviderKeyPattern(provider: SupportedProvider, key: string): boolean {
  switch (provider) {
    case "gemini":
      return /^AIzaSy[A-Za-z0-9_-]{33}$/.test(key);
    case "groq":
      return /^gsk_[A-Za-z0-9]{48,64}$/.test(key);
    case "nvidia":
      return /^nvapi-[A-Za-z0-9_-]{30,120}$/.test(key);
    case "openrouter":
      return /^sk-or-v1-[A-Za-z0-9_-]{16,200}$/.test(key);
  }
}

export async function providerConnection(
  db: D1Database,
  projectId: string | null,
  provider: SupportedProvider = "openrouter",
): Promise<Connection | null> {
  const shared = await db
    .prepare(
      "SELECT id,NULL AS project_id,ciphertext,iv,created_at FROM provider_keys WHERE provider=?",
    )
    .bind(provider)
    .first<Connection>();
  if (shared) return shared;
  if (!projectId) return null;
  return db
    .prepare(
      "SELECT id,project_id,ciphertext,iv,created_at FROM project_provider_keys WHERE project_id=? AND provider=?",
    )
    .bind(projectId, provider)
    .first<Connection>();
}

export async function providerKey(
  env: Env,
  projectId: string | null,
  keyId: string,
  provider: SupportedProvider = "openrouter",
): Promise<string> {
  const row = await providerConnection(env.DB, projectId, provider);
  if (!row || row.id !== keyId || !env.PROJECT_ENCRYPTION_KEY)
    throw new StoreError(403, "Conexión de proveedor no autorizada.");
  return decryptSecret(
    row,
    env.PROJECT_ENCRYPTION_KEY,
    `${row.project_id ?? "global"}:${provider}:${row.id}`,
  );
}

const preferencesSchema = z
  .object({
    fallbackModel: z.string().max(180).default(""),
    noticeSeconds: z.number().int().min(10).max(180).default(30),
  })
  .strict();

export async function providerPreferences(db: D1Database) {
  const row = await db
    .prepare("SELECT value FROM app_settings WHERE id='chat'")
    .first<{ value: string }>();
  return preferencesSchema.parse(row ? JSON.parse(row.value) : {});
}

export async function providerBlocked(
  db: D1Database,
  projectId: string | null,
  provider: SupportedProvider = "openrouter",
): Promise<boolean> {
  return Boolean(
    await db
      .prepare(
        "SELECT 1 FROM tasks WHERE error='UNEXPECTED_PROVIDER_COST' AND json_extract(input,'$.provider')=? AND (? IS NULL OR json_extract(input,'$.projectId')=?) LIMIT 1",
      )
      .bind(provider, projectId, projectId)
      .first(),
  );
}

let catalog:
  | { expires: number; models: Awaited<ReturnType<OpenRouterProvider["freeModels"]>> }
  | undefined;

export async function freeModels(): Promise<FreeModel[]> {
  if (catalog && catalog.expires > Date.now()) return catalog.models;
  const models = await new OpenRouterProvider().freeModels();
  catalog = { models, expires: Date.now() + 60000 };
  return models;
}

export const globalProviderRoutes = new Hono<{ Bindings: Env; Variables: { runnerId: string } }>();

globalProviderRoutes.use("*", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  await next();
});

// Listado de todos los proveedores y su estado
globalProviderRoutes.get("/", async (c) => {
  const results = await Promise.all(
    supportedProviders.map(async (p) => {
      const row = await c.env.DB.prepare("SELECT id FROM provider_keys WHERE provider=?")
        .bind(p)
        .first<{ id: string }>();

      const adapter = getProviderAdapter(p);
      let models: FreeModel[] = [];
      let quota: ProviderQuota | null = null;
      let catalogAvailable = false;

      try {
        models = await adapter.freeModels();
        catalogAvailable = true;
      } catch {
        // preserve outage
      }

      if (row && c.env.PROJECT_ENCRYPTION_KEY) {
        try {
          const key = await providerKey(c.env, null, row.id, p);
          quota = await adapter.quota(key);
        } catch {
          // quota unavailable
        }
      }

      return {
        provider: p,
        name:
          p === "gemini"
            ? "Google Gemini"
            : p === "groq"
              ? "Groq Cloud"
              : p === "nvidia"
                ? "NVIDIA NIM"
                : "OpenRouter",
        configured: Boolean(row),
        encryptionConfigured: Boolean(c.env.PROJECT_ENCRYPTION_KEY),
        models,
        quota,
        catalogAvailable,
        freeOnly: true,
        blockedReason: (await providerBlocked(c.env.DB, null, p))
          ? "UNEXPECTED_PROVIDER_COST"
          : null,
      };
    }),
  );

  return c.json({ providers: results });
});

// Detalle de OpenRouter (compatibilidad exacta existente)
globalProviderRoutes.get("/openrouter", async (c) => {
  const row = await c.env.DB.prepare(
    "SELECT id FROM provider_keys WHERE provider='openrouter'",
  ).first<{ id: string }>();
  let models: Awaited<ReturnType<OpenRouterProvider["freeModels"]>> = [],
    quota = null,
    catalogAvailable = false;
  await Promise.all([
    freeModels()
      .then((m) => {
        models = m;
        catalogAvailable = true;
      })
      .catch(() => {}),
    row && c.env.PROJECT_ENCRYPTION_KEY
      ? providerKey(c.env, "", row.id, "openrouter")
          .then((key) => new OpenRouterProvider().quota(key))
          .then((q) => {
            quota = q;
          })
          .catch(() => {})
      : Promise.resolve(),
  ]);
  return c.json({
    provider: "openrouter",
    configured: Boolean(row),
    encryptionConfigured: Boolean(c.env.PROJECT_ENCRYPTION_KEY),
    models,
    quota,
    catalogAvailable,
    freeOnly: true,
    blockedReason: (await providerBlocked(c.env.DB, null, "openrouter"))
      ? "UNEXPECTED_PROVIDER_COST"
      : null,
    preferences: await providerPreferences(c.env.DB),
  });
});

globalProviderRoutes.put("/openrouter", async (c) => {
  if (!c.env.PROJECT_ENCRYPTION_KEY) throw new StoreError(503, "Cifrado pendiente de configurar.");
  const input = z
    .object({ key: z.string().regex(/^sk-or-v1-[A-Za-z0-9_-]{16,200}$/) })
    .strict()
    .safeParse(await c.req.json());
  if (!input.success) throw new StoreError(400, "Clave OpenRouter inválida.");
  try {
    await new OpenRouterProvider().quota(input.data.key);
  } catch {
    throw new StoreError(400, "OpenRouter no pudo validar esta clave. No se guardó.");
  }
  const id = crypto.randomUUID(),
    encrypted = await encryptSecret(
      input.data.key,
      c.env.PROJECT_ENCRYPTION_KEY,
      `global:openrouter:${id}`,
    );
  // Atomic guard: key rotation cannot race a newly queued turn.
  const result = await c.env.DB.prepare(
    "INSERT INTO provider_keys(id,provider,ciphertext,iv,created_at) SELECT ?,'openrouter',?,?,? WHERE NOT EXISTS(SELECT 1 FROM tasks WHERE status IN ('QUEUED','RUNNING') AND json_extract(input,'$.type')='CHAT_TURN') ON CONFLICT(provider) DO UPDATE SET id=excluded.id,ciphertext=excluded.ciphertext,iv=excluded.iv,created_at=excluded.created_at",
  )
    .bind(id, encrypted.ciphertext, encrypted.iv, new Date().toISOString())
    .run();
  if (!result.meta.changes)
    throw new StoreError(409, "Espera o detén los turnos activos antes de cambiar la clave.");
  return c.json({ configured: true });
});

globalProviderRoutes.put("/openrouter/preferences", async (c) => {
  const value = preferencesSchema.safeParse(await c.req.json());
  if (!value.success) throw new StoreError(400, "Preferencias inválidas.");
  if (
    value.data.fallbackModel &&
    !(await freeModels()).some((m) => m.id === value.data.fallbackModel)
  )
    throw new StoreError(400, "Respaldo gratuito no disponible.");
  await c.env.DB.prepare(
    "INSERT INTO app_settings(id,value) VALUES('chat',?) ON CONFLICT(id) DO UPDATE SET value=excluded.value",
  )
    .bind(JSON.stringify(value.data))
    .run();
  return c.json({ preferences: value.data });
});

// Rutas genéricas para cada proveedor: GET, PUT, DELETE
globalProviderRoutes.get("/:provider", async (c) => {
  const p = c.req.param("provider") as SupportedProvider;
  if (!supportedProviders.includes(p)) {
    return c.json({ error: "Proveedor no soportado." }, 404);
  }
  const row = await c.env.DB.prepare("SELECT id FROM provider_keys WHERE provider=?")
    .bind(p)
    .first<{ id: string }>();

  const adapter = getProviderAdapter(p);
  let models: FreeModel[] = [];
  let quota: ProviderQuota | null = null;
  let catalogAvailable = false;

  try {
    models = await adapter.freeModels();
    catalogAvailable = true;
  } catch {
    // catalog outage
  }

  if (row && c.env.PROJECT_ENCRYPTION_KEY) {
    try {
      const key = await providerKey(c.env, null, row.id, p);
      quota = await adapter.quota(key);
    } catch {
      // quota check failed
    }
  }

  return c.json({
    provider: p,
    name:
      p === "gemini"
        ? "Google Gemini"
        : p === "groq"
          ? "Groq Cloud"
          : p === "nvidia"
            ? "NVIDIA NIM"
            : "OpenRouter",
    configured: Boolean(row),
    encryptionConfigured: Boolean(c.env.PROJECT_ENCRYPTION_KEY),
    models,
    quota,
    catalogAvailable,
    freeOnly: true,
    blockedReason: (await providerBlocked(c.env.DB, null, p)) ? "UNEXPECTED_PROVIDER_COST" : null,
  });
});

globalProviderRoutes.put("/:provider", async (c) => {
  const p = c.req.param("provider") as SupportedProvider;
  if (!supportedProviders.includes(p)) {
    return c.json({ error: "Proveedor no soportado." }, 404);
  }
  if (!c.env.PROJECT_ENCRYPTION_KEY) throw new StoreError(503, "Cifrado pendiente de configurar.");

  const body = (await c.req.json()) as { key?: string };
  const rawKey = typeof body?.key === "string" ? body.key.trim() : "";

  if (!rawKey || !validateProviderKeyPattern(p, rawKey)) {
    throw new StoreError(400, `Clave de formato inválido para ${p}.`);
  }

  const adapter = getProviderAdapter(p);
  try {
    await adapter.quota(rawKey);
  } catch {
    throw new StoreError(400, `El proveedor ${p} no pudo validar esta clave. No se guardó.`);
  }

  const id = crypto.randomUUID();
  const encrypted = await encryptSecret(rawKey, c.env.PROJECT_ENCRYPTION_KEY, `global:${p}:${id}`);

  const result = await c.env.DB.prepare(
    "INSERT INTO provider_keys(id,provider,ciphertext,iv,created_at) SELECT ?,?,?,?,? WHERE NOT EXISTS(SELECT 1 FROM tasks WHERE status IN ('QUEUED','RUNNING') AND json_extract(input,'$.type')='CHAT_TURN') ON CONFLICT(provider) DO UPDATE SET id=excluded.id,ciphertext=excluded.ciphertext,iv=excluded.iv,created_at=excluded.created_at",
  )
    .bind(id, p, encrypted.ciphertext, encrypted.iv, new Date().toISOString())
    .run();

  if (!result.meta.changes) {
    throw new StoreError(409, "Espera o detén los turnos activos antes de cambiar la clave.");
  }

  return c.json({ configured: true, provider: p });
});

globalProviderRoutes.delete("/:provider", async (c) => {
  const p = c.req.param("provider") as SupportedProvider;
  if (!supportedProviders.includes(p)) {
    return c.json({ error: "Proveedor no soportado." }, 404);
  }
  await c.env.DB.prepare("DELETE FROM provider_keys WHERE provider=?").bind(p).run();
  return c.json({ configured: false, provider: p });
});

export function registerProviderRoutes(
  routes: Hono<{ Bindings: Env; Variables: { runnerId: string } }>,
): void {
  routes.get("/:id/providers/openrouter", async (c) => {
    const project = await new D1ProjectStore(c.env.DB).find(c.req.param("id"));
    const row = await providerConnection(c.env.DB, project.id, "openrouter"),
      provider = new OpenRouterProvider();
    const blocked = await providerBlocked(
      c.env.DB,
      row?.project_id === null ? null : project.id,
      "openrouter",
    );
    let quota = null,
      models: Awaited<ReturnType<OpenRouterProvider["freeModels"]>> = [],
      catalogAvailable = false;
    try {
      models = await freeModels();
      catalogAvailable = true;
    } catch {
      /* Provider outages must not invent model availability. */
    }
    if (row && c.env.PROJECT_ENCRYPTION_KEY && c.req.query("summary") !== "1") {
      try {
        quota = await provider.quota(await providerKey(c.env, project.id, row.id, "openrouter"));
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
      preferences: await providerPreferences(c.env.DB),
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
