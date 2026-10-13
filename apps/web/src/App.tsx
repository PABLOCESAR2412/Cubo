import { useEffect, useRef, useState } from "react";
import { Icon, type IconName } from "./Icon";
import { Analytics, Chat, Projects, Settings } from "./PreparedViews";
import { Tasks } from "./Tasks";
import { labels, taskIdFromHash, time, useWorkspace, type Workspace } from "./workspace";

type View = "chat" | "tareas" | "proyectos" | "analiticas" | "ajustes";
const navigation: Array<{ id: View; label: string; icon: IconName }> = [
  { id: "chat", label: "Chat", icon: "chat" },
  { id: "tareas", label: "Tareas", icon: "tasks" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "analiticas", label: "Analíticas", icon: "chart" },
  { id: "ajustes", label: "Ajustes", icon: "settings" },
];
function currentView(): View {
  const key = window.location.hash.split("/")[1];
  return navigation.some((n) => n.id === key) ? (key as View) : "tareas";
}
function NewTask({ w, close, created }: { w: Workspace; close: () => void; created: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog ref={dialog} className="new-task-dialog" onCancel={close} onClose={close}>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (await w.create()) created();
        }}
      >
        <div className="panel-heading">
          <h2>Nueva tarea</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Cerrar nueva tarea"
            onClick={close}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="form-stack">
          <label>
            Ejecutor
            <select disabled defaultValue="runner">
              <option value="runner">Runner de validación</option>
            </select>
          </label>
          <p className="hint">
            Codex y OpenCode se conectarán posteriormente. Esta ejecución utiliza el backend durable
            real.
          </p>
          <div className="config-summary">
            <span>
              Pasos<strong>6</strong>
            </span>
            <span>
              Intervalo<strong>10 segundos</strong>
            </span>
            <span>
              Resultado<strong>Suma de cuadrados</strong>
            </span>
          </div>
          <label className="check-row">
            <input
              type="checkbox"
              checked={w.pause}
              disabled={w.busy}
              onChange={(e) => w.updatePause(e.target.checked)}
            />
            <span>Pausar a mitad y pedir aprobación para continuar en otro runner.</span>
          </label>
          <p className="hint">
            Logs, checkpoints y resultado permanecen en Cubo aunque cierres este dispositivo.
          </p>
          {(!w.configured || !w.guard) && (
            <div className="inline-notice">
              La ejecución remota requiere configuración. La tarea se guardará en cola.
            </div>
          )}
          {w.error && (
            <div className="inline-notice error" role="alert">
              {w.error}
            </div>
          )}
        </div>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={close} disabled={w.busy}>
            Cancelar
          </button>
          <button className="primary" type="submit" disabled={w.busy || !w.online}>
            {w.busy ? "Guardando…" : "Crear tarea"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
export default function App() {
  const w = useWorkspace();
  const [view, setView] = useState<View>(currentView);
  const [drawer, setDrawer] = useState(false);
  const [composer, setComposer] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [inspecting, setInspecting] = useState(false);
  const navigationDialog = useRef<HTMLDialogElement>(null);
  const Navigation = mobile ? "dialog" : "aside";
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const change = () => {
      setMobile(media.matches);
      setDrawer(false);
    };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    const change = () => {
      setView(currentView());
      setDrawer(false);
      const id = taskIdFromHash();
      if (id && id !== w.selected) w.chooseTask(id);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, [w.chooseTask, w.selected]);
  useEffect(() => {
    const hash = `#/${view}${view === "tareas" && w.selected ? `/${w.selected}` : ""}`;
    if (window.location.hash !== hash) history.replaceState(null, "", hash);
  }, [view, w.selected]);
  useEffect(() => {
    const dialog = navigationDialog.current;
    if (!mobile || !dialog || !w.authenticated) return;
    if (drawer && !dialog.open) dialog.showModal();
    if (!drawer && dialog.open) dialog.close();
  }, [mobile, drawer, w.authenticated]);
  function navigate(next: View) {
    // Close navigation before opening another modal so native focus restoration completes first.
    if (mobile && navigationDialog.current?.open) navigationDialog.current.close();
    setView(next);
    window.location.hash = `/${next}`;
    setDrawer(false);
    setInspecting(false);
  }
  function openTask(id: string) {
    w.chooseTask(id);
    navigate("tareas");
    setInspecting(true);
  }
  const title = navigation.find((n) => n.id === view)?.label;
  if (!w.authenticated)
    return (
      <div className="access-shell">
        <div className="access-brand">
          <Icon name="cube" size={29} />
          <span>Cubo</span>
          <span className="tag">Workspace personal</span>
        </div>
        <main className="access-panel">
          <div className="panel-heading">
            <h1>Acceso a Cubo</h1>
            <Icon name="logs" />
          </div>
          <p>Tu centro de control para ejecuciones persistentes.</p>
          {w.authenticated === null ? (
            <p role="status">Conectando con el workspace…</p>
          ) : (
            <form onSubmit={w.login} className="form-stack">
              <label htmlFor="password">
                Clave de acceso
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  maxLength={256}
                  value={w.password}
                  onChange={(e) => w.setPassword(e.target.value)}
                />
              </label>
              {w.error && (
                <div className="inline-notice error" role="alert">
                  {w.error}
                </div>
              )}
              <button className="primary" type="submit" disabled={w.busy || !w.online}>
                {w.busy ? "Verificando…" : "Entrar a Cubo"}
              </button>
              <p className="hint">Acceso privado · la clave se verifica en Cubo.</p>
            </form>
          )}
        </main>
      </div>
    );
  return (
    <div className="workspace-shell">
      <Navigation
        ref={navigationDialog}
        id="workspace-navigation"
        aria-label="Navegación del workspace"
        className="sidebar"
        onCancel={() => setDrawer(false)}
        onClose={() => setDrawer(false)}
      >
        <div className="brand-row">
          <a className="brand" href="#/tareas" aria-label="Cubo, tareas">
            <Icon name="cube" size={26} />
            <span>Cubo</span>
          </a>
          <span className="personal-label">personal</span>
          <button
            type="button"
            className="icon-button mobile-only"
            aria-label="Cerrar menú"
            onClick={() => setDrawer(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <button
          className="sidebar-create"
          type="button"
          onClick={() => {
            if (mobile && navigationDialog.current?.open) {
              navigationDialog.current.close();
              toggle.current?.focus();
            }
            setComposer(true);
            setDrawer(false);
          }}
        >
          <Icon name="plus" size={17} />
          Nueva tarea
        </button>
        <nav className="main-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <a
              key={item.id}
              href={`#/${item.id}`}
              className={view === item.id ? "active" : ""}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => navigate(item.id)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "tareas" && w.tasks.length > 0 && (
                <span className="nav-count">{w.tasks.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="recent-header">
          Recientes<span>{Math.min(5, w.tasks.length)}</span>
        </div>
        <div className="recents">
          {w.tasks.slice(0, 5).map((t) => (
            <button
              key={t.id}
              type="button"
              className={view === "tareas" && w.selected === t.id ? "active" : ""}
              onClick={() => openTask(t.id)}
            >
              <span
                className={`recent-dot ${t.status.toLowerCase()}`}
                role="img"
                aria-label={labels[t.status]}
              />
              <span>
                {t.title}
                <small>
                  {t.id.slice(0, 8)} · {time(t.createdAt)}
                </small>
              </span>
            </button>
          ))}
          {!w.tasks.length && <p className="hint">Sin ejecuciones recientes</p>}
        </div>
        <div className="sidebar-system">
          <div>
            <span className={w.online && !w.pollError ? "system-dot" : "system-dot inactive"} />
            <strong>{w.online ? "Cliente conectado" : "Sin conexión"}</strong>
          </div>
          <p>GitHub Actions · {w.configured ? "configurado" : "pendiente"}</p>
          <div className="system-budget">
            <span>Presupuesto</span>
            <span>USD 0</span>
          </div>
          <button type="button" className="sign-out" onClick={() => void w.logout()}>
            Cerrar sesión
          </button>
        </div>
      </Navigation>
      <div className="workspace-main">
        <header className="systembar">
          <div>
            <button
              ref={toggle}
              type="button"
              className="icon-button mobile-only"
              aria-label="Abrir navegación"
              aria-expanded={drawer}
              aria-controls="workspace-navigation"
              onClick={() => setDrawer(!drawer)}
            >
              <Icon name="menu" />
            </button>
            <span className="breadcrumb">
              Workspace <span>/</span> <strong>{title}</strong>
            </span>
          </div>
          <div className="systembar-status">
            <span className={w.online && !w.pollError ? "system-dot" : "system-dot inactive"} />
            <span>{w.lastSync && !w.pollError ? "API sincronizada" : "Sin sincronizar"}</span>
            <span className="mono last-sync">{w.lastSync ? time(w.lastSync) : "—"}</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Abrir ajustes"
              onClick={() => navigate("ajustes")}
            >
              <Icon name="settings" />
            </button>
          </div>
        </header>
        <main id="workspace-content">
          {(w.error || w.pollError) && (
            <div className="workspace-alert error" role="alert">
              {w.error || w.pollError}
            </div>
          )}
          {!w.online && (
            <div className="workspace-alert" role="status">
              Sin conexión. Las ejecuciones remotas siguen su ciclo. Reconecta para consultar el
              estado.
            </div>
          )}
          {(!w.guard || !w.configured) && (
            <div className="workspace-alert">
              Ejecución remota pendiente de configuración. Las tareas se conservan en cola.
            </div>
          )}
          {view === "tareas" ? (
            <Tasks
              w={w}
              openTask={openTask}
              newTask={() => setComposer(true)}
              mobile={mobile}
              inspectorOpen={inspecting}
              closeInspector={() => setInspecting(false)}
            />
          ) : view === "chat" ? (
            <Chat />
          ) : view === "proyectos" ? (
            <Projects />
          ) : view === "analiticas" ? (
            <Analytics w={w} />
          ) : (
            <Settings w={w} />
          )}
        </main>
      </div>
      {composer && (
        <NewTask
          w={w}
          close={() => setComposer(false)}
          created={() => {
            setComposer(false);
            navigate("tareas");
          }}
        />
      )}
    </div>
  );
}
