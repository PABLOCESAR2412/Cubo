import { useState } from "react";
import {
  getNotificationPermission,
  getNotificationPreferences,
  isNotificationSupported,
  requestNotificationPermission,
  saveNotificationPreferences,
} from "./notifications";
import { ProviderSettings } from "./ProjectProviderSettings";
import { getStoredTheme, saveTheme, type Theme } from "./theme";
import { EmptyState, MetricCard, PageHeader, ProviderCard, SectionCard, Tabs } from "./ui";
import { VersionHistoryDialog } from "./VersionHistory";
import type { Workspace } from "./workspace";

export function Settings({ w }: { w: Workspace }) {
  const [tab, setTab] = useState("Agentes y proveedores");
  const [showVersions, setShowVersions] = useState(false);
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
        <NotificationsSettings />
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
          <h3>Instalación de Cubo</h3>
          <p className="hint">
            Usa Instalar cuando aparezca en la barra superior. Si no aparece, busca Instalar
            aplicación o Añadir a la pantalla de inicio en el menú del navegador. La disponibilidad
            depende del navegador.
          </p>
        </SectionCard>
      ) : tab === "Apariencia" ? (
        <AppearanceSettings />
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
          <SectionCard title="Versión y novedades">
            <dl className="definition">
              <div>
                <dt>Versión instalada</dt>
                <dd>v{import.meta.env.VITE_CUBO_VERSION ?? "1.2.0"}</dd>
              </div>
              <div>
                <dt>Control de versiones</dt>
                <dd>SemVer (Grande · Mediano · Mínimo)</dd>
              </div>
            </dl>
            <button
              className="secondary compact"
              type="button"
              onClick={() => setShowVersions(true)}
            >
              Ver registro de cambios y novedades
            </button>
          </SectionCard>
        </SectionCard>
      )}
      <VersionHistoryDialog open={showVersions} onClose={() => setShowVersions(false)} />
    </div>
  );
}

function NotificationsSettings() {
  const supported = isNotificationSupported();
  const [permission, setPermission] = useState(getNotificationPermission);
  const [prefs, setPrefs] = useState(getNotificationPreferences);

  async function handleRequest() {
    const granted = await requestNotificationPermission();
    setPermission(getNotificationPermission());
    if (granted) {
      setPrefs(getNotificationPreferences());
    }
  }

  function updatePref(key: keyof typeof prefs, val: boolean) {
    const next = { ...prefs, [key]: val };
    setPrefs(next);
    saveNotificationPreferences(next);
  }

  return (
    <SectionCard title="Notificaciones del navegador">
      <dl className="definition">
        <div>
          <dt>Soporte del navegador</dt>
          <dd>{supported ? "Disponible" : "No soportado"}</dd>
        </div>
        <div>
          <dt>Permiso actual</dt>
          <dd>
            {permission === "granted"
              ? "Permitido"
              : permission === "denied"
                ? "Bloqueado por el navegador"
                : "Sin solicitar"}
          </dd>
        </div>
      </dl>

      {supported && permission !== "granted" && (
        <div style={{ marginTop: "1rem" }}>
          <button className="primary compact" type="button" onClick={() => void handleRequest()}>
            Activar notificaciones en segundo plano
          </button>
          <p className="hint">
            Cubo te avisará cuando una tarea termine, falle o requiera tu aprobación de cambios Git.
          </p>
        </div>
      )}

      <div className="preference-rows" style={{ marginTop: "1.5rem" }}>
        <label>
          Activar notificaciones
          <input
            type="checkbox"
            disabled={!supported || permission !== "granted"}
            checked={prefs.enabled}
            onChange={(e) => updatePref("enabled", e.target.checked)}
          />
        </label>
        <label>
          Tarea completada
          <input
            type="checkbox"
            disabled={!prefs.enabled || permission !== "granted"}
            checked={prefs.notifyTaskCompleted}
            onChange={(e) => updatePref("notifyTaskCompleted", e.target.checked)}
          />
        </label>
        <label>
          Error de ejecución
          <input
            type="checkbox"
            disabled={!prefs.enabled || permission !== "granted"}
            checked={prefs.notifyTaskFailed}
            onChange={(e) => updatePref("notifyTaskFailed", e.target.checked)}
          />
        </label>
        <label>
          Decisión o aprobación pendiente
          <input
            type="checkbox"
            disabled={!prefs.enabled || permission !== "granted"}
            checked={prefs.notifyTaskApproval}
            onChange={(e) => updatePref("notifyTaskApproval", e.target.checked)}
          />
        </label>
      </div>
      <p className="hint">
        Las notificaciones son avisos informativos. El estado persistido en D1 sigue siendo la
        fuente consultable.
      </p>
    </SectionCard>
  );
}

function AppearanceSettings() {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  const choose = (next: Theme) => {
    setTheme(next);
    saveTheme(next);
  };

  return (
    <SectionCard title="Tema y Apariencia">
      <div className="section-label">
        <h2>Modo de color</h2>
        <span className="hint">
          Elige entre el tema oscuro tradicional (Zenith Monolith) o el tema claro de alta precisión
          (Orquestador Light Precision), ambos con acento ámbar industrial (#d9a441).
        </span>
      </div>
      <div className="theme-selector-grid">
        <button
          type="button"
          className={`theme-card ${theme === "oscuro" ? "active" : ""}`}
          onClick={() => choose("oscuro")}
        >
          <div className="theme-preview dark">
            <span className="theme-sample-dot" />
            <span className="theme-sample-bar" />
          </div>
          <strong>Oscuro</strong>
          <small>Zenith Monolith · fondo pizarra con acento ámbar</small>
        </button>
        <button
          type="button"
          className={`theme-card ${theme === "claro" ? "active" : ""}`}
          onClick={() => choose("claro")}
        >
          <div className="theme-preview light">
            <span className="theme-sample-dot" />
            <span className="theme-sample-bar" />
          </div>
          <strong>Claro</strong>
          <small>Orquestador Light Precision · superficies blancas y nítidas</small>
        </button>
        <button
          type="button"
          className={`theme-card ${theme === "sistema" ? "active" : ""}`}
          onClick={() => choose("sistema")}
        >
          <div className="theme-preview system">
            <span className="theme-sample-dot" />
            <span className="theme-sample-bar" />
          </div>
          <strong>Sistema</strong>
          <small>Sigue automáticamente la configuración de tu sistema operativo</small>
        </button>
      </div>
    </SectionCard>
  );
}
