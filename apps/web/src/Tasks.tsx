import type { TaskStatus } from "@cubo/shared";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { labels, time, type Workspace } from "./workspace";

export function Status({ status }: { status: TaskStatus }) {
  return (
    <span className={`status ${status.toLowerCase()}`}>
      <i />
      {labels[status]}
    </span>
  );
}
export function Tasks({
  w,
  openTask,
  newTask,
  mobile,
  inspectorOpen,
  closeInspector,
}: {
  w: Workspace;
  openTask: (id: string) => void;
  newTask: () => void;
  mobile: boolean;
  inspectorOpen: boolean;
  closeInspector: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Actividad");
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const Inspector = mobile ? "dialog" : "aside";
  useEffect(() => {
    if (!mobile || !dialog.current) return;
    if (inspectorOpen && !dialog.current.open) {
      opener.current = document.activeElement as HTMLElement;
      dialog.current.showModal();
    }
    if (!inspectorOpen && dialog.current.open) dialog.current.close();
  }, [mobile, inspectorOpen]);
  function closed() {
    closeInspector();
    const target = opener.current;
    if (
      target?.isConnected &&
      target.getClientRects().length &&
      !target.closest("dialog:not([open])")
    ) {
      target.focus();
    } else {
      document.querySelector<HTMLButtonElement>('[aria-controls="workspace-navigation"]')?.focus();
    }
  }
  const matching = w.tasks.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      `${t.title} ${t.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  const counts = ["RUNNING", "QUEUED", "WAITING_APPROVAL", "SUCCEEDED"] as const;
  const task = w.task;
  return (
    <div className="module tasks-module">
      <div className="page-heading">
        <div>
          <h1>Tareas</h1>
          <p>Ejecuciones persistentes. El trabajo continúa al cerrar Cubo.</p>
        </div>
        <button className="primary" type="button" onClick={newTask}>
          <Icon name="plus" />
          Nueva tarea
        </button>
      </div>
      <div className="metrics-strip">
        {counts.map((s) => (
          <div key={s}>
            <span>{labels[s]}</span>
            <strong>{w.tasks.filter((t) => t.status === s).length}</strong>
            <small>
              {s === "SUCCEEDED"
                ? "en el historial disponible"
                : s === "WAITING_APPROVAL"
                  ? "requieren tu decisión"
                  : "en este workspace"}
            </small>
          </div>
        ))}
      </div>
      <div className="tasks-workspace">
        <section className="task-register" aria-label="Lista de tareas">
          <div className="filterbar">
            <label className="search-field">
              <Icon name="search" />
              <input
                aria-label="Buscar tarea o ID"
                placeholder="Buscar tarea o ID…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="sr-only" htmlFor="status-filter">
              Filtrar estado
            </label>
            <select id="status-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Todos los estados</option>
              {Object.entries(labels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="agent-filter">
              Filtrar agente
            </label>
            <select id="agent-filter" aria-label="Filtrar agente" defaultValue="runner">
              <option value="runner">Runner de validación</option>
              <option disabled>Codex · pendiente</option>
              <option disabled>OpenCode · pendiente</option>
            </select>
            <button
              type="button"
              className="icon-button"
              aria-label="Actualizar tareas"
              disabled={!w.online}
              onClick={() => void w.refresh()}
            >
              <Icon name="refresh" />
            </button>
          </div>
          <div className="register-caption">
            <span>{matching.length} ejecuciones</span>
            <span>Estado sincronizado con Cubo</span>
          </div>
          <div className="task-rows">
            {matching.map((t) => (
              <article
                key={t.id}
                className={w.selected === t.id ? "task-item selected" : "task-item"}
              >
                <div className="task-item-top">
                  <span className="tag">Runner</span>
                  <Status status={t.status} />
                  <time dateTime={t.createdAt}>{time(t.createdAt)}</time>
                </div>
                <div className="task-item-main">
                  <div>
                    <button
                      type="button"
                      className="task-title"
                      onClick={() => {
                        openTask(t.id);
                      }}
                    >
                      {t.title}
                    </button>
                    <p>
                      {t.input.steps} pasos · checkpoints persistidos
                      {t.input.pauseAt ? " · pausa con aprobación" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="secondary compact"
                    onClick={() => {
                      openTask(t.id);
                      setTab("Actividad");
                    }}
                  >
                    <Icon name="logs" size={15} />
                    Ver logs
                  </button>
                </div>
                <div className="task-item-bottom">
                  <span className="mono" title={t.id}>
                    ID {t.id.slice(0, 8)}
                  </span>
                  <span>
                    {t.progress}/{t.input.steps} pasos
                  </span>
                  <progress
                    value={t.progress}
                    max={t.input.steps}
                    aria-label={`Progreso de ${t.id.slice(0, 8)}`}
                  />
                  <span>Actualizada {time(t.updatedAt)}</span>
                </div>
              </article>
            ))}
          </div>
          {!matching.length && (
            <div className="empty-inline">
              <Icon name="tasks" size={26} />
              <h2>{w.tasks.length ? "Sin coincidencias" : "No hay tareas todavía"}</h2>
              <p>
                {w.tasks.length
                  ? "Cambia los filtros para ver otras ejecuciones."
                  : "Crea una ejecución para ver su progreso, logs y resultado."}
              </p>
              {w.tasks.length > 0 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
        </section>
        <Inspector
          ref={dialog}
          className="execution-inspector"
          aria-label="Detalle de tarea"
          onCancel={closeInspector}
          onClose={closed}
        >
          <div className="panel-heading">
            <span>
              <Icon name="logs" size={16} />
              Inspección de ejecución
            </span>
            <button
              type="button"
              className="icon-button mobile-only"
              aria-label="Cerrar detalle"
              onClick={() => dialog.current?.close()}
            >
              <Icon name="close" />
            </button>
          </div>
          <p className="sr-only" aria-live="polite" aria-atomic="true">
            {task
              ? `${labels[task.status]}. ${task.progress} de ${task.input.steps} pasos guardados.`
              : ""}
          </p>
          {!task ? (
            <div className="empty-inline">
              <Icon name="logs" size={24} />
              <h2>Selecciona una tarea</h2>
              <p>Consulta su historial, checkpoints y resultado persistido.</p>
            </div>
          ) : (
            <>
              <div className="inspector-summary">
                <Status status={task.status} />
                <h2>{task.title}</h2>
                <dl className="definition">
                  <div>
                    <dt>Ejecutor</dt>
                    <dd>GitHub Actions</dd>
                  </div>
                  <div>
                    <dt>Intento</dt>
                    <dd>{task.attempt}</dd>
                  </div>
                  <div>
                    <dt>Progreso guardado</dt>
                    <dd>
                      {task.progress} / {task.input.steps}
                    </dd>
                  </div>
                </dl>
                <progress
                  value={task.progress}
                  max={task.input.steps}
                  aria-label="Progreso guardado"
                />
                {task.error && (
                  <div className="inline-notice error">
                    <span>
                      {task.error === "EXECUTION_QUOTA_EXHAUSTED"
                        ? "Cuota gratuita agotada. La tarea permanece pendiente."
                        : task.error === "EXECUTION_CONFIGURATION_REQUIRED"
                          ? "Ejecución remota pendiente de configuración."
                          : task.error === "COST_GUARD_NOT_VERIFIED"
                            ? "Bloqueo de gasto pendiente de verificar."
                            : task.error}
                    </span>
                    {task.status === "QUEUED" && w.guard && (
                      <button
                        className="secondary compact"
                        type="button"
                        disabled={w.busy || !w.online}
                        onClick={() => void w.retry()}
                      >
                        Comprobar capacidad
                      </button>
                    )}
                  </div>
                )}
                {task.status === "WAITING_APPROVAL" && (
                  <div className="approval">
                    <strong>Continuación pendiente</strong>
                    <p>
                      Checkpoint guardado en el paso {task.progress}. Tu aprobación inicia otro
                      runner. No autoriza commit, push ni PR.
                    </p>
                    <button
                      type="button"
                      className="primary compact"
                      disabled={w.busy || !w.online}
                      onClick={() => void w.continueTask()}
                    >
                      Aprobar continuación
                    </button>
                  </div>
                )}
                {task.result && (
                  <div className="result-summary">
                    <span>Resultado persistido</span>
                    <strong>{task.result.sum}</strong>
                    <small>Suma de cuadrados · {task.result.steps} pasos</small>
                  </div>
                )}
              </div>
              <nav className="tabs" aria-label="Vistas de ejecución">
                {["Actividad", "Checkpoint", "Datos"].map((name) => (
                  <button
                    type="button"
                    key={name}
                    aria-pressed={tab === name}
                    className={tab === name ? "active" : ""}
                    onClick={() => setTab(name)}
                  >
                    {name}
                  </button>
                ))}
              </nav>
              <div className="inspector-content">
                {tab === "Actividad" && (
                  <ol className="event-log">
                    {w.detail?.events.map((event) => (
                      <li key={event.id}>
                        <time dateTime={event.createdAt}>{time(event.createdAt)}</time>
                        <div>
                          <span className={`event-dot ${event.type.toLowerCase()}`} />
                          <p>{event.message}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
                {tab === "Checkpoint" &&
                  (w.detail?.checkpoint ? (
                    <>
                      <dl className="definition">
                        <div>
                          <dt>Cursor</dt>
                          <dd>{w.detail.checkpoint.cursor}</dd>
                        </div>
                        <div>
                          <dt>Secuencia</dt>
                          <dd>{w.detail.checkpoint.sequence}</dd>
                        </div>
                        <div>
                          <dt>Valor acumulado</dt>
                          <dd>{w.detail.checkpoint.sum}</dd>
                        </div>
                      </dl>
                      <pre>{JSON.stringify(w.detail.checkpoint, null, 2)}</pre>
                    </>
                  ) : (
                    <p className="muted">Aún no se ha guardado un checkpoint.</p>
                  ))}
                {tab === "Datos" && (
                  <dl className="definition identifiers">
                    <div>
                      <dt>Task ID</dt>
                      <dd>{task.id}</dd>
                    </div>
                    <div>
                      <dt>Execution ID</dt>
                      <dd>{task.executionId}</dd>
                    </div>
                    <div>
                      <dt>Creada</dt>
                      <dd>{new Date(task.createdAt).toLocaleString("es")}</dd>
                    </div>
                    <div>
                      <dt>Actualizada</dt>
                      <dd>{new Date(task.updatedAt).toLocaleString("es")}</dd>
                    </div>
                    <div>
                      <dt>Versión</dt>
                      <dd>{task.version}</dd>
                    </div>
                  </dl>
                )}
                <details className="raw-details">
                  <summary>Identificadores y checkpoint</summary>
                  <pre>
                    {JSON.stringify(
                      {
                        taskId: task.id,
                        executionId: task.executionId,
                        checkpoint: w.detail?.checkpoint,
                      },
                      null,
                      2,
                    )}
                  </pre>
                </details>
              </div>
            </>
          )}
        </Inspector>
      </div>
    </div>
  );
}
