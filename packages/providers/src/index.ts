import type { Provider } from "@cubo/shared";
export interface ProviderAdapter {
  readonly descriptor: Provider;
  supports(agentId: string, modelId: string): boolean;
}
// Gemini, Groq y NVIDIA están contemplados; no hay llamadas pagas habilitadas.
