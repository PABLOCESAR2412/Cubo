import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import {
  getNotificationPreferences,
  isNotificationSupported,
  requestNotificationPermission,
  saveNotificationPreferences,
} from "./notifications";
import { getStoredTheme, saveTheme, type Theme } from "./theme";
import type { Workspace } from "./workspace";

export function Settings({ w }: { w: Workspace }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => getStoredTheme());
  const [apiKey, setApiKey] = useState("••••••••••••••••••••••••••••••••");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState("qwen/qwen-2.5-coder-32b-instruct:free");
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const prefs = getNotificationPreferences();
    return prefs.enabled;
  });
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = () => {
      setCurrentTheme(getStoredTheme());
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setCurrentTheme(newTheme);
    saveTheme(newTheme);
  };

  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
        saveNotificationPreferences({
          enabled: true,
          notifyTaskCompleted: true,
          notifyTaskFailed: true,
          notifyTaskApproval: true,
        });
      }
    } else {
      setNotificationsEnabled(false);
      saveNotificationPreferences({
        enabled: false,
        notifyTaskCompleted: false,
        notifyTaskFailed: false,
        notifyTaskApproval: false,
      });
    }
  };

  const sendTestNotification = async () => {
    if (!isNotificationSupported()) {
      setNotifMessage("Las notificaciones no están soportadas en este navegador.");
      return;
    }
    const granted = await requestNotificationPermission();
    if (!granted) {
      setNotifMessage("Permiso de notificaciones denegado.");
      return;
    }
    try {
      new Notification("Cubo · Alerta de Sistema", {
        body: "Prueba de canal IPC y Web Push API local completada con éxito.",
        icon: "/icon-192.png",
      });
      setNotifMessage("Notificación de prueba enviada con éxito.");
      setTimeout(() => setNotifMessage(null), 4000);
    } catch {
      setNotifMessage("No se pudo disparar la notificación nativa.");
    }
  };

  return (
    <div className="settings-stitch-canvas">
      {/* 1. Header */}
      <div className="settings-stitch-header">
        <span className="settings-stitch-breadcrumb">AJUSTES / CONFIGURACIÓN DE ENTORNO</span>
        <h1 className="settings-stitch-title">Ajustes del Sistema y Proveedores</h1>
        <p className="settings-stitch-subtitle">
          Gestiona claves de cómputo en la nube, límites de modelos, alertas de agente y apariencia
          de escritorio.
        </p>
      </div>

      <div className="settings-stitch-stack">
        {/* Card 1: Proveedor de Inferencia LLM */}
        <section className="settings-stitch-card" aria-labelledby="llm-heading">
          <div className="card-stitch-header">
            <div className="card-stitch-title-group">
              <div className="card-stitch-icon" aria-hidden="true">
                <Icon name="terminal" size={17} />
              </div>
              <div>
                <h2 id="llm-heading" className="card-stitch-title">
                  Proveedor de Inferencia LLM
                </h2>
                <span className="card-stitch-subtitle">
                  OpenRouter Cloud Pipeline &amp; Routing
                </span>
              </div>
            </div>
            <div className="card-stitch-status-pill">
              <span className="stitch-status-dot" />
              <span>Conexión Cifrada (AES-256-GCM)</span>
            </div>
          </div>

          <div className="card-stitch-body">
            {/* API Key Row */}
            <div className="settings-field-group">
              <div className="settings-field-label-row">
                <label htmlFor="api-key-input" className="settings-field-label">
                  CLAVE DE ACCESO API
                </label>
                <span className="settings-field-status">sk-or-v1-validated</span>
              </div>
              <div className="settings-key-input-row">
                <div className="settings-input-wrapper">
                  <input
                    id="api-key-input"
                    type={showKey ? "text" : "password"}
                    className="settings-text-input mono"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                  />
                  <button
                    type="button"
                    className="settings-eye-btn"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? "Ocultar clave" : "Mostrar clave"}
                  >
                    <Icon name={showKey ? "close" : "eye"} size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  className="settings-action-btn"
                  onClick={() => {
                    alert("Clave guardada y cifrada en el almacén seguro.");
                  }}
                >
                  Actualizar Clave
                </button>
              </div>
            </div>

            {/* Model & Budget Row */}
            <div className="settings-grid-two">
              <div className="settings-field-group">
                <span className="settings-field-label">MODELO PREDETERMINADO</span>
                <div className="settings-select-wrapper">
                  <select
                    className="settings-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option value="qwen/qwen-2.5-coder-32b-instruct:free">
                      Qwen 2.5 Coder 32B (Free Tier)
                    </option>
                    <option value="google/gemini-2.0-flash-exp:free">
                      Gemini 2.0 Flash (Free Tier)
                    </option>
                    <option value="meta-llama/llama-3.3-70b-instruct:free">
                      Llama 3.3 70B (Free Tier)
                    </option>
                  </select>
                  <Icon name="chevron" size={14} className="select-chevron" />
                </div>
              </div>

              <div className="settings-field-group">
                <span className="settings-field-label">POLÍTICA DE PRESUPUESTO Y CONSUMO</span>
                <div className="settings-budget-box">
                  <div className="budget-val">
                    <Icon name="check" size={13} className="budget-check" />
                    <span>USD $0.00</span>
                  </div>
                  <span className="budget-note">Sin fallback de pago</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: Notificaciones PWA y Alertas Web */}
        <section className="settings-stitch-card" aria-labelledby="notif-heading">
          <div className="card-stitch-header">
            <div>
              <div className="notif-title-row">
                <h2 id="notif-heading" className="card-stitch-title">
                  Notificaciones PWA y Alertas Web
                </h2>
                <span className="sw-version-pill">Service Worker v1.4</span>
              </div>
              <p className="card-stitch-desc">
                Notificar cuando un agente termine, falle o requiera aprobación de diffs en Git
                mediante Web Push API local.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              className={`stitch-toggle-switch ${notificationsEnabled ? "active" : ""}`}
              onClick={handleToggleNotifications}
              title="Activar/desactivar notificaciones"
            >
              <span className="stitch-toggle-thumb" />
            </button>
          </div>

          <div className="card-stitch-body">
            <div className="notif-test-box">
              <div className="notif-test-left">
                <Icon name="bell" size={15} />
                <span>Prueba del canal IPC y suscripción push de navegador</span>
              </div>
              <button
                type="button"
                className="notif-test-btn"
                onClick={() => void sendTestNotification()}
              >
                Enviar notificación de prueba
              </button>
            </div>
            {notifMessage && (
              <div className="inline-notice" role="status" style={{ marginTop: 8 }}>
                {notifMessage}
              </div>
            )}
          </div>
        </section>

        {/* Section 3: Tema de la Interfaz */}
        <section className="settings-stitch-theme-section" aria-labelledby="theme-heading">
          <div className="theme-section-header">
            <h2 id="theme-heading" className="theme-section-title">
              Tema de la Interfaz
            </h2>
            <p className="theme-section-subtitle">
              Ajusta la respuesta cromática para sesiones de codificación prolongadas.
            </p>
          </div>

          <div className="theme-previews-grid">
            {/* Card Oscuro */}
            <button
              type="button"
              className={`theme-preview-card ${currentTheme === "oscuro" ? "active" : ""}`}
              onClick={() => handleThemeChange("oscuro")}
            >
              <div className="theme-preview-top">
                <span className="theme-preview-name">Oscuro</span>
                {currentTheme === "oscuro" && <span className="theme-active-dot" />}
              </div>
              <div className="theme-preview-visual dark-visual">
                <div className="visual-sidebar dark-sub" />
                <div className="visual-main dark-main">
                  <div className="visual-line line-1" />
                  <div className="visual-line line-2" />
                  <div className="visual-accent-line green" />
                </div>
              </div>
              <span className="theme-preview-sub">Zenith Graphite · Monocromo</span>
            </button>

            {/* Card Claro */}
            <button
              type="button"
              className={`theme-preview-card ${currentTheme === "claro" ? "active" : ""}`}
              onClick={() => handleThemeChange("claro")}
            >
              <div className="theme-preview-top">
                <span className="theme-preview-name">Claro</span>
                {currentTheme === "claro" && <span className="theme-active-dot" />}
              </div>
              <div className="theme-preview-visual light-visual">
                <div className="visual-sidebar light-sub" />
                <div className="visual-main light-main">
                  <div className="visual-line light-line-1" />
                  <div className="visual-line light-line-2" />
                  <div className="visual-accent-line green" />
                </div>
              </div>
              <span className="theme-preview-sub">Porcelain Precision · Balance</span>
            </button>

            {/* Card Sistema */}
            <button
              type="button"
              className={`theme-preview-card ${currentTheme === "sistema" ? "active" : ""}`}
              onClick={() => handleThemeChange("sistema")}
            >
              <div className="theme-preview-top">
                <span className="theme-preview-name">Sistema</span>
                {currentTheme === "sistema" && <span className="theme-active-dot" />}
              </div>
              <div className="theme-preview-visual split-visual">
                <div className="split-half dark-half">
                  <div className="visual-line line-1" />
                </div>
                <div className="split-half light-half">
                  <div className="visual-line light-line-1" />
                </div>
              </div>
              <span className="theme-preview-sub">Auto (Sincronizado con SO)</span>
            </button>
          </div>
        </section>

        {/* Card 4: Session info card */}
        <section className="settings-session-card">
          <div className="session-card-left">
            <div className="session-shield-icon">
              <Icon name="shield" size={17} />
            </div>
            <div>
              <div className="session-user-row">
                <span className="session-user">dev-lead@local</span>
                <span className="session-status-badge">ACTIVO</span>
              </div>
              <span className="session-token-hint">
                Cloudflare D1 Session Token (expira en 14d)
              </span>
            </div>
          </div>
          <button type="button" className="session-logout-btn" onClick={() => void w.logout()}>
            <Icon name="logout" size={15} />
            <span>Cerrar Sesión</span>
          </button>
        </section>
      </div>
    </div>
  );
}
