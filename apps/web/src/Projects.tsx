import type { Conversation, StoredProject } from "@cubo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { RepositoryPanel } from "./RepositoryPanel";
import { EmptyState, PageHeader, ProjectRow, SectionCard, StatusBadge } from "./ui";
import { requestApi as api, time } from "./workspace";

function openChat(projectId: string, chatId: string) {
  const url = new URL(window.location.href);
  url.searchParams.set("project", projectId);
  url.searchParams.set("chat", chatId);
  url.hash = "/chat";
  window.location.href = url.toString();
  window.dispatchEvent(new Event("cubo-chat-selected"));
}
export function Projects() {
  const [projects, setProjects] = useState<StoredProject[]>([]);
  const [selected, setSelected] = useState(() =>
    new URL(location.href).searchParams.get("project"),
  );
  const [creating, setCreating] = useState(
    () => new URL(location.href).searchParams.get("new") === "project",
  );
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [name, setName] = useState("");
  const [repository, setRepository] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const key = useRef<string | null>(null);
  const newProjectName = useRef<HTMLInputElement>(null),
    renameName = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (creating) newProjectName.current?.focus();
  }, [creating]);
  useEffect(() => {
    if (renaming?.id) renameName.current?.focus();
  }, [renaming?.id]);
  const refreshGeneration = useRef(0);
  const refresh = useCallback(async () => {
    const generation = ++refreshGeneration.current;
    const result = await api<{ projects: StoredProject[] }>("projects");
    if (generation !== refreshGeneration.current) return;
    setProjects(result.projects);
    setLoaded(true);
  }, []);
  useEffect(() => {
    void refresh().catch(() => setError("No se pudieron cargar los proyectos."));
    return () => {
      refreshGeneration.current++;
    };
  }, [refresh]);
  useEffect(() => {
    const index = () => {
      setSelected(null);
      setCreating(new URL(location.href).searchParams.get("new") === "project");
      setError("");
    };
    window.addEventListener("cubo-projects-index", index);
    return () => window.removeEventListener("cubo-projects-index", index);
  }, []);
  function choose(id: string | null, panel?: string) {
    setSelected(id);
    setCreating(false);
    setError("");
    const url = new URL(location.href);
    if (id) url.searchParams.set("project", id);
    else url.searchParams.delete("project");
    url.searchParams.delete("chat");
    url.searchParams.delete("new");
    if (panel) url.searchParams.set("panel", panel);
    else url.searchParams.delete("panel");
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("cubo-conversations-changed"));
  }
  async function rename(project: StoredProject) {
    if (!renaming?.name.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await api(`projects/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({
          version: project.version,
          name: renaming.name,
          instructions: project.instructions,
          memory: project.memory,
        }),
      });
      setRenaming(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo renombrar el proyecto.");
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      key.current ??= crypto.randomUUID();
      const result = await api<{ project: StoredProject }>("projects", {
        method: "POST",
        headers: { "Idempotency-Key": key.current },
        body: JSON.stringify({ name, repository }),
      });
      await refresh();
      key.current = null;
      setName("");
      setRepository("");
      choose(result.project.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el proyecto.");
    } finally {
      setBusy(false);
    }
  }
  const project = projects.find((p) => p.id === selected);
  return (
    <div className="module">
      {error && (
        <div role="alert" className="inline-notice error">
          {error}
          <button
            className="secondary compact"
            type="button"
            onClick={() =>
              void refresh().catch(() => setError("No se pudieron cargar los proyectos."))
            }
          >
            Actualizar
          </button>
        </div>
      )}
      {project ? (
        <ProjectDetail
          key={project.id}
          project={project}
          refresh={refresh}
          back={() => choose(null)}
        />
      ) : (
        <>
          <PageHeader
            title="Proyectos"
            description="Repositorios, instrucciones y contexto aislado para tus agentes."
            actions={
              <button
                className="primary"
                type="button"
                disabled={busy}
                onClick={() => {
                  choose(null);
                  setCreating(true);
                }}
              >
                Nuevo proyecto
              </button>
            }
          />
          {selected && loaded && (
            <p role="status" className="hint">
              El proyecto seleccionado no está disponible.
            </p>
          )}
          {creating && (
            <SectionCard title="Nuevo proyecto">
              <form
                className="form-stack"
                onSubmit={(e) => {
                  e.preventDefault();
                  void create();
                }}
              >
                <div className="field-grid">
                  <label>
                    Nombre del proyecto
                    <input
                      ref={newProjectName}
                      required
                      maxLength={120}
                      value={name}
                      disabled={busy}
                      onChange={(e) => {
                        setName(e.target.value);
                        key.current = null;
                      }}
                    />
                  </label>
                  <label>
                    Repositorio de GitHub (opcional)
                    <input
                      type="url"
                      placeholder="https://github.com/owner/repo"
                      value={repository}
                      disabled={busy}
                      onChange={(e) => {
                        setRepository(e.target.value);
                        key.current = null;
                      }}
                    />
                  </label>
                </div>
                <p className="hint">
                  Después de crear el proyecto podrás importar una revisión. Si es privado, Cubo
                  generará una deploy key de lectura; no introducir claves aquí.
                </p>
                <div className="toolbar-actions">
                  <button className="primary" type="submit" disabled={busy || !name.trim()}>
                    {busy ? "Guardando…" : "Crear proyecto"}
                  </button>
                  <button
                    className="secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => setCreating(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </SectionCard>
          )}
          <section className="project-index" aria-labelledby="project-index-title">
            <div className="panel-heading">
              <h2 id="project-index-title">Tus proyectos</h2>
              <StatusBadge>{loaded ? projects.length : "Cargando…"}</StatusBadge>
            </div>
            {!loaded ? (
              <p className="hint">Cargando proyectos…</p>
            ) : !projects.length ? (
              <EmptyState
                title="Sin proyectos todavía"
                description="Crea un proyecto para guardar su contexto y abrir sus propios chats."
              />
            ) : (
              <div className="project-grid">
                {projects.map((p) => (
                  <article className="project-tile" key={p.id} aria-label={p.name}>
                    <div className="project-list-row">
                      <div>
                        {renaming?.id === p.id ? (
                          <form
                            className="form-stack"
                            onSubmit={(e) => {
                              e.preventDefault();
                              void rename(p);
                            }}
                          >
                            <label>
                              Nombre del proyecto
                              <input
                                ref={renameName}
                                required
                                maxLength={120}
                                value={renaming.name}
                                disabled={busy}
                                onChange={(e) => setRenaming({ id: p.id, name: e.target.value })}
                              />
                            </label>
                            <div className="toolbar-actions">
                              <button type="submit" className="secondary compact" disabled={busy}>
                                Guardar nombre
                              </button>
                              <button
                                type="button"
                                className="secondary compact"
                                onClick={() => setRenaming(null)}
                                disabled={busy}
                              >
                                Cancelar
                              </button>
                            </div>
                          </form>
                        ) : (
                          <button
                            className="task-title"
                            type="button"
                            disabled={busy}
                            onClick={() => choose(p.id)}
                          >
                            {p.name}
                          </button>
                        )}
                        <p className="hint">{p.repository ?? "Sin repositorio"}</p>
                      </div>
                      <div className="project-list-meta">
                        <span>
                          {p.chatCount} {p.chatCount === 1 ? "chat" : "chats"}
                        </span>
                        <button
                          className="secondary compact"
                          type="button"
                          aria-label={`Renombrar ${p.name}`}
                          disabled={busy}
                          onClick={() => setRenaming({ id: p.id, name: p.name })}
                        >
                          Renombrar
                        </button>
                        <button
                          className="secondary compact"
                          type="button"
                          disabled={busy}
                          onClick={() => choose(p.id, "edit")}
                        >
                          Editar
                        </button>
                        <button
                          className="secondary compact"
                          type="button"
                          disabled={busy}
                          onClick={() => choose(p.id)}
                        >
                          Abrir proyecto
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
function ProjectDetail({
  project,
  refresh,
  back,
}: {
  project: StoredProject;
  refresh: () => Promise<void>;
  back: () => void;
}) {
  useEffect(() => {
    const panel = new URL(location.href).searchParams.get("panel");
    if (panel === "provider" || panel === "edit")
      document
        .getElementById(
          panel === "provider" ? "project-provider-settings" : "project-manual-context",
        )
        ?.scrollIntoView({ block: "start" });
  }, []);
  const [name, setName] = useState(project.name);
  const [instructions, setInstructions] = useState(project.instructions);
  const [memory, setMemory] = useState(project.memory);
  const [chats, setChats] = useState<Conversation[]>([]);
  const [chatsLoaded, setChatsLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const chatKey = useRef<string | null>(null);
  useEffect(() => {
    setName(project.name);
    setInstructions(project.instructions);
    setMemory(project.memory);
  }, [project.name, project.instructions, project.memory]);
  useEffect(() => {
    let disposed = false;
    void api<{ conversations: Conversation[] }>(`conversations?project=${project.id}`)
      .then((r) => {
        if (!disposed) {
          setChats(r.conversations);
          setChatsLoaded(true);
        }
      })
      .catch(() => {
        if (!disposed) setError("No se pudieron cargar los chats del proyecto.");
      });
    return () => {
      disposed = true;
    };
  }, [project.id]);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`projects/${project.id}`, {
        method: "PUT",
        body: JSON.stringify({ version: project.version, name, instructions, memory }),
      });
      await refresh();
      setNotice("Contexto guardado en este proyecto.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el contexto.");
    } finally {
      setBusy(false);
    }
  }
  async function createChat() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      chatKey.current ??= crypto.randomUUID();
      const result = await api<{ conversation: Conversation }>(
        `conversations?project=${project.id}`,
        {
          method: "POST",
          headers: { "Idempotency-Key": chatKey.current },
          body: JSON.stringify({ title: "Nuevo chat" }),
        },
      );
      chatKey.current = null;
      openChat(project.id, result.conversation.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el chat.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      busy ||
      !confirm(`Eliminar el proyecto «${project.name}»? Solo es posible si no tiene chats.`)
    )
      return;
    setBusy(true);
    setError("");
    try {
      await api(`projects/${project.id}`, {
        method: "DELETE",
        body: JSON.stringify({ version: project.version }),
      });
      await refresh();
      back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar el proyecto.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <button className="back-link" type="button" disabled={busy} onClick={back}>
        Volver a Proyectos
      </button>
      <PageHeader
        title={project.name}
        description="Contexto propio del proyecto. Los chats conservan historiales independientes."
        actions={
          <button
            className="primary"
            type="button"
            disabled={busy || !chatsLoaded}
            onClick={() => (chats[0] ? openChat(project.id, chats[0].id) : void createChat())}
          >
            Abrir chat
          </button>
        }
      />
      {error && (
        <div className="inline-notice error" role="alert">
          {error}
          <button
            className="secondary compact"
            type="button"
            onClick={() =>
              void refresh().catch(() => setError("No se pudo actualizar el proyecto."))
            }
          >
            Actualizar proyecto
          </button>
        </div>
      )}
      {notice && (
        <p className="inline-notice" role="status">
          {notice}
        </p>
      )}
      <SectionCard title="Resumen del proyecto">
        <div className="project-summary">
          <div>
            <span>Repositorio</span>
            <strong>{project.repository ?? "Sin repositorio"}</strong>
          </div>
          <div>
            <span>Chats</span>
            <strong>{project.chatCount}</strong>
          </div>
          <div>
            <span>GitHub</span>
            <strong>Importación por revisión</strong>
          </div>
          <div>
            <span>Versión del contexto</span>
            <strong>{project.version}</strong>
          </div>
        </div>
      </SectionCard>
      <RepositoryPanel projectId={project.id} repository={project.repository} />
      <form
        id="project-manual-context"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <SectionCard title="Instrucciones adicionales">
          <label>
            Nombre del proyecto
            <input
              required
              value={name}
              maxLength={120}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            Instrucciones propias del proyecto
            <textarea
              value={instructions}
              rows={4}
              maxLength={3000}
              disabled={busy}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </label>
        </SectionCard>
        <SectionCard title="Memoria adicional">
          <p className="hint">
            Memoria funcional editable de este proyecto. Independiente de MEMORY.md y del contexto
            importado.
          </p>
          <label>
            Memoria del proyecto
            <textarea
              value={memory}
              rows={4}
              maxLength={3000}
              disabled={busy}
              onChange={(e) => setMemory(e.target.value)}
            />
          </label>
          <button className="secondary" type="submit" disabled={busy || !name.trim()}>
            Guardar contexto
          </button>
        </SectionCard>
      </form>
      <SectionCard
        title="Chats del proyecto"
        actions={
          <button
            className="secondary compact"
            type="button"
            disabled={busy}
            onClick={() => void createChat()}
          >
            Nuevo chat
          </button>
        }
      >
        {!chats.length ? (
          <EmptyState
            title="Sin chats todavía"
            description="Abrir chat crea una conversación aislada dentro de este proyecto."
          />
        ) : (
          chats.map((chat) => (
            <ProjectRow key={chat.id}>
              <div className="project-list-row">
                <button
                  className="task-title"
                  type="button"
                  disabled={busy}
                  onClick={() => openChat(project.id, chat.id)}
                >
                  {chat.pinned ? "Fijado · " : ""}
                  {chat.title}
                </button>
                <time dateTime={chat.updatedAt}>{time(chat.updatedAt)}</time>
              </div>
            </ProjectRow>
          ))
        )}
      </SectionCard>
      <SectionCard title="Herramientas y conexiones">
        <div className="project-capabilities">
          {["Skills", "APIs y MCPs", "Variables y secretos", "Tareas mediante agentes"].map(
            (label) => (
              <div key={label}>
                <span>{label}</span>
                <StatusBadge>Integración pendiente</StatusBadge>
              </div>
            ),
          )}
        </div>
      </SectionCard>
      <button
        className="secondary"
        type="button"
        disabled={busy || project.chatCount > 0}
        onClick={() => void remove()}
      >
        Eliminar proyecto vacío
      </button>
    </>
  );
}
