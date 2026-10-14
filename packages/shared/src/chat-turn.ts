import { z } from "zod";

export const chatTurnInputSchema = z
  .object({
    type: z.literal("CHAT_TURN"),
    steps: z.literal(1).default(1),
    pauseAt: z.null().default(null),
    projectId: z.uuid(),
    conversationId: z.uuid(),
    userMessageId: z.uuid(),
    keyId: z.uuid(),
    provider: z.literal("openrouter"),
    model: z
      .string()
      .min(1)
      .max(180)
      .regex(/^[A-Za-z0-9_./:-]+$/),
  })
  .strict();
export type ChatTurnInput = z.infer<typeof chatTurnInputSchema>;
export interface ChatProviderMessage {
  role: "system" | "user" | "assistant";
  content: string;
}
export interface ChatTurnContext {
  messages: ChatProviderMessage[];
  projectVersion: number;
  repositoryRevision: string | null;
}
export const chatTurnResultSchema = z
  .object({
    content: z.string().min(1).max(12000),
    finishReason: z.enum(["stop", "length", "unknown"]).optional(),
    model: z.string().min(1).max(180),
    inputTokens: z.number().int().nonnegative().nullable(),
    outputTokens: z.number().int().nonnegative().nullable(),
    costUsd: z.literal(0),
    costQuality: z.enum(["exact", "estimated"]),
  })
  .strict();
export type ChatTurnOutput = z.infer<typeof chatTurnResultSchema>;
export interface ChatTurnResult extends Omit<ChatTurnOutput, "content"> {
  steps: 1;
  messageId: string;
  sum?: never;
}
export interface ChatTurnState {
  taskId: string;
  status: string;
  model: string;
  error: string | null;
  result: ChatTurnResult | null;
}
export interface FreeModel {
  id: string;
  name: string;
}
export interface ProviderQuota {
  checkedAt: string;
  requestsRemaining: number | null;
  requestsLimit: number | null;
  creditsRemaining: number | null;
  quality: "exact" | "unavailable";
}
export interface ProjectProviderStatus {
  blockedReason: string | null;
  provider: "openrouter";
  configured: boolean;
  encryptionConfigured: boolean;
  models: FreeModel[];
  catalogAvailable: boolean;
  quota: ProviderQuota | null;
  freeOnly: true;
}
