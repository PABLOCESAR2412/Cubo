import type { FreeModel, ProviderQuota, SupportedProvider } from "@cubo/shared";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "./Icon";
import {
  getNotificationPreferences,
  isNotificationSupported,
  requestNotificationPermission,
  saveNotificationPreferences,
} from "./notifications";
import { getStoredTheme, saveTheme, type Theme } from "./theme";
import { requestApi, type Workspace } from "./workspace";

interface ProviderItem {
  provider: SupportedProvider;
  name: string;
  configured: boolean;
  encryptionConfigured: boolean;
  models: FreeModel[];
  quota: ProviderQuota | null;
  catalogAvailable: boolean;
  blockedReason: string | null;
}

const PROVIDER_METADATA: Record<
  SupportedProvider,
  {
    subtitle: string;
    placeholder: string;
    docsUrl: string;
    docsLabel: string;
    icon: "terminal" | "cube" | "bolt" | "shield";
    defaultModel: string;
  }
> = {
  gemini: {
    subtitle: "Google AI Studio · Modelos Flash y Pro",
    placeholder: "AIzaSy...",
    docsUrl: "https://aistudio.google.com/app/apikey",
    docsLabel: "Obtener clave en Google AI Studio",
    icon: "cube",
    defaultModel: "gemini-2.0-flash",
  },
  groq: {
    subtitle: "Groq LPU Inference · Llama 3.3 y Mixtral Ultrarrápidos",
    placeholder: "gsk_...",
    docsUrl: "https://console.groq.com/keys",
    docsLabel: "Obtener clave en Groq Console",
    icon: "bolt",
    defaultModel: "llama-3.3-70b-versatile",
  },
  nvidia: {
    subtitle: "NVIDIA NIM / Build · Enterprise Accelerated Inference",
    placeholder: "nvapi-...",
    docsUrl: "https://build.nvidia.com/",
    docsLabel: "Obtener clave en NVIDIA Build",
    icon: "terminal",
    defaultModel: "meta/llama-3.3-70b-instruct",
  },
  openrouter: {
    subtitle: "OpenRouter Cloud Pipeline · Acceso a Catálogo Libre",
    placeholder: "sk-or-v1-...",
    docsUrl: "https://openrouter.ai/keys",
    docsLabel: "Obtener clave en OpenRouter",
    icon: "terminal",
    defaultModel: "qwen/qwen-2.5-coder-32b-instruct:free",
  },
};

