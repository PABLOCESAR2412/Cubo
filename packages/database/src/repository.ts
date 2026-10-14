import {
  excludedRepositoryPath,
  isImportInput,
  looksLikeSecret,
  type RepositoryImportUpdate,
  type RepositoryKeyInfo,
  type RepositorySnapshot,
  safeRepositoryPath,
} from "@cubo/shared";
import { D1TaskStore, StoreError } from "./index";

export interface EncryptedRepositoryKey extends RepositoryKeyInfo {
  projectId: string;
  ciphertext: string;
  iv: string;
}
export class D1RepositoryStore {
  constructor(private readonly db: D1Database) {}
  async key(projectId: string): Promise<EncryptedRepositoryKey | null> {
    const r = await this.db
      .prepare("SELECT * FROM project_repository_keys WHERE project_id=?")
      .bind(projectId)
      .first<Record<string, string>>();
    return r
      ? {
          id: r.id,
          projectId: r.project_id,
          publicKey: r.public_key,
          fingerprint: r.fingerprint,
          ciphertext: r.ciphertext,
          iv: r.iv,
          createdAt: r.created_at,
        }
      : null;
  }
  async saveKey(key: EncryptedRepositoryKey): Promise<EncryptedRepositoryKey> {
    await this.db
      .prepare(
        "INSERT INTO project_repository_keys(id,project_id,public_key,fingerprint,ciphertext,iv,created_at) VALUES(?,?,?,?,?,?,?) ON CONFLICT(project_id) DO NOTHING",
      )
      .bind(
        key.id,
        key.projectId,
        key.publicKey,
        key.fingerprint,
        key.ciphertext,
        key.iv,
        key.createdAt,
      )
      .run();
    const saved = await this.key(key.projectId);
    if (!saved) throw new StoreError(409, "No se pudo guardar la conexión.");
    return saved;
  }
  async snapshot(taskId: string): Promise<RepositorySnapshot | null> {
    const r = await this.db
      .prepare("SELECT snapshot FROM repository_snapshots WHERE task_id=?")
      .bind(taskId)
      .first<{ snapshot: string }>();
    return r ? JSON.parse(r.snapshot) : null;
  }
  async latest(projectId: string): Promise<RepositorySnapshot | null> {
    const r = await this.db
      .prepare(
        "SELECT s.snapshot FROM repository_snapshots s JOIN tasks t ON t.id=s.task_id WHERE s.project_id=? AND t.status='SUCCEEDED' ORDER BY s.created_at DESC LIMIT 1",
      )
      .bind(projectId)
      .first<{ snapshot: string }>();
    return r ? JSON.parse(r.snapshot) : null;
  }
  async tasks(projectId: string) {
    return new D1TaskStore(this.db).listTasks(projectId);
  }
  async saveProgress(id: string, runId: string, update: RepositoryImportUpdate): Promise<void> {
    const store = new D1TaskStore(this.db);
    const { task, execution } = await store.context(id, runId);
    if (!isImportInput(task.input)) throw new StoreError(400, "No es una importación.");
    if (
      update.inventory.some(
        (path) =>
          !safeRepositoryPath(path) || excludedRepositoryPath(path) || looksLikeSecret(path),
      ) ||
      update.files.some(
        (file) =>
          !safeRepositoryPath(file.path) ||
          excludedRepositoryPath(file.path) ||
          looksLikeSecret(file.content) ||
          looksLikeSecret(file.path) ||
          !update.inventory.includes(file.path),
      )
    )
      throw new StoreError(400, "El snapshot contiene rutas o contenido no permitidos.");
    if (
      new Set(update.inventory).size !== update.inventory.length ||
      new Set(update.files.map((f) => f.path)).size !== update.files.length ||
      update.files.length > update.fileCount ||
      update.inventory.length > update.fileCount
    )
      throw new StoreError(400, "Inventario inconsistente.");
    if (looksLikeSecret(update.summary)) throw new StoreError(400, "Resumen no permitido.");
    const raw = JSON.stringify(update);
    const digest = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw))),
    )
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("");
    const prior = await this.snapshot(task.id);
    if (prior?.sequence === update.sequence) {
      if (prior.digest !== digest) throw new StoreError(409, "Checkpoint distinto.");
      return;
    }
    if (
      execution.status !== "RUNNING" ||
      task.status !== "RUNNING" ||
      update.sequence !== task.progress + 1 ||
      (prior && prior.revision !== update.revision)
    )
      throw new StoreError(409, "Importación fuera de orden o terminada.");
    if (update.sequence < 3 && update.files.length)
      throw new StoreError(400, "Archivos recibidos antes del inventario.");
    if (
      update.sequence === 4 &&
      (!prior ||
        prior.fileCount !== update.fileCount ||
        prior.summary !== update.summary ||
        JSON.stringify(prior.files) !== JSON.stringify(update.files) ||
        JSON.stringify(prior.inventory) !== JSON.stringify(update.inventory))
    )
      throw new StoreError(409, "El resultado cambió después del checkpoint.");
    const now = new Date().toISOString();
    const snapshot: RepositorySnapshot = {
      ...update,
      taskId: task.id,
      projectId: task.input.projectId,
      executionId: id,
      digest,
      createdAt: now,
    };
    const status = update.sequence === 4 ? "SUCCEEDED" : "RUNNING";
    const result =
      status === "SUCCEEDED"
        ? JSON.stringify({
            revision: update.revision,
            fileCount: update.fileCount,
            importedFileCount: update.files.length,
            steps: 4,
          })
        : null;
    await this.db.batch([
      this.db
        .prepare(
          "UPDATE tasks SET progress=?,status=?,result=?,version=version+1,updated_at=? WHERE id=? AND execution_id=? AND version=? AND status='RUNNING'",
        )
        .bind(update.sequence, status, result, now, task.id, id, task.version),
      this.db
        .prepare(
          "INSERT INTO repository_snapshots(task_id,project_id,execution_id,sequence,snapshot,digest,created_at) SELECT ?,?,?,?,?,?,? FROM tasks WHERE id=? AND execution_id=? AND version=? ON CONFLICT(task_id) DO UPDATE SET execution_id=excluded.execution_id,sequence=excluded.sequence,snapshot=excluded.snapshot,digest=excluded.digest,created_at=excluded.created_at",
        )
        .bind(
          task.id,
          task.input.projectId,
          id,
          update.sequence,
          JSON.stringify(snapshot),
          digest,
          now,
          task.id,
          id,
          task.version + 1,
        ),
      this.db
        .prepare(
          "UPDATE executions SET status=? WHERE id=? AND EXISTS(SELECT 1 FROM repository_snapshots WHERE task_id=? AND digest=?)",
        )
        .bind(status, id, task.id, digest),
      this.db
        .prepare(
          "INSERT INTO task_events SELECT ?,task_id,execution_id,?,?,?,? FROM repository_snapshots WHERE task_id=? AND digest=? ON CONFLICT(id) DO NOTHING",
        )
        .bind(
          `${id}:import:${update.sequence}`,
          update.sequence,
          status,
          [
            "",
            "Repositorio leído; revisión fijada.",
            "Inventario guardado.",
            "Archivos y contexto guardados.",
            "Importación completada.",
          ][update.sequence],
          now,
          task.id,
          digest,
        ),
    ]);
    if ((await this.snapshot(task.id))?.digest !== digest)
      throw new StoreError(409, "El estado cambió; recuperar el checkpoint.");
  }
}
