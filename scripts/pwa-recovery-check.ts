import { chromium, expect } from "@playwright/test";

const base = process.env.CUBO_RECOVERY_TEST_URL ?? "http://127.0.0.1:8855";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  const missing = await context.request.get(`${base}/assets/index-CEZ_fnF4.css`);
  expect(missing.status()).toBe(404);
  expect(missing.headers()["content-type"]).toContain("text/plain");
  const index = await context.request.get(`${base}/`);
  const html = await index.text();
  const css = html.match(/href="(\/assets\/[^"]+\.css)"/);
  if (!css) throw new Error("El shell no declara su CSS.");
  expect(
    (await context.request.get(new URL(css[1], base).href)).headers()["content-type"],
  ).toContain("text/css");
  await page.goto(base);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.addCookies([{ name: "recovery-fixture", value: "preserve", url: base }]);
  await page.evaluate(async () => {
    localStorage.setItem("recovery-fixture", "preserve");
    await caches.open("unrelated-fixture");
    for (const name of await caches.keys())
      if (name.startsWith("workbox-precache-")) {
        const cache = await caches.open(name);
        for (const request of await cache.keys())
          if (new URL(request.url).pathname === "/index.html") {
            const response = await cache.match(request);
            if (!response) throw new Error("Precaché sin shell.");
            let text = await response.text();
            text = text
              .replace('<script src="/pwa-recovery.js"></script>', "")
              .replace(/\/assets\/index-[^" ]+\.js/g, "/assets/removed-legacy.js")
              .replace(/\/assets\/index-[^" ]+\.css/g, "/assets/index-CEZ_fnF4.css");
            await cache.put(
              request,
              new Response(text, { headers: { "Content-Type": "text/html" } }),
            );
          }
      }
  });
  await page.reload();
  await page.goto(`${base}/api/pwa-recovery`);
  await expect(page.getByRole("heading", { name: "Recuperar actualización" })).toBeVisible();
  await page.screenshot({ path: "artifacts/pwa-recovery-390.png" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: "artifacts/pwa-recovery-1440.png" });
  await page.getByRole("button", { name: "Actualizar y abrir Cubo" }).click();
  await page.waitForURL(`${base}/`);
  await expect(page.locator("#root")).not.toBeEmpty();
  expect(await page.evaluate(() => localStorage.getItem("recovery-fixture"))).toBe("preserve");
  expect((await context.cookies()).find((c) => c.name === "recovery-fixture")?.value).toBe(
    "preserve",
  );
  expect(await page.evaluate(() => caches.has("unrelated-fixture"))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  console.log(
    JSON.stringify({
      missingCssStatus: 404,
      currentCssMime: "text/css",
      staleShellRecovered: true,
      cookiesPreserved: true,
      localStoragePreserved: true,
      unrelatedCachePreserved: true,
      viewports: [390, 1440],
      cloud: !base.includes("127.0.0.1"),
    }),
  );
} finally {
  await browser.close();
}
