import type { StoredProject } from "@cubo/shared";
import { StoreError } from "./index";

type Row = Record<string, string | number | null>;
const select =
  "SELECT p.*,(SELECT COUNT(*) FROM conversations c WHERE c.project_id=p.id) AS chat_count FROM projects p";
function project(row: Row): StoredProject {
  return {
    id: String(row.id),
    name: String(row.name),
    repository: row.repository === null ? null : String(row.repository),
    instructions: String(row.instructions),
    memory: String(row.memory),
    version: Number(row.version),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    chatCount: Number(row.chat_count),
  };
}
export class D1ProjectStore {
  constructor(private readonly db: D1Database) {}
  async find(id: string): Promise<StoredProject> {
    const row = await this.db.prepare(`${select} WHERE p.id=?`).bind(id).first<Row>();
    if (!row) throw new StoreError(404, "Proyecto desconocido.");
    return project(row);
  }
  async list(): Promise<StoredProject[]> {
    return (
      await this.db.prepare(`${select} ORDER BY p.updated_at DESC,p.id LIMIT 100`).all<Row>()
    ).results.map(project);
  }
  async create(id: string, name: string, repository: string | null): Promise<StoredProject> {
    const now = new Date().toISOString();
    await this.db
      .prepare(
        "INSERT INTO projects(id,name,repository,created_at,updated_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM projects)<100 ON CONFLICT(id) DO NOTHING",
      )
      .bind(id, name, repository, now, now)
      .run();
    const row = await this.db.prepare(`${select} WHERE p.id=?`).bind(id).first<Row>();
    if (!row) throw new StoreError(429, "Límite de almacenamiento: 100 proyectos.");
    if (row.name !== name || row.repository !== repository)
      throw new StoreError(409, "La clave corresponde a otro proyecto.");
    return project(row);
  }
  async update(
    id: string,
    version: number,
    name: string,
    instructions: string,
    memory: string,
  ): Promise<StoredProject> {
    const result = await this.db
      .prepare(
        "UPDATE projects SET name=?,instructions=?,memory=?,version=version+1,updated_at=? WHERE id=? AND version=?",
      )
      .bind(name, instructions, memory, new Date().toISOString(), id, version)
      .run();
    if (!result.meta.changes) {
      await this.find(id);
      throw new StoreError(409, "El proyecto cambió. Actualiza antes de guardar.");
    }
    return this.find(id);
  }
  async remove(id: string, version: number): Promise<void> {
    if (
      await this.db
        .prepare(
          "SELECT 1 AS found FROM project_repository_keys WHERE project_id=? UNION ALL SELECT 1 FROM repository_snapshots WHERE project_id=? UNION ALL SELECT 1 FROM tasks WHERE json_extract(input,'$.projectId')=? LIMIT 1",
        )
        .bind(id, id, id)
        .first()
    )
      throw new StoreError(
        409,
        "El proyecto tiene conexión o importaciones guardadas; su eliminación requiere archivar esos datos primero.",
      );
    const result = await this.db
      .prepare(
        "DELETE FROM projects WHERE id=? AND version=? AND NOT EXISTS(SELECT 1 FROM conversations WHERE project_id=?)",
      )
      .bind(id, version, id)
      .run();
    if (!result.meta.changes) {
      await this.find(id);
      throw new StoreError(
        409,
        "El proyecto cambió o tiene chats. Elimina sus chats antes de borrar el proyecto.",
      );
    }
  }
}
