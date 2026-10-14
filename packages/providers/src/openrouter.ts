import type {
  ChatProviderMessage,
  ChatTurnOutput,
  FreeModel,
  ProviderQuota,
} from "../../shared/src/chat-turn.ts";

export class ProviderRequestError extends Error {
  readonly reason: string;
  constructor(reason: string) {
    super(reason);
    this.reason = reason;
  }
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
  return value as Record<string, unknown>;
}
function zero(value: unknown): boolean {
  return (
    (typeof value === "number" || (typeof value === "string" && Boolean(value.trim()))) &&
    Number(value) === 0
  );
}
export interface ChatProviderAdapter {
  freeModels(): Promise<FreeModel[]>;
  quota(key: string): Promise<ProviderQuota>;
  complete(key: string, model: string, messages: ChatProviderMessage[]): Promise<ChatTurnOutput>;
}
export class OpenRouterProvider implements ChatProviderAdapter {
  private readonly fetcher: (input: string, init?: RequestInit) => Promise<Response>;
  constructor(
    fetcher: (input: string, init?: RequestInit) => Promise<Response> = (input, init) =>
      fetch(input, init),
  ) {
    this.fetcher = fetcher;
  }
  private async request(
    path: string,
    key?: string,
    body?: unknown,
  ): Promise<Record<string, unknown>> {
    const response = await this.fetcher(`https://openrouter.ai/api/v1/${path}`, {
      method: body === undefined ? "GET" : "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(body === undefined ? 15000 : 120000),
      headers: {
        "Content-Type": "application/json",
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (!response.ok)
      throw new ProviderRequestError(
        response.status === 429
          ? "PROVIDER_QUOTA_EXHAUSTED"
          : response.status === 401
            ? "PROVIDER_CREDENTIAL_REJECTED"
            : "PROVIDER_REQUEST_FAILED",
      );
    const raw = await response.text();
    if (raw.length > 4000000) throw new ProviderRequestError("PROVIDER_RESPONSE_TOO_LARGE");
    try {
      return object(JSON.parse(raw));
    } catch {
      throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    }
  }
  async freeModels(): Promise<FreeModel[]> {
    const response = await this.request("models");
    if (!Array.isArray(response.data)) throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    return response.data
      .flatMap((entry: unknown) => {
        const model = object(entry),
          pricing = object(model.pricing);
        if (
          typeof model.id !== "string" ||
          !(model.id.endsWith(":free") || model.id === "openrouter/free") ||
          !["prompt", "completion"].every((field) => zero(pricing[field])) ||
          (pricing.request !== undefined && !zero(pricing.request))
        )
          return [];
        return [{ id: model.id, name: typeof model.name === "string" ? model.name : model.id }];
      })
      .slice(0, 40);
  }
  async quota(key: string): Promise<ProviderQuota> {
    const data = object((await this.request("key", key)).data);
    const value = (input: unknown) =>
      typeof input === "number" && Number.isFinite(input) && input >= 0 ? input : null;
    const quota = data.free_model_daily_requests ? object(data.free_model_daily_requests) : {};
    const remaining = value(quota.remaining),
      limit = value(quota.limit);
    return {
      checkedAt: new Date().toISOString(),
      requestsRemaining: remaining,
      requestsLimit: limit,
      creditsRemaining: value(data.limit_remaining),
      quality: remaining === null ? "unavailable" : "exact",
    };
  }
  async complete(
    key: string,
    model: string,
    messages: ChatProviderMessage[],
  ): Promise<ChatTurnOutput> {
    if (!(await this.freeModels()).some((item) => item.id === model))
      throw new ProviderRequestError("FREE_MODEL_REQUIRED");
    const response = await this.request("chat/completions", key, {
      model,
      messages,
      stream: false,
      max_tokens: 1024,
      provider: { allow_fallbacks: false },
      plugins: [],
    });
    const choice = Array.isArray(response.choices) ? object(response.choices[0]) : {};
    const content = object(choice.message).content;
    if (typeof content !== "string" || !content.trim() || content.length > 12000)
      throw new ProviderRequestError("PROVIDER_RESPONSE_INVALID");
    const usage = response.usage ? object(response.usage) : {};
    const exactCost = usage.cost !== undefined && usage.cost !== null;
    if (exactCost && !zero(usage.cost)) throw new ProviderRequestError("UNEXPECTED_PROVIDER_COST");
    const tokens = (n: unknown) =>
      typeof n === "number" && Number.isSafeInteger(n) && n >= 0 ? n : null;
    return {
      content,
      finishReason:
        choice.finish_reason === "stop"
          ? "stop"
          : choice.finish_reason === "length"
            ? "length"
            : "unknown",
      model,
      inputTokens: tokens(usage.prompt_tokens),
      outputTokens: tokens(usage.completion_tokens),
      costUsd: 0,
      costQuality: exactCost ? "exact" : "estimated",
    };
  }
}
