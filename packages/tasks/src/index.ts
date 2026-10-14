import type { ExecutionBackend } from "@cubo/runner";
import {
  ExecutionBlockedError,
  type ExecutionStatus,
  isTerminal,
  type TaskRepository,
} from "@cubo/shared";
export interface DurableSteps {
  do(name: string, action: () => Promise<boolean>): Promise<boolean>;
  sleep(name: string, milliseconds: number): Promise<void>;
}
export class TaskEngine {
  constructor(
    private readonly store: TaskRepository,
    private readonly backend: ExecutionBackend,
  ) {}
  async run(executionId: string, steps: DurableSteps): Promise<void> {
    try {
      const blocked = await steps.do("dispatch", async () => {
        const execution = await this.store.findExecution(executionId);
        if (!execution) throw new Error("Ejecución desconocida.");
        if (isTerminal(execution.status)) return true;
        if (this.store.reserveExecution && !(await this.store.reserveExecution(executionId))) {
          await this.store.deferExecution(executionId, "EXECUTION_SLOT_BUSY");
          return true;
        }
        try {
          await this.backend.start({ executionId, taskId: execution.taskId });
        } catch (error) {
          if (!(error instanceof ExecutionBlockedError)) throw error;
          await this.store.deferExecution(executionId, error.reason);
          return true;
        }
        await this.store.setDispatched(executionId);
        return false;
      });
      if (blocked) return;
      for (let poll = 0; poll < 30; poll++) {
        const done = await steps.do(`status-${poll}`, async () => {
          const execution = await this.store.findExecution(executionId);
          if (!execution) throw new Error("Ejecución desconocida.");
          if (isTerminal(execution.status)) return true;
          let remote: ExecutionStatus;
          try {
            remote = await this.backend.getStatus(executionId);
          } catch (error) {
            if (!(error instanceof ExecutionBlockedError)) throw error;
            await this.store.deferExecution(executionId, error.reason);
            return true;
          }
          if (remote === "EXECUTION_QUOTA_EXHAUSTED") {
            await this.store.deferExecution(executionId, "EXECUTION_QUOTA_EXHAUSTED");
            return true;
          }
          if (remote === "FAILED" || remote === "CANCELLED") {
            await this.store.failExecution(
              executionId,
              "El runner terminó sin guardar un resultado válido.",
            );
            return true;
          }
          return false;
        });
        if (done) return;
        await steps.sleep(`wait-${poll}`, 30000);
      }
      await steps.do("expired", async () => {
        await this.store.failExecution(
          executionId,
          "Se agotó el plazo de ejecución de 15 minutos.",
        );
        return true;
      });
    } catch {
      await steps.do("record-failure", async () => {
        await this.store.failExecution(
          executionId,
          "No fue posible ejecutar la tarea tras los reintentos.",
        );
        return true;
      });
      throw new Error("La ejecución durable falló; consultar el estado de Cubo.");
    }
  }
}
