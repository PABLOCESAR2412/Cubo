import type { Execution, ExecutionStatus } from "@cubo/shared";
export interface ExecutionInput {
  executionId: string;
  taskId: string;
}
export interface ExecutionBackend {
  start(input: ExecutionInput): Promise<Execution>;
  cancel(executionId: string): Promise<void>;
  getStatus(executionId: string): Promise<ExecutionStatus>;
}
export { executeDemo } from "./demo.ts";
export type { GitHubActionsConfig } from "./github-actions.ts";
export { GitHubActionsExecutionBackend } from "./github-actions.ts";
export { importRepository } from "./repository-import.ts";
