import { expect, test } from "bun:test";
import {
  readChatModelSelection,
  writeChatModelSelection,
} from "../apps/web/src/chat-model-selection";

test("la selección de modelo queda aislada por conversación y se puede restaurar", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };

  writeChatModelSelection(
    "chat-a",
    { provider: "gemini", model: "gemini-3.5-flash-lite" },
    storage,
  );
  writeChatModelSelection(
    "chat-b",
    { provider: "nvidia", model: "deepseek-ai/deepseek-v4.1-flash" },
    storage,
  );

  expect(readChatModelSelection("chat-a", storage)).toEqual({
    provider: "gemini",
    model: "gemini-3.5-flash-lite",
  });
  expect(readChatModelSelection("chat-b", storage)).toEqual({
    provider: "nvidia",
    model: "deepseek-ai/deepseek-v4.1-flash",
  });
});

test("la selección local corrupta o de proveedor desconocido se ignora", () => {
  const values = new Map([
    [
      "cubo.chat-model-selection.chat-a",
      JSON.stringify({ provider: "unknown", model: "paid-model" }),
    ],
  ]);
  const storage = { getItem: (key: string) => values.get(key) ?? null };

  expect(readChatModelSelection("chat-a", storage)).toBeNull();
  expect(readChatModelSelection("chat-missing", storage)).toBeNull();
});
