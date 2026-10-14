import { mkdir } from "node:fs/promises";
import { chromium, expect } from "@playwright/test";

const base = process.env.CUBO_TEST_URL ?? "http://127.0.0.1:8787";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  let context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  let page = await context.newPage();
  await page.goto(base);
  await page.getByRole("button", { name: "Nueva tarea", exact: true }).first().click();
  await page.getByText("Validar el motor durable existente", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Ejecutar validación durable", exact: true }),
  ).toBeVisible();
  const created = page.waitForResponse(
    (response) => response.url().endsWith("/api/tasks") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Ejecutar validación durable", exact: true }).click();
  const response = await created;
  if (response.status() !== 202) throw new Error("No se creó la tarea local.");
  const { task } = (await response.json()) as { task: { id: string } };
  await expect(page.getByRole("heading", { name: "Prueba durable", exact: true })).toBeVisible();
  await expect(page.locator("pre")).toContainText(task.id);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/console-desktop.png", fullPage: true });
  await context.close();
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  page = await context.newPage();
  await page.goto(`${base}/#${task.id}`);
  await page
    .locator(".task-item.selected")
    .getByRole("button", { name: "Ver proceso", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Prueba durable", exact: true })).toBeVisible();
  const restored = await context.request.get(`${base}/api/tasks/${task.id}`);
  const data = (await restored.json()) as { task: { id: string } };
  await expect(page.locator("pre")).toContainText(task.id);
  if (data.task.id !== task.id) throw new Error("Se perdió la tarea al cerrar el cliente.");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  if (overflow) throw new Error("La consola desborda el viewport móvil.");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "artifacts/console-mobile.png", fullPage: true });
  await page.evaluate(() => navigator.serviceWorker.ready);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Acceso a Cubo", exact: true })).toBeVisible();
  console.log(
    "PWA/API verificadas: tarea local persistida al cerrar el cliente, móvil sin overflow y shell offline. Ejecución cloud aún no cubierta.",
  );
} finally {
  await browser.close();
}
