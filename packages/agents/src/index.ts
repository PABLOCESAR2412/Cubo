import type { Agent, Checkpoint, Task } from "@cubo/shared";
export interface AgentAdapter {
  readonly descriptor: Agent;
  execute(input: {
    task: Task;
    checkpoint: Checkpoint | null;
    signal: AbortSignal;
  }): Promise<{ outcome: "SUCCEEDED" | "WAITING_APPROVAL"; checkpoint: Checkpoint }>;
}
// Codex y OpenCode se incorporarán después de demostrar el motor durable.