export function Settings({ w }: { w: Workspace }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => getStoredTheme());
  const [selectedProvider, setSelectedProvider] = useState<SupportedProvider>("gemini");
  const [providers, setProviders] = useState<Record<SupportedProvider, ProviderItem | null>>({
    gemini: null,
    groq: null,
    nvidia: null,
    openrouter: null,
  });
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Respaldo gratuito autorizado de OpenRouter: preferencia real de los turnos de chat.
  const [fallbackModel, setFallbackModel] = useState("");
  const fallbackOptions = providers.openrouter?.models ?? [];

  useEffect(() => {
    let disposed = false;
    void requestApi<{ preferences?: { fallbackModel?: string } }>("providers/openrouter")
      .then((res) => {
        if (!disposed && typeof res.preferences?.fallbackModel === "string")
          setFallbackModel(res.preferences.fallbackModel);
      })
      .catch(() => {});
    return () => {
      disposed = true;
    };
  }, []);

  const handleSaveFallback = async () => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await requestApi("providers/openrouter/preferences", {
        method: "PUT",
        body: JSON.stringify({ fallbackModel }),
      });
      setNotice(
        fallbackModel ? `Respaldo gratuito fijado a ${fallbackModel}.` : "Respaldo desactivado.",
      );
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el modelo de respaldo.");
    } finally {
      setBusy(false);
    }
  };

  // Type-Safe AI State
  const [typeSafeTesting, setTypeSafeTesting] = useState(false);
  const [typeSafeResult, setTypeSafeResult] = useState<string | null>(null);

  // Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const prefs = getNotificationPreferences();
    return prefs.enabled;
  });
  const [notifMessage, setNotifMessage] = useState<string | null>(null);

  const refreshProviders = useCallback(async () => {
    try {
      const res = await requestApi<{ providers: ProviderItem[] }>("providers");
      if (res?.providers) {
        const map: Record<SupportedProvider, ProviderItem | null> = {
          gemini: null,
          groq: null,
          nvidia: null,
          openrouter: null,
        };
        for (const item of res.providers) {
          map[item.provider] = item;
        }
        setProviders(map);
      }
    } catch {
      // Fallback single provider fetch
      try {
        const item = await requestApi<ProviderItem>("providers/openrouter");
        setProviders((prev) => ({ ...prev, openrouter: item }));
      } catch {
        /* Preservar UI */
      }
    }
  }, []);

  useEffect(() => {
    void refreshProviders();
  }, [refreshProviders]);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await requestApi(`providers/${selectedProvider}`, {
        method: "PUT",
        body: JSON.stringify({ key: keyInput.trim() }),
      });
      setNotice(
        `Clave para ${selectedProvider.toUpperCase()} guardada y cifrada con éxito (AES-256-GCM).`,
      );
      setKeyInput("");
      setShowKey(false);
      await refreshProviders();
      setTimeout(() => setNotice(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la clave del proveedor.");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!confirm(`¿Eliminar la clave configurada para ${selectedProvider.toUpperCase()}?`)) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await requestApi(`providers/${selectedProvider}`, {
        method: "DELETE",
      });
      setNotice(`Clave de ${selectedProvider.toUpperCase()} eliminada.`);
      await refreshProviders();
      setTimeout(() => setNotice(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la clave.");
    } finally {
      setBusy(false);
    }
  };

  const handleTestTypeSafeAi = async () => {
    setTypeSafeTesting(true);
    setTypeSafeResult(null);
    try {
      const res = await requestApi<{ suggestions: unknown }>("ai/suggest", {
        method: "POST",
        body: JSON.stringify({
          context:
            "Usuario trabajando en refactorización de middleware y temas de interfaz en Cubo PWA.",
          provider: selectedProvider,
        }),
      });
      setTypeSafeResult(JSON.stringify(res.suggestions, null, 2));
    } catch (err) {
      setTypeSafeResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTypeSafeTesting(false);
    }
  };

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

  const currentProviderData = providers[selectedProvider];
  const meta = PROVIDER_METADATA[selectedProvider];

  return (
    <div className="settings-stitch-canvas">
      {/* 1. Header */}
      <div className="settings-stitch-header">
        <span className="settings-stitch-breadcrumb">AJUSTES / CONFIGURACIÓN DE ENTORNO</span>
        <h1 className="settings-stitch-title">Ajustes del Sistema y Proveedores</h1>
        <p className="settings-stitch-subtitle">
          Gestiona claves de cómputo en la nube (Gemini, Groq, NVIDIA, OpenRouter), límites de
          modelos, asistente Type-Safe y apariencia de escritorio.
        </p>
      </div>

      <div className="settings-stitch-stack">
        {/* Card 1: Proveedores de Inferencia LLM y Claves */}
        <section className="settings-stitch-card" aria-labelledby="llm-heading">
          <div className="card-stitch-header">
            <div className="card-stitch-title-group">
              <div className="card-stitch-icon" aria-hidden="true">
                <Icon name={meta.icon} size={17} />
              </div>
              <div>
                <h2 id="llm-heading" className="card-stitch-title">
                  Proveedores de Inferencia LLM
                </h2>
                <span className="card-stitch-subtitle">{meta.subtitle}</span>
              </div>
            </div>
            <div className="card-stitch-status-pill">
              <span
                className={`stitch-status-dot ${currentProviderData?.configured ? "active" : ""}`}
              />
              <span>
                {currentProviderData?.configured
                  ? "Conexión Cifrada (AES-256-GCM)"
                  : "Clave Pendiente"}
              </span>
            </div>
          </div>

          <div className="card-stitch-body">
            {/* Tabs selector for Providers */}
            <div className="settings-provider-tabs">
              {(["gemini", "groq", "nvidia", "openrouter"] as SupportedProvider[]).map((p) => {
                const isConf = Boolean(providers[p]?.configured);
                return (
                  <button
                    key={p}
                    type="button"
                    className={`settings-provider-tab-btn ${selectedProvider === p ? "active" : ""}`}
                    onClick={() => {
                      setSelectedProvider(p);
                      setKeyInput("");
                      setShowKey(false);
                      setError(null);
                      setNotice(null);
                    }}
                  >
                    <span className={`tab-status-dot ${isConf ? "configured" : ""}`} />
                    <span>
                      {p === "gemini"
                        ? "Google Gemini"
                        : p === "groq"
                          ? "Groq Cloud"
                          : p === "nvidia"
                            ? "NVIDIA NIM"
                            : "OpenRouter"}
                    </span>
                  </button>
                );
              })}
            </div>

            {notice && (
              <div className="inline-notice" role="status" style={{ marginBottom: 12 }}>
                {notice}
              </div>
            )}
            {error && (
              <div className="inline-notice error" role="alert" style={{ marginBottom: 12 }}>
                {error}
              </div>
            )}

            {/* API Key Form */}
            <div className="settings-field-group">
              <div className="settings-field-label-row">
                <label htmlFor="api-key-input" className="settings-field-label">
                  CLAVE DE ACCESO API ({selectedProvider.toUpperCase()})
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <a
                    href={meta.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="settings-field-status"
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                  >
                    {meta.docsLabel} ↗
                  </a>
                  {currentProviderData?.configured && (
                    <span className="settings-field-status" style={{ color: "var(--signal)" }}>
                      ✓ Guardada y cifrada
                    </span>
                  )}
                </div>
              </div>
              <div className="settings-key-input-row">
                <div className="settings-input-wrapper">
                  <input
                    id="api-key-input"
                    type={showKey ? "text" : "password"}
                    className="settings-text-input mono"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={
                      currentProviderData?.configured
                        ? "•••••••••••••••••••••••••••••••• (Clave configurada)"
                        : meta.placeholder
                    }
                    disabled={busy}
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
                  onClick={() => void handleSaveKey()}
                  disabled={busy || !keyInput.trim()}
                >
                  {currentProviderData?.configured ? "Actualizar Clave" : "Guardar Clave"}
                </button>
                {currentProviderData?.configured && (
                  <button
                    type="button"
                    className="secondary compact"
                    style={{ height: 36, padding: "0 12px" }}
                    onClick={() => void handleDeleteKey()}
                    disabled={busy}
                    title="Eliminar clave configurada"
                  >
                    Eliminar
                  </button>
                )}
              </div>
            </div>

            {/* Models & Budget Row */}
            <div className="settings-grid-two">
              <div className="settings-field-group">
                <label htmlFor="fallback-model-select" className="settings-field-label">
                  MODELO RESPALDO (FALLBACK) · OPENROUTER
                </label>
                <div className="settings-select-wrapper">
                  <select
                    id="fallback-model-select"
                    className="settings-select"
                    value={fallbackModel}
                    onChange={(e) => setFallbackModel(e.target.value)}
                    disabled={busy || !fallbackOptions.length}
                    aria-describedby="fallback-model-hint"
                  >
                    <option value="">
                      {fallbackOptions.length ? "Sin respaldo" : "Catálogo no disponible"}
                    </option>
                    {fallbackOptions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron" size={14} className="select-chevron" />
                </div>
                <small id="fallback-model-hint" className="settings-field-status">
                  Se usa cuando el modelo principal no está disponible gratis. Sin respaldo de pago
                  nunca.
                </small>
                <button
                  type="button"
                  className="secondary compact"
                  style={{ alignSelf: "flex-start" }}
                  onClick={() => void handleSaveFallback()}
                  disabled={busy}
                >
                  Guardar respaldo
                </button>
              </div>

              <div className="settings-field-group">
                <span className="settings-field-label">POLÍTICA DE PRESUPUESTO Y CONSUMO</span>
                <div className="settings-budget-box">
                  <div className="budget-val">
                    <Icon name="check" size={13} className="budget-check" />
                    <span>USD $0.00</span>
                  </div>
                  <span className="budget-note">Sin fallback de pago · Free Tier Estricto</span>
                </div>
              </div>
            </div>

            {/* Type-Safe AI Assistant Section */}
            <div className="typesafe-ai-banner">
              <div className="typesafe-ai-header">
                <div className="typesafe-ai-title">
                  <Icon name="cube" size={15} />
                  <span>Motor Type-Safe de Inteligencia Artificial</span>
                </div>
                <span className="typesafe-ai-badge">ZOD TYPE-SAFE VALIDADO</span>
              </div>
              <p className="typesafe-ai-desc">
                Esta IA auxiliar opera bajo contratos fuertemente tipados. Genera exclusivamente
                salidas estructuradas y validadas en tiempo de ejecución para:
              </p>
              <div className="typesafe-capabilities-grid">
                <div className="typesafe-cap-item">
                  <span className="typesafe-cap-icon">✦</span>
                  <div className="typesafe-cap-text">
                    <strong>Propuestas de Tareas</strong>
                    <span>
                      Desglose de refactorizaciones, impacto y pasos estimados para Codex/OpenCode.
                    </span>
                  </div>
                </div>
                <div className="typesafe-cap-item">
                  <span className="typesafe-cap-icon">✦</span>
                  <div className="typesafe-cap-text">
                    <strong>Síntesis de Memoria</strong>
                    <span>
                      Destilación estructurada de decisiones técnicas y arquitectura por proyecto.
                    </span>
                  </div>
                </div>
                <div className="typesafe-cap-item">
                  <span className="typesafe-cap-icon">✦</span>
                  <div className="typesafe-cap-text">
                    <strong>Sugerencias Contextuales</strong>
                    <span>
                      Acciones rápidas y recomendaciones proactivas en el chat de desarrollo.
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 8, display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  type="button"
                  className="secondary compact"
                  onClick={() => void handleTestTypeSafeAi()}
                  disabled={typeSafeTesting}
                >
                  {typeSafeTesting
                    ? "Ejecutando contrato Type-Safe…"
                    : "Probar Asistente Type-Safe"}
                </button>
                {typeSafeResult && (
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => setTypeSafeResult(null)}
                    title="Cerrar resultado"
                  >
                    <Icon name="close" size={12} />
                  </button>
                )}
              </div>

              {typeSafeResult && <pre className="typesafe-test-result">{typeSafeResult}</pre>}
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
                <span className="sw-version-pill">Service Worker v2.0</span>
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
              <span className="theme-preview-sub">Silent Canvas · Monocromo</span>
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
