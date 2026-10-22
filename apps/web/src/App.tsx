import type { Conversation, TaskStatus } from "@cubo/shared";
import { useEffect, useRef, useState } from "react";
import { CommandPalette } from "./CommandPalette";
import { GlobalTopBar } from "./GlobalTopBar";
import { Icon, type IconName } from "./Icon";
import { NewTask } from "./NewTask";
import { notifyTaskStatus } from "./notifications";
import { Analytics, Chat, Projects, Settings } from "./PreparedViews";
import { PwaControls } from "./PwaControls";
import { RecentChat } from "./RecentChat";
import { Tasks } from "./Tasks";
import { initTheme } from "./theme";
import { AppShell, Sidebar } from "./ui";
import { VersionHistoryDialog } from "./VersionHistory";
import { requestApi, taskIdFromHash, useWorkspace } from "./workspace";

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
  const [showVersions, setShowVersions] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const navigationDialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const previousTasksRef = useRef<Map<string, TaskStatus>>(new Map());

  useEffect(() => {
    initTheme();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "t" && !e.shiftKey) {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        e.preventDefault();
        setComposer(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!w.tasks.length) return;
    for (const task of w.tasks) {
      const prev = previousTasksRef.current.get(task.id);
      if (prev && prev !== task.status) {
        if (
          task.status === "WAITING_APPROVAL" ||
          task.status === "SUCCEEDED" ||
          task.status === "FAILED"
        ) {
          notifyTaskStatus(task);
        }
      }
      previousTasksRef.current.set(task.id, task.status);
    }
  }, [w.tasks]);
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
      <button
        ref={toggle}
        type="button"
        className="icon-button mobile-menu-trigger mobile-only"
        aria-label="Abrir navegación"
        aria-expanded={drawer}
        aria-controls="workspace-navigation"
        onClick={() => setDrawer(!drawer)}
      >
        <Icon name="menu" />
      </button>
      <Sidebar mobile={mobile} dialogRef={navigationDialog} close={() => setDrawer(false)}>
        <div className="brand-row">
          <button
            className="brand"
            type="button"
            aria-label="Cubo, proyectos"
            onClick={() => openProjects()}
          >
            <span className="brand-symbol">&gt;&lt;</span>
            <span className="brand-title">cubo</span>
          </button>
          <span className="personal-label">workspace</span>
          <button
            type="button"
            className="icon-button mobile-only"
            aria-label="Cerrar menú"
            onClick={() => setDrawer(false)}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="sidebar-new-container">
          <div className="sidebar-new-trigger-wrapper">
            <button
              className="sidebar-create"
              type="button"
              onClick={() => {
                const el = document.getElementById(
                  "sidebar-new-menu-details",
                ) as HTMLDetailsElement | null;
                if (el) el.open = !el.open;
              }}
            >
              <div className="sidebar-create-inner">
                <Icon name="plus" size={16} />
                <span>Nuevo</span>
              </div>
              <Icon name="chevron" size={11} className="sidebar-new-chevron" />
            </button>
            <details id="sidebar-new-menu-details" className="sidebar-new-dropdown-details">
              <summary className="visually-hidden">Opciones de Nuevo</summary>
              <div className="sidebar-new-dropdown-menu" role="menu">
                <button
                  type="button"
                  className="sidebar-new-dropdown-item"
                  role="menuitem"
                  onClick={async () => {
                    const el = document.getElementById(
                      "sidebar-new-menu-details",
                    ) as HTMLDetailsElement | null;
                    if (el) el.open = false;
                    if (mobile && navigationDialog.current?.open) navigationDialog.current.close();
                    const url = new URL(location.href);
                    url.searchParams.delete("project");
                    history.replaceState(null, "", url);
                    try {
                      const res = await requestApi<{ conversation: { id: string } }>(
                        "conversations",
                        {
                          method: "POST",
                          headers: { "Idempotency-Key": crypto.randomUUID() },
                          body: JSON.stringify({
                            title: `Chat libre ${new Date().toLocaleDateString("es")}`,
                          }),
                        },
                      );
                      url.searchParams.set("chat", res.conversation.id);
                      history.replaceState(null, "", url);
                      setActiveChat(res.conversation.id);
                    } catch {
                      url.searchParams.delete("chat");
                      history.replaceState(null, "", url);
                      setActiveChat(null);
                    }
                    navigate("chat");
                    window.dispatchEvent(new Event("cubo-chat-selected"));
                    setDrawer(false);
                  }}
                >
                  <Icon name="chat" size={14} />
                  <div className="item-text">
                    <span className="item-title">Nuevo chat libre</span>
                    <span className="item-desc">Sin proyecto asignado</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="sidebar-new-dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    const el = document.getElementById(
                      "sidebar-new-menu-details",
                    ) as HTMLDetailsElement | null;
                    if (el) el.open = false;
                    if (mobile && navigationDialog.current?.open) navigationDialog.current.close();
                    openProjects(true);
                    setDrawer(false);
                  }}
                >
                  <Icon name="folder" size={14} />
                  <div className="item-text">
                    <span className="item-title">Nuevo proyecto</span>
                    <span className="item-desc">Crear o vincular repositorio</span>
                  </div>
                </button>
                <button
                  type="button"
                  className="sidebar-new-dropdown-item"
                  role="menuitem"
                  onClick={() => {
                    const el = document.getElementById(
                      "sidebar-new-menu-details",
                    ) as HTMLDetailsElement | null;
                    if (el) el.open = false;
                    if (mobile && navigationDialog.current?.open) navigationDialog.current.close();
                    const url = new URL(location.href);
                    url.searchParams.delete("chat");
                    const currentProj = url.searchParams.get("project");
                    if (!currentProj) {
                      openProjects(false);
                    } else {
                      history.replaceState(null, "", url);
                      setActiveChat(null);
                      navigate("chat");
                      window.dispatchEvent(new Event("cubo-chat-selected"));
                    }
                    setDrawer(false);
                  }}
                >
                  <Icon name="commit" size={14} />
                  <div className="item-text">
                    <span className="item-title">Nuevo chat de este proyecto</span>
                    <span className="item-desc">Con contexto de repositorio</span>
                  </div>
                </button>
              </div>
            </details>
          </div>
        </div>
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
          {recentChats.map((chat, index) => {
            const chatTask = w.tasks.find(
              (t) => t.input && "conversationId" in t.input && t.input.conversationId === chat.id,
            );
            return (
              <div key={chat.id}>
                {(index === 0 ||
                  chatGroup(recentChats[index - 1] as Conversation) !== chatGroup(chat)) && (
                  <span className="recent-group">{chatGroup(chat)}</span>
                )}
                <RecentChat
                  chat={chat}
                  active={view === "chat" && activeChat === chat.id}
                  executionStatus={chatTask?.status}
                  open={() => openChat(chat)}
                  removed={() => {
                    if (activeChat === chat.id) openProjects();
                  }}
                />
              </div>
            );
          })}
          {!recentChats.length && <p className="hint">Sin chats todavía</p>}
        </div>
        <div className="sidebar-system">
          <div className="sidebar-server-status single-line">
            <span className={`runner-led-pulse ${w.online ? "is-online" : "is-offline"}`} />
            <span className="server-status-text">
              SERVIDOR: {w.online ? "Listo · Cloudflare" : "Desconectado"}
            </span>
          </div>
          <button
            type="button"
            className="app-version-btn"
            onClick={() => setShowVersions(true)}
            title="Ver historial de versiones y novedades"
          >
            <Icon name="cube" size={13} />
            <span>Cubo v{import.meta.env.VITE_CUBO_VERSION ?? "2.2.0"}</span>
            <span className="version-pill">Novedades</span>
          </button>
          <PwaControls />
          <button type="button" className="sign-out" onClick={() => void w.logout()}>
            <Icon name="logout" size={15} />
            Cerrar sesión
          </button>
        </div>
      </Sidebar>
      <div className="workspace-main">
        <GlobalTopBar
          onOpenCommandPalette={() => setPaletteOpen(true)}
          onNewTask={() => setComposer(true)}
          onOpenMenu={() => setDrawer(true)}
          online={w.online}
        />
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
      <VersionHistoryDialog open={showVersions} onClose={() => setShowVersions(false)} />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(target) => navigate(target)}
        onNewTask={() => setComposer(true)}
        onNewProject={() => openProjects(true)}
        onNewChat={() => navigate("chat")}
        onShowVersions={() => setShowVersions(true)}
        onLogout={() => void w.logout()}
      />
    </AppShell>
  );
}
