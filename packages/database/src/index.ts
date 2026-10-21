import {
  type AgentTaskInput,
  type Approval,
  type ChatTurnContext,
  type ChatTurnInput,
  type Checkpoint,
  type DemoInput,
  type Execution,
  type ExecutionBlockReason,
  expectedSum,
  isAgentTaskInput,
  isChatTurnInput,
  isImportInput,
  type RepositoryImportInput,
  type RunnerContext,
  type RunnerUpdate,
  type Task,
  type TaskEvent,
  type TaskRepository,
  type TaskStatus,
} from "@cubo/shared";

type Row = Record<string, string | number | null>;

export { D1ChatStore } from "./chat";
export { D1ChatExecutionStore } from "./chat-execution";
export { D1ProjectStore } from "./projects";
export { D1RepositoryStore } from "./repository";
export class StoreError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
  }
}
function taskFrom(row: Row): Task {
  return {
    id: String(row.id),
    title: String(row.title),
    status: row.status as TaskStatus,
    input: JSON.parse(String(row.input)),
    executionId: String(row.execution_id),
    attempt: Number(row.attempt),
    progress: Number(row.progress),
    version: Number(row.version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    error: row.error as string | null,
    result: row.result ? JSON.parse(String(row.result)) : null,
  };
}
function executionFrom(row: Row): Execution {
  return {
    dispatchStarted: row.dispatch_started === 1,
    cancellationRequested: row.cancellation_requested === 1,
    id: String(row.id),
    taskId: String(row.task_id),
    backend: String(row.backend),
    backendRunId: row.backend_run_id as string | null,
    status: row.status as TaskStatus,
    createdAt: String(row.created_at),
    dispatched: row.dispatched === 1,
  };
}
export class D1TaskStore implements TaskRepository {
  constructor(private readonly db: D1Database) {}
  async findTask(id: string): Promise<Task | null> {
    const row = await this.db.prepare("SELECT * FROM tasks WHERE id=?").bind(id).first<Row>();
    return row ? taskFrom(row) : null;
  }
  async findExecution(id: string): Promise<Execution | null> {
    const row = await this.db.prepare("SELECT * FROM executions WHERE id=?").bind(id).first<Row>();
    return row ? executionFrom(row) : null;
  }
  async listTasks(projectId?: string): Promise<Task[]> {
    return (
      await (projectId
        ? this.db
            .prepare(
              "SELECT * FROM tasks WHERE project_id=? AND json_extract(input,'$.type')='REPOSITORY_IMPORT' ORDER BY created_at DESC LIMIT 100",
            )
            .bind(projectId)
        : this.db.prepare("SELECT * FROM tasks ORDER BY created_at DESC LIMIT 100")
      ).all<Row>()
    ).results.map(taskFrom);
  }
  async createTask(
    id: string,
    input: DemoInput | RepositoryImportInput | ChatTurnInput | AgentTaskInput,
    chatContext?: ChatTurnContext,
  ): Promise<Task> {
    const existing = await this.findTask(id);
    if (existing) {
      if (JSON.stringify(existing.input) !== JSON.stringify(input))
        throw new StoreError(409, "La clave de creación ya corresponde a otros datos.");
      if (isChatTurnInput(input)) {
        const user = await this.db
          .prepare(
            "SELECT content FROM chat_messages WHERE id=? AND conversation_id=? AND role='user'",
          )
          .bind(input.userMessageId, input.conversationId)
          .first<{ content: string }>();
        if (!user || user.content !== chatContext?.messages.at(-1)?.content)
          throw new StoreError(409, "La clave corresponde a otro mensaje o el chat fue eliminado.");
      }
      return existing;
    }
    const now = new Date().toISOString();
    if (
      isChatTurnInput(input) &&
      (chatContext?.messages.at(-1)?.role !== "user" ||
        (chatContext.messages.at(-1)?.content.length ?? 0) > 2000 ||
        !chatContext.messages.at(-1)?.content.trim() ||
        input.userMessageId !== id)
    )
      throw new StoreError(400, "Conserva el contexto antes de lanzar el turno.");
    const executionId = `${id}-1`;
    const projectId =
      input &&
      typeof input === "object" &&
      "projectId" in input &&
      typeof input.projectId === "string"
        ? input.projectId
        : null;
    await this.db.batch([
      this.db
        .prepare(
          "INSERT INTO tasks(id,title,status,input,execution_id,created_at,updated_at,project_id) SELECT ?,?,'QUEUED',?,?,?,?,? WHERE (SELECT COUNT(*) FROM tasks WHERE created_at>=?)<20 AND (SELECT COUNT(*) FROM tasks WHERE status IN ('QUEUED','RUNNING'))<3 ON CONFLICT(id) DO NOTHING",
        )
        .bind(
          id,
          isChatTurnInput(input)
            ? "Responder chat"
            : isImportInput(input)
              ? "Importar repositorio"
              : isAgentTaskInput(input)
                ? `Tarea ${input.agent === "codex" ? "Codex" : "OpenCode"}`
                : "Prueba durable",
          JSON.stringify(input),
          executionId,
          now,
          now,
          projectId,
          now.slice(0, 10),
        ),
      this.db
        .prepare(
          "INSERT INTO executions(id,task_id,backend,status,created_at,dispatch_started) SELECT ?,id,'github-actions','QUEUED',?,0 FROM tasks WHERE id=? AND execution_id=? ON CONFLICT(id) DO NOTHING",
        )
        .bind(executionId, now, id, executionId),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,id,?,0,'QUEUED','Tarea guardada y pendiente de ejecución.',? FROM tasks WHERE id=? ON CONFLICT(id) DO NOTHING",
        )
        .bind(`${executionId}:queued`, executionId, now, id),
      ...(isChatTurnInput(input)
        ? [
            this.db
              .prepare(
                "INSERT INTO chat_messages(id,conversation_id,sequence,content,created_at,role,attachments) SELECT ?,?,COALESCE((SELECT MAX(sequence) FROM chat_messages WHERE conversation_id=?),0)+1,?,?,'user',? FROM tasks WHERE id=? ON CONFLICT(id) DO NOTHING",
              )
              .bind(
                input.userMessageId,
                input.conversationId,
                input.conversationId,
                chatContext?.messages.at(-1)?.content,
                now,
                JSON.stringify(chatContext?.attachments ?? []),
                id,
              ),
            this.db
              .prepare(
                "INSERT INTO chat_turns(task_id,project_id,conversation_id,user_message_id,context) SELECT ?,?,?,?,? FROM tasks WHERE id=? ON CONFLICT(task_id) DO NOTHING",
              )
              .bind(
                id,
                input.projectId,
                input.conversationId,
                input.userMessageId,
                JSON.stringify(chatContext),
                id,
              ),
          ]
        : []),
    ]);
    const task = await this.findTask(id);
    if (!task)
      throw new StoreError(
        429,
        "Límite interno de Cubo: 20 tareas por día y 3 tareas pendientes/activas.",
      );
    if (JSON.stringify(task.input) !== JSON.stringify(input))
      throw new StoreError(409, "La clave de creación ya corresponde a otros datos.");
    return task;
  }
  async outbox(): Promise<Array<{ id: string; orchestration_attempt: number }>> {
    return (
      await this.db
        .prepare(
          "SELECT e.id,e.orchestration_attempt FROM executions e JOIN tasks t ON t.execution_id=e.id WHERE e.workflow_created=0 AND e.status='QUEUED' AND COALESCE(t.error,'') NOT IN ('COST_GUARD_NOT_VERIFIED','EXECUTION_CONFIGURATION_REQUIRED') AND (e.retry_after IS NULL OR e.retry_after<=?) ORDER BY e.created_at LIMIT 20",
        )
        .bind(new Date().toISOString())
        .all<{ id: string; orchestration_attempt: number }>()
    ).results;
  }
  async markWorkflowCreated(id: string): Promise<void> {
    await this.db.prepare("UPDATE executions SET workflow_created=1 WHERE id=?").bind(id).run();
  }
  async setDispatched(id: string): Promise<void> {
    await this.db.prepare("UPDATE executions SET dispatched=1 WHERE id=?").bind(id).run();
  }
  async claim(id: string, runId: string): Promise<void> {
    if (!(await this.reserveExecution(id)))
      throw new StoreError(409, "Otra ejecución está activa.");
    const now = new Date().toISOString();
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE executions SET backend_run_id=?,status='RUNNING' WHERE id=? AND cancellation_requested=0 AND status IN ('QUEUED','RUNNING') AND (backend_run_id IS NULL OR backend_run_id=?) AND EXISTS(SELECT 1 FROM tasks WHERE execution_id=? AND status IN ('QUEUED','RUNNING'))",
        )
        .bind(runId, id, runId, id),
      this.db
        .prepare(
          "UPDATE tasks SET status='RUNNING',updated_at=?,version=version+1 WHERE execution_id=? AND status='QUEUED' AND EXISTS(SELECT 1 FROM executions WHERE id=? AND backend_run_id=?)",
        )
        .bind(now, id, id, runId),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,task_id,id,0,'RUNNING','Runner remoto conectado.',? FROM executions WHERE id=? AND backend_run_id=? AND status='RUNNING' ON CONFLICT(id) DO NOTHING",
        )
        .bind(`${id}:claimed`, now, id, runId),
    ]);
    const execution = await this.findExecution(id);
    if (
      !execution ||
      execution.cancellationRequested ||
      execution.backendRunId !== runId ||
      execution.status !== "RUNNING"
    )
      throw new StoreError(409, "Otro runner reclamó la ejecución o ya terminó.");
  }
  async latestCheckpoint(taskId: string): Promise<Checkpoint | null> {
    const r = await this.db
      .prepare(
        "SELECT * FROM checkpoints WHERE task_id=? ORDER BY cursor DESC,created_at DESC LIMIT 1",
      )
      .bind(taskId)
      .first<Row>();
    return r
      ? {
          version: 1,
          taskId: String(r.task_id),
          executionId: String(r.execution_id),
          sequence: Number(r.sequence),
          cursor: Number(r.cursor),
          sum: Number(r.sum),
          digest: String(r.digest),
          createdAt: String(r.created_at),
        }
      : null;
  }
  async context(id: string, runId: string): Promise<RunnerContext> {
    const execution = await this.findExecution(id);
    if (!execution || execution.backendRunId !== runId)
      throw new StoreError(403, "Runner no autorizado para esta ejecución.");
    const task = await this.findTask(execution.taskId);
    if (execution.cancellationRequested)
      throw new StoreError(409, "Cancelación solicitada; callbacks revocados.");
    if (!task || task.executionId !== id) throw new StoreError(409, "La ejecución fue sustituida.");
    return { task, execution, checkpoint: await this.latestCheckpoint(task.id) };
  }
  async saveProgress(id: string, runId: string, update: RunnerUpdate): Promise<void> {
    const { task, execution, checkpoint } = await this.context(id, runId);
    const input = task.input;
    if ("type" in input) throw new StoreError(400, "Esta ejecución no admite progreso de la demo.");
    if (
      update.cursor > input.steps ||
      update.sequence !== update.cursor ||
      update.sum !== expectedSum(update.cursor)
    )
      throw new StoreError(400, "Checkpoint de demostración inválido.");
    const outcome =
      update.cursor === input.steps
        ? "SUCCEEDED"
        : update.cursor === input.pauseAt && task.attempt === 1
          ? "WAITING_APPROVAL"
          : "RUNNING";
    if (update.outcome !== outcome)
      throw new StoreError(400, "Estado incompatible con el progreso.");
    const raw = JSON.stringify({ taskId: task.id, executionId: id, ...update });
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const prior = await this.db
      .prepare("SELECT digest FROM checkpoints WHERE execution_id=? AND sequence=?")
      .bind(id, update.sequence)
      .first<{ digest: string }>();
    if (prior) {
      if (prior.digest !== digest)
        throw new StoreError(409, "Checkpoint repetido con contenido distinto.");
      return;
    }
    if (
      execution.status !== "RUNNING" ||
      task.status !== "RUNNING" ||
      update.cursor !== (checkpoint?.cursor ?? 0) + 1
    )
      throw new StoreError(409, "Checkpoint fuera de orden o ejecución terminada.");
    const now = new Date().toISOString();
    const eventId = `${id}:${update.sequence}`;
    const message =
      outcome === "SUCCEEDED"
        ? "Resultado guardado."
        : outcome === "WAITING_APPROVAL"
          ? "Checkpoint guardado; runner liberado."
          : "Progreso guardado.";
    const result =
      outcome === "SUCCEEDED" ? JSON.stringify({ sum: update.sum, steps: update.cursor }) : null;
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE tasks SET status=?,progress=?,version=version+1,updated_at=?,result=? WHERE id=? AND execution_id=? AND version=? AND status='RUNNING'",
        )
        .bind(outcome, update.cursor, now, result, task.id, id, task.version),
      this.db
        .prepare(
          "INSERT INTO checkpoints SELECT ?,?,?, ?,?,?,? FROM tasks WHERE id=? AND execution_id=? AND version=? AND progress=? ON CONFLICT(execution_id,sequence) DO NOTHING",
        )
        .bind(
          id,
          update.sequence,
          task.id,
          update.cursor,
          update.sum,
          digest,
          now,
          task.id,
          id,
          task.version + 1,
          update.cursor,
        ),
      this.db
        .prepare(
          "UPDATE executions SET status=? WHERE id=? AND EXISTS(SELECT 1 FROM checkpoints WHERE execution_id=? AND sequence=? AND digest=?)",
        )
        .bind(outcome, id, id, update.sequence, digest),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,task_id,execution_id,sequence,?,?,? FROM checkpoints WHERE execution_id=? AND sequence=? AND digest=? ON CONFLICT(id) DO NOTHING",
        )
        .bind(eventId, outcome, message, now, id, update.sequence, digest),
      this.db
        .prepare(
          "INSERT INTO approvals SELECT ?,task_id,execution_id,'continue',digest,'PENDING',?,NULL FROM checkpoints WHERE execution_id=? AND sequence=? AND digest=? AND ?='WAITING_APPROVAL' ON CONFLICT(id) DO NOTHING",
        )
        .bind(`${id}:continue`, now, id, update.sequence, digest, outcome),
    ]);
    const saved = await this.db
      .prepare("SELECT digest FROM checkpoints WHERE execution_id=? AND sequence=?")
      .bind(id, update.sequence)
      .first<{ digest: string }>();
    if (saved?.digest !== digest)
      throw new StoreError(409, "El estado cambió; reintentar desde el checkpoint persistido.");
  }
  async approvals(taskId: string): Promise<Approval[]> {
    return (
      await this.db
        .prepare("SELECT * FROM approvals WHERE task_id=? ORDER BY created_at")
        .bind(taskId)
        .all<Row>()
    ).results.map((r) => ({
      id: String(r.id),
      taskId: String(r.task_id),
      executionId: String(r.execution_id),
      action: "continue",
      checkpointDigest: String(r.checkpoint_digest),
      status: r.status as Approval["status"],
      createdAt: String(r.created_at),
      decidedAt: r.decided_at as string | null,
    }));
  }
  async approve(taskId: string, approvalId: string, version: number): Promise<Task> {
    const task = await this.findTask(taskId);
    if (!task) throw new StoreError(404, "Tarea desconocida.");
    const approval = (await this.approvals(taskId)).find((a) => a.id === approvalId);
    if (!approval) throw new StoreError(404, "Aprobación desconocida.");
    if (approval.status === "APPROVED") return task;
    const cp = await this.latestCheckpoint(taskId);
    if (
      task.status !== "WAITING_APPROVAL" ||
      task.version !== version ||
      approval.executionId !== task.executionId ||
      cp?.digest !== approval.checkpointDigest
    )
      throw new StoreError(409, "La aprobación no corresponde al estado actual.");
    const now = new Date().toISOString();
    const next = `${taskId}-${task.attempt + 1}`;
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE approvals SET status='APPROVED',decided_at=? WHERE id=? AND status='PENDING' AND EXISTS(SELECT 1 FROM tasks WHERE id=? AND version=? AND status='WAITING_APPROVAL')",
        )
        .bind(now, approvalId, taskId, version),
      this.db
        .prepare(
          "UPDATE tasks SET status='QUEUED',execution_id=?,attempt=attempt+1,version=version+1,updated_at=? WHERE id=? AND version=? AND status='WAITING_APPROVAL' AND EXISTS(SELECT 1 FROM approvals WHERE id=? AND status='APPROVED')",
        )
        .bind(next, now, taskId, version, approvalId),
      this.db
        .prepare(
          "INSERT INTO executions(id,task_id,backend,status,created_at,dispatch_started) SELECT ?,id,'github-actions','QUEUED',?,0 FROM tasks WHERE id=? AND execution_id=? ON CONFLICT(id) DO NOTHING",
        )
        .bind(next, now, taskId, next),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,id,?,0,'QUEUED','Continuación aprobada; nueva ejecución pendiente.',? FROM tasks WHERE id=? AND execution_id=? ON CONFLICT(id) DO NOTHING",
        )
        .bind(`${next}:queued`, next, now, taskId, next),
    ]);
    const current = await this.findTask(taskId);
    if (!current) throw new StoreError(404, "Tarea desconocida.");
    return current;
  }
  async events(taskId: string): Promise<TaskEvent[]> {
    return (
      await this.db
        .prepare("SELECT * FROM task_events WHERE task_id=? ORDER BY created_at,sequence LIMIT 200")
        .bind(taskId)
        .all<Row>()
    ).results.map((r) => ({
      id: String(r.id),
      taskId: String(r.task_id),
      executionId: String(r.execution_id),
      sequence: Number(r.sequence),
      type: r.type as TaskStatus,
      message: String(r.message),
      createdAt: String(r.created_at),
    }));
  }
  async failExecution(id: string, message: string): Promise<void> {
    if ((await this.findExecution(id))?.cancellationRequested) return;
    const now = new Date().toISOString();
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE tasks SET status='FAILED',error=?,updated_at=?,version=version+1 WHERE execution_id=? AND status IN ('QUEUED','RUNNING') AND EXISTS(SELECT 1 FROM executions e WHERE e.id=tasks.execution_id AND e.cancellation_requested=0)",
        )
        .bind(message, now, id),
      this.db
        .prepare(
          "UPDATE executions SET status='FAILED' WHERE id=? AND cancellation_requested=0 AND status IN ('QUEUED','RUNNING')",
        )
        .bind(id),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,task_id,id,0,'FAILED',?,? FROM executions WHERE id=? AND status='FAILED' ON CONFLICT(id) DO NOTHING",
        )
        .bind(`${id}:failed`, message, now, id),
    ]);
  }
  async beginDispatch(id: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        "UPDATE executions SET dispatch_started=1 WHERE id=? AND cancellation_requested=0 AND status IN ('QUEUED','RUNNING')",
      )
      .bind(id)
      .run();
    return Boolean(result.meta.changes);
  }
  async requestCancellation(taskId: string): Promise<Task> {
    const task = await this.findTask(taskId);
    if (!task) throw new StoreError(404, "Tarea desconocida.");
    if (task.status === "CANCELLED") return task;
    if (!["QUEUED", "RUNNING"].includes(task.status))
      throw new StoreError(409, "La tarea ya terminó.");
    const now = new Date().toISOString();
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE executions SET cancellation_requested=1,retry_after=NULL WHERE id=? AND status IN ('QUEUED','RUNNING')",
        )
        .bind(task.executionId),
      this.db
        .prepare(
          "UPDATE tasks SET error='CANCELLATION_REQUESTED',version=version+1,updated_at=? WHERE id=? AND status IN ('QUEUED','RUNNING')",
        )
        .bind(now, taskId),
    ]);
    return (await this.findTask(taskId)) as Task;
  }
  async confirmCancellation(id: string): Promise<void> {
    const now = new Date().toISOString();
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE tasks SET status='CANCELLED',error=NULL,version=version+1,updated_at=? WHERE execution_id=? AND status IN ('QUEUED','RUNNING') AND EXISTS(SELECT 1 FROM executions WHERE id=? AND cancellation_requested=1)",
        )
        .bind(now, id, id),
      this.db
        .prepare(
          "UPDATE executions SET status='CANCELLED' WHERE id=? AND cancellation_requested=1 AND EXISTS(SELECT 1 FROM tasks WHERE execution_id=? AND status='CANCELLED')",
        )
        .bind(id, id),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,task_id,id,0,'CANCELLED','Cancelación confirmada.',? FROM executions WHERE id=? AND status='CANCELLED' ON CONFLICT(id) DO NOTHING",
        )
        .bind(`${id}:cancelled`, now, id),
    ]);
  }
  async pendingCancellations(): Promise<string[]> {
    return (
      await this.db
        .prepare(
          "SELECT id FROM executions WHERE cancellation_requested=1 AND status IN ('QUEUED','RUNNING') LIMIT 3",
        )
        .all<{ id: string }>()
    ).results.map((r) => r.id);
  }
  async allowLogin(ip: string): Promise<boolean> {
    const id = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip))),
    )
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const window = Math.floor(Date.now() / 60000);
    const row = await this.db
      .prepare(
        "INSERT INTO login_limits VALUES(?,?,1) ON CONFLICT(id) DO UPDATE SET hits=CASE WHEN window=excluded.window THEN hits+1 ELSE 1 END,window=excluded.window RETURNING hits",
      )
      .bind(id, window)
      .first<{ hits: number }>();
    return (row?.hits ?? 99) <= 5;
  }
  async cleanupLoginLimits(): Promise<void> {
    await this.db
      .prepare("DELETE FROM login_limits WHERE window<?")
      .bind(Math.floor(Date.now() / 60000) - 60)
      .run();
  }
  async deferExecution(id: string, reason: ExecutionBlockReason): Promise<void> {
    if ((await this.findExecution(id))?.cancellationRequested) return;
    const now = new Date();
    const retry = new Date(
      now.getTime() + (reason === "EXECUTION_SLOT_BUSY" ? 60000 : 24 * 60 * 60 * 1000),
    ).toISOString();
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE tasks SET status='QUEUED',error=?,updated_at=?,version=version+1 WHERE execution_id=? AND status IN ('QUEUED','RUNNING') AND EXISTS(SELECT 1 FROM executions e WHERE e.id=tasks.execution_id AND e.cancellation_requested=0)",
        )
        .bind(reason, now.toISOString(), id),
      this.db
        .prepare(
          "UPDATE executions SET status='QUEUED',workflow_created=0,dispatched=0,backend_run_id=NULL,orchestration_attempt=orchestration_attempt+1,retry_after=? WHERE id=? AND cancellation_requested=0 AND status IN ('QUEUED','RUNNING')",
        )
        .bind(retry, id),
    ]);
  }
  async retryDispatch(taskId: string): Promise<Task> {
    const task = await this.findTask(taskId);
    if (!task) throw new StoreError(404, "Tarea desconocida.");
    if ((await this.findExecution(task.executionId))?.cancellationRequested)
      throw new StoreError(409, "Cancelación pendiente de confirmar.");
    if (task.status !== "QUEUED" || !task.error)
      throw new StoreError(409, "La tarea no está bloqueada por capacidad.");
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE tasks SET error=NULL,updated_at=?,version=version+1 WHERE id=? AND status='QUEUED'",
        )
        .bind(new Date().toISOString(), taskId),
      this.db
        .prepare("UPDATE executions SET retry_after=NULL WHERE id=? AND status='QUEUED'")
        .bind(task.executionId),
    ]);
    return (await this.findTask(taskId)) as Task;
  }
  async reserveExecution(id: string): Promise<boolean> {
    await this.db
      .prepare(
        "UPDATE execution_slot SET execution_id=? WHERE slot=1 AND (execution_id IS NULL OR execution_id=? OR EXISTS(SELECT 1 FROM executions e WHERE e.id=execution_slot.execution_id AND e.status IN ('SUCCEEDED','FAILED','CANCELLED','WAITING_APPROVAL')))",
      )
      .bind(id, id)
      .run();
    const row = await this.db
      .prepare("SELECT execution_id FROM execution_slot WHERE slot=1")
      .first<{ execution_id: string }>();
    return row?.execution_id === id;
  }
}
