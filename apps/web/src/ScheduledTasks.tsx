import { useEffect, useState } from "react";
import { Icon } from "./Icon";

export interface ScheduledTask {
  id: string;
  title: string;
  cronExpr: string;
  scheduleText: string;
  repo: string;
  branch: string;
  runner: string;
  active: boolean;
  lastRunStatus: "success" | "paused" | "failed";
  lastRunText: string;
  duration?: string;
  prompt: string;
}

const DEFAULT_SCHEDULES: ScheduledTask[] = [
  {
    id: "sched-1",
    title: "Auditoría nocturna de tipos y linter",
    cronExpr: "0 2 * * *",
    scheduleText: "Diario a las 02:00 UTC",
    repo: "PABLOCESAR2412/Cubo",
    branch: "rama main",
    runner: "Cloudflare Worker Local #2",
    active: true,
    lastRunStatus: "success",
    lastRunText: "Exitosa (hace 5h)",
    duration: "14s",
    prompt: "Ejecutar comprobación estricta de tipos y lint de Biome en todo el monorepo.",
  },
  {
    id: "sched-2",
    title: "Verificación de dependencias y vulnerabilidades (Audit)",
    cronExpr: "0 0 * * 1",
    scheduleText: "Semanal los lunes a las 00:00 UTC",
    repo: "PABLOCESAR2412/Cubo",
    branch: "rama main",
    runner: "GitHub Runner Pool",
    active: true,
    lastRunStatus: "success",
    lastRunText: "Exitosa (hace 2d)",
    prompt: "Comprobar paquetes con vulnerabilidades conocidas y reportar diffs.",
  },
  {
    id: "sched-3",
    title: "Sincronización y backup de snapshots D1",
    cronExpr: "*/30 * * * *",
    scheduleText: "Cada 30 minutos",
    repo: "cubo-production-db",
    branch: "main",
    runner: "Cloudflare Workers CRON",
    active: false,
    lastRunStatus: "paused",
    lastRunText: "Pausado manualmente · Último backup hace 1h",
    prompt: "Generar snapshot de respaldo y sincronizar tablas críticas en D1.",
  },
];

const STORAGE_KEY = "cubo:scheduled-tasks-stitch";

