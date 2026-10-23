import {
  generateSuggestions,
  generateTaskProposal,
  ProviderRequestError,
  synthesizeProjectMemory,
} from "@cubo/providers";
import { type SupportedProvider, supportedProviders } from "@cubo/shared";
import { Hono } from "hono";
import { z } from "zod";
import { ownerAuthorized } from "./auth";
import type { Env } from "./env";
import { getProviderAdapter, providerConnection, providerKey } from "./project-providers";

export const aiRoutes = new Hono<{ Bindings: Env; Variables: { runnerId: string } }>();

aiRoutes.use("*", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  await next();
});

async function getActiveAiProvider(
  env: Env,
  preferred?: SupportedProvider,
  model?: string,
): Promise<{
  adapter: ReturnType<typeof getProviderAdapter>;
  key: string;
  model: string;
  provider: SupportedProvider;
}> {
  const candidates: SupportedProvider[] = preferred
    ? [preferred, ...supportedProviders]
    : [...supportedProviders];

  for (const prov of candidates) {
    const conn = await providerConnection(env.DB, null, prov);
    if (conn && env.PROJECT_ENCRYPTION_KEY) {
      try {
        const decryptedKey = await providerKey(env, null, conn.id, prov);
        const adapter = getProviderAdapter(prov);
        let selectedModel = model;
        if (!selectedModel) {
          const models = await adapter.freeModels();
          selectedModel = models[0]?.id;
        }
        if (selectedModel) {
          return { adapter, key: decryptedKey, model: selectedModel, provider: prov };
        }
      } catch {
        // try next candidate
      }
    }
  }

  throw new Error("No hay ningún proveedor de IA configurado con clave válida en Ajustes.");
}

// Los errores del proveedor no se reproducen tal cual: solo se exponen motivos
// tipados conocidos; cualquier otro detalle queda en un mensaje genérico.
const providerFailureReasons = [
  "PROVIDER_QUOTA_EXHAUSTED",
  "PROVIDER_MODEL_UNAVAILABLE",
  "PROVIDER_CREDENTIAL_REJECTED",
  "FREE_MODEL_REQUIRED",
  "UNEXPECTED_PROVIDER_COST",
  "PROVIDER_REQUEST_FAILED",
] as const;
function providerFailureStatus(reason: string): 402 | 409 | 503 {
  if (reason === "PROVIDER_QUOTA_EXHAUSTED") return 503;
  if (reason === "PROVIDER_CREDENTIAL_REJECTED") return 402;
  return 409;
}
function providerFailureMessage(reason: string): string {
  if (reason === "PROVIDER_QUOTA_EXHAUSTED")
    return "Cuota gratuita del proveedor agotada. Espera o cambia de proveedor.";
  if (reason === "PROVIDER_CREDENTIAL_REJECTED")
    return "La clave del proveedor fue rechazada. Revisa Ajustes.";
  if (reason === "UNEXPECTED_PROVIDER_COST")
    return "El proveedor devolvió un coste inesperado. Revisión requerida antes de continuar.";
  return "El modelo no está disponible en el catálogo gratuito verificado.";
}

// 1. Endpoint Type-Safe: Sugerencias y siguientes pasos
aiRoutes.post("/suggest", async (c) => {
  const schema = z.object({
    context: z.string().min(1).max(12000),
    provider: z.enum(supportedProviders).optional(),
    model: z.string().optional(),
  });
  const parsed = schema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Contexto inválido para generar sugerencias." }, 400);

  try {
    const { adapter, key, model } = await getActiveAiProvider(
      c.env,
      parsed.data.provider,
      parsed.data.model,
    );
    const result = await generateSuggestions(adapter, key, model, {
      conversationContext: parsed.data.context,
    });
    return c.json({ suggestions: result });
  } catch (err) {
    const reason =
      err instanceof ProviderRequestError &&
      (providerFailureReasons as readonly string[]).includes(err.reason)
        ? err.reason
        : null;
    return c.json(
      {
        error: reason
          ? providerFailureMessage(reason)
          : "No se pudo generar sugerencias Type-Safe. Reintenta.",
      },
      reason ? providerFailureStatus(reason) : 500,
    );
  }
});

// 2. Endpoint Type-Safe: Propuestas de tareas y refactorización
aiRoutes.post("/propose-task", async (c) => {
  const schema = z.object({
    projectContext: z.string().max(8000).default(""),
    userIntent: z.string().min(3).max(4000),
    provider: z.enum(supportedProviders).optional(),
    model: z.string().optional(),
  });
  const parsed = schema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Datos de propuesta inválidos." }, 400);

  try {
    const { adapter, key, model } = await getActiveAiProvider(
      c.env,
      parsed.data.provider,
      parsed.data.model,
    );
    const result = await generateTaskProposal(adapter, key, model, {
      projectContext: parsed.data.projectContext,
      userIntent: parsed.data.userIntent,
    });
    return c.json({ proposal: result });
  } catch (err) {
    const reason =
      err instanceof ProviderRequestError &&
      (providerFailureReasons as readonly string[]).includes(err.reason)
        ? err.reason
        : null;
    return c.json(
      {
        error: reason
          ? providerFailureMessage(reason)
          : "No se pudo generar propuesta Type-Safe. Reintenta.",
      },
      reason ? providerFailureStatus(reason) : 500,
    );
  }
});

// 3. Endpoint Type-Safe: Síntesis y actualización de memoria
aiRoutes.post("/synthesize-memory", async (c) => {
  const schema = z.object({
    currentMemory: z.string().max(6000).default(""),
    recentTurns: z.string().min(1).max(12000),
    provider: z.enum(supportedProviders).optional(),
    model: z.string().optional(),
  });
  const parsed = schema.safeParse(await c.req.json());
  if (!parsed.success) return c.json({ error: "Datos de memoria inválidos." }, 400);

  try {
    const { adapter, key, model } = await getActiveAiProvider(
      c.env,
      parsed.data.provider,
      parsed.data.model,
    );
    const result = await synthesizeProjectMemory(adapter, key, model, {
      currentMemory: parsed.data.currentMemory,
      recentTurns: parsed.data.recentTurns,
    });
    return c.json({ memoryUpdate: result });
  } catch (err) {
    const reason =
      err instanceof ProviderRequestError &&
      (providerFailureReasons as readonly string[]).includes(err.reason)
        ? err.reason
        : null;
    return c.json(
      {
        error: reason
          ? providerFailureMessage(reason)
          : "No se pudo sintetizar memoria Type-Safe. Reintenta.",
      },
      reason ? providerFailureStatus(reason) : 500,
    );
  }
});
