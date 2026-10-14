import { mkdir } from "node:fs/promises";
import type { Task, TaskEvent } from "@cubo/shared";
import { chromium, expect } from "@playwright/test";

// Acceptance evidence only: never persist cookies, passwords, tokens or request traces.
const base = "https://cubo-dev.pctg.workers.dev";
const repository = "PABLOCESAR2412/Cubo";
type Detail = { task: Task; events: TaskEvent[] };
type Run = { id: number; display_title: string; status: string; conclusion: string | null };
async function main() {
  const secrets = await Bun.file(
    `${process.env.USERPROFILE}/.config/cubo/cloudflare-personal/cubo-dev.secrets.json`,
  ).json();
  await mkdir("artifacts", { recursive: true });
  const evidence: Record<string, unknown> = {
    base,
    repository,
    startedAt: new Date().toISOString(),
  };
  const save = () => Bun.write("artifacts/cloud-evidence.json", JSON.stringify(evidence, null, 2));
  async function github(path: string) {
    const response = await fetch(`https://api.github.com/repos/${repository}${path}`, {
      headers: {
        Authorization: `Bearer ${secrets.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Cubo-validation",
      },
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`GitHub HTTP ${response.status}`);
    return response.json();
  }
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    let context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
    const login = async () => {
      const response = await context.request.post(`${base}/api/login`, {
        headers: { Origin: base },
        data: { password: secrets.OWNER_PASSWORD },
      });
      if (!response.ok()) throw new Error(`Login HTTP ${response.status()}`);
    };
    const health = await context.request.get(`${base}/api/health`);
    if (!health.ok() || (await health.json()).executionBackend !== "github-actions")
      throw new Error("API health inválido");
    const unauthorized = await context.request.get(`${base}/api/tasks`);
    if (unauthorized.status() !== 401) throw new Error("Acceso privado no protegido");
    await login();
    let page = await context.newPage();
    await page.goto(base);
    await page.getByRole("button", { name: "Nueva tarea", exact: true }).first().click();
    await page.getByText("Validar el motor durable existente", { exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Ejecutar validación durable", exact: true }),
    ).toBeVisible();
    const created = page.waitForResponse(
      (r) => r.url().endsWith("/api/tasks") && r.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Ejecutar validación durable", exact: true }).click();
    const response = await created;
    if (response.status() !== 202) throw new Error(`Crear tarea HTTP ${response.status()}`);
    const { task } = (await response.json()) as { task: Task };
    evidence.taskId = task.id;
    evidence.executionId = task.executionId;
    await save();
    let run: Run | undefined;
    for (let attempt = 0; attempt < 60; attempt++) {
      const data = (await github(
        "/actions/workflows/cubo-runner.yml/runs?event=workflow_dispatch&per_page=30",
      )) as { workflow_runs: Run[] };
      run = data.workflow_runs.find((r) => r.display_title === `cubo:${task.executionId}`);
      if (run?.status === "in_progress") break;
      if (run?.status === "completed") throw new Error("Runner terminó antes de cerrar cliente");
      await Bun.sleep(5000);
    }
    if (run?.status !== "in_progress") throw new Error("Runner no inició dentro del plazo");
    evidence.workflowRunId = run.id;
    const before = (await (
      await context.request.get(`${base}/api/tasks/${task.id}`)
    ).json()) as Detail;
    evidence.beforeClose = before.task;
    await page.screenshot({ path: "artifacts/cloud-running.png", fullPage: true });
    await browser.close();
    evidence.clientClosedAt = new Date().toISOString();
    await save();
    console.log(`Cliente cerrado; task_id=${task.id}, workflow_run_id=${run.id}`);
    for (let attempt = 0; attempt < 90; attempt++) {
      run = (await github(`/actions/runs/${run.id}`)) as Run;
      if (run.status === "completed") break;
      await Bun.sleep(5000);
    }
    evidence.remoteConclusion = run.conclusion;
    evidence.remoteObservedAt = new Date().toISOString();
    await save();
    const reopened = await chromium.launch({ channel: "chrome", headless: true });
    try {
      context = await reopened.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
      });
      await login();
      page = await context.newPage();
      await page.goto(`${base}/#${task.id}`);
      await page
        .locator(".task-item.selected")
        .getByRole("button", { name: "Ver proceso", exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "Prueba durable", exact: true }),
      ).toBeVisible();
      const restored = (await (
        await context.request.get(`${base}/api/tasks/${task.id}`)
      ).json()) as Detail;
      evidence.afterReopen = restored;
      evidence.reopenedAt = new Date().toISOString();
      await save();
      if (
        restored.task.id !== task.id ||
        restored.task.status !== "SUCCEEDED" ||
        restored.task.result?.sum !== 91
      )
        throw new Error("Estado/resultado remoto no cumple aceptación");
      if (!restored.events.some((event) => event.createdAt > String(evidence.clientClosedAt)))
        throw new Error("No hay progreso persistido posterior al cierre");
      await expect(page.getByText("91", { exact: true })).toBeVisible();
      await page.screenshot({ path: "artifacts/cloud-restored-mobile.png", fullPage: true });
      await page.evaluate(() => navigator.serviceWorker.ready);
      await context.setOffline(true);
      await page.reload();
      await expect(page.getByRole("heading", { name: "Acceso a Cubo", exact: true })).toBeVisible();
      evidence.accepted = true;
      await save();
      console.log(
        "Cloud: SUCCEEDED, resultado 91, progreso posterior al cierre y recuperación PWA verificados.",
      );
    } finally {
      await reopened.close();
    }
  } finally {
    await browser.close();
  }
}
main().catch(() => {
  console.error(
    "Prueba cloud no completada. Revisar evidencia persistida y estado remoto; no imprimir credenciales.",
  );
  process.exitCode = 1;
});