export function ScheduledTasks({
  onRunNow,
  onSwitchToExecutions,
}: {
  onRunNow?: (sched: ScheduledTask) => void;
  onSwitchToExecutions?: () => void;
}) {
  const [schedules, setSchedules] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCHEDULES;
  });

  const [formOpen, setFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCron, setNewCron] = useState("0 3 * * *");
  const [newScheduleText, setNewScheduleText] = useState("Diario a las 03:00 UTC");
  const [newPrompt, setNewPrompt] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch {}
  }, [schedules]);

  const toggleTask = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextActive = !s.active;
          return {
            ...s,
            active: nextActive,
            lastRunStatus: nextActive ? "success" : "paused",
            lastRunText: nextActive ? "Reanudado" : "Pausado manualmente",
          };
        }
        return s;
      }),
    );
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrompt.trim()) return;

    const newTask: ScheduledTask = {
      id: `sched-${Date.now()}`,
      title: newTitle.trim(),
      cronExpr: newCron.trim() || "0 0 * * *",
      scheduleText: newScheduleText.trim() || "Diario",
      repo: "PABLOCESAR2412/Cubo",
      branch: "rama main",
      runner: "Cloudflare Worker Local #2",
      active: true,
      lastRunStatus: "success",
      lastRunText: "Programado",
      prompt: newPrompt.trim(),
    };

    setSchedules([newTask, ...schedules]);
    setNewTitle("");
    setNewPrompt("");
    setFormOpen(false);
  };

  const runTaskNow = (task: ScheduledTask) => {
    setStatusMessage(`Tarea "${task.title}" enviada al runner para ejecución inmediata.`);
    if (onRunNow) onRunNow(task);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const activeCount = schedules.filter((s) => s.active).length;
  const pausedCount = schedules.filter((s) => !s.active).length;

  return (
    <div className="sched-stitch-container">
      {/* 1. Header with Breadcrumb, Title & Top Controls */}
      <div className="sched-stitch-header">
        <div>
          <span className="sched-breadcrumb">INFRAESTRUCTURA / PLANIFICADOR</span>
          <h1 className="sched-title">Automatizaciones y Tareas</h1>
        </div>

        <div className="sched-header-actions">
          <div className="sched-mode-segmented">
            <button type="button" className="sched-mode-btn" onClick={onSwitchToExecutions}>
              <span>Ejecuciones Activas</span>
              <span className="sched-badge">3</span>
            </button>
            <button type="button" className="sched-mode-btn active">
              <span>Tareas Programadas (Cron)</span>
              <span className="sched-active-dot" />
            </button>
          </div>

          <button
            type="button"
            className="sched-new-cron-btn"
            onClick={() => setFormOpen(!formOpen)}
          >
            <Icon name={formOpen ? "close" : "plus"} size={14} />
            <span>{formOpen ? "Cancelar" : "Nueva Tarea Cron"}</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="inline-notice" role="status" style={{ marginBottom: 16 }}>
          <Icon name="check" size={14} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Form modal/drawer if open */}
      {formOpen && (
        <form onSubmit={handleCreateTask} className="sched-form-card">
          <h2 className="sched-form-title">Programar Nueva Tarea Cron</h2>
          <div className="sched-form-grid">
            <label>
              Título
              <input
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ej: Análisis de cobertura de pruebas"
              />
            </label>
            <label>
              Expresión Cron
              <input
                required
                value={newCron}
                onChange={(e) => setNewCron(e.target.value)}
                placeholder="0 2 * * *"
              />
            </label>
            <label>
              Descripción de Frecuencia
              <input
                value={newScheduleText}
                onChange={(e) => setNewScheduleText(e.target.value)}
                placeholder="Ej: Diario a las 02:00 UTC"
              />
            </label>
            <label className="span-full">
              Instrucción para el Agente
              <textarea
                required
                rows={2}
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Instrucciones automáticas que ejecutará el runner..."
              />
            </label>
          </div>
          <div className="sched-form-footer">
            <button
              type="button"
              className="sched-btn-secondary"
              onClick={() => setFormOpen(false)}
            >
              Descartar
            </button>
            <button type="submit" className="sched-btn-primary">
              Guardar Automatización
            </button>
          </div>
        </form>
      )}

      {/* 2. List of Cron Task Cards */}
      <div className="sched-cards-list">
        {schedules.map((task) => (
          <article
            key={task.id}
            className={`sched-task-card ${task.active ? "is-active" : "is-paused"}`}
          >
            <div className="sched-card-left">
              <button
                type="button"
                role="switch"
                aria-checked={task.active}
                className={`stitch-toggle-switch ${task.active ? "active" : ""}`}
                onClick={() => toggleTask(task.id)}
                title={task.active ? "Pausar tarea" : "Activar tarea"}
              >
                <span className="stitch-toggle-thumb" />
              </button>

              <div className="sched-card-info">
                <div className="sched-title-row">
                  <h2 className="sched-task-title">{task.title}</h2>
                  <div className="sched-cron-tags">
                    <span className="cron-expr-pill">{task.cronExpr}</span>
                    <span className="cron-desc-text">{task.scheduleText}</span>
                  </div>
                </div>

                <div className="sched-sub-row">
                  <span className="sched-repo-tag">
                    <Icon name="terminal" size={13} />
                    <span>{task.repo}</span>
                    {task.branch && <span className="sched-branch-tag">({task.branch})</span>}
                  </span>
                  <span className="sched-sep">·</span>
                  <span className="sched-runner-tag">
                    <span className="sched-runner-dot" />
                    <span>{task.runner}</span>
                  </span>
                </div>

                <div className="sched-last-run-row">
                  {task.lastRunStatus === "success" ? (
                    <div className="last-run-success">
                      <Icon name="check" size={12} className="check-icon" />
                      <span>Última ejecución: {task.lastRunText}</span>
                      {task.duration && (
                        <>
                          <span className="sched-sep">·</span>
                          <span>Duración: {task.duration}</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="last-run-paused">
                      <span className="pause-icon">⏸</span>
                      <span>{task.lastRunText}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sched-card-right">
              <button
                type="button"
                className={`sched-action-btn ${task.active ? "" : "resume-btn"}`}
                onClick={() => toggleTask(task.id)}
              >
                {task.active ? "Pausar" : "Reanudar"}
              </button>
              <button type="button" className="sched-run-now-btn" onClick={() => runTaskNow(task)}>
                <span className="play-icon">▶</span>
                <span>Ejecutar ahora</span>
              </button>
              <button
                type="button"
                className="sched-more-btn"
                title="Más opciones"
                onClick={() => {
                  alert(`Opciones de tarea: ${task.title}\nID: ${task.id}`);
                }}
              >
                •••
              </button>
            </div>
          </article>
        ))}
      </div>

      {/* 3. Metrics 3-Card Row */}
      <div className="sched-metrics-grid">
        {/* Metric 1 */}
        <div className="sched-metric-card">
          <div className="metric-header-row">
            <span className="metric-label">TASA DE CONFIABILIDAD</span>
            <span className="metric-value-green">99.94%</span>
          </div>
          <div className="sched-progress-track">
            <div className="sched-progress-bar" style={{ width: "99.94%" }} />
          </div>
          <span className="metric-sub-text">Últimas 1,420 ejecuciones automatizadas</span>
        </div>

        {/* Metric 2 */}
        <div className="sched-metric-card">
          <div className="metric-header-row">
            <span className="metric-label">LATENCIA MEDIA DE WORKER</span>
            <span className="metric-value-white">184 ms</span>
          </div>
          <div className="sched-mini-bars">
            <div className="mini-bar h-1" />
            <div className="mini-bar h-2" />
            <div className="mini-bar h-1" />
            <div className="mini-bar h-2" />
            <div className="mini-bar h-3 green-bar" />
            <div className="mini-bar h-1" />
            <div className="mini-bar h-3 green-bar" />
          </div>
          <span className="metric-sub-text">Cloudflare Edge Execution</span>
        </div>

        {/* Metric 3 */}
        <div className="sched-metric-card">
          <div className="metric-header-row">
            <span className="metric-label">PRESUPUESTO DE CPU</span>
            <span className="metric-value-white">1.2s / 50s máx</span>
          </div>
          <div className="sched-progress-track">
            <div className="sched-progress-bar dot-bar" style={{ width: "4%" }}>
              <span className="progress-marker-dot" />
            </div>
          </div>
          <span className="metric-sub-text">Capacidad en reposo al 97.6%</span>
        </div>
      </div>

      {/* 4. Footer Status Bar */}
      <div className="sched-footer-bar">
        <div className="sched-footer-left">
          <span className="footer-status-item">
            <span className="dot-green" />
            <span>{activeCount} activas</span>
          </span>
          <span className="sched-sep">·</span>
          <span className="footer-status-item">
            <span className="dot-gray" />
            <span>
              {pausedCount} pausada{pausedCount === 1 ? "" : "s"}
            </span>
          </span>
          <span className="sched-sep">·</span>
          <span className="footer-status-item">
            <Icon name="clock" size={13} />
            <span>Próxima ejecución: Hoy 02:00 UTC (Auditoría nocturna)</span>
          </span>
        </div>
        <div className="sched-footer-right">
          <span className="sync-icon">↻</span>
          <span>Sincronizado vía Cloudflare Triggers</span>
        </div>
      </div>
    </div>
  );
}
