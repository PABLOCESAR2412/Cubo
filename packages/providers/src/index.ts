import type { Provider } from "@cubo/shared";

export interface ProviderAdapter {
  readonly descriptor: Provider;
  supports(agentId: string, modelId: string): boolean;
}

export {
  GEMINI_FREE_MODELS,
  GeminiProvider,
} from "./gemini.ts";
export {
  GROQ_FREE_MODELS,
  GroqProvider,
} from "./groq.ts";
export {
  NVIDIA_FREE_MODELS,
  NvidiaProvider,
} from "./nvidia.ts";
export type { ChatProviderAdapter } from "./openrouter.ts";
export {
  OpenRouterProvider,
  ProviderRequestError,
} from "./openrouter.ts";

export {
  type CodeReviewProposal,
  codeReviewProposalSchema,
  generateSuggestions,
  generateTaskProposal,
  generateTypeSafe,
  type ProjectMemoryUpdate,
  projectMemorySchema,
  type SuggestionList,
  suggestionListSchema,
  synthesizeProjectMemory,
  type TaskProposal,
  TypeSafeAiError,
  taskProposalSchema,
} from "./typesafe-ai.ts";
export { ZEN_FREE_MODELS, ZenProvider } from "./zen.ts";
