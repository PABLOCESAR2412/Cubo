import type { ChatTurnInput } from "./chat-turn";
export function isChatTurnInput(input: unknown): input is ChatTurnInput {
  return !!input && typeof input === "object" && "type" in input && input.type === "CHAT_TURN";
}
