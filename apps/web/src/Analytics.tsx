import type { StoredProject } from "@cubo/shared";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { requestApi, type Workspace } from "./workspace";

export function Analytics({ w: _w }: { w: Workspace }) {
  const [period, setPeriod] = useState<"Hoy" | "7 días" | "30 días" | "Todo">("7 días");
  const [_projects, setProjects] = useState<StoredProject[]>([]);

  useEffect(() => {
    let disposed = false;
    void requestApi<{ projects: StoredProject[] }>("projects")
      .then((data) => {
        if (!disposed && Array.isArray(data.projects)) setProjects(data.projects);
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
  }, []);

  const recentExecutions = [
    {
      id: "#e1042",
      task: "Refactor JWKS Auth",
      agent: "Cubo Core",
      duration: "4.2s",
      status: "Completado",
      isSuccess: true,
    },
    {
      id: "#e1041",
      task: "Migración schema D1",
      agent: "Worker Runner",
      duration: "1.8s",
      status: "Completado",
      isSuccess: true,
    },
    {
      id: "#e1040",
      task: "Linter fix & AST sync",
      agent: "OpenCode Fast",
      duration: "0.9s",
      status: "Completado",
      isSuccess: true,
    },
    {
      id: "#e1039",
      task: "Index KV store routi...",
      agent: "Cubo Core",
      duration: "--",
      status: "En cola",
      isSuccess: false,
    },
  ];

  const exportCsv = () => {
    const headers = "ID,Tarea,Agente,Duracion,Estado\n";
    const rows = recentExecutions
      .map((e) => `"${e.id}","${e.task}","${e.agent}","${e.duration}","${e.status}"`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cubo-metricas-cloud-${period.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
  };

  return (
    <div className="analytics-stitch-canvas">
      {/* 1. Header with Breadcrumb & Time Filters */}
      <div className="analytics-stitch-header">
        <div>
          <div className="analytics-breadcrumb-row">
            <span className="analytics-bc-text">Analíticas / Rendimiento global</span>
            <span className="analytics-live-badge">LIVE</span>
          </div>
          <h1 className="analytics-stitch-title">Métricas de Ejecución Cloud</h1>
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

      {/* 2. Top 3 KPI Cards */}
      <div className="analytics-kpi-3grid">
        {/* Card 1: Total Ejecuciones */}
        <div className="analytics-kpi-stitch-card">
          <div className="kpi-stitch-header">
            <span className="kpi-stitch-label">TOTAL EJECUCIONES</span>
            <Icon name="terminal" size={15} className="kpi-icon-muted" />
          </div>
          <div className="kpi-stitch-body">
            <span className="kpi-stitch-big">1,284</span>
            <span className="kpi-stitch-delta-badge">↑ 12%</span>
          </div>
          <div className="kpi-stitch-footer">
            <span>vs. ciclo previo (7d)</span>
            <span className="kpi-sep">·</span>
            <span className="kpi-highlight-green">+138 netas</span>
          </div>
        </div>

        {/* Card 2: Tokens Procesados */}
        <div className="analytics-kpi-stitch-card">
          <div className="kpi-stitch-header">
            <span className="kpi-stitch-label">TOKENS PROCESADOS</span>
            <Icon name="cube" size={15} className="kpi-icon-muted" />
          </div>
          <div className="kpi-stitch-body">
            <span className="kpi-stitch-big">8.4M</span>
            <span className="kpi-stitch-ctx-label">ctx / s: 1.4k</span>
          </div>
          <div className="kpi-stitch-footer">
            <span>100% Free Tier · $0.00 USD</span>
            <span className="kpi-sep">·</span>
            <span className="kpi-highlight-green">92% cuota libre</span>
          </div>
        </div>

        {/* Card 3: Tasa Aprobación Git */}
        <div className="analytics-kpi-stitch-card">
          <div className="kpi-stitch-header">
            <span className="kpi-stitch-label">TASA APROBACIÓN GIT</span>
            <Icon name="check" size={15} className="kpi-icon-muted" />
          </div>
          <div className="kpi-stitch-body">
            <span className="kpi-stitch-big">99.1%</span>
            <span className="kpi-stitch-dot-green" />
          </div>
          <div className="kpi-stitch-footer">
            <span>34 verificaciones consecutivas</span>
            <span className="kpi-sep">·</span>
            <span>0 regresiones</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Chart: Volumen de Computación por Jornada */}
      <div className="analytics-chart-stitch-card">
        <div className="chart-stitch-header">
          <div>
            <h2 className="chart-stitch-title">Volumen de Computación por Jornada</h2>
            <p className="chart-stitch-sub">
              Rendimiento continuo distribuido en Workers Edge nodes
            </p>
          </div>
          <div className="chart-stitch-legend">
            <div className="legend-entry">
              <span className="legend-box gray" />
              <span>Promedio (162)</span>
            </div>
            <div className="legend-entry">
              <span className="legend-box green" />
              <span>Pico de carga</span>
            </div>
          </div>
        </div>

        {/* 7 Columns Day Bar Chart */}
        <div className="chart-bars-container">
          <div className="chart-bar-col">
            <div className="bar-track">
              <div className="bar-fill gray" style={{ height: "42%" }} />
            </div>
            <span className="bar-day-label">LUN</span>
          </div>

          <div className="chart-bar-col">
            <div className="bar-track">
              <div className="bar-fill gray" style={{ height: "55%" }} />
            </div>
            <span className="bar-day-label">MAR</span>
          </div>

          <div className="chart-bar-col">
            <div className="bar-track">
              <div className="bar-fill gray" style={{ height: "60%" }} />
            </div>
            <span className="bar-day-label">MIÉ</span>
          </div>

          {/* JUE: Peak Bar with Active Tooltip */}
          <div className="chart-bar-col active-peak">
            <div className="peak-tooltip-card">
              <span className="peak-tooltip-title">
                <span className="tooltip-dot" />
                <span>Jueves</span>
              </span>
              <span className="tooltip-sep">·</span>
              <span className="tooltip-stat">312 ejecuciones (+24%)</span>
            </div>
            <div className="bar-track">
              <span className="peak-top-number">312</span>
              <div className="bar-fill green-peak" style={{ height: "82%" }} />
            </div>
            <span className="bar-day-label peak-label">JUE</span>
          </div>

          <div className="chart-bar-col">
            <div className="bar-track">
              <div className="bar-fill gray" style={{ height: "70%" }} />
            </div>
            <span className="bar-day-label">VIE</span>
          </div>

          <div className="chart-bar-col">
            <div className="bar-track">
              <div className="bar-fill gray" style={{ height: "26%" }} />
            </div>
            <span className="bar-day-label">SÁB</span>
          </div>

          <div className="chart-bar-col">
            <div className="bar-track">
              <div className="bar-fill gray" style={{ height: "22%" }} />
            </div>
            <span className="bar-day-label">DOM</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom 2-Grid: Distribución de Modelos IA & Ejecuciones Recientes */}
      <div className="analytics-bottom-grid">
        {/* Left: Model Distribution */}
        <div className="analytics-models-card">
          <div className="card-top-row">
            <div>
              <h2 className="card-heading">Distribución de Modelos IA</h2>
              <span className="card-subheading">Ruteo predictivo de prompts y síntesis</span>
            </div>
            <span className="model-count-badge">2 Modelos</span>
          </div>

          {/* Split Bar */}
          <div className="split-progress-bar">
            <div className="split-bar-fill codex" style={{ width: "58%" }} />
            <div className="split-bar-fill opencode" style={{ width: "42%" }} />
          </div>

          <div className="split-legend-row">
            <div className="split-legend-item">
              <span className="dot-green" />
              <span>Codex 58%</span>
            </div>
            <div className="split-legend-item">
              <span className="dot-gray" />
              <span>OpenCode 42%</span>
            </div>
          </div>

          {/* Model Card 1 */}
          <div className="model-detail-row">
            <div>
              <h3 className="model-name">Codex Orchestrator</h3>
              <p className="model-desc">Code generation · Deep context</p>
            </div>
            <div className="model-metrics-right">
              <span className="model-time">1.18s</span>
              <span className="model-score">0.994 score</span>
            </div>
          </div>

          {/* Model Card 2 */}
          <div className="model-detail-row">
            <div>
              <h3 className="model-name">OpenCode HighSpeed</h3>
              <p className="model-desc">Linter / AST Analysis</p>
            </div>
            <div className="model-metrics-right">
              <span className="model-time">0.64s</span>
              <span className="model-score">0.982 score</span>
            </div>
          </div>

          {/* Latency Footer */}
          <div className="model-latency-footer">
            <span className="latency-wave-icon">∿</span>
            <span className="latency-text">Latencia P95 Media</span>
            <span className="latency-val">1.2s avg</span>
          </div>
        </div>

        {/* Right: Recent Executions Table */}
        <div className="analytics-table-card">
          <div className="card-top-row">
            <div>
              <h2 className="card-heading">Ejecuciones Recientes</h2>
              <span className="card-subheading">Logs auditados de tareas de sintetización</span>
            </div>
            <button type="button" className="export-csv-btn" onClick={exportCsv}>
              <Icon name="arrow" size={13} className="rotate-down" />
              <span>Exportar CSV</span>
            </button>
          </div>

          <div className="table-responsive">
            <table className="analytics-stitch-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>TAREA</th>
                  <th>AGENTE</th>
                  <th>DURACIÓN</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {recentExecutions.map((row) => (
                  <tr key={row.id}>
                    <td className="col-id">{row.id}</td>
                    <td className="col-task">{row.task}</td>
                    <td className="col-agent">{row.agent}</td>
                    <td className="col-duration">{row.duration}</td>
                    <td className="col-status">
                      <span
                        className={`status-badge-stitch ${row.isSuccess ? "success" : "pending"}`}
                      >
                        <span className="status-dot" />
                        <span>{row.status}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
