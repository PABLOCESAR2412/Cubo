import { z } from "zod";
import type { ChatTurnState } from "./chat-turn";

export interface Conversation {
  id: string;
  projectId: string | null;
  title: string;
  pinned: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface ChatMessage {
  id: string;
  conversationId: string;
  sequence: number;
  role: "user" | "assistant";
  content: string;
  status: "STORED";
  createdAt: string;
}
export interface ConversationDetail {
  conversation: Conversation;
  messages: ChatMessage[];
  inference: "unavailable" | "configured";
  turns?: ChatTurnState[];
}
export const conversationInputSchema = z
  .object({ title: z.string().trim().min(1).max(120) })
  .strict();
export const conversationUpdateSchema = z
  .object({
    version: z.number().int().positive(),
    title: z.string().trim().min(1).max(120),
    pinned: z.boolean(),
  })
  .strict();
export const chatMessageSchema = z.object({ content: z.string().trim().min(1).max(2000) }).strict();
