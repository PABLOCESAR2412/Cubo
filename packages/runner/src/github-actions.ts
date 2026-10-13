import { type Execution, ExecutionBlockedError, type ExecutionStatus } from "@cubo/shared";
import type { ExecutionBackend, ExecutionInput } from "./index.ts";
export type HttpRequest = (url: string, init?: RequestInit) => Promise<Response>;
export interface GitHubActionsConfig {
  repository: string;
  workflow: string;
  ref: string;
  token: string;
  zeroSpendVerified: boolean;
}
interface Run {
  id: number;
  display_title: string;
  status: string;
  conclusion: string | null;
  check_suite_id?: number;
}
export class BackendError extends Error {
  constructor(public readonly status: number) {
    super(`GitHub Actions rechazó la operación (HTTP ${status}).`);
  }
}
export function mapRunStatus(run: Pick<Run, "status" | "conclusion">): ExecutionStatus {
  if (run.status !== "completed") return run.status === "in_progress" ? "RUNNING" : "QUEUED";
  if (run.conclusion === "success") return "SUCCEEDED";
  if (run.conclusion === "cancelled") return "CANCELLED";
  return "FAILED";
}
export class GitHubActionsExecutionBackend implements ExecutionBackend {
  constructor(
    private readonly config: GitHubActionsConfig,
    private readonly loadExecution: (id: string) => Promise<Execution | null>,
    private readonly request: HttpRequest = fetch,
  ) {
    if (
      !/^[\w.-]+\/[\w.-]+$/.test(config.repository) ||
      !/^[\w.-]+\.ya?ml$/.test(config.workflow) ||
      !/^[\w./-]+$/.test(config.ref) ||
      config.ref.includes("..") ||
      !config.token
    ) {
      throw new Error("Configuración de GitHub Actions incompleta o inválida.");
    }
  }
  private async api(path: string, init: RequestInit = {}): Promise<Response> {
    const response = await this.request(
      `https://api.github.com/repos/${this.config.repository}${path}`,
      {
        ...init,
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.config.token}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "Cubo",
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(15000),
        redirect: "error",
      },
    );
    if (!response.ok) {
      const body = await response.text();
      if (
        [402, 403, 422].includes(response.status) &&
        /billing|payment|spending|quota|minutes|usage limit/i.test(body)
      ) {
        throw new ExecutionBlockedError("EXECUTION_QUOTA_EXHAUSTED");
      }
      throw new BackendError(response.status);
    }
    return response;
  }
  async start(input: ExecutionInput): Promise<Execution> {
    const existing = await this.loadExecution(input.executionId);
    if (!existing || existing.taskId !== input.taskId)
      throw new Error("La ejecución no está registrada.");
    if (existing.dispatched || existing.backendRunId) return existing;
    if (!this.config.zeroSpendVerified) throw new ExecutionBlockedError("COST_GUARD_NOT_VERIFIED");
    const repo = (await (await this.api("")).json()) as { private: boolean };
    if (typeof repo.private !== "boolean")
      throw new Error("No se pudo verificar el repositorio de ejecución.");
    await this.api(`/actions/workflows/${encodeURIComponent(this.config.workflow)}/dispatches`, {
      method: "POST",
      body: JSON.stringify({ ref: this.config.ref, inputs: { execution_id: input.executionId } }),
    });
    return { ...existing, dispatched: true };
  }
  private async run(executionId: string): Promise<Run | null> {
    const execution = await this.loadExecution(executionId);
    if (!execution) throw new Error("Ejecución desconocida.");
    if (execution.backendRunId)
      return (await (await this.api(`/actions/runs/${execution.backendRunId}`)).json()) as Run;
    for (let page = 1; page <= 3; page++) {
      const data = (await (
        await this.api(
          `/actions/workflows/${encodeURIComponent(this.config.workflow)}/runs?event=workflow_dispatch&per_page=100&page=${page}`,
        )
      ).json()) as { workflow_runs: Run[] };
      const matches = data.workflow_runs.filter((r) => r.display_title === `cubo:${executionId}`);
      if (matches.length) return matches.sort((a, b) => a.id - b.id)[0] ?? null;
      if (data.workflow_runs.length < 100) break;
    }
    return null;
  }
  async getStatus(executionId: string): Promise<ExecutionStatus> {
    const run = await this.run(executionId);
    if (run?.status === "completed" && run.conclusion === "failure" && run.check_suite_id) {
      const checks = (await (
        await this.api(`/check-suites/${run.check_suite_id}/check-runs`)
      ).json()) as { check_runs: Array<{ id: number }> };
      for (const check of checks.check_runs.slice(0, 3)) {
        const notes = (await (
          await this.api(`/check-runs/${check.id}/annotations`)
        ).json()) as Array<{ message: string }>;
        if (
          notes.some((note) =>
            /billing|payment|spending limit|quota|minutes|usage limit/i.test(note.message),
          )
        )
          return "EXECUTION_QUOTA_EXHAUSTED";
      }
    }
    return run ? mapRunStatus(run) : "UNKNOWN";
  }
  async cancel(executionId: string): Promise<void> {
    const run = await this.run(executionId);
    if (!run)
      throw new Error("GitHub aún no ha identificado la ejecución; reintentar cancelación.");
    if (run.status !== "completed")
      await this.api(`/actions/runs/${run.id}/cancel`, { method: "POST" });
  }
}
