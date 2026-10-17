import { expect, test } from "bun:test";

if (typeof DOMParser === "undefined") {
  class MockElement {
    constructor(public content: string) {}
    remove() {}
  }
  globalThis.DOMParser = class MockDOMParser {
    parseFromString(raw: string) {
      const clean = raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
        .replace(/<[^>]+>/g, " ");
      return {
        querySelectorAll: () => [new MockElement("")],
        body: { textContent: clean },
        getElementsByTagNameNS: () => [],
      };
    }
  } as unknown as typeof DOMParser;
}

import { extractAttachment } from "../apps/web/src/attachments.ts";

test("extractAttachment extrae texto plano y markdown correctamente", async () => {
  const txtFile = new File(["Hola Cubo mundo"], "saludo.txt", { type: "text/plain" });
  const txtAttachment = await extractAttachment(txtFile);
  expect(txtAttachment.name).toBe("saludo.txt");
  expect(txtAttachment.text).toBe("Hola Cubo mundo");
  expect(txtAttachment.truncated).toBe(false);

  const mdFile = new File(["# Titulo\n\nContenido de prueba"], "doc.md", { type: "text/markdown" });
  const mdAttachment = await extractAttachment(mdFile);
  expect(mdAttachment.name).toBe("doc.md");
  expect(mdAttachment.text).toContain("# Titulo");
  expect(mdAttachment.truncated).toBe(false);
});

test("extractAttachment sanea HTML eliminando scripts y estilos peligrosos", async () => {
  const html = `
    <html>
      <head>
        <style>body { color: red; }</style>
        <script>alert("hack");</script>
      </head>
      <body>
        <h1>Cubo Seguro</h1>
        <p>Texto limpio</p>
        <iframe src="https://evil.example"></iframe>
      </body>
    </html>
  `;
  const file = new File([html], "index.html", { type: "text/html" });
  const attachment = await extractAttachment(file);
  expect(attachment.text).toContain("Cubo Seguro");
  expect(attachment.text).toContain("Texto limpio");
  expect(attachment.text).not.toContain("alert");
  expect(attachment.text).not.toContain("color: red");
  expect(attachment.truncated).toBe(false);
});

test("extractAttachment rechaza archivos de más de 5MB", async () => {
  const bigBuffer = new Uint8Array(5 * 1024 * 1024 + 10);
  const bigFile = new File([bigBuffer], "pesado.txt", { type: "text/plain" });
  expect(extractAttachment(bigFile)).rejects.toThrow("máximo 5 MB");
});

test("extractAttachment trunca textos mayores a 12000 caracteres", async () => {
  const longText = "A".repeat(15000);
  const file = new File([longText], "largo.txt", { type: "text/plain" });
  const attachment = await extractAttachment(file);
  expect(attachment.text.length).toBe(12000);
  expect(attachment.truncated).toBe(true);
});

test("extractAttachment rechaza extensiones no soportadas o archivos sin texto", async () => {
  const exeFile = new File(["binario"], "script.exe", { type: "application/octet-stream" });
  expect(extractAttachment(exeFile)).rejects.toThrow("Formato no compatible");

  const emptyFile = new File(["   "], "vacio.txt", { type: "text/plain" });
  expect(extractAttachment(emptyFile)).rejects.toThrow("No se encontró texto");
});
