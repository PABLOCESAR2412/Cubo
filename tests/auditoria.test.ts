import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { D1ChatStore, D1TaskStore } from "@cubo/database";
import {
  agentProgressSchema,
  agentTaskInputSchema,
  type ChatTurnContext,
  chatTurnInputSchema,
} from "@cubo/shared";
import { containsSecret } from "../apps/api/src/content-safety";
import { OpenCodeAgentAdapter, type RegisteredApproval } from "../packages/agents/src/index.ts";
import { database } from "./sqlite";

const testEnv = { GITHUB_TOKEN: `ghp_${"a".repeat(40)}` };

test("turno de chat sin proyecto persiste sin errores de restricción", async () => {
  const { db } = database();
  const chat = new D1ChatStore(db, null);
  const conversation = await chat.create(crypto.randomUUID(), "Chat libre");
  expect(conversation.projectId).toBeNull();
  const messageId = crypto.randomUUID();
  await chat.append(conversation.id, messageId, "Hola sin proyecto");
  const store = new D1TaskStore(db);
  const input = chatTurnInputSchema.parse({
    type: "CHAT_TURN",
    projectId: null,
    conversationId: conversation.id,
    userMessageId: messageId,
    keyId: crypto.randomUUID(),
    model: "test/model:free",
  });
  const context: ChatTurnContext = {
    projectVersion: 1,
    repositoryRevision: null,
    messages: [{ role: "user", content: "Hola sin proyecto" }],
  };
  const task = await store.createTask(messageId, input, context);
  expect(task.status).toBe("QUEUED");
  const saved = await store.findTask(messageId);
  expect(saved).not.toBeNull();
  expect(saved?.input).toEqual(input);
});

test("saveAgentProgress registra diff, checkpoint ligado y aprobación git", async () => {
  const { db } = database();
  const store = new D1TaskStore(db);
  const input = agentTaskInputSchema.parse({
    type: "AGENT_TASK",
    agent: "opencode",
    instructions: "Refactoriza el módulo de pagos",
    repository: "PABLOCESAR2412/Cubo",
    actionRequested: "push",
  });
  const id = crypto.randomUUID();
  await store.createTask(id, input, {
    projectVersion: 1,
    repositoryRevision: null,
    messages: [],
  });
  const task = await store.findTask(id);
  if (!task) throw new Error("Esperaba la tarea del agente.");
  expect(task.status).toBe("QUEUED");
  await store.beginDispatch(task.executionId);
  await store.claim(task.executionId, "run-1");
  const adapter = new OpenCodeAgentAdapter();
  const attempt = await adapter.execute({
    task,
    checkpoint: null,
    approval: null,
    signal: new AbortController().signal,
  });
  expect(attempt.outcome).toBe("WAITING_APPROVAL");
  expect(attempt.diff).toBeDefined();
  const update = agentProgressSchema.parse({
    sequence: attempt.checkpoint.sequence,
    cursor: attempt.checkpoint.cursor,
    sum: attempt.checkpoint.sum,
    outcome: attempt.outcome,
    summary: attempt.summary,
    diff: attempt.diff,
  });
  await store.saveAgentProgress(`${id}-1`, "run-1", update);
  const waiting = await store.findTask(id);
  expect(waiting?.status).toBe("WAITING_APPROVAL");
  const result = waiting?.result as unknown as {
    diff?: string;
    gitAction?: string;
    diffDigest?: string;
    summary?: string;
  };
  expect(result.diff).toBe(attempt.diff);
  expect(result.gitAction).toBe("git.push");
  const digest = createHash("sha256")
    .update(attempt.diff ?? "")
    .digest("hex");
  expect(result.diffDigest).toBe(digest);
  const approvals = await store.approvals(id);
  expect(approvals.length).toBe(1);
  const first = approvals[0];
  expect(first.action).toBe("git.push");
  expect(first.status).toBe("PENDING");
  expect(first.checkpointDigest).toBe(digest);

  const approvedTask = await store.approve(id, first.id, (await store.findTask(id))?.version ?? 0);
  expect(approvedTask.status).toBe("QUEUED");
  expect(approvedTask.attempt).toBe(2);
  expect(approvedTask.executionId).toBe(`${id}-2`);

  const approval: RegisteredApproval = {
    id: approvals[0].id,
    taskId: id,
    action: "git.push",
    checkpointDigest: digest,
    status: "APPROVED",
  };
  const outcome = await adapter.execute({
    task: approvedTask,
    checkpoint: null,
    approval,
    signal: new AbortController().signal,
  });
  expect(outcome.outcome).toBe("SUCCEEDED");
  expect(outcome.summary).toContain("git.push");
  await store.beginDispatch(approvedTask.executionId);
  await store.claim(approvedTask.executionId, "run-2");
  const resumed = await store.context(approvedTask.executionId, "run-2");
  const resumedOutcome = await adapter.execute({
    task: resumed.task,
    checkpoint: resumed.checkpoint,
    approval,
    signal: new AbortController().signal,
  });
  expect(resumedOutcome.outcome).toBe("SUCCEEDED");
  await store.saveAgentProgress(approvedTask.executionId, "run-2", {
    sequence: resumedOutcome.checkpoint.sequence,
    cursor: resumedOutcome.checkpoint.cursor,
    sum: resumedOutcome.checkpoint.sum,
    outcome: resumedOutcome.outcome,
    summary: resumedOutcome.summary,
  });
  const finished = await store.findTask(id);
  expect(finished?.status).toBe("SUCCEEDED");
  const finishedResult = finished?.result as unknown as { summary?: string };
  expect(finishedResult.summary).toContain("git.push");
});

