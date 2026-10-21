import { z } from "zod";
import type { AgentTaskInput, AgentTaskResult } from "./agent-task";
import type { ChatTurnInput, ChatTurnResult } from "./chat-turn";
import type { RepositoryImportInput, RepositoryImportResult } from "./repository";

export * from "./agent-task";
export * from "./chat";
export * from "./chat-turn";
export * from "./chat-turn-safety";
export * from "./project";
export * from "./repository";
export * from "./versions";
export const taskStatuses = [
  "QUEUED",
  "RUNNING",
  "WAITING_APPROVAL",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export type ExecutionStatus = TaskStatus | "UNKNOWN" | "EXECUTION_QUOTA_EXHAUSTED";
export type ExecutionBlockReason =
  | "EXECUTION_QUOTA_EXHAUSTED"
  | "COST_GUARD_NOT_VERIFIED"
  | "EXECUTION_CONFIGURATION_REQUIRED"
  | "EXECUTION_SLOT_BUSY";
export class ExecutionBlockedError extends Error {
  constructor(public readonly reason: ExecutionBlockReason) {
    super(reason);
  }
}
export const demoInputSchema = z
  .object({
    steps: z.number().int().min(2).max(12).default(6),
    delaySeconds: z.number().int().min(5).max(15).default(10),
    pauseAt: z.number().int().min(1).max(11).nullable().default(null),
  })
  .strict()
  .refine((v) => v.pauseAt === null || v.pauseAt < v.steps, "La pausa debe preceder al final.");
export type DemoInput = z.infer<typeof demoInputSchema>;
export function isDemoInput(input: unknown): input is DemoInput {
  return typeof input === "object" && input !== null && "steps" in input && !("type" in input);
}
export function isDemoResult(result: unknown): result is DemoResult {
  return typeof result === "object" && result !== null && "sum" in result;
}
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  input: DemoInput | RepositoryImportInput | ChatTurnInput | AgentTaskInput;
  executionId: string;
  attempt: number;
  progress: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  error: string | null;
  result: DemoResult | RepositoryImportResult | ChatTurnResult | AgentTaskResult | null;
}
export interface DemoResult {
  sum: number;
  steps: number;
}
export interface TaskEvent {
  id: string;
  taskId: string;
  executionId: string;
  sequence: number;
  type: TaskStatus;
  message: string;
  createdAt: string;
}
export interface Execution {
  dispatchStarted?: boolean;
  cancellationRequested?: boolean;
  id: string;
  taskId: string;
  backend: string;
  backendRunId: string | null;
  status: ExecutionStatus;
  createdAt: string;
  dispatched: boolean;
}
export interface Agent {
  id: string;
  name: string;
  providers: string[];
  supportsCheckpoints: boolean;
}
export interface Provider {
  id: string;
  name: string;
  models: string[];
}
export interface Approval {
  id: string;
  taskId: string;
  executionId: string;
  action: "continue" | "git.commit" | "git.push" | "github.pull-request.create";
  checkpointDigest: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  decidedAt: string | null;
}
export interface Project {
  id: string;
  name: string;
  repository: string | null;
  baseRef: string | null;
}
export interface Checkpoint {
  version: 1;
  taskId: string;
  executionId: string;
  sequence: number;
  cursor: number;
  sum: number;
  digest: string;
  createdAt: string;
}
export const runnerUpdateSchema = z
  .object({
    sequence: z.number().int().min(1).max(12),
    cursor: z.number().int().min(1).max(12),
    sum: z.number().int().min(0).max(10000),
    outcome: z.enum(["RUNNING", "WAITING_APPROVAL", "SUCCEEDED"]),
  })
  .strict();
export type RunnerUpdate = z.infer<typeof runnerUpdateSchema>;
export interface RunnerContext {
  protocolVersion?: 2;
  task: Task;
  execution: Execution;
  checkpoint: Checkpoint | null;
}
export interface TaskRepository {
  beginDispatch?(id: string): Promise<boolean>;
  confirmCancellation?(id: string): Promise<void>;
  reserveExecution?(id: string): Promise<boolean>;
  findTask(id: string): Promise<Task | null>;
  findExecution(id: string): Promise<Execution | null>;
  setDispatched(id: string): Promise<void>;
  failExecution(id: string, message: string): Promise<void>;
  deferExecution(id: string, reason: ExecutionBlockReason): Promise<void>;
}
export function expectedSum(cursor: number): number {
  return (cursor * (cursor + 1) * (2 * cursor + 1)) / 6;
}
export function isTerminal(status: ExecutionStatus): boolean {
  return ["SUCCEEDED", "FAILED", "CANCELLED", "WAITING_APPROVAL"].includes(status);
}
