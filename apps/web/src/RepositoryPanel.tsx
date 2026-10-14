import type { RepositoryKeyInfo, RepositorySnapshot, Task } from "@cubo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { SectionCard, StatusBadge } from "./ui";
import { requestApi as api, labels } from "./workspace";

interface Overview {
  key: RepositoryKeyInfo | null;
  encryptionConfigured: boolean;
  snapshot: RepositorySnapshot | null;
  tasks: Task[];
}
export function RepositoryPanel({
  projectId,
  repository,
}: {
  projectId: string;
  repository: string | null;
}) {
  const [data, setData] = useState<Overview | null>(null);
  const [access, setAccess] = useState("PUBLIC");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [file, setFile] = useState("");
  const creationKey = useRef<string | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const id = ++generation.current;
    const result = await api<Overview>(`projects/${projectId}/repository`);
    if (id === generation.current) setData(result);
  }, [projectId]);
  useEffect(() => {
    void refresh().catch(() => setError("No se pudo cargar el repositorio."));
    return () => {
      generation.current++;
    };
  }, [refresh]);
  const active = data?.tasks.some((t) => t.status === "QUEUED" || t.status === "RUNNING");
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible")
        void refresh().catch(() =>
          setError("Sin sincronizar. La importación continúa en el backend."),
        );
    }, 5000);
    return () => clearInterval(timer);
  }, [active, refresh]);
  async function act(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await operation();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible completar la operación.");
    } finally {
      setBusy(false);
    }
  }
  async function generate() {
    await act(async () => {
      await api(`projects/${projectId}/repository-key`, { method: "POST", body: "{}" });
      setNotice("Clave pública lista. Añádela como deploy key de lectura en GitHub.");
    });
  }
  async function start() {
    await act(async () => {
      creationKey.current ??= crypto.randomUUID();
      await api(`projects/${projectId}/import`, {
        method: "POST",
        headers: { "Idempotency-Key": creationKey.current },
        body: JSON.stringify({ access }),
      });
      creationKey.current = null;
      setNotice("Importación guardada. Puedes cerrar Cubo; continuará en cloud.");
      window.dispatchEvent(new Event("cubo-tasks-changed"));
    });
  }
  const snapshot = data?.snapshot;
  const currentFile = snapshot?.files.find((item) => item.path === file);
  return (
    <>
      <SectionCard
        title="Repositorio y conexión"
        actions={
          <button
            className="secondary compact"
            type="button"
            disabled={busy}
            onClick={() =>
              void refresh().catch(() => setError("No se pudo actualizar el repositorio."))
            }
          >
            Actualizar
          </button>
        }
      >
        {error && (
          <p className="inline-notice error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="inline-notice" role="status">
            {notice}
          </p>
        )}
        <p className="hint">{repository ?? "Este proyecto no tiene repositorio."}</p>
        <div className="field-grid">
          <label>
            Acceso al repositorio
            <select
              value={access}
              disabled={busy || !repository}
              onChange={(e) => {
                setAccess(e.target.value);
                creationKey.current = null;
              }}
            >
              <option value="PUBLIC">Público · sin credenciales</option>
              <option value="SSH">Privado · deploy key SSH</option>
            </select>
          </label>
          <div className="repository-action">
            <button
              className="primary"
              type="button"
              disabled={
                busy ||
                !repository ||
                !data ||
                active ||
                (access === "SSH" && (!data.key || !data.encryptionConfigured))
              }
              onClick={() => void start()}
            >
              {busy ? "Guardando…" : "Importar repositorio"}
            </button>
          </div>
        </div>
        <p className="hint">
          Lectura remota de una revisión; no ejecuta scripts ni publica cambios. El inventario y los
          textos importados son acotados.
        </p>
        {access === "SSH" && (
          <div className="form-stack">
            {!data?.encryptionConfigured && (
              <p className="inline-notice">
                Cifrado de conexiones pendiente de configurar. La importación pública sigue
                disponible.
              </p>
            )}
            {!data?.key ? (
              <button
                className="secondary"
                type="button"
                disabled={busy || !repository || !data?.encryptionConfigured}
                onClick={() => void generate()}
              >
                Generar clave del proyecto
              </button>
            ) : (
              <>
                <label>
                  Clave pública del proyecto
                  <textarea readOnly rows={3} value={data.key.publicKey} />
                </label>
                <p className="hint mono">{data.key.fingerprint}</p>
                <button
                  className="secondary compact"
                  type="button"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(data.key?.publicKey ?? "")
                      .then(() => setNotice("Clave pública copiada."))
                      .catch(() => setError("Selecciona y copia la clave pública manualmente."));
                  }}
                >
                  Copiar clave pública
                </button>
              </>
            )}
            <ol className="ssh-guide">
              <li>En tu repositorio de GitHub, abre Settings → Deploy keys → Add deploy key.</li>
              <li>Pega la clave pública de este proyecto y usa un título identificable.</li>
              <li>
                Deja desmarcado Allow write access. Guarda la clave y vuelve a Importar repositorio.
              </li>
            </ol>
            {repository && (
              <a
                className="back-link"
                href={`${repository}/settings/keys`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir deploy keys en GitHub
              </a>
            )}
          </div>
        )}
        <div className="repository-imports">
          {data?.tasks.map((task) => (
            <div className="project-list-row" key={task.id}>
              <div>
                <StatusBadge status={task.status.toLowerCase()}>{labels[task.status]}</StatusBadge>
                <p className="hint">
                  {task.progress}/4 etapas · ID {task.id.slice(0, 8)}
                </p>
                {task.error && (
                  <p className="hint error">
                    {task.error === "EXECUTION_SLOT_BUSY"
                      ? "Esperando el turno de ejecución."
                      : task.error}
                  </p>
                )}
              </div>
              <a className="secondary compact" href={`#/tareas/${task.id}`}>
                Ver proceso
              </a>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Contexto importado">
        {snapshot ? (
          <>
            <p className="hint mono">Revisión {snapshot.revision}</p>
            <pre>{snapshot.summary}</pre>
            <p className="hint">
              Separado de tu memoria manual. No representa análisis de un agente.
            </p>
          </>
        ) : (
          <p className="hint">
            Sin importación completada. Tu memoria manual permanece disponible.
          </p>
        )}
      </SectionCard>
      <SectionCard title="Archivos · solo lectura">
        {snapshot ? (
          <>
            <p className="hint">
              {snapshot.inventory.length} rutas disponibles de {snapshot.fileCount} entradas;{" "}
              {snapshot.files.length} textos guardados. Rutas sensibles, binarios, archivos grandes
              y contenido detectado como secreto se excluyen.
            </p>
            <div className="repository-explorer">
              <div className="repository-file-list">
                {snapshot.inventory.map((path) => {
                  const stored = snapshot.files.some((item) => item.path === path);
                  return (
                    <button
                      className={`repository-file-link ${file === path ? "active" : ""}`}
                      key={path}
                      type="button"
                      disabled={!stored}
                      onClick={() => setFile(path)}
                      title={stored ? "Abrir texto importado" : "Contenido no importado"}
                    >
                      {path}
                      {!stored && <span>Solo ruta</span>}
                    </button>
                  );
                })}
              </div>
              <div className="repository-file-view">
                {currentFile ? (
                  <>
                    <strong className="mono">{currentFile.path}</strong>
                    <pre>{currentFile.content}</pre>
                  </>
                ) : (
                  <p className="hint">Selecciona un texto importado para leerlo.</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <p className="hint">
            Importa el repositorio para consultar el inventario y los textos disponibles.
          </p>
        )}
      </SectionCard>
    </>
  );
}
