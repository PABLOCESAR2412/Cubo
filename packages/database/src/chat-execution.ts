import {
  type ChatTurnContext,
  type ChatTurnOutput,
  type ChatTurnResult,
  isChatTurnInput,
} from "@cubo/shared";
import { D1TaskStore, StoreError } from "./index";

export class D1ChatExecutionStore {
  constructor(private readonly db: D1Database) {}
  async acquire(
    executionId: string,
    runId: string,
  ): Promise<{ context: ChatTurnContext; keyId: string; projectId: string; model: string }> {
    const { task, execution } = await new D1TaskStore(this.db).context(executionId, runId);
    if (!isChatTurnInput(task.input) || task.status !== "RUNNING" || execution.status !== "RUNNING")
      throw new StoreError(403, "Turno no autorizado.");
    const updated = await this.db
      .prepare(
        "UPDATE chat_turns SET request_started=1 WHERE task_id=? AND project_id=? AND conversation_id=? AND request_started=0 AND EXISTS(SELECT 1 FROM executions WHERE id=? AND cancellation_requested=0 AND status='RUNNING')",
      )
      .bind(task.id, task.input.projectId, task.input.conversationId, executionId)
      .run();
    if (!updated.meta.changes)
      throw new StoreError(409, "La solicitud ya fue entregada; no se repetirá automáticamente.");
    const row = await this.db
      .prepare("SELECT context FROM chat_turns WHERE task_id=?")
      .bind(task.id)
      .first<{ context: string }>();
    if (!row) throw new StoreError(404, "Turno desconocido.");
    return {
      context: JSON.parse(row.context),
      keyId: task.input.keyId,
      projectId: task.input.projectId,
      model: task.input.model,
    };
  }
  async complete(executionId: string, runId: string, output: ChatTurnOutput): Promise<void> {
    const { task, execution } = await new D1TaskStore(this.db).context(executionId, runId);
    if (
      !isChatTurnInput(task.input) ||
      ![task.input.model, task.input.fallbackModel].includes(output.model)
    )
      throw new StoreError(400, "Resultado de turno inválido.");
    const digest = Array.from(
      new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(output))),
      ),
    )
      .map((n) => n.toString(16).padStart(2, "0"))
      .join("");
    const turn = await this.db
      .prepare(
        "SELECT result_digest,request_started FROM chat_turns WHERE task_id=? AND project_id=? AND conversation_id=?",
      )
      .bind(task.id, task.input.projectId, task.input.conversationId)
      .first<{ result_digest: string | null; request_started: number }>();
    if (!turn) throw new StoreError(404, "Turno desconocido.");
    if (task.status === "SUCCEEDED" && turn.result_digest === digest) return;
    if (task.status !== "RUNNING" || execution.status !== "RUNNING" || turn.request_started !== 1)
      throw new StoreError(409, "Turno terminado o no adquirido.");
    const now = new Date().toISOString(),
      messageId = `${task.id}:reply`;
    const { content, ...usage } = output;
    const result: ChatTurnResult = { ...usage, steps: 1, messageId };
    await this.db.batch([
      this.db
        .prepare(
          "INSERT INTO chat_messages(id,conversation_id,sequence,content,created_at,role) SELECT ?,?,COALESCE((SELECT MAX(sequence) FROM chat_messages WHERE conversation_id=?),0)+1,?,?,'assistant' FROM tasks WHERE id=? AND execution_id=? AND version=? AND status='RUNNING' AND EXISTS(SELECT 1 FROM executions e WHERE e.id=tasks.execution_id AND e.cancellation_requested=0) ON CONFLICT(id) DO NOTHING",
        )
        .bind(
          messageId,
          task.input.conversationId,
          task.input.conversationId,
          content,
          now,
          task.id,
          executionId,
          task.version,
        ),
      this.db
        .prepare(
          "UPDATE tasks SET status='SUCCEEDED',progress=1,result=?,version=version+1,updated_at=? WHERE id=? AND execution_id=? AND version=? AND status='RUNNING' AND EXISTS(SELECT 1 FROM chat_messages WHERE id=?)",
        )
        .bind(JSON.stringify(result), now, task.id, executionId, task.version, messageId),
      this.db
        .prepare(
          "UPDATE executions SET status='SUCCEEDED' WHERE id=? AND EXISTS(SELECT 1 FROM tasks WHERE id=? AND status='SUCCEEDED')",
        )
        .bind(executionId, task.id),
      this.db
        .prepare(
          "UPDATE chat_turns SET result_digest=? WHERE task_id=? AND EXISTS(SELECT 1 FROM tasks WHERE id=? AND status='SUCCEEDED')",
        )
        .bind(digest, task.id, task.id),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,id,execution_id,1,'SUCCEEDED','Respuesta y uso guardados.',? FROM tasks WHERE id=? AND status='SUCCEEDED' ON CONFLICT(id) DO NOTHING",
        )
        .bind(`${executionId}:response`, now, task.id),
    ]);
    if ((await new D1TaskStore(this.db).findTask(task.id))?.status !== "SUCCEEDED")
      throw new StoreError(409, "El turno cambió mientras se guardaba.");
  }
}
