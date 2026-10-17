import { type Agent, type Checkpoint, isAgentTaskInput, type Task } from "@cubo/shared";

export interface AgentAdapter {
  readonly descriptor: Agent;
  execute(input: {
    task: Task;
    checkpoint: Checkpoint | null;
    approval?: RegisteredApproval | null;
    signal: AbortSignal;
  }): Promise<{ outcome: "SUCCEEDED" | "WAITING_APPROVAL"; checkpoint: Checkpoint; diff?: string }>;
}

export interface GitActionRequest {
  action: "git.commit" | "git.push" | "github.pull-request.create";
  repository: string;
  targetRef: string;
  diffDigest: string;
}

export interface RegisteredApproval {
  id: string;
  taskId: string;
  action: "git.commit" | "git.push" | "github.pull-request.create" | "continue";
  checkpointDigest: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export class GitApprovalBarrierError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitApprovalBarrierError";
  }
}

/**
 * Valida que una acción de repositorio cuente con una aprobación explícita registrada por Cubo.
 * El digest del diff y la acción deben coincidir con exactitud para evitar efectos duplicados o no autorizados.
 */
export function verifyGitApproval(
  request: GitActionRequest,
  approval: RegisteredApproval | null,
): boolean {
  if (!approval) {
    throw new GitApprovalBarrierError(
      "Acción Git rechazada: no existe aprobación registrada en Cubo.",
    );
  }
  if (approval.status !== "APPROVED") {
    throw new GitApprovalBarrierError(
      `Acción Git rechazada: la aprobación está en estado ${approval.status}.`,
    );
  }
  if (approval.action !== request.action) {
    throw new GitApprovalBarrierError(
      `Acción Git rechazada: la aprobación autoriza '${approval.action}', no '${request.action}'.`,
    );
  }
  if (approval.checkpointDigest !== request.diffDigest) {
    throw new GitApprovalBarrierError(
      "Acción Git rechazada: el diff de los cambios no coincide con el digest aprobado.",
    );
  }
  return true;
}

async function computeSha256(content: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class OpenCodeAgentAdapter implements AgentAdapter {
  readonly descriptor: Agent = {
    id: "opencode",
    name: "OpenCode",
    providers: ["openrouter", "opencode-zen"],
    supportsCheckpoints: true,
  };

  async execute(input: {
    task: Task;
    checkpoint: Checkpoint | null;
    approval?: RegisteredApproval | null;
    signal: AbortSignal;
  }): Promise<{
    outcome: "SUCCEEDED" | "WAITING_APPROVAL";
    checkpoint: Checkpoint;
    diff?: string;
  }> {
    if (input.signal.aborted) throw new Error("Ejecución cancelada.");
    const nextSequence = (input.checkpoint?.sequence ?? 0) + 1;
    const nextCursor = (input.checkpoint?.cursor ?? 0) + 1;

    if (isAgentTaskInput(input.task.input)) {
      const taskInput = input.task.input;
      const isGitWrite =
        taskInput.actionRequested === "commit" || taskInput.actionRequested === "push";

      if (isGitWrite) {
        const diff = `--- a/instructions.md\n+++ b/instructions.md\n@@ -1,3 +1,4 @@\n+# [OpenCode] ${taskInput.instructions.slice(0, 100)}\n`;
        const diffDigest = await computeSha256(diff);

        // Si aún no está aprobada, se solicita aprobación explícita
        if (input.approval?.status !== "APPROVED") {
          const checkpoint: Checkpoint = {
            version: 1,
            taskId: input.task.id,
            executionId: input.task.executionId,
            sequence: nextSequence,
            cursor: nextCursor,
            sum: nextCursor,
            digest: diffDigest,
            createdAt: new Date().toISOString(),
          };
          return { outcome: "WAITING_APPROVAL", checkpoint, diff };
        }

        // Si ya hay aprobación registrada, verificar la barrera Git
        verifyGitApproval(
          {
            action: taskInput.actionRequested === "push" ? "git.push" : "git.commit",
            repository: taskInput.repository ?? "PABLOCESAR2412/Cubo",
            targetRef: taskInput.targetRef ?? "main",
            diffDigest,
          },
          input.approval,
        );
      }
    }

    const digest = await computeSha256(`opencode:${input.task.id}:${nextSequence}:${nextCursor}`);
    const checkpoint: Checkpoint = {
      version: 1,
      taskId: input.task.id,
      executionId: input.task.executionId,
      sequence: nextSequence,
      cursor: nextCursor,
      sum: nextCursor,
      digest,
      createdAt: new Date().toISOString(),
    };

    return { outcome: "SUCCEEDED", checkpoint };
  }
}

export class CodexAgentAdapter implements AgentAdapter {
  readonly descriptor: Agent = {
    id: "codex",
    name: "Codex",
    providers: ["openrouter", "openai"],
    supportsCheckpoints: true,
  };

  async execute(input: {
    task: Task;
    checkpoint: Checkpoint | null;
    approval?: RegisteredApproval | null;
    signal: AbortSignal;
  }): Promise<{
    outcome: "SUCCEEDED" | "WAITING_APPROVAL";
    checkpoint: Checkpoint;
    diff?: string;
  }> {
    if (input.signal.aborted) throw new Error("Ejecución cancelada.");
    const nextSequence = (input.checkpoint?.sequence ?? 0) + 1;
    const nextCursor = (input.checkpoint?.cursor ?? 0) + 1;

    if (isAgentTaskInput(input.task.input)) {
      const taskInput = input.task.input;
      const isGitWrite =
        taskInput.actionRequested === "commit" || taskInput.actionRequested === "push";

      if (isGitWrite) {
        const diff = `--- a/codex-task.md\n+++ b/codex-task.md\n@@ -1,3 +1,4 @@\n+# [Codex] ${taskInput.instructions.slice(0, 100)}\n`;
        const diffDigest = await computeSha256(diff);

        if (input.approval?.status !== "APPROVED") {
          const checkpoint: Checkpoint = {
            version: 1,
            taskId: input.task.id,
            executionId: input.task.executionId,
            sequence: nextSequence,
            cursor: nextCursor,
            sum: nextCursor,
            digest: diffDigest,
            createdAt: new Date().toISOString(),
          };
          return { outcome: "WAITING_APPROVAL", checkpoint, diff };
        }

        verifyGitApproval(
          {
            action: taskInput.actionRequested === "push" ? "git.push" : "git.commit",
            repository: taskInput.repository ?? "PABLOCESAR2412/Cubo",
            targetRef: taskInput.targetRef ?? "main",
            diffDigest,
          },
          input.approval,
        );
      }
    }

    const digest = await computeSha256(`codex:${input.task.id}:${nextSequence}:${nextCursor}`);
    const checkpoint: Checkpoint = {
      version: 1,
      taskId: input.task.id,
      executionId: input.task.executionId,
      sequence: nextSequence,
      cursor: nextCursor,
      sum: nextCursor,
      digest,
      createdAt: new Date().toISOString(),
    };

    return { outcome: "SUCCEEDED", checkpoint };
  }
}
