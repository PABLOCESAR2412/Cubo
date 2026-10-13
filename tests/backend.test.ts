import { expect, test } from "bun:test";
import { GitHubActionsExecutionBackend } from "@cubo/runner";
import { type Execution, ExecutionBlockedError } from "@cubo/shared";
import { type HttpRequest, mapRunStatus } from "../packages/runner/src/github-actions.ts";

const execution: Execution = {
  id: "execution-1",
  taskId: "task-1",
  backend: "github-actions",
  backendRunId: null,
  status: "QUEUED",
  createdAt: "2026-10-12",
  dispatched: false,
};
const config = {
  repository: "PABLOCESAR2412/Cubo",
  workflow: "cubo-runner.yml",
  ref: "main",
  token: "test-token-not-a-credential",
  zeroSpendVerified: true,
};
test("dispatch privado requiere guardia verificada y envía solo execution_id", async () => {
  const calls: Array<{ url: string; body: string | null }> = [];
  const request: HttpRequest = async (url, init) => {
    calls.push({ url: String(url), body: typeof init?.body === "string" ? init.body : null });
    return calls.length === 1
      ? Response.json({ private: true })
      : new Response(null, { status: 204 });
  };
  const backend = new GitHubActionsExecutionBackend(config, async () => execution, request);
  const next = await backend.start({ executionId: execution.id, taskId: execution.taskId });
  expect(next.dispatched).toBe(true);
  expect(JSON.parse(calls[1]?.body ?? "null")).toEqual({
    ref: "main",
    inputs: { execution_id: execution.id },
  });
});
test("sin bloqueo de gasto no hace llamadas; errores de cuota no se confunden con credenciales", async () => {
  let calls = 0;
  const request: HttpRequest = async () => {
    calls++;
    return new Response("minutes quota exhausted", { status: 403 });
  };
  const denied = new GitHubActionsExecutionBackend(
    { ...config, zeroSpendVerified: false },
    async () => execution,
    request,
  );
  await expect(
    denied.start({ executionId: execution.id, taskId: execution.taskId }),
  ).rejects.toThrow("COST_GUARD_NOT_VERIFIED");
  expect(calls).toBe(0);
  const backend = new GitHubActionsExecutionBackend(config, async () => execution, request);
  try {
    await backend.start({ executionId: execution.id, taskId: execution.taskId });
    throw new Error("unexpected");
  } catch (e) {
    expect(e instanceof ExecutionBlockedError).toBe(true);
  }
  const authFailure: HttpRequest = async () => new Response("Bad credentials", { status: 401 });
  await expect(
    new GitHubActionsExecutionBackend(config, async () => execution, authFailure).start({
      executionId: execution.id,
      taskId: execution.taskId,
    }),
  ).rejects.toThrow("HTTP 401");
});
test("correlación exacta, status y cancelación remota", async () => {
  const calls: string[] = [];
  const request: HttpRequest = async (url, init) => {
    calls.push(String(url));
    if (init?.method === "POST") return new Response(null, { status: 202 });
    return Response.json({
      workflow_runs: [
        { id: 99, display_title: "other", status: "completed", conclusion: "success" },
        { id: 10, display_title: "cubo:execution-1", status: "in_progress", conclusion: null },
      ],
    });
  };
  const backend = new GitHubActionsExecutionBackend(config, async () => execution, request);
  expect(await backend.getStatus(execution.id)).toBe("RUNNING");
  await backend.cancel(execution.id);
  expect(calls.at(-1)).toContain("/actions/runs/10/cancel");
  expect(mapRunStatus({ status: "completed", conclusion: "timed_out" })).toBe("FAILED");
  expect(mapRunStatus({ status: "completed", conclusion: "cancelled" })).toBe("CANCELLED");
});
test("retry de start con ejecución reclamada no genera otro dispatch", async () => {
  const request: HttpRequest = async () => {
    throw new Error("No debe llamar GitHub");
  };
  const backend = new GitHubActionsExecutionBackend(
    config,
    async () => ({ ...execution, backendRunId: "10" }),
    request,
  );
  expect(
    (await backend.start({ executionId: execution.id, taskId: execution.taskId })).backendRunId,
  ).toBe("10");
});
test("job bloqueado por facturación conserva la señal de cuota agotada", async () => {
  const request: HttpRequest = async (url) => {
    if (url.endsWith("/annotations"))
      return Response.json([
        { message: "The job was not started because a spending limit was exceeded." },
      ]);
    if (url.endsWith("/check-runs")) return Response.json({ check_runs: [{ id: 20 }] });
    return Response.json({
      id: 10,
      status: "completed",
      conclusion: "failure",
      check_suite_id: 30,
    });
  };
  const backend = new GitHubActionsExecutionBackend(
    config,
    async () => ({ ...execution, backendRunId: "10" }),
    request,
  );
  expect(await backend.getStatus(execution.id)).toBe("EXECUTION_QUOTA_EXHAUSTED");
});
