import type { Provider } from "@cubo/shared";
export interface ProviderAdapter {
  readonly descriptor: Provider;
  supports(agentId: string, modelId: string): boolean;
}
export type { ChatProviderAdapter } from "./openrouter.ts";
export {
  OpenRouterProvider,
  ProviderRequestError,
} from "./openrouter.ts";
// Gemini, Groq y NVIDIA están contemplados; no hay llamadas pagas habilitadas.