test("saveAgentProgress rechaza diff para acción sin repositorio", async () => {
  const { db } = database();
  const store = new D1TaskStore(db);
  const input = agentTaskInputSchema.parse({
    type: "AGENT_TASK",
    agent: "codex",
    instructions: "Plan de migración",
    actionRequested: "plan",
  });
  const id = crypto.randomUUID();
  await store.createTask(id, input, { projectVersion: 1, repositoryRevision: null, messages: [] });
  const task = await store.findTask(id);
  if (!task) throw new Error("Esperaba la tarea de plan.");
  await store.beginDispatch(task.executionId);
  await store.claim(task.executionId, "run-1");
  await expect(
    store.saveAgentProgress(`${id}-1`, "run-1", {
      sequence: 1,
      cursor: 1,
      sum: 1,
      outcome: "SUCCEEDED",
      summary: "Plan",
      diff: "--- a/src/auth.ts\n+++ b/src/auth.ts\n",
    }),
  ).rejects.toThrow("no solicitó una acción de repositorio");
});

test("demo guarda progreso con aritmética de demo", async () => {
  const { db } = database();
  const store = new D1TaskStore(db);
  const id = crypto.randomUUID();
  const task = await store.createTask(id, { steps: 3, delaySeconds: 0, pauseAt: null });
  expect((task.input as unknown as { steps: number }).steps).toBe(3);
});

test("containsSecret detecta prefijos de claves oficiales", () => {
  const cases = [
    ["AIzaSy0123456789abcdefghijklmnopqrstuv", true],
    ["gsk_0123456789abcdefghijklmnopqrstuvwxyzABCD", true],
    ["nvapi-0123456789abcdefghijklmnopqrstuvwxyzAB", true],
    ["ghp_0123456789abcdefghijklmnopqrstuvwxyz", true],
    ["texto normal sin credenciales", false],
    ["ghp_corta", false],
    ["nvapi-corta", false],
  ] as const;
  for (const [text, detected] of cases) {
    expect(containsSecret(`datos: ${text}`, testEnv as never)).toBe(detected);
  }
});

const read = (p: string) => readFileSync(p, "utf8");

test("style.css ya no elimina el anillo de foco", () => {
  const css = read("apps/web/src/style.css");
  expect(css.includes("outline: none")).toBe(false);
  expect(css.includes("outline:none")).toBe(false);
});

test("la UI no muestra datos fabricados", () => {
  const analytics = read("apps/web/src/Analytics.tsx");
  expect(analytics.includes("recentExecutions")).toBe(false);
  expect(analytics.includes("1,284")).toBe(false);
  expect(analytics.includes("w.tasks")).toBe(true);
  const scheduled = read("apps/web/src/ScheduledTasks.tsx");
  expect(scheduled.includes("DEFAULT_SCHEDULES")).toBe(false);
  expect(scheduled.includes("localStorage")).toBe(false);
  const tasks = read("apps/web/src/Tasks.tsx");
  expect(tasks.includes("DiffInspector")).toBe(false);
  expect(tasks.includes('"diff" in task.result')).toBe(true);
});

test("la PWA declara favicon y la cabecera envía HSTS", () => {
  expect(read("apps/web/index.html").includes('href="/icon.svg"')).toBe(true);
  const headers = read("apps/web/public/_headers");
  expect(headers.includes("Strict-Transport-Security")).toBe(true);
});
