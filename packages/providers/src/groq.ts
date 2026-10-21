import type {
  ChatProviderMessage,
  ChatTurnOutput,
  FreeModel,
  ProviderQuota,
} from "../../shared/src/chat-turn.ts";
import type { ChatProviderAdapter } from "./openrouter.ts";
import { ProviderRequestError } from "./openrouter.ts";

export const GROQ_FREE_MODELS: FreeModel[] = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B Versatile", contextLength: 128000 },
  { id: "llama-3.1-8b-instant", name: "Llama 3.1 8B Instant", contextLength: 128000 },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B 32k", contextLength: 32768 },
  { id: "gemma2-9b-it", name: "Gemma 2 9B IT", contextLength: 8192 },
];

export class GroqProvider implements ChatProviderAdapter {
  private readonly fetcher: (input: string, init?: RequestInit) => Promise<Response>;

  constructor(
    fetcher: (input: string, init?: RequestInit) => Promise<Response> = (input, init) =>
      fetch(input, init),
  ) {
    this.fetcher = fetcher;
  }

  async freeModels(): Promise<FreeModel[]> {
    return GROQ_FREE_MODELS;
  }

  async quota(key: string): Promise<ProviderQuota> {
    if (!/^gsk_[A-Za-z0-9]{48,64}$/.test(key)) {
      throw new ProviderRequestError("PROVIDER_CREDENTIAL_REJECTED");
    }
    const response = await this.fetcher("https://api.groq.com/openai/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) {
      throw new ProviderRequestError(
        response.status === 401
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
    const validModel = GROQ_FREE_MODELS.find((m) => m.id === model);
    if (!validModel) {
      throw new ProviderRequestError("FREE_MODEL_REQUIRED");
    }

    const response = await this.fetcher("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 2048,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      throw new ProviderRequestError(
        response.status === 429
          ? "PROVIDER_QUOTA_EXHAUSTED"
          : response.status === 401
            ? "PROVIDER_CREDENTIAL_REJECTED"
            : "PROVIDER_REQUEST_FAILED",
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: { content?: string };
        finish_reason?: string;
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
      };
    };

    const choice = data.choices?.[0];
    const text = choice?.message?.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    }

    return {
      content: text,
      finishReason: choice?.finish_reason === "stop" ? "stop" : "unknown",
      model,
      inputTokens: data.usage?.prompt_tokens ?? null,
      outputTokens: data.usage?.completion_tokens ?? null,
      costUsd: 0,
      costQuality: "exact",
    };
  }
}
