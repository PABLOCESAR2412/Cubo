import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium, expect } from "@playwright/test";

const dist = resolve("apps/web/dist");
let revision = 1;
const server = Bun.serve({
  port: 0,
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/api/session")
      return Response.json({
        authenticated: true,
        costGuardVerified: true,
        executionConfigured: true,
      });
    if (url.pathname === "/api/tasks") return Response.json({ tasks: [] });
    if (url.pathname === "/api/projects") return Response.json({ projects: [] });
    if (url.pathname === "/api/conversations/recent") return Response.json({ conversations: [] });
    if (url.pathname === "/sw.js") {
      const versioned = `self.addEventListener('install',()=>{});self.addEventListener('message',event=>{if(event.data==='SKIP_WAITING'||event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data==='pwa-revision')event.ports[0]?.postMessage(${revision})});\n// revision:${revision}`;
      return new Response(versioned, {
        headers: { "Content-Type": "text/javascript", "Cache-Control": "no-store" },
      });
    }
    if (url.pathname.startsWith("/api/")) return Response.json({ conversations: [], tasks: [] });
    const relative = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
    const file = resolve(dist, relative);
    if (!file.startsWith(`${dist}/`) && file !== resolve(dist, "index.html"))
      return new Response("Not found", { status: 404 });
    try {
      return new Response(await readFile(file), {
        headers: {
          "Content-Type": file.endsWith(".html")
            ? "text/html"
            : file.endsWith(".css")
              ? "text/css"
              : "application/javascript",
        },
      });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
});
const base = `http://127.0.0.1:${server.port}`;
const browser = await chromium.launch({ headless: true });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(base);
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.getRegistration));
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect(page.locator(".sidebar")).toBeAttached();
    if (width > 767) await expect(page.locator(".app-version-btn")).toBeVisible();
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, {
      timeout: 15_000,
    });
    expect(pageErrors).toEqual([]);
    if (width === 390) await expect(page.locator(".sidebar")).not.toHaveAttribute("open", "");
    revision = 2;
    await page.evaluate(async () => (await navigator.serviceWorker.ready).update());
    const notice = page.getByRole("status", { name: "Actualización de Cubo" });
    await expect(notice).toBeVisible({ timeout: 15_000 });
    await expect(notice.getByRole("button", { name: "Actualizar", exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
    await notice.getByRole("button", { name: "Recordar actualización después" }).click();
    await expect(notice).toHaveCount(0);
    const update = page.getByRole("button", { name: "Actualizar", exact: true });
    await expect(update).toBeVisible();
    const updateBounds = await update.boundingBox();
    if (!updateBounds) throw new Error("El botón de actualización no tiene posición visible.");
    expect(updateBounds.x).toBeGreaterThanOrEqual(0);
    expect(updateBounds.x + updateBounds.width).toBeLessThanOrEqual(width);
    page.once("dialog", (dialog) => void dialog.accept());
    const reloaded = page.waitForEvent("framenavigated");
    await update.click();
    await reloaded;
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const worker = (await navigator.serviceWorker.ready).active;
          if (!worker) return null;
          return await new Promise((resolve) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => resolve(event.data);
            worker.postMessage("pwa-revision", [channel.port2]);
          });
        }),
      )
      .toBe(2);
    expect(pageErrors).toEqual([]);
    console.log(
      `PWA update: aviso, posponer, botón persistente y activación v2 verificados a ${width}px.`,
    );
    await context.close();
    revision = 1;
  }
} finally {
  await browser.close();
  server.stop();
}
