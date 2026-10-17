import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { StatusBadge } from "./ui";

export interface ScheduledTask {
  id: string;
  title: string;
  frequency: "hourly" | "daily" | "weekly" | "custom";
  cronText: string;
  agent: "opencode" | "codex";
  prompt: string;
  projectName?: string;
  active: boolean;
  nextRun: string;
  lastRun?: string;
}

const STORAGE_KEY = "cubo:scheduled-tasks";

const DEFAULT_SCHEDULES: ScheduledTask[] = [
  {
    id: "sched-1",
    title: "Revisión diaria de dependencias y vulnerabilidades",
    frequency: "daily",
    cronText: "Diaria a las 08:00 UTC",
    agent: "opencode",
    prompt:
      "Revisar dependencias desactualizadas en package.json y ejecutar comprobación de seguridad.",
    projectName: "Cubo",
    active: true,
    nextRun: "Mañana a las 08:00 UTC",
    lastRun: "Hoy a las 08:00 UTC",
  },
  {
    id: "sched-2",
    title: "Linteo y formateo preventivo de PRs pendientes",
    frequency: "hourly",
    cronText: "Cada 6 horas",
    agent: "codex",
    prompt: "Ejecutar bun run lint y verificar que no existan errores de formato.",
    projectName: "Cubo",
    active: false,
    nextRun: "En pausa",
    lastRun: "Ayer a las 18:00 UTC",
  },
];

export function ScheduledTasks({ onRunNow }: { onRunNow?: (sched: ScheduledTask) => void }) {
  const [schedules, setSchedules] = useState<ScheduledTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_SCHEDULES;
  });

  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [agent, setAgent] = useState<"opencode" | "codex">("opencode");
  const [frequency, setFrequency] = useState<"hourly" | "daily" | "weekly">("daily");
  const [prompt, setPrompt] = useState("");
  const [projectName, setProjectName] = useState("Cubo");
  const [executedMessage, setExecutedMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(schedules));
    } catch {}
  }, [schedules]);

  const toggleActive = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextActive = !s.active;
          return {
            ...s,
            active: nextActive,
            nextRun: nextActive ? "En 4 horas" : "En pausa",
          };
        }
        return s;
      }),
    );
  };

  const removeSchedule = (id: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;

    const newSched: ScheduledTask = {
      id: `sched-${Date.now()}`,
      title: title.trim(),
      frequency,
      cronText:
        frequency === "hourly"
          ? "Cada 4 horas"
          : frequency === "daily"
            ? "Diaria a las 09:00 UTC"
            : "Semanal cada lunes",
      agent,
      prompt: prompt.trim(),
      projectName: projectName.trim() || "Cubo",
      active: true,
      nextRun: "Próxima ejecución programada",
    };

    setSchedules([newSched, ...schedules]);
    setTitle("");
    setPrompt("");
    setFormOpen(false);
  };

  const runSchedule = (sched: ScheduledTask) => {
    setExecutedMessage(
      `Tarea "${sched.title}" despachada al runner con agente ${sched.agent.toUpperCase()}.`,
    );
    if (onRunNow) onRunNow(sched);
    setTimeout(() => setExecutedMessage(null), 5000);
  };

  return (
    <section className="scheduled-panel" aria-label="Tareas programadas">
      <div className="panel-heading">
        <div>
          <h2>Tareas Programadas</h2>
          <p className="hint">
            Automatizaciones recurrentes que el orquestador dispara en la nube sin mantener pestañas
            abiertas.
          </p>
        </div>
        <button type="button" className="secondary compact" onClick={() => setFormOpen(!formOpen)}>
          <Icon name={formOpen ? "close" : "plus"} size={14} />
          {formOpen ? "Cancelar" : "Nueva Programación"}
        </button>
      </div>

      {executedMessage && (
        <div className="inline-notice" role="status" style={{ borderLeftColor: "var(--signal)" }}>
          <Icon name="check" size={15} />
          <span>{executedMessage}</span>
        </div>
      )}

      {formOpen && (
        <form onSubmit={handleCreate} className="form-stack scheduled-form">
          <label>
            Título de la automatización
            <input
              required
              placeholder="Ej: Análisis nocturno de seguridad"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <label>
              Agente ejecutor
              <select
                value={agent}
                onChange={(e) => setAgent(e.target.value as "opencode" | "codex")}
              >
                <option value="opencode">OpenCode Agent</option>
                <option value="codex">Codex Agent</option>
              </select>
            </label>

            <label>
              Frecuencia de ejecución
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as "hourly" | "daily" | "weekly")}
              >
                <option value="hourly">Cada 4 horas</option>
                <option value="daily">Diaria a las 09:00 UTC</option>
                <option value="weekly">Semanal los lunes</option>
              </select>
            </label>
          </div>

          <label>
            Proyecto asociado
            <input
              placeholder="Nombre del proyecto"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </label>

          <label>
            Instrucción / Prompt para el agente
            <textarea
              required
              rows={3}
              placeholder="Describe lo que el agente debe hacer en cada ciclo…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
            <button type="button" className="secondary compact" onClick={() => setFormOpen(false)}>
              Descartar
            </button>
            <button type="submit" className="primary compact">
              Guardar Programación
            </button>
          </div>
        </form>
      )}

      <div className="scheduled-list">
        {schedules.map((item) => (
          <article key={item.id} className={`scheduled-card ${item.active ? "active" : "paused"}`}>
            <div className="scheduled-card-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className={`event-dot ${item.active ? "running" : "queued"}`} />
                <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>{item.title}</h3>
              </div>
              <StatusBadge status={item.active ? "running" : "pending"}>
                {item.active ? "Activa" : "En pausa"}
              </StatusBadge>
            </div>

            <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: "4px 0" }}>
              {item.prompt}
            </p>

            <div className="scheduled-card-meta">
              <span>
                Frecuencia: <strong>{item.cronText}</strong>
              </span>
              <span>
                Agente: <strong>{item.agent.toUpperCase()}</strong>
              </span>
              <span>
                Proyecto: <strong>{item.projectName}</strong>
              </span>
              <span>
                Próxima: <strong>{item.nextRun}</strong>
              </span>
              {item.lastRun && (
                <span>
                  Última: <strong>{item.lastRun}</strong>
                </span>
              )}
            </div>

            <div className="scheduled-card-actions">
              <button
                type="button"
                className="secondary compact"
                onClick={() => toggleActive(item.id)}
              >
                {item.active ? "Pausar" : "Reanudar"}
              </button>
              <button type="button" className="primary compact" onClick={() => runSchedule(item)}>
                <Icon name="arrow" size={13} />
                Ejecutar Ahora
              </button>
              <button
                type="button"
                className="icon-button"
                onClick={() => removeSchedule(item.id)}
                title="Eliminar programación"
                aria-label="Eliminar programación"
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          </article>
        ))}
        {schedules.length === 0 && (
          <div className="empty-inline">
            <Icon name="clock" size={24} />
            <h2>Sin automatizaciones programadas</h2>
            <p>Crea una programación para ejecutar tareas automáticas de agentes.</p>
          </div>
        )}
      </div>
    </section>
  );
}
