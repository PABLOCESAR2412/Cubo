import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const css = () => readFileSync("apps/web/src/style.css", "utf8");

test("style.css tiene llaves balanceadas", () => {
  const src = css();
  expect(src.split("{").length).toBe(src.split("}").length);
});

test("chat-toolbar define un solo background y conserva el render actual", () => {
  const src = css();
  const defs = src.match(/\.chat-toolbar\s*\{[^}]*background\s*:\s*[^;]+/g) ?? [];
  expect(defs.length).toBe(1);
  expect(defs[0]).toContain("var(--color-base)");
});

test("effort-controls no tiene declaracion muerta border-top + border", () => {
  const src = css();
  const block = src.match(/\.effort-controls\s*\{[^}]*\}/);
  expect(block).not.toBeNull();
  expect(block?.[0]).not.toMatch(/border-top:[^;]+;\s*border:/);
});
