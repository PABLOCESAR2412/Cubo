import type {
  ChatProviderMessage,
  ChatTurnOutput,
  FreeModel,
  ProviderQuota,
} from "../../shared/src/chat-turn.ts";
import type { ChatProviderAdapter } from "./openrouter.ts";
import { ProviderRequestError } from "./openrouter.ts";

export const GEMINI_FREE_MODELS: FreeModel[] = [
  { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash", contextLength: 1048576 },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", contextLength: 1048576 },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", contextLength: 2097152 },
  { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite", contextLength: 1048576 },
];

export class GeminiProvider implements ChatProviderAdapter {
  private readonly fetcher: (input: string, init?: RequestInit) => Promise<Response>;

  constructor(
    fetcher: (input: string, init?: RequestInit) => Promise<Response> = (input, init) =>
      fetch(input, init),
  ) {
    this.fetcher = fetcher;
  }

  async freeModels(): Promise<FreeModel[]> {
    return GEMINI_FREE_MODELS;
  }

  async quota(key: string): Promise<ProviderQuota> {
    if (!/^AIzaSy[A-Za-z0-9_-]{33}$/.test(key)) {
      throw new ProviderRequestError("PROVIDER_CREDENTIAL_REJECTED");
    }
    const response = await this.fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      {
        method: "GET",
        signal: AbortSignal.timeout(12000),
      },
    );
    if (!response.ok) {
      throw new ProviderRequestError(
        response.status === 401 || response.status === 403
          ? "PROVIDER_CREDENTIAL_REJECTED"
          : response.status === 429
            ? "PROVIDER_QUOTA_EXHAUSTED"
            : "PROVIDER_REQUEST_FAILED",
      );
    }
    return {
      checkedAt: new Date().toISOString(),
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
    const validModel = GEMINI_FREE_MODELS.find((m) => m.id === model);
    if (!validModel) {
      throw new ProviderRequestError("FREE_MODEL_REQUIRED");
    }

    const systemMessages = messages.filter((m) => m.role === "system");
    const nonSystemMessages = messages.filter((m) => m.role !== "system");

    const contents = nonSystemMessages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.2,
      },
    };

    if (systemMessages.length > 0) {
      body.system_instruction = {
        parts: [{ text: systemMessages.map((s) => s.content).join("\n\n") }],
      };
    }

    const response = await this.fetcher(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(60000),
      },
    );

    if (!response.ok) {
      throw new ProviderRequestError(
        response.status === 429
          ? "PROVIDER_QUOTA_EXHAUSTED"
          : response.status === 401 || response.status === 403
            ? "PROVIDER_CREDENTIAL_REJECTED"
            : "PROVIDER_REQUEST_FAILED",
      );
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
      };
    };

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) {
      throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    }

    return {
      content: text,
      finishReason: candidate?.finishReason === "STOP" ? "stop" : "unknown",
      model,
      inputTokens: data.usageMetadata?.promptTokenCount ?? null,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? null,
      costUsd: 0,
      costQuality: "exact",
    };
  }
}
