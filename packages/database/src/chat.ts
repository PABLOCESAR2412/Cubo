import type { ChatMessage, ChatTurnResult, Conversation, ConversationDetail } from "@cubo/shared";
import { StoreError } from "./index";

type Row = Record<string, string | number | null>;
function conversation(row: Row): Conversation {
  return {
    id: String(row.id),
    projectId: row.project_id === null ? null : String(row.project_id),
    title: String(row.title),
    pinned: row.pinned === 1,
    version: Number(row.version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
function message(row: Row): ChatMessage {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    sequence: Number(row.sequence),
    content: String(row.content),
    role: row.role === "assistant" ? "assistant" : "user",
    attachments: JSON.parse(String(row.attachments ?? "[]")),
    status: "STORED",
    createdAt: String(row.created_at),
  };
}
export class D1ChatStore {
  constructor(
    private readonly db: D1Database,
    private readonly projectId: string | null = null,
  ) {}
  async find(id: string): Promise<Conversation> {
    const row = await this.db
      .prepare("SELECT * FROM conversations WHERE id=? AND project_id IS ?")
      .bind(id, this.projectId)
      .first<Row>();
    if (!row) throw new StoreError(404, "Conversación desconocida.");
    return conversation(row);
  }
  async list(): Promise<Conversation[]> {
    return (
      await this.db
        .prepare(
          "SELECT * FROM conversations WHERE project_id IS ? ORDER BY pinned DESC,updated_at DESC,id LIMIT 100",
        )
        .bind(this.projectId)
        .all<Row>()
    ).results.map(conversation);
  }
  async recent(): Promise<Conversation[]> {
    return (
      await this.db
        .prepare("SELECT * FROM conversations ORDER BY pinned DESC,updated_at DESC,id LIMIT 100")
        .all<Row>()
    ).results.map(conversation);
  }
  async create(id: string, title: string): Promise<Conversation> {
    const now = new Date().toISOString();
    await this.db
      .prepare(
        "INSERT INTO conversations(id,title,created_at,updated_at,project_id) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM conversations)<100 ON CONFLICT(id) DO NOTHING",
      )
      .bind(id, title, now, now, this.projectId)
      .run();
    const row = await this.db
      .prepare("SELECT * FROM conversations WHERE id=?")
      .bind(id)
      .first<Row>();
    if (!row)
      throw new StoreError(
        429,
        "Límite de almacenamiento: 100 conversaciones. Elimina una para continuar.",
      );
    if (row.title !== title || row.project_id !== this.projectId)
      throw new StoreError(409, "La clave de creación corresponde a otra conversación.");
    return conversation(row);
  }
  async detail(id: string): Promise<ConversationDetail> {
    const [parent, rows] = await this.db.batch([
      this.db
        .prepare("SELECT * FROM conversations WHERE id=? AND project_id IS ?")
        .bind(id, this.projectId),
      this.db
        .prepare(
          "SELECT m.* FROM chat_messages m JOIN conversations c ON c.id=m.conversation_id WHERE m.conversation_id=? AND c.project_id IS ? ORDER BY m.sequence LIMIT 200",
        )
        .bind(id, this.projectId),
    ]);
    const row = parent.results[0] as Row | undefined;
    if (!row) throw new StoreError(404, "Conversación desconocida.");
    return {
      conversation: conversation(row),
      messages: (rows.results as Row[]).map(message),
      inference: (await this.db
        .prepare(
          "SELECT 1 FROM provider_keys WHERE provider='openrouter' UNION ALL SELECT 1 FROM project_provider_keys WHERE project_id=? AND provider='openrouter'",
        )
        .bind(this.projectId)
        .first())
        ? "configured"
        : "unavailable",
      turns: (
        await this.db
          .prepare(
            "SELECT t.id,t.status,t.error,t.result,t.input,t.created_at,t.updated_at FROM tasks t JOIN chat_turns r ON r.task_id=t.id WHERE r.conversation_id=? AND r.project_id IS ? ORDER BY t.created_at DESC LIMIT 50",
          )
          .bind(id, this.projectId)
          .all<Row>()
      ).results.map((row) => ({
        taskId: String(row.id),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
        status: String(row.status),
        error: row.error as string | null,
        model: JSON.parse(String(row.input)).model as string,
        effort: JSON.parse(String(row.input)).effort ?? "",
        result: row.result ? (JSON.parse(String(row.result)) as ChatTurnResult) : null,
      })),
    };
  }
  async update(id: string, version: number, title: string, pinned: boolean): Promise<Conversation> {
    const result = await this.db
      .prepare(
        "UPDATE conversations SET title=?,pinned=?,version=version+1,updated_at=? WHERE id=? AND version=? AND project_id IS ?",
      )
      .bind(title, pinned ? 1 : 0, new Date().toISOString(), id, version, this.projectId)
      .run();
    if (!result.meta.changes) {
      await this.find(id);
      throw new StoreError(409, "La conversación cambió. Actualiza antes de editar.");
    }
    return this.find(id);
  }
  async remove(id: string, version: number): Promise<void> {
    if (await this.activeTurn(id))
      throw new StoreError(409, "Detén la ejecución antes de eliminar el chat.");
    const result = await this.db
      .prepare(
        "DELETE FROM conversations WHERE id=? AND version=? AND project_id IS ? AND NOT EXISTS(SELECT 1 FROM chat_turns r JOIN tasks t ON t.id=r.task_id WHERE r.conversation_id=? AND t.status IN ('QUEUED','RUNNING'))",
      )
      .bind(id, version, this.projectId, id)
      .run();
    if (!result.meta.changes) {
      await this.find(id);
      throw new StoreError(409, "La conversación cambió. Actualiza antes de eliminar.");
    }
  }
  async append(conversationId: string, id: string, content: string): Promise<ConversationDetail> {
    await this.find(conversationId);
    const previous = await this.db
      .prepare("SELECT conversation_id,content FROM chat_messages WHERE id=?")
      .bind(id)
      .first<Row>();
    if (previous) {
      if (previous.conversation_id !== conversationId || previous.content !== content)
        throw new StoreError(409, "La clave de mensaje corresponde a otros datos.");
      return this.detail(conversationId);
    }
    if (await this.activeTurn(conversationId))
      throw new StoreError(409, "Espera o detén el turno activo antes de añadir otro mensaje.");
    const now = new Date().toISOString();
    await this.db.batch([
      this.db
        .prepare(
          "INSERT INTO chat_messages(id,conversation_id,sequence,content,created_at) SELECT ?,id,COALESCE((SELECT MAX(sequence) FROM chat_messages WHERE conversation_id=?),0)+1,?,? FROM conversations WHERE id=? AND project_id IS ? AND (SELECT COUNT(*) FROM chat_messages WHERE conversation_id=?)<200 AND NOT EXISTS(SELECT 1 FROM chat_turns r JOIN tasks t ON t.id=r.task_id WHERE r.conversation_id=? AND t.status IN ('QUEUED','RUNNING')) ON CONFLICT(id) DO NOTHING",
        )
        .bind(
          id,
          conversationId,
          content,
          now,
          conversationId,
          this.projectId,
          conversationId,
          conversationId,
        ),
    ]);
    const stored = await this.db
      .prepare("SELECT * FROM chat_messages WHERE id=?")
      .bind(id)
      .first<Row>();
    if (!stored)
      throw new StoreError(429, "Límite de almacenamiento: 200 mensajes por conversación.");
    if (stored.conversation_id !== conversationId || stored.content !== content)
      throw new StoreError(409, "La clave de mensaje corresponde a otros datos.");
    return this.detail(conversationId);
  }
  async activeTurn(id: string): Promise<boolean> {
    return Boolean(
      await this.db
        .prepare(
          "SELECT 1 FROM chat_turns r JOIN tasks t ON t.id=r.task_id WHERE r.conversation_id=? AND r.project_id IS ? AND t.status IN ('QUEUED','RUNNING') LIMIT 1",
        )
        .bind(id, this.projectId)
        .first(),
    );
  }
}
