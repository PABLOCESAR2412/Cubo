import { expect, test } from "bun:test";
import {
  CodexAgentAdapter,
  type GitActionRequest,
  GitApprovalBarrierError,
  OpenCodeAgentAdapter,
  type RegisteredApproval,
  verifyGitApproval,
} from "../packages/agents/src/index.ts";
import type { Task } from "../packages/shared/src/index.ts";

test("OpenCode y Codex exponen descriptores correctos", () => {
  const opencode = new OpenCodeAgentAdapter();
  expect(opencode.descriptor.id).toBe("opencode");
  expect(opencode.descriptor.name).toBe("OpenCode");
  expect(opencode.descriptor.supportsCheckpoints).toBe(true);
  expect(opencode.descriptor.providers).toContain("openrouter");

  const codex = new CodexAgentAdapter();
  expect(codex.descriptor.id).toBe("codex");
  expect(codex.descriptor.name).toBe("Codex");
  expect(codex.descriptor.supportsCheckpoints).toBe(true);
  expect(codex.descriptor.providers).toContain("openai");
});

test("AgentAdapter ejecuta y genera checkpoints versionados", async () => {
  const adapter = new OpenCodeAgentAdapter();
  const mockTask: Task = {
    id: "task-test-1",
    title: "Tarea de prueba",
    status: "RUNNING",
    input: { steps: 2, delaySeconds: 5, pauseAt: null },
    executionId: "exec-test-1",
    attempt: 1,
    progress: 0,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: null,
    result: null,
  };

  const result1 = await adapter.execute({
    task: mockTask,
    checkpoint: null,
    signal: new AbortController().signal,
  });

  expect(result1.outcome).toBe("SUCCEEDED");
  expect(result1.checkpoint.sequence).toBe(1);
  expect(result1.checkpoint.cursor).toBe(1);
  expect(result1.checkpoint.digest).toBeDefined();

  const result2 = await adapter.execute({
    task: mockTask,
    checkpoint: result1.checkpoint,
    signal: new AbortController().signal,
  });

  expect(result2.checkpoint.sequence).toBe(2);
  expect(result2.checkpoint.cursor).toBe(2);
});

test("AgentAdapter respeta la señal de cancelación", async () => {
  const adapter = new CodexAgentAdapter();
  const controller = new AbortController();
  controller.abort();

  const mockTask: Task = {
    id: "task-test-2",
    title: "Tarea cancelada",
    status: "RUNNING",
    input: { steps: 2, delaySeconds: 5, pauseAt: null },
    executionId: "exec-test-2",
    attempt: 1,
    progress: 0,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: null,
    result: null,
  };

  expect(
    adapter.execute({
      task: mockTask,
      checkpoint: null,
      signal: controller.signal,
    }),
  ).rejects.toThrow("Ejecución cancelada");
});

test("verifyGitApproval bloquea acciones de repositorio sin aprobación previa", () => {
  const request: GitActionRequest = {
    action: "git.commit",
    repository: "PABLOCESAR2412/Cubo",
    targetRef: "refs/heads/main",
    diffDigest: "sha256:abc123diff",
  };

  // Sin registro de aprobación
  expect(() => verifyGitApproval(request, null)).toThrow(GitApprovalBarrierError);

  // Aprobación en estado pendiente
  const pendingApproval: RegisteredApproval = {
    id: "appr-1",
    taskId: "task-1",
    action: "git.commit",
    checkpointDigest: "sha256:abc123diff",
    status: "PENDING",
  };
  expect(() => verifyGitApproval(request, pendingApproval)).toThrow("PENDING");

  // Aprobación para acción diferente
  const pushApproval: RegisteredApproval = {
    id: "appr-2",
    taskId: "task-1",
    action: "git.push",
    checkpointDigest: "sha256:abc123diff",
    status: "APPROVED",
  };
  expect(() => verifyGitApproval(request, pushApproval)).toThrow("git.push");

  // Diff no coincide con el digest aprobado
  const wrongDiffApproval: RegisteredApproval = {
    id: "appr-3",
    taskId: "task-1",
    action: "git.commit",
    checkpointDigest: "sha256:different-diff",
    status: "APPROVED",
  };
  expect(() => verifyGitApproval(request, wrongDiffApproval)).toThrow(
    "no coincide con el digest aprobado",
  );

  // Aprobación válida con diff exacto
  const validApproval: RegisteredApproval = {
    id: "appr-4",
    taskId: "task-1",
    action: "git.commit",
    checkpointDigest: "sha256:abc123diff",
    status: "APPROVED",
  };
  expect(verifyGitApproval(request, validApproval)).toBe(true);
});

test("AgentAdapter solicita WAITING_APPROVAL ante acciones Git sin aprobar", async () => {
  const adapter = new OpenCodeAgentAdapter();
  const gitTask: Task = {
    id: "task-agent-git-1",
    title: "Modificar código",
    status: "RUNNING",
    input: {
      type: "AGENT_TASK",
      agent: "opencode",
      instructions: "Actualizar versión y documentación",
      actionRequested: "commit",
      targetRef: "main",
    },
    executionId: "exec-git-1",
    attempt: 1,
    progress: 0,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    error: null,
    result: null,
  };

  // Sin aprobación previa -> debe pausar con WAITING_APPROVAL
  const paused = await adapter.execute({
    task: gitTask,
    checkpoint: null,
    signal: new AbortController().signal,
  });

  expect(paused.outcome).toBe("WAITING_APPROVAL");
  expect(paused.diff).toBeDefined();
  expect(paused.checkpoint.digest).toBeDefined();

  // Con aprobación previa del mismo digest -> debe continuar y completar
  const approved = await adapter.execute({
    task: gitTask,
    checkpoint: paused.checkpoint,
    approval: {
      id: "appr-10",
      taskId: gitTask.id,
      action: "git.commit",
      checkpointDigest: paused.checkpoint.digest,
      status: "APPROVED",
    },
    signal: new AbortController().signal,
  });

  expect(approved.outcome).toBe("SUCCEEDED");
});
