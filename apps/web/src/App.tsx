import type { Conversation } from "@cubo/shared";
import { useEffect, useRef, useState } from "react";
import { Diagnostics } from "./Diagnostics";
import { Icon, type IconName } from "./Icon";
import { NewTask } from "./NewTask";
import { Analytics, Chat, Projects, Settings } from "./PreparedViews";
import { PwaControls } from "./PwaControls";
import { RecentChat } from "./RecentChat";
import { Tasks } from "./Tasks";
import { AppShell, Sidebar, TopBar } from "./ui";
import { requestApi, taskIdFromHash, useWorkspace } from "./workspace";

type View = "chat" | "tareas" | "proyectos" | "analiticas" | "ajustes";
const navigation: Array<{ id: View; label: string; icon: IconName }> = [
  { id: "tareas", label: "Tareas", icon: "tasks" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "analiticas", label: "Analíticas", icon: "chart" },
  { id: "ajustes", label: "Ajustes", icon: "settings" },
];
function currentView(): View {
  const key = window.location.hash.split("/")[1];
  if (key === "chat") return "chat";
  return navigation.some((n) => n.id === key)
    ? (key as View)
    : taskIdFromHash()
      ? "tareas"
      : "proyectos";
}
function chatGroup(chat: Conversation): string {
  if (chat.pinned) return "Fijados";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(chat.updatedAt);
  date.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - date.getTime()) / 86400000);
  return days <= 0 ? "Hoy" : days === 1 ? "Ayer" : days < 7 ? "Últimos 7 días" : "Anteriores";
}
export default function App() {
  const w = useWorkspace();
  const [view, setView] = useState<View>(currentView);
  const [drawer, setDrawer] = useState(false);
  const [composer, setComposer] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const [inspecting, setInspecting] = useState(() => Boolean(taskIdFromHash()));
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);
  const [activeChat, setActiveChat] = useState(() =>
    new URL(window.location.href).searchParams.get("chat"),
  );
  const navigationDialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!w.authenticated) return;
    let disposed = false;
    const refresh = () => {
      void requestApi<{ conversations: Conversation[] }>("conversations/recent")
        .then((data) => {
          if (!disposed) {
            setRecentChats(data.conversations);
            setActiveChat(new URL(window.location.href).searchParams.get("chat"));
          }
        })
        .catch(() => {});
    };
    refresh();
    window.addEventListener("cubo-conversations-changed", refresh);
    return () => {
      disposed = true;
      window.removeEventListener("cubo-conversations-changed", refresh);
    };
  }, [w.authenticated]);
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
      if (id) setInspecting(true);
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
    if (next !== view) document.getElementById("workspace-content")?.scrollTo({ top: 0 });
    // Close navigation before opening another modal so native focus restoration completes first.
    if (mobile && navigationDialog.current?.open) navigationDialog.current.close();
    setView(next);
    window.location.hash = `/${next}`;
    if (next === "tareas") void w.refresh().catch(() => {});
    setDrawer(false);
    setInspecting(false);
  }
  function openTask(id: string) {
    w.chooseTask(id);
    navigate("tareas");
    setInspecting(true);
  }
  function openChat(chat: Conversation) {
    const id = chat.id;
    setActiveChat(id);
    const url = new URL(window.location.href);
    url.searchParams.set("chat", id);
    if (chat.projectId) url.searchParams.set("project", chat.projectId);
    else url.searchParams.delete("project");
    history.replaceState(null, "", url);
    navigate("chat");
    window.dispatchEvent(new Event("cubo-chat-selected"));
  }
  function openProjects(create = false) {
    const url = new URL(location.href);
    url.searchParams.delete("project");
    url.searchParams.delete("chat");
    url.searchParams.delete("panel");
    if (create) url.searchParams.set("new", "project");
    else url.searchParams.delete("new");
    history.replaceState(null, "", url);
    navigate("proyectos");
    window.dispatchEvent(new Event("cubo-projects-index"));
  }
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
            <div>
              <p role="status">{w.error || "Conectando con el workspace…"}</p>
              {w.error && (
                <button className="secondary" type="button" onClick={() => void w.checkSession()}>
                  Reintentar conexión
                </button>
              )}
            </div>
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
    <AppShell>
      <TopBar>
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
        </div>
        <div className="systembar-status">
          <PwaControls />
          <Diagnostics w={w} />
        </div>
      </TopBar>
      <Sidebar mobile={mobile} dialogRef={navigationDialog} close={() => setDrawer(false)}>
        <div className="brand-row">
          <button
            className="brand"
            type="button"
            aria-label="Cubo, proyectos"
            onClick={() => openProjects()}
          >
            <Icon name="cube" size={26} />
            <span>Cubo</span>
          </button>
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
            openProjects(true);
            setDrawer(false);
          }}
        >
          <Icon name="plus" size={17} />
          Nuevo proyecto
        </button>
        <nav className="main-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <a
              key={item.id}
              href={`#/${item.id}`}
              className={view === item.id ? "active" : ""}
              aria-current={view === item.id ? "page" : undefined}
              onClick={() => (item.id === "proyectos" ? openProjects() : navigate(item.id))}
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
          Recientes<span>{recentChats.length}</span>
        </div>
        <div className="recents">
          {recentChats.map((chat, index) => (
            <div key={chat.id}>
              {(index === 0 ||
                chatGroup(recentChats[index - 1] as Conversation) !== chatGroup(chat)) && (
                <span className="recent-group">{chatGroup(chat)}</span>
              )}
              <RecentChat
                chat={chat}
                active={view === "chat" && activeChat === chat.id}
                open={() => openChat(chat)}
                removed={() => {
                  if (activeChat === chat.id) openProjects();
                }}
              />
            </div>
          ))}
          {!recentChats.length && <p className="hint">Sin chats todavía</p>}
        </div>
        <div className="sidebar-system">
          <button type="button" className="sign-out" onClick={() => void w.logout()}>
            <Icon name="logout" size={15} />
            Cerrar sesión
          </button>
          <span className="app-version">Cubo {import.meta.env.VITE_CUBO_VERSION ?? "1.0.0"}</span>
        </div>
      </Sidebar>
      <div className="workspace-main">
        <main id="workspace-content" className={view === "chat" ? "chat-workspace" : undefined}>
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
            setInspecting(true);
          }}
        />
      )}
    </AppShell>
  );
}
