import { useState } from "react";
import { EmptyState, MetricCard, PageHeader, ProviderCard, SectionCard, Tabs } from "./ui";
import type { Workspace } from "./workspace";

export { Chat } from "./Chat";

export { Projects } from "./Projects";

export function Analytics({ w }: { w: Workspace }) {
  const [days, setDays] = useState("30d");
  const count = Number.parseInt(days, 10);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const first = new Date(today);
  first.setDate(first.getDate() - count + 1);
  const tasks = w.tasks.filter((t) => new Date(t.createdAt) >= first);
  const bars = Array.from({ length: count }, (_, i) => {
    const date = new Date(first);
    date.setDate(date.getDate() + i);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    return {
      date,
      count: tasks.filter((t) => new Date(t.createdAt) >= date && new Date(t.createdAt) < next)
        .length,
    };
  });
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div className="module">
      <PageHeader
        title="Analíticas de consumo"
        description="Uso y actividad del workspace. Solo se muestran datos disponibles."
        actions={
          <Tabs
            names={["7d", "30d", "90d"]}
            value={days}
            onChange={setDays}
            label="Periodo de analíticas"
          />
        }
      />
      <div className="analytics-filters">
        <label>
          Proyecto
          <select disabled>
            <option>Todos los proyectos · pendiente</option>
          </select>
        </label>
        <label>
          Modelo
          <select disabled>
            <option>Todos los modelos · pendiente</option>
          </select>
        </label>
      </div>
      <div className="metric-grid">
        <MetricCard label="Gasto" value="—" detail="unavailable · sin telemetría" />
        <MetricCard label="Tokens" value="—" detail="unavailable · sin telemetría" />
        <MetricCard
          label="Ejecuciones"
          value={tasks.length}
          detail={`exact · tareas registradas en ${days}`}
          icon="clock"
        />
      </div>
      <SectionCard
        title="Actividad del workspace"
        actions={<span className="hint">Tareas creadas · no llamadas de modelos</span>}
      >
        {tasks.length ? (
          <div
            className="activity-chart"
            role="img"
            aria-label={`${tasks.length} tareas creadas en ${days}. ${bars
              .filter((b) => b.count)
              .map((b) => `${b.date.toLocaleDateString("es")}: ${b.count}`)
              .join(". ")}`}
          >
            <div className="chart-bars">
              {bars.map((b, i) => (
                <div className="chart-column" key={b.date.toISOString()}>
                  <div className="bar-space">
                    <div
                      className="chart-bar"
                      style={{ height: `${(b.count / max) * 100}%` }}
                      title={`${b.date.toLocaleDateString("es")}: ${b.count}`}
                    />
                    {b.count > 0 && <span className="bar-count">{b.count}</span>}
                  </div>
                  <span>{i === 0 || i === count - 1 || count === 7 ? b.date.getDate() : ""}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Sin datos todavía"
            description="No hay tareas en este periodo dentro del historial disponible."
          />
        )}
      </SectionCard>
      <SectionCard title="Distribución por modelo">
        <EmptyState
          title="Sin datos todavía"
          description="Uso, tokens y coste por modelo aparecerán cuando los agentes o proveedores expongan telemetría."
        />
      </SectionCard>
      <p className="hint">
        Cobertura: {w.tasks.length} tareas cargadas desde la API. No equivale a un historial
        ilimitado ni al consumo facturado.
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
          {["OpenAI", "Gemini", "Groq", "NVIDIA"].map((name) => (
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
              <select disabled>
                <option>Oscuro · paleta de Cubo</option>
              </select>
            </label>
            <label>
              Densidad
              <select disabled>
                <option>Compacta</option>
              </select>
            </label>
          </div>
          <p className="hint">Paleta aprobada conservada. Preferencias persistentes pendientes.</p>
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
