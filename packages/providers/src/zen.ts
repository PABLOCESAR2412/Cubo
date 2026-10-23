import type {
  ChatProviderMessage,
  ChatTurnOutput,
  FreeModel,
  ProviderQuota,
} from "../../shared/src/chat-turn.ts";
import type { ChatProviderAdapter } from "./openrouter.ts";
import { ProviderRequestError } from "./openrouter.ts";

// Gama gratuita verificada solo con contratos chat/completions publicados en
// https://opencode.ai/docs/zen (consola OpenCode) y presentes en el catálogo
// vivo de la API. Cada entrada se filtra contra el catálogo: si OpenCode retira
// un modelo, desaparece del listado en vez de fallar de pago.
export const ZEN_FREE_MODELS: FreeModel[] = [
  { id: "glm-5.3-flash-free", name: "GLM-5.3-Flash Free" },
  { id: "deepseek-v4.1-flash-free", name: "DeepSeek V4.1 Flash Free" },
  { id: "big-pickle", name: "Big Pickle" },
  { id: "beam-free", name: "Beam Free" },
  { id: "flint-40b-free", name: "Flint 40B Free" },
  { id: "longcat-2.5-preview-free", name: "LongCat 2.5 Preview Free" },
  { id: "exo-free", name: "Exo Free" },
  { id: "mimo-v2.5-free", name: "MiMo-V2.5 Free" },
  { id: "mimo-v2.6-flash-free", name: "MiMo-V2.6-Flash Free" },
  { id: "nemotron-3-ultra-free", name: "Nemotron 3 Ultra Free" },
  { id: "nemotron-3.5-lightning-free", name: "Nemotron 3.5 Lightning Free" },
  { id: "nemotron-3.5-super-vl-free", name: "Nemotron 3.5 Super VL Free" },
];

// Formato real de claves de servicio de la consola OpenCode: "sk-" + 64 alfanuméricos.
export function isValidZenKey(key: string): boolean {
  return /^sk-[A-Za-z0-9]{64}$/.test(key);
}

interface ZenModelEntry {
  id: unknown;
}

interface ZenErrorBody {
  error?: { type?: string; message?: string };
}

export class ZenProvider implements ChatProviderAdapter {
  private readonly fetcher: (input: string, init?: RequestInit) => Promise<Response>;
  constructor(
    fetcher: (input: string, init?: RequestInit) => Promise<Response> = (input, init) =>
      fetch(input, init),
  ) {
    this.fetcher = fetcher;
  }

  private headers(key?: string): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...(isValidZenKey(key ?? "") ? { Authorization: `Bearer ${key}` } : {}),
    };
  }

  private async request(path: string, key: string | undefined, body?: unknown): Promise<Response> {
    const response = await this.fetcher(`https://opencode.ai/inference/${path}`, {
      method: body === undefined ? "GET" : "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(body === undefined ? 12000 : 120000),
      headers: this.headers(key),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return response;
  }

  private async requestJson(path: string, key?: string, body?: unknown) {
    const response = await this.request(path, key, body);
    if (!response.ok) {
      let errorType = "";
      try {
        const raw = (await response.json()) as ZenErrorBody;
        errorType = typeof raw?.error?.type === "string" ? raw.error.type : "";
      } catch {
        // cuerpo sin JSON tipado: solo se usa el estado HTTP
      }
      if (errorType === "FreeTierError")
        throw new ProviderRequestError("PROVIDER_MODEL_UNAVAILABLE");
      throw new ProviderRequestError(
        response.status === 401 || response.status === 403
          ? "PROVIDER_CREDENTIAL_REJECTED"
          : response.status === 429
            ? "PROVIDER_QUOTA_EXHAUSTED"
            : [404, 503].includes(response.status)
              ? "PROVIDER_MODEL_UNAVAILABLE"
              : "PROVIDER_REQUEST_FAILED",
      );
    }
    const raw = await response.text();
    if (raw.length > 4000000) throw new ProviderRequestError("PROVIDER_RESPONSE_TOO_LARGE");
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object")
        throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
      return parsed;
    } catch (error) {
      if (error instanceof ProviderRequestError) throw error;
      throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    }
  }

  async freeModels(): Promise<FreeModel[]> {
    // El catálogo público puede cambiar: se conservan solo los modelos de la
    // gama gratuita verificados que siguen publicados hoy.
    const response = await this.requestJson("v1/models");
    if (!Array.isArray(response.data)) throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    const published = new Set(
      response.data
        .filter(
          (entry): entry is ZenModelEntry =>
            Boolean(entry) && typeof entry === "object" && !Array.isArray(entry),
        )
        .map((entry) => entry.id)
        .filter((id): id is string => typeof id === "string"),
    );
    return ZEN_FREE_MODELS.filter((model) => published.has(model.id));
  }

  async quota(key: string): Promise<ProviderQuota> {
    // GET /models valida la credencial sin gastar tokens: 401/403 con clave, 200 con clave válida.
    if (!isValidZenKey(key)) throw new ProviderRequestError("PROVIDER_CREDENTIAL_REJECTED");
    await this.requestJson("v1/models", key);
    const checkedAt = new Date().toISOString();
    return {
      checkedAt,
      requestsRemaining: null,
      requestsLimit: null,
      creditsRemaining: null,
      quality: "unavailable",
    };
  }

  async complete(
    key: string,
    model: string,
    messages: ChatProviderMessage[],
  ): Promise<ChatTurnOutput> {
    if (!isValidZenKey(key)) throw new ProviderRequestError("PROVIDER_CREDENTIAL_REJECTED");
    const selected = ZEN_FREE_MODELS.find((item) => item.id === model);
    if (!selected) throw new ProviderRequestError("FREE_MODEL_REQUIRED");
    const response = await this.requestJson("openai/v1/chat/completions", key, {
      model,
      messages,
      stream: false,
      max_tokens: 1024,
    });
    const choices = Array.isArray(response.choices) ? response.choices : [];
    const choice =
      choices.length && typeof choices[0] === "object" && choices[0] !== null
        ? (choices[0] as Record<string, unknown>)
        : {};
    const message =
      choice.message && typeof choice.message === "object" && choice.message !== null
        ? (choice.message as Record<string, unknown>)
        : {};
    const content = message.content;
    if (typeof content !== "string" || !content.trim() || content.length > 12000)
      throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    const usage =
      response.usage && typeof response.usage === "object" && response.usage !== null
        ? (response.usage as Record<string, unknown>)
        : {};
    const tokens = (n: unknown) =>
      typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : null;
    return {
      content,
      finishReason: choice.finish_reason === "stop" ? "stop" : "unknown",
      model,
      inputTokens: tokens(usage.prompt_tokens),
      outputTokens: tokens(usage.completion_tokens),
      costUsd: 0,
      costQuality: "estimated",
    };
  }
}
