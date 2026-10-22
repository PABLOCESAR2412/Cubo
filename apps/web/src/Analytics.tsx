import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { labels, type Workspace } from "./workspace";

type Period = "Hoy" | "7 días" | "30 días" | "Todo";

const dayMs = 86400000;

function inPeriod(createdAt: string, period: Period): boolean {
  if (period === "Todo") return true;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const now = new Date();
  if (period === "Hoy") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return created >= start;
  }
  return created >= now.getTime() - (period === "7 días" ? 7 : 30) * dayMs;
}

function origin(input: unknown): string {
  if (typeof input !== "object" || input === null) return "Tarea";
  if (!("type" in input)) return "Demo";
  const record = input as { type: string; agent?: string };
  if (record.type === "CHAT_TURN") return "Chat";
  if (record.type === "AGENT_TASK") return record.agent === "codex" ? "Codex" : "OpenCode";
  if (record.type === "REPOSITORY_IMPORT") return "Importación";
  return "Tarea";
}

export function Analytics({ w }: { w: Workspace }) {
  const [period, setPeriod] = useState<Period>("Todo");
  const tasks = useMemo(
    () => w.tasks.filter((t) => inPeriod(t.createdAt, period)),
    [w.tasks, period],
  );
  const count = (status: string) => tasks.filter((t) => t.status === status).length;
  const total = tasks.length;
  const attention = count("WAITING_APPROVAL") + count("QUEUED") + count("RUNNING");
  const statuses = ["SUCCEEDED", "FAILED", "CANCELLED", "WAITING_APPROVAL", "RUNNING", "QUEUED"];

  const exportCsv = () => {
    const headers = "ID,Tarea,Origen,Estado,Creada,Actualizada\n";
    const rows = tasks
      .map((t) =>
        [t.id, t.title, origin(t.input), labels[t.status], t.createdAt, t.updatedAt]
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cubo-ejecuciones-${period.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="analytics-stitch-canvas">
      <div className="analytics-stitch-header">
        <div>
          <div className="analytics-breadcrumb-row">
            <span className="analytics-bc-text">Analíticas / Ejecuciones reales</span>
            <span className="analytics-live-badge">D1</span>
          </div>
          <h1 className="analytics-stitch-title">Métricas de ejecución</h1>
          <p className="chart-stitch-sub">
            Conteos derivados de las tareas persistidas en D1. Sin telemetría de tokens ni datos
            simulados.
          </p>
        </div>

        <div className="analytics-time-tabs" role="tablist" aria-label="Filtro temporal">
          {(["Hoy", "7 días", "30 días", "Todo"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={period === p}
              className={`analytics-time-btn ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="analytics-kpi-3grid">
        <div className="analytics-kpi-stitch-card">
          <div className="kpi-stitch-header">
            <span className="kpi-stitch-label">TOTAL EJECUCIONES</span>
            <Icon name="terminal" size={15} className="kpi-icon-muted" />
          </div>
          <div className="kpi-stitch-body">
            <span className="kpi-stitch-big">{total}</span>
          </div>
          <div className="kpi-stitch-footer">
            <span>Tareas registradas en D1 en el periodo</span>
          </div>
        </div>

        <div className="analytics-kpi-stitch-card">
          <div className="kpi-stitch-header">
            <span className="kpi-stitch-label">COMPLETADAS</span>
            <Icon name="check" size={15} className="kpi-icon-muted" />
          </div>
          <div className="kpi-stitch-body">
            <span className="kpi-stitch-big">{count("SUCCEEDED")}</span>
            <span className="kpi-highlight-green">
              {total ? `${Math.round((count("SUCCEEDED") / total) * 100)}%` : "—"}
            </span>
          </div>
          <div className="kpi-stitch-footer">
            <span>
              Fallidas: {count("FAILED")} · Canceladas: {count("CANCELLED")}
            </span>
          </div>
        </div>

        <div className="analytics-kpi-stitch-card">
          <div className="kpi-stitch-header">
            <span className="kpi-stitch-label">REQUIEREN ATENCIÓN</span>
            <Icon name="clock" size={15} className="kpi-icon-muted" />
          </div>
          <div className="kpi-stitch-body">
            <span className="kpi-stitch-big">{attention}</span>
            <span className="kpi-stitch-dot-green" />
          </div>
          <div className="kpi-stitch-footer">
            <span>
              Pendientes de aprobación: {count("WAITING_APPROVAL")} · En cola/ejecución:{" "}
              {count("QUEUED") + count("RUNNING")}
            </span>
          </div>
        </div>
      </div>

      <div className="analytics-chart-stitch-card">
        <div className="chart-stitch-header">
          <div>
            <h2 className="chart-stitch-title">Distribución por estado</h2>
            <p className="chart-stitch-sub">Ejecuciones en el periodo seleccionado</p>
          </div>
        </div>
        {total ? (
          <div className="chart-bars-container">
            {statuses.map((status) => {
              const value = count(status);
              if (!value) return null;
              return (
                <div className="chart-bar-col" key={status}>
                  <div className="bar-track">
                    <span className="peak-top-number">{value}</span>
                    <div
                      className="bar-fill gray"
                      style={{ height: `${Math.round((value / total) * 100)}%` }}
                    />
                  </div>
                  <span className="bar-day-label">{labels[status as keyof typeof labels]}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">
            Sin tareas en este periodo. Crea una ejecución desde Tareas o Proyectos.
          </p>
        )}
      </div>

      <div className="analytics-table-card">
        <div className="card-top-row">
          <div>
            <h2 className="card-heading">Ejecuciones recientes</h2>
            <span className="card-subheading">
              Últimas 8 tareas del periodo con estado real en D1
            </span>
          </div>
          <button type="button" className="export-csv-btn" onClick={exportCsv} disabled={!total}>
            <Icon name="arrow" size={13} className="rotate-down" />
            <span>Exportar CSV</span>
          </button>
        </div>

        {total ? (
          <div className="table-responsive">
            <table className="analytics-stitch-table">
              <thead>
                <tr>
                  <th>TAREA</th>
                  <th>ORIGEN</th>
                  <th>ESTADO</th>
                  <th>CREADA</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(0, 8).map((t) => (
                  <tr key={t.id}>
                    <td className="col-task">{t.title}</td>
                    <td className="col-agent">{origin(t.input)}</td>
                    <td className="col-status">
                      <span
                        className={`status-badge-stitch ${t.status === "SUCCEEDED" ? "success" : "pending"}`}
                      >
                        <span className="status-dot" />
                        <span>{labels[t.status]}</span>
                      </span>
                    </td>
                    <td className="col-duration">{new Date(t.createdAt).toLocaleString("es")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">Sin ejecuciones registradas en el periodo seleccionado.</p>
        )}
      </div>
    </div>
  );
}
