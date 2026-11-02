import { type ChatProvider, chatProviders } from "@cubo/shared";

type SelectableChatProvider = (typeof chatProviders)[number];

export interface ChatModelSelection {
  provider: SelectableChatProvider;
  model: string;
}

interface SelectionStorage {
  getItem(key: string): string | null;
  setItem?(key: string, value: string): void;
}

function storageKey(conversationId: string): string {
  return `cubo.chat-model-selection.${conversationId}`;
}

function isSelection(value: unknown): value is ChatModelSelection {
  return (
    value !== null &&
    typeof value === "object" &&
    "provider" in value &&
    typeof value.provider === "string" &&
    chatProviders.includes(value.provider as SelectableChatProvider) &&
    "model" in value &&
    typeof value.model === "string" &&
    value.model.length > 0 &&
    value.model.length <= 180
  );
}

export function readChatModelSelection(
  conversationId: string,
  storage?: SelectionStorage,
): ChatModelSelection | null {
  try {
    const raw = (storage ?? globalThis.localStorage).getItem(storageKey(conversationId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSelection(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeChatModelSelection(
  conversationId: string,
  selection: { provider: ChatProvider; model: string },
  storage?: SelectionStorage,
): void {
  if (!isSelection(selection)) return;
  try {
    (storage ?? globalThis.localStorage).setItem?.(
      storageKey(conversationId),
      JSON.stringify(selection),
    );
  } catch {
    // Storage may be unavailable in private browsing; the active selection still works.
  }
}
