import { useState } from "react";
import { Icon } from "./Icon";
import type { Workspace } from "./workspace";

function Pending({ children }: { children: React.ReactNode }) {
  return (
    <div className="integration-note">
      <span className="tag pending">Integración pendiente</span>
      <p>{children}</p>
    </div>
  );
}

export { Chat } from "./Chat";
export function Projects() {
  const [form, setForm] = useState(false);
  return (
    <div className="module">
      <div className="page-heading">
        <div>
          <h1>Proyectos</h1>
          <p>Repositorios, instrucciones y contexto de trabajo.</p>
        </div>
        <button
          className="secondary"
          type="button"
          aria-expanded={form}
          onClick={() => setForm(!form)}
        >
          <Icon name="plus" />
          Nuevo proyecto
        </button>
      </div>
      <Pending>
        La conexión de repositorios está pendiente. Aún no se pueden crear o guardar proyectos.
      </Pending>
      <div className="projects-layout">
        <section className="panel">
          <div className="panel-heading">
            <h2>Repositorios</h2>
            <span className="tag">Sin conexión</span>
          </div>
          <div className="project-search">
            <Icon name="search" />
            <input aria-label="Buscar proyectos" disabled placeholder="Buscar proyecto…" />
          </div>
          <div className="empty-inline">
            <Icon name="folder" size={30} />
            <h2>Sin proyectos conectados</h2>
            <p>Aquí aparecerán los repositorios autorizados para las tareas de Cubo.</p>
            <button className="secondary" type="button" onClick={() => setForm(true)}>
              Ver configuración de proyecto
            </button>
          </div>
        </section>
        <section className="panel project-config">
          <div className="panel-heading">
            <h2>{form ? "Nuevo proyecto" : "Contexto del proyecto"}</h2>
            <span className="tag pending">Próximamente</span>
          </div>
          <div className="form-stack">
            <fieldset disabled>
              <label>
                Nombre
                <input placeholder="Nombre del proyecto" />
              </label>
              <label>
                Repositorio de GitHub
                <input placeholder="owner/repositorio" />
              </label>
              <label>
                Rama de trabajo
                <input placeholder="main" />
              </label>
            </fieldset>
            <div className="config-summary">
              <span>
                Repositorio<strong>Sin conectar</strong>
              </span>
              <span>
                Actividad<strong>Sin datos</strong>
              </span>
            </div>
            <label>
              Instrucciones
              <textarea
                disabled
                placeholder="Reglas y contexto para las tareas de este proyecto."
              />
            </label>
            <label>
              Memoria del proyecto
              <textarea
                disabled
                placeholder="Se cargará el contexto persistente del repositorio conectado."
              />
            </label>
            <p className="hint">
              La memoria del proyecto se mantiene separada de la memoria de desarrollo de Cubo.
            </p>
            <button type="button" className="primary" disabled>
              Crear proyecto · próximamente
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
export function Analytics({ w }: { w: Workspace }) {
  const [days, setDays] = useState(7);
  const now = new Date();
  const start = new Date(now.getTime() - (days - 1) * 86400000);
  start.setHours(0, 0, 0, 0);
  const tasks = w.tasks.filter((t) => new Date(t.createdAt) >= start);
  const completed = tasks.filter((t) => t.status === "SUCCEEDED").length;
  const failed = tasks.filter((t) => t.status === "FAILED").length;
  const bars = Array.from({ length: days }, (_, i) => {
    const date = new Date(start.getTime() + i * 86400000);
    const key = date.toLocaleDateString("en-CA");
    return {
      date,
      key,
      count: tasks.filter((t) => new Date(t.createdAt).toLocaleDateString("en-CA") === key).length,
    };
  });
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <div className="module">
      <div className="page-heading">
        <div>
          <h1>Analíticas</h1>
          <p>Actividad observable de las tareas disponibles en Cubo.</p>
        </div>
        <nav className="segments" aria-label="Periodo">
          {[7, 30, 90].map((n) => (
            <button
              type="button"
              key={n}
              aria-pressed={days === n}
              className={days === n ? "active" : ""}
              onClick={() => setDays(n)}
            >
              {n} días
            </button>
          ))}
        </nav>
      </div>
      <div className="filterbar analytics-filters">
        <label>
          Proyecto
          <select disabled>
            <option>Proyectos pendientes</option>
          </select>
        </label>
        <label>
          Modelo
          <select disabled>
            <option>Sin telemetría de modelos</option>
          </select>
        </label>
        <span className="hint">Fuente: historial de tareas disponible</span>
      </div>
      <div className="metrics-strip">
        <div>
          <span>Tareas registradas</span>
          <strong>{tasks.length}</strong>
          <small>últimos {days} días</small>
        </div>
        <div>
          <span>Completadas</span>
          <strong>{completed}</strong>
          <small>resultado persistido</small>
        </div>
        <div>
          <span>Fallidas</span>
          <strong>{failed}</strong>
          <small>estado reportado por Cubo</small>
        </div>
        <div>
          <span>Tasa de éxito</span>
          <strong>
            {completed + failed ? `${Math.round((completed / (completed + failed)) * 100)}%` : "—"}
          </strong>
          <small>sobre completadas y fallidas</small>
        </div>
      </div>
      <section className="panel activity-panel">
        <div className="panel-heading">
          <div>
            <h2>Actividad de tareas</h2>
            <p className="hint">
              Creaciones por día · {days} días · datos disponibles, no consumo de modelos
            </p>
          </div>
          <span className="tag">Tareas creadas</span>
        </div>
        <div
          className="activity-chart"
          role="img"
          aria-label={`Actividad diaria: ${tasks.length} tareas en ${days} días. ${bars
            .filter((b) => b.count)
            .map((b) => `${b.key}: ${b.count}`)
            .join(". ")}`}
        >
          <div className="chart-scale">
            <span>{max}</span>
            <span>0</span>
          </div>
          <div className="chart-bars">
            {bars.map((bar, i) => (
              <div key={bar.key} className="chart-column">
                <div className="bar-space">
                  {bar.count > 0 && <span className="bar-count">{bar.count}</span>}
                  <div
                    className="chart-bar"
                    style={{ height: `${(bar.count / max) * 100}%` }}
                    title={`${bar.key}: ${bar.count} tareas`}
                  />
                </div>
                <span>{i === 0 || i === days - 1 || days === 7 ? bar.date.getDate() : ""}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="analytics-bottom">
        <section className="panel">
          <div className="panel-heading">
            <h2>Modelos y proveedores</h2>
            <span className="tag pending">Pendiente</span>
          </div>
          <div className="empty-inline compact-empty">
            <Icon name="chart" size={23} />
            <p>
              Sin telemetría de modelos. Tokens, coste y distribución aparecerán cuando se conecten
              los agentes.
            </p>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>Cobertura de los datos</h2>
          </div>
          <dl className="definition padded">
            <div>
              <dt>Origen</dt>
              <dd>API de tareas</dd>
            </div>
            <div>
              <dt>Historial cargado</dt>
              <dd>{w.tasks.length} tareas</dd>
            </div>
            <div>
              <dt>Periodo</dt>
              <dd>{days} días</dd>
            </div>
            <div>
              <dt>Consumo facturado</dt>
              <dd>No disponible</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
export function Settings({ w }: { w: Workspace }) {
  const [tab, setTab] = useState("Sistema");
  const tabs = ["Sistema", "Agentes", "Proveedores", "Preferencias"];
  return (
    <div className="module">
      <div className="page-heading">
        <div>
          <h1>Ajustes</h1>
          <p>Estado del workspace y configuración de sus integraciones.</p>
        </div>
        <span className="tag">Uso personal</span>
      </div>
      <nav className="tabs settings-tabs" aria-label="Secciones de ajustes">
        {tabs.map((name) => (
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
      {tab === "Sistema" ? (
        <>
          <div className="metrics-strip">
            <div>
              <span>Acceso API</span>
              <strong className="metric-text">
                {w.authenticated ? "Autenticado" : "Sin sesión"}
              </strong>
              <small>{w.online ? "Cliente conectado" : "Cliente offline"}</small>
            </div>
            <div>
              <span>En ejecución</span>
              <strong>{w.tasks.filter((t) => t.status === "RUNNING").length}</strong>
              <small>estado de tareas cargadas</small>
            </div>
            <div>
              <span>Backend</span>
              <strong className="metric-text">GitHub Actions</strong>
              <small>{w.configured ? "Configuración presente" : "Pendiente de conectar"}</small>
            </div>
            <div>
              <span>Presupuesto</span>
              <strong className="metric-text">USD 0</strong>
              <small>límite de infraestructura acordado</small>
            </div>
          </div>
          <section className="panel">
            <div className="panel-heading">
              <h2>Control plane</h2>
              <button
                type="button"
                className="secondary compact"
                disabled={!w.online}
                onClick={() => void w.refresh()}
              >
                <Icon name="refresh" size={15} />
                Actualizar estado
              </button>
            </div>
            <dl className="definition padded">
              <div>
                <dt>API</dt>
                <dd className="mono">{window.location.origin}/api</dd>
              </div>
              <div>
                <dt>Orquestación</dt>
                <dd>Cloudflare Workflows</dd>
              </div>
              <div>
                <dt>Persistencia</dt>
                <dd>Cloudflare D1</dd>
              </div>
              <div>
                <dt>Guardia de gasto</dt>
                <dd>{w.guard ? "Verificada en configuración" : "Pendiente"}</dd>
              </div>
              <div>
                <dt>Última consulta</dt>
                <dd>
                  {w.lastSync ? new Date(w.lastSync).toLocaleString("es") : "Sin sincronizar"}
                </dd>
              </div>
            </dl>
          </section>
        </>
      ) : tab === "Preferencias" ? (
        <section className="panel">
          <div className="panel-heading">
            <h2>Preferencias del workspace</h2>
            <span className="tag pending">Próximamente</span>
          </div>
          <div className="preference-row">
            <div>
              <strong>Modo oscuro</strong>
              <p>Paleta de Cubo conservada en todos los módulos.</p>
            </div>
            <input
              type="checkbox"
              role="switch"
              aria-checked={true}
              checked
              disabled
              aria-label="Modo oscuro"
            />
          </div>
          <div className="preference-row">
            <div>
              <strong>Notificaciones</strong>
              <p>Avisos de resultados y aprobaciones pendientes de integración.</p>
            </div>
            <input
              type="checkbox"
              role="switch"
              aria-checked={false}
              checked={false}
              disabled
              aria-label="Notificaciones"
            />
          </div>
        </section>
      ) : (
        <>
          <Pending>
            {tab === "Agentes"
              ? "Los adaptadores de agentes aún no están conectados. La ejecución actual utiliza el runner de validación."
              : "Los proveedores de modelos se conectarán por fases. No introduzcas credenciales en esta vista."}
          </Pending>
          <div className="integration-list">
            {(tab === "Agentes" ? ["Codex", "OpenCode"] : ["Gemini", "Groq", "NVIDIA"]).map(
              (name) => (
                <section className="panel integration-card" key={name}>
                  <div className="panel-heading">
                    <div className="integration-title">
                      <span className="integration-icon">
                        <Icon name={tab === "Agentes" ? "logs" : "link"} />
                      </span>
                      <div>
                        <h2>{name}</h2>
                        <p className="hint">
                          {tab === "Agentes" ? "Adaptador de agente" : "Proveedor de modelos"} ·
                          integración pendiente
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      role="switch"
                      aria-checked={false}
                      disabled
                      checked={false}
                      aria-label={`Habilitar ${name}`}
                    />
                  </div>
                  <div className="provider-fields">
                    <label>
                      {tab === "Agentes" ? "Adaptador" : "Credencial"}
                      <input disabled placeholder="No configurado" />
                    </label>
                    <label>
                      {tab === "Agentes" ? "Modelo compatible" : "Endpoint"}
                      <input disabled placeholder="Disponible al conectar la integración" />
                    </label>
                  </div>
                  <div className="integration-footer">
                    <span className="tag pending">Próximamente</span>
                    <button className="secondary compact" type="button" disabled>
                      Guardar configuración
                    </button>
                  </div>
                </section>
              ),
            )}
          </div>
        </>
      )}
    </div>
  );
}
