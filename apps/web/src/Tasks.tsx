import type { TaskStatus } from "@cubo/shared";
import { useState } from "react";
import { Icon } from "./Icon";
import { MetricCard, PageHeader, ProcessEvent, RightPanel, StatusBadge, TaskRow } from "./ui";
import { labels, type Workspace } from "./workspace";

export function Status({ status }: { status: TaskStatus }) {
  return <StatusBadge status={status.toLowerCase()}>{labels[status]}</StatusBadge>;
}
export function Tasks({
  w,
  openTask,
  newTask,
  inspectorOpen,
  closeInspector,
}: {
  w: Workspace;
  openTask: (id: string) => void;
  newTask: () => void;
  inspectorOpen: boolean;
  closeInspector: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("Actividad");
  const matching = w.tasks.filter(
    (t) =>
      (filter === "all" || t.status === filter) &&
      `${t.title} ${t.id}`.toLowerCase().includes(query.toLowerCase()),
  );
  const counts = ["RUNNING", "QUEUED", "SUCCEEDED"] as const;
  const task = w.task;
  return (
    <div className="module tasks-module">
      <PageHeader
        title="Tareas"
        description="Tareas que continúan ejecutándose aunque cierres Cubo."
        actions={
          <button className="primary" type="button" onClick={newTask}>
            <Icon name="plus" />
            Nueva tarea
          </button>
        }
      />
      <div className="metric-grid">
        {counts.map((s) => (
          <MetricCard
            key={s}
            label={s === "RUNNING" ? "En ejecución" : s === "QUEUED" ? "En cola" : "Completas"}
            value={w.tasks.filter((t) => t.status === s).length}
            detail="historial de tareas disponible"
            icon={s === "RUNNING" ? "refresh" : s === "QUEUED" ? "clock" : "check"}
          />
        ))}
      </div>
      {w.tasks.some((t) => t.status === "WAITING_APPROVAL") && (
        <p className="pending-decisions">
          <StatusBadge>
            {w.tasks.filter((t) => t.status === "WAITING_APPROVAL").length} decisión pendiente
          </StatusBadge>
        </p>
      )}
      <div className="tasks-workspace">
        <section className="task-register" aria-label="Lista de tareas">
          <div className="filterbar">
            <fieldset className="agent-tabs" aria-label="Agentes de tareas">
              <span className="tag">Todas · {w.tasks.length}</span>
              <button type="button" disabled>
                OpenCode · pendiente
              </button>
              <button type="button" disabled>
                Codex · pendiente
              </button>
            </fieldset>
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
              <TaskRow
                key={t.id}
                task={t}
                selected={w.selected === t.id}
                open={() => {
                  openTask(t.id);
                  setTab("Actividad");
                }}
              />
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
        <RightPanel open={inspectorOpen} close={closeInspector} title="Proceso de tarea">
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
                      <ProcessEvent key={event.id} event={event} />
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
                <button type="button" className="secondary compact" disabled>
                  Cancelar · integración pendiente
                </button>
              </div>
            </>
          )}
        </RightPanel>
      </div>
    </div>
  );
}
