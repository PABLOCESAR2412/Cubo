import { registerSW } from "virtual:pwa-register";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Icon } from "./Icon";

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let state = { update: false, install: null as InstallPrompt | null };
const listeners = new Set<() => void>();
function publish(next: Partial<typeof state>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
let registration: ServiceWorkerRegistration | undefined;
async function checkUpdate() {
  if (navigator.onLine && document.visibilityState === "visible") {
    try {
      await registration?.update();
    } catch {
      /* Reintentar al volver a estar online. */
    }
  }
}
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh: () => publish({ update: true }),
  onOfflineReady: () => window.dispatchEvent(new Event("cubo-offline-ready")),
  onRegisteredSW: (_url, value) => {
    registration = value;
    window.setInterval(() => void checkUpdate(), 5 * 60 * 1000);
  },
});
window.addEventListener("online", () => void checkUpdate());
window.addEventListener("focus", () => void checkUpdate());
document.addEventListener("visibilitychange", () => void checkUpdate());
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  publish({ install: event as InstallPrompt });
});
window.addEventListener("appinstalled", () => publish({ install: null }));

export function PwaControls() {
  const current = useSyncExternalStore(subscribe, () => state);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [later, setLater] = useState(false);
  const reloadTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(reloadTimer.current), []);
  async function install() {
    const prompt = current.install;
    if (!prompt || busy) return;
    setBusy(true);
    setError("");
    try {
      await prompt.prompt();
      await prompt.userChoice;
      publish({ install: null });
    } catch {
      setError("No se pudo abrir la instalación. Usa el menú del navegador.");
    } finally {
      setBusy(false);
    }
  }
  async function update() {
    if (
      busy ||
      !window.confirm(
        "Actualizar Cubo y recargar? Guarda primero cualquier borrador. Las tareas remotas seguirán ejecutándose.",
      )
    )
      return;
    setBusy(true);
    setError("");
    reloadTimer.current = window.setTimeout(() => {
      setBusy(false);
      setError("La actualización no terminó. Revisa la conexión y vuelve a intentarlo.");
    }, 15000);
    try {
      await updateSW(true);
    } catch {
      window.clearTimeout(reloadTimer.current);
      setError("No se pudo actualizar. Revisa la conexión e inténtalo de nuevo.");
      setBusy(false);
    }
  }
  return (
    <>
      {current.install && (
        <button
          className="secondary compact"
          type="button"
          disabled={busy}
          onClick={() => void install()}
        >
          <Icon name="download" size={14} />
          Instalar
        </button>
      )}
      {current.update && later && (
        <button
          className="secondary compact"
          type="button"
          disabled={busy}
          onClick={() => void update()}
        >
          Actualizar
        </button>
      )}
      {current.update && !later && (
        <div className="pwa-update-notice" role="status" aria-label="Actualización de Cubo">
          <Icon name="refresh" size={18} />
          <div>
            <strong>Actualización disponible</strong>
            <p>Tu trabajo remoto continúa.</p>
          </div>
          <button
            className="primary compact"
            type="button"
            disabled={busy}
            onClick={() => void update()}
          >
            {busy ? "Actualizando…" : "Actualizar"}
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Recordar actualización después"
            disabled={busy}
            onClick={() => setLater(true)}
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="pwa-update-notice error" role="alert">
          {error}
          <a className="secondary compact" href="/api/pwa-recovery">
            Recuperar actualización
          </a>
          <button className="secondary compact" type="button" onClick={() => setError("")}>
            Cerrar
          </button>
        </div>
      )}
    </>
  );
}
