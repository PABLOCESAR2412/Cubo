import type { StoredProject } from "@cubo/shared";
import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { ProviderSettings } from "./ProjectProviderSettings";
import {
  EmptyState,
  MetricCard,
  PageHeader,
  ProviderCard,
  SectionCard,
  StatusBadge,
  Tabs,
} from "./ui";
import { requestApi, type Workspace } from "./workspace";

export { Chat } from "./Chat";

export { Projects } from "./Projects";

export function Analytics({ w }: { w: Workspace }) {
  const [period, setPeriod] = useState("30d");
  const [metricMode, setMetricMode] = useState<"tokens" | "turns">("tokens");
  const [projectFilter, setProjectFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [projects, setProjects] = useState<StoredProject[]>([]);

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

  const projectMap = new Map<string, string>();
  for (const p of projects) {
    projectMap.set(p.id, p.name);
  }

  const items = w.tasks.map((t) => {
    const isTurn = "type" in t.input && t.input.type === "CHAT_TURN";
    const type = ("type" in t.input ? t.input.type : "DEMO") as string;
    const projectId =
      "projectId" in t.input && typeof t.input.projectId === "string" ? t.input.projectId : null;
    const provider =
      "provider" in t.input && typeof t.input.provider === "string"
        ? t.input.provider
        : isTurn
          ? "openrouter"
          : "system";
    const model =
      "model" in t.input && typeof t.input.model === "string"
        ? t.input.model
        : isTurn
          ? "modelo no especificado"
          : "tarea estándar";
    let inputTokens = 0;
    let outputTokens = 0;
    let costUsd = 0;
    let costQuality: "exact" | "estimated" | "unavailable" = "unavailable";

    if (t.result && typeof t.result === "object") {
      const res = t.result as unknown as Record<string, unknown>;
      if (typeof res.inputTokens === "number") inputTokens = res.inputTokens;
      if (typeof res.outputTokens === "number") outputTokens = res.outputTokens;
      if (typeof res.costUsd === "number") costUsd = res.costUsd;
      if (res.costQuality === "exact" || res.costQuality === "estimated") {
        costQuality = res.costQuality;
      } else if (inputTokens > 0 || outputTokens > 0) {
        costQuality = "exact";
      }
    }

    return {
      id: t.id,
      title: t.title,
      createdAt: t.createdAt,
      status: t.status,
      isTurn,
      type,
      projectId,
      provider,
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      costUsd,
      costQuality,
    };
  });

  const now = new Date();
  const cutoff = (() => {
    const d = new Date(now);
    if (period === "Hoy") {
      d.setHours(d.getHours() - 24);
      return d;
    }
    if (period === "7d") {
      d.setDate(d.getDate() - 7);
      return d;
    }
    if (period === "30d") {
      d.setDate(d.getDate() - 30);
      return d;
    }
    if (period === "90d") {
      d.setDate(d.getDate() - 90);
      return d;
    }
    return new Date(0); // Todo
  })();

  const inPeriod = items.filter((item) => new Date(item.createdAt) >= cutoff);

  const availableModels = [
    ...new Set(
      inPeriod
        .map((i) => i.model)
        .filter((m) => m && m !== "tarea estándar" && m !== "modelo no especificado"),
    ),
  ];
  const availableProviders = [
    ...new Set(inPeriod.map((i) => i.provider).filter((p) => p && p !== "system")),
  ];

  const filtered = inPeriod.filter((item) => {
    if (projectFilter !== "all") {
      if (projectFilter === "none" && item.projectId !== null) return false;
      if (projectFilter !== "none" && item.projectId !== projectFilter) return false;
    }
    if (providerFilter !== "all" && item.provider !== providerFilter) return false;
    if (modelFilter !== "all" && item.model !== modelFilter) return false;
    return true;
  });

  const totalInputTokens = filtered.reduce((acc, i) => acc + i.inputTokens, 0);
  const totalOutputTokens = filtered.reduce((acc, i) => acc + i.outputTokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const totalCostUsd = filtered.reduce((acc, i) => acc + i.costUsd, 0);
  const uniqueModelsUsed = [
    ...new Set(
      filtered
        .map((i) => i.model)
        .filter((m) => m && m !== "tarea estándar" && m !== "modelo no especificado"),
    ),
  ];
  const totalTurns = filtered.filter((i) => i.isTurn).length;
  const succeededTurns = filtered.filter((i) => i.isTurn && i.status === "SUCCEEDED").length;

  // Group by Project
  const projectGroups = new Map<string, typeof filtered>();
  for (const item of filtered) {
    const key = item.projectId ?? "global";
    const group = projectGroups.get(key) ?? [];
    group.push(item);
    projectGroups.set(key, group);
  }
  const projectBreakdown = Array.from(projectGroups.entries())
    .map(([key, group]) => {
      const pName =
        key === "global"
          ? "Global / Sin proyecto"
          : (projectMap.get(key) ?? `Proyecto ${key.slice(0, 8)}`);
      const tokens = group.reduce((acc, i) => acc + i.totalTokens, 0);
      const inTokens = group.reduce((acc, i) => acc + i.inputTokens, 0);
      const outTokens = group.reduce((acc, i) => acc + i.outputTokens, 0);
      const cost = group.reduce((acc, i) => acc + i.costUsd, 0);
      const turns = group.filter((i) => i.isTurn).length;
      const models = [
        ...new Set(
          group
            .map((i) => i.model)
            .filter((m) => m && m !== "tarea estándar" && m !== "modelo no especificado"),
        ),
      ];
      return { id: key, name: pName, tokens, inTokens, outTokens, cost, turns, models };
    })
    .sort((a, b) => b.tokens - a.tokens || b.turns - a.turns);

  // Group by Model
  const modelGroups = new Map<string, typeof filtered>();
  for (const item of filtered) {
    if (!item.model || item.model === "tarea estándar") continue;
    const group = modelGroups.get(item.model) ?? [];
    group.push(item);
    modelGroups.set(item.model, group);
  }
  const modelBreakdown = Array.from(modelGroups.entries())
    .map(([model, group]) => {
      const provider = group[0]?.provider ?? "openrouter";
      const tokens = group.reduce((acc, i) => acc + i.totalTokens, 0);
      const inTokens = group.reduce((acc, i) => acc + i.inputTokens, 0);
      const outTokens = group.reduce((acc, i) => acc + i.outputTokens, 0);
      const cost = group.reduce((acc, i) => acc + i.costUsd, 0);
      const turns = group.filter((i) => i.isTurn).length;
      return { model, provider, tokens, inTokens, outTokens, cost, turns };
    })
    .sort((a, b) => b.tokens - a.tokens || b.turns - a.turns);

  // Activity bars
  const barDays = period === "Hoy" ? 1 : period === "7d" ? 7 : period === "30d" ? 30 : 14;
  const bars = Array.from({ length: barDays }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (barDays - 1 - i));
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayItems = filtered.filter((item) => {
      const itemDate = new Date(item.createdAt);
      return itemDate >= d && itemDate < nextD;
    });

    const val =
      metricMode === "tokens"
        ? dayItems.reduce((acc, it) => acc + it.totalTokens, 0)
        : dayItems.length;

    return {
      date: d,
      value: val,
      turns: dayItems.filter((it) => it.isTurn).length,
      tasks: dayItems.length,
      tokens: dayItems.reduce((acc, it) => acc + it.totalTokens, 0),
    };
  });

  const maxBarValue = Math.max(1, ...bars.map((b) => b.value));

  return (
    <div className="module">
      <PageHeader
        title="Analíticas de consumo"
        description="Telemetría de agentes, modelos, proveedores y consumo por proyecto."
        actions={
          <Tabs
            names={["Hoy", "7d", "30d", "90d", "Todo"]}
            value={period}
            onChange={(val) => {
              setPeriod(val);
              setProjectFilter("all");
              setModelFilter("all");
              setProviderFilter("all");
            }}
            label="Periodo de analíticas"
          />
        }
      />

      <div className="analytics-filters">
        <label>
          Proyecto
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            aria-label="Filtrar por proyecto"
          >
            <option value="all">Todos los proyectos ({projects.length})</option>
            <option value="none">Global / Sin proyecto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Proveedor
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            aria-label="Filtrar por proveedor"
          >
            <option value="all">Todos los proveedores</option>
            {availableProviders.map((pr) => (
              <option key={pr} value={pr}>
                {pr.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label>
          Modelo
          <select
            value={modelFilter}
            onChange={(e) => setModelFilter(e.target.value)}
            aria-label="Filtrar por modelo"
          >
            <option value="all">Todos los modelos</option>
            {availableModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="metric-grid">
        <MetricCard
          label="Tokens consumidos"
          value={totalTokens.toLocaleString("es-ES")}
          detail={
            totalTokens > 0
              ? `${totalInputTokens.toLocaleString("es-ES")} entrada · ${totalOutputTokens.toLocaleString("es-ES")} salida (exact)`
              : "0 tokens · sin turnos en el periodo"
          }
          icon="chart"
        />
        <MetricCard
          label="Gasto estimado"
          value={`$${totalCostUsd.toFixed(4)} USD`}
          detail={
            totalCostUsd === 0
              ? "USD 0 verificado · nivel gratuito"
              : `exact · $${totalCostUsd.toFixed(4)} USD`
          }
          icon="cube"
        />
        <MetricCard
          label="Modelos utilizados"
          value={uniqueModelsUsed.length}
          detail={
            uniqueModelsUsed.length > 0
              ? `${uniqueModelsUsed.length} modelos en ${totalTurns} turnos`
              : "Sin llamadas a modelos"
          }
          icon="tasks"
        />
        <MetricCard
          label="Turnos ejecutados"
          value={totalTurns}
          detail={
            totalTurns > 0
              ? `${succeededTurns} completados · ${totalTurns - succeededTurns} otros`
              : `${filtered.length} tareas totales en ${period}`
          }
          icon="clock"
        />
      </div>

      <SectionCard
        title="Actividad temporal"
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className={metricMode === "tokens" ? "secondary compact active" : "secondary compact"}
              onClick={() => setMetricMode("tokens")}
            >
              Tokens
            </button>
            <button
              type="button"
              className={metricMode === "turns" ? "secondary compact active" : "secondary compact"}
              onClick={() => setMetricMode("turns")}
            >
              Turnos
            </button>
          </div>
        }
      >
        {bars.some((b) => b.value > 0) ? (
          <div
            className="activity-chart"
            role="img"
            aria-label={`${metricMode === "tokens" ? "Tokens consumidos" : "Turnos"}: ${bars
              .filter((b) => b.value > 0)
              .map((b) => `${b.date.toLocaleDateString("es")}: ${b.value}`)
              .join(", ")}`}
          >
            <div className="chart-bars">
              {bars.map((b, i) => (
                <div className="chart-column" key={b.date.toISOString()}>
                  <div className="bar-space">
                    <div
                      className="chart-bar"
                      style={{ height: `${(b.value / maxBarValue) * 100}%` }}
                      title={`${b.date.toLocaleDateString("es")}: ${b.tokens.toLocaleString("es-ES")} tokens (${b.turns} turnos)`}
                    />
                    {b.value > 0 && (
                      <span className="bar-count">
                        {b.value >= 1000 ? `${Math.round(b.value / 1000)}k` : b.value}
                      </span>
                    )}
                  </div>
                  <span>
                    {i === 0 || i === barDays - 1 || barDays <= 7 ? b.date.getDate() : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Sin consumo en este periodo"
            description="No se registraron tokens o turnos de agentes en el rango de fechas seleccionado."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Consumo por proyecto"
        actions={
          <span className="hint">
            {projectBreakdown.length} proyecto{projectBreakdown.length === 1 ? "" : "s"} con
            actividad
          </span>
        }
      >
        {projectBreakdown.length > 0 ? (
          <div className="analytics-breakdown-list">
            {projectBreakdown.map((item) => (
              <div key={item.id} className="analytics-breakdown-item">
                <div className="analytics-breakdown-main">
                  <div className="analytics-breakdown-title">
                    <Icon name="folder" size={15} />
                    <span>{item.name}</span>
                  </div>
                  <div className="analytics-breakdown-meta">
                    <span>{item.turns} turnos</span>
                    <span>·</span>
                    <span>
                      {item.inTokens.toLocaleString("es-ES")} in /{" "}
                      {item.outTokens.toLocaleString("es-ES")} out
                    </span>
                    {item.models.length > 0 && (
                      <>
                        <span>·</span>
                        <span>Modelos: {item.models.join(", ")}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="analytics-breakdown-stats">
                  <div>
                    <span className="analytics-stat-pill">
                      {item.tokens.toLocaleString("es-ES")} tokens
                    </span>
                    <div className="analytics-stat-sub">USD {item.cost.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin datos de proyectos"
            description="Ningún proyecto ha registrado turnos o consumo con los filtros actuales."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Modelos y proveedores utilizados"
        actions={
          <span className="hint">
            {modelBreakdown.length} modelo{modelBreakdown.length === 1 ? "" : "s"} registrado
            {modelBreakdown.length === 1 ? "" : "s"}
          </span>
        }
      >
        {modelBreakdown.length > 0 ? (
          <div className="analytics-breakdown-list">
            {modelBreakdown.map((item) => (
              <div key={item.model} className="analytics-breakdown-item">
                <div className="analytics-breakdown-main">
                  <div className="analytics-breakdown-title">
                    <Icon name="cube" size={15} />
                    <span>{item.model}</span>
                  </div>
                  <div className="analytics-breakdown-meta">
                    <StatusBadge status="running">{item.provider.toUpperCase()}</StatusBadge>
                    <span>{item.turns} turnos completados</span>
                    <span>·</span>
                    <span>
                      {item.inTokens.toLocaleString("es-ES")} entrada /{" "}
                      {item.outTokens.toLocaleString("es-ES")} salida
                    </span>
                  </div>
                </div>
                <div className="analytics-breakdown-stats">
                  <div>
                    <span className="analytics-stat-pill">
                      {item.tokens.toLocaleString("es-ES")} tokens
                    </span>
                    <div className="analytics-stat-sub">
                      {item.cost === 0 ? "USD 0 (gratuito)" : `USD ${item.cost.toFixed(4)}`}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Sin modelos registrados"
            description="Los modelos y sus proveedores aparecerán aquí cuando se ejecuten turnos de chat o tareas de agentes."
          />
        )}
      </SectionCard>

      <p className="hint">
        Datos calculados a partir de {w.tasks.length} tareas sincronizadas con Cubo cloud.
      </p>
    </div>
  );
}
export function Settings({ w }: { w: Workspace }) {
  const [tab, setTab] = useState("Agentes y proveedores");
  const available = w.online && !!w.lastSync && !w.pollError;
  return (
    <div className="module settings-module">
      <PageHeader
        title="Ajustes"
        description="Agentes, proveedores y configuración de Cubo cloud."
      />
      <Tabs
        names={[
          "Agentes y proveedores",
          "Ejecución",
          "Notificaciones",
          "Apariencia",
          "Skills",
          "Cuenta / conexiones",
        ]}
        value={tab}
        onChange={setTab}
        label="Secciones de ajustes"
      />
      {tab === "Agentes y proveedores" ? (
        <>
          <div className="section-label">
            <h2>Agentes</h2>
            <span className="hint">Ejecutan el trabajo mediante adaptadores.</span>
          </div>
          {["OpenCode", "Codex"].map((name) => (
            <ProviderCard name={name} kind="AGENTE" key={name} />
          ))}
          <div className="section-label">
            <h2>Proveedores</h2>
            <span className="hint">Servicios de modelos; independientes de los agentes.</span>
          </div>
          <ProviderSettings />
          {["OpenCode Zen", "OpenAI", "Gemini", "Groq", "NVIDIA"].map((name) => (
            <ProviderCard name={name} kind="PROVEEDOR" key={name} />
          ))}
        </>
      ) : tab === "Ejecución" ? (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Cubo API"
              value={available ? "Disponible" : "Sin sincronizar"}
              detail="estado observado por el cliente"
            />
            <MetricCard
              label="Tareas en ejecución"
              value={w.tasks.filter((t) => t.status === "RUNNING").length}
              detail="exact · historial disponible"
            />
            <MetricCard
              label="Presupuesto de infraestructura"
              value="USD 0"
              detail="política del proyecto, no gasto medido"
            />
          </div>
          <SectionCard title="Backend de ejecución">
            <dl className="definition">
              <div>
                <dt>ExecutionBackend</dt>
                <dd>GitHub Actions</dd>
              </div>
              <div>
                <dt>Configuración</dt>
                <dd>{w.configured ? "Configurado" : "Pendiente"}</dd>
              </div>
              <div>
                <dt>Guardia de coste</dt>
                <dd>{w.guard ? "Verificada" : "Pendiente"}</dd>
              </div>
              <div>
                <dt>Persistencia</dt>
                <dd>D1 y Workflows</dd>
              </div>
              <div>
                <dt>Runner</dt>
                <dd>Efímero · ubuntu-latest</dd>
              </div>
            </dl>
            <p className="hint">
              Cubo no tiene VM permanente. No se presentan métricas de RAM, uptime ni procesos de
              servidor inexistentes.
            </p>
          </SectionCard>
        </>
      ) : tab === "Notificaciones" ? (
        <SectionCard title="Notificaciones">
          <div className="preference-rows">
            {["Tarea completada", "Error de ejecución", "Decisión o aprobación pendiente"].map(
              (name) => (
                <label key={name}>
                  {name}
                  <input type="checkbox" disabled />
                </label>
              ),
            )}
          </div>
          <p className="hint">Integración pendiente. Consulta el estado persistido en Tareas.</p>
        </SectionCard>
      ) : tab === "Apariencia" ? (
        <SectionCard title="Apariencia">
          <div className="field-grid">
            <label>
              Tema
              <select
                value={w.theme}
                onChange={(e) => w.setTheme(e.target.value === "light" ? "light" : "dark")}
                aria-label="Tema de la interfaz"
              >
                <option value="dark">Oscuro · paleta de Cubo</option>
                <option value="light">Claro · misma paleta base</option>
              </select>
            </label>
            <label>
              Densidad
              <select disabled>
                <option>Compacta</option>
              </select>
            </label>
          </div>
          <p className="hint">Oscuro por defecto. El modo claro reutiliza los mismos componentes.</p>
          <h3>Instalación de Cubo</h3>
          <p className="hint">
            Usa Instalar cuando aparezca en la barra superior. Si no aparece, busca Instalar
            aplicación o Añadir a la pantalla de inicio en el menú del navegador. La disponibilidad
            depende del navegador.
          </p>
        </SectionCard>
      ) : tab === "Skills" ? (
        <SectionCard title="Skills disponibles">
          <EmptyState
            title="Integración pendiente"
            description="La instalación local de skills de desarrollo no implica que estén disponibles para ejecuciones cloud."
          />
          <button className="secondary compact" type="button" disabled>
            Instalar skill
          </button>
        </SectionCard>
      ) : (
        <SectionCard title="Cuenta y conexiones">
          <dl className="definition">
            <div>
              <dt>Sesión</dt>
              <dd>Acceso personal autenticado</dd>
            </div>
            <div>
              <dt>GitHub de ejecución</dt>
              <dd>{w.configured ? "Configurado" : "Pendiente"}</dd>
            </div>
            <div>
              <dt>Proyectos GitHub</dt>
              <dd>Integración pendiente</dd>
            </div>
          </dl>
          <button className="secondary compact" type="button" disabled>
            Conectar proyecto
          </button>
        </SectionCard>
      )}
    </div>
  );
}
