import type { Conversation, ConversationDetail } from "@cubo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ChatComposer } from "./ui";
import { requestApi as api, time } from "./workspace";

function selectedChat() {
  return new URL(window.location.href).searchParams.get("chat") ?? "";
}
export function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState(selectedChat);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [config, setConfig] = useState(false);
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  const configDialog = useRef<HTMLDialogElement>(null);
  const Configuration = mobile ? "dialog" : "aside";
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const change = () => setMobile(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (mobile && config && configDialog.current && !configDialog.current.open) {
      configDialog.current.showModal();
    }
  }, [mobile, config]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [notice, setNotice] = useState("");
  const request = useRef(0);
  const active = useRef(selected);
  const locked = useRef(false);
  const createKey = useRef<string | null>(null);
  const pendingMessage = useRef<{ id: string; chat: string; content: string } | null>(null);
  const historyDialog = useRef<HTMLDialogElement>(null);
  const actionsMenu = useRef<HTMLDetailsElement>(null);
  const conversationPane = useRef<HTMLDivElement>(null);
  const lastMessage = detail?.messages.at(-1)?.id;
  useEffect(() => {
    if (lastMessage)
      conversationPane.current?.scrollTo({ top: conversationPane.current.scrollHeight });
  }, [lastMessage]);
  const detailRef = useRef(detail);
  detailRef.current = detail;
  const refresh = useCallback(async () => {
    const generation = ++request.current;
    const id = active.current;
    const list = await api<{ conversations: Conversation[] }>("conversations");
    const next =
      id && list.conversations.some((c) => c.id === id)
        ? await api<ConversationDetail>(`conversations/${id}`)
        : null;
    if (generation !== request.current || id !== active.current) return;
    setConversations(list.conversations);
    setDetail(next);
    setSyncError("");
    if (id && !next) {
      active.current = "";
      setSelected("");
    }
  }, []);
  useEffect(() => {
    const select = () => {
      const id = selectedChat();
      if (id !== active.current) {
        active.current = id;
        setSelected(id);
        setDetail(null);
        setDraft("");
        setError("");
      }
      void refresh().catch(() => setSyncError("No se pudo cargar la conversación."));
    };
    window.addEventListener("cubo-chat-selected", select);
    return () => window.removeEventListener("cubo-chat-selected", select);
  }, [refresh]);
  useEffect(() => {
    void refresh().catch(() =>
      setSyncError("No se pudo sincronizar Chat. Actualiza o vuelve a iniciar sesión."),
    );
    const interval = setInterval(() => {
      if (!locked.current)
        void refresh().catch(() =>
          setSyncError("Sin sincronizar. Los mensajes confirmados permanecen en Cubo."),
        );
    }, 8000);
    return () => {
      clearInterval(interval);
      request.current++;
    };
  }, [refresh]);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected) url.searchParams.set("chat", selected);
    else url.searchParams.delete("chat");
    history.replaceState(null, "", url);
    window.dispatchEvent(new Event("cubo-conversations-changed"));
  }, [selected]);
  useEffect(() => {
    setTitle(detail?.conversation.title ?? "");
  }, [detail?.conversation.title]);
  function choose(id: string) {
    if (active.current !== id) {
      active.current = id;
      setSelected(id);
      setDetail(null);
      setDraft("");
      setError("");
      setNotice("");
    }
    historyDialog.current?.close();
    void refresh().catch(() => setSyncError("No se pudo cargar la conversación."));
  }
  async function action(operation: () => Promise<void>) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    request.current++;
    try {
      await operation();
      await refresh();
      window.dispatchEvent(new Event("cubo-conversations-changed"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No fue posible guardar el cambio.");
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function create() {
    await action(async () => {
      createKey.current ??= crypto.randomUUID();
      const result = await api<{ conversation: Conversation }>("conversations", {
        method: "POST",
        headers: { "Idempotency-Key": createKey.current },
        body: JSON.stringify({ title: "Nuevo chat" }),
      });
      createKey.current = null;
      active.current = result.conversation.id;
      setSelected(result.conversation.id);
      setDetail(null);
      setDraft("");
      historyDialog.current?.close();
    });
  }
  async function saveMessage() {
    const content = draft.trim(),
      id = active.current;
    if (!content || !id) return;
    await action(async () => {
      if (
        !pendingMessage.current ||
        pendingMessage.current.chat !== id ||
        pendingMessage.current.content !== content
      ) {
        pendingMessage.current = { id: crypto.randomUUID(), chat: id, content };
      }
      const saved = await api<ConversationDetail>(`conversations/${id}/messages`, {
        method: "POST",
        headers: { "Idempotency-Key": pendingMessage.current.id },
        body: JSON.stringify({ content }),
      });
      pendingMessage.current = null;
      if (active.current === id) {
        setDetail(saved);
        setDraft("");
        setNotice("Mensaje guardado en Cubo. No se ha ejecutado ningún agente.");
      }
    });
  }
  async function update(pinned: boolean, rename = false) {
    const conversation = detailRef.current?.conversation;
    if (!conversation) return;
    await action(async () => {
      await api(`conversations/${conversation.id}`, {
        method: "PUT",
        body: JSON.stringify({
          title: rename ? title.trim() : conversation.title,
          pinned,
          version: conversation.version,
        }),
      });
    });
  }
  async function remove() {
    const conversation = detailRef.current?.conversation;
    if (
      !conversation ||
      !window.confirm(
        `Eliminar «${conversation.title}» y todos sus mensajes guardados? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await action(async () => {
      await api(`conversations/${conversation.id}`, {
        method: "DELETE",
        body: JSON.stringify({ version: conversation.version }),
      });
      active.current = "";
      setSelected("");
      setDetail(null);
      setDraft("");
    });
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Mensaje copiado.");
    } catch {
      setError("El navegador no permite copiar. Selecciona el texto para copiarlo manualmente.");
    }
  }
  function exportConversation() {
    if (!detail) return;
    const text = `# ${detail.conversation.title}\n\n${detail.messages.map((m) => `## Usuario · ${m.createdAt}\n\n${m.content}`).join("\n\n")}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cubo-chat-${detail.conversation.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const historyList = (
    <>
      <div className="panel-heading">
        <strong>Conversaciones</strong>
        <button
          type="button"
          className="secondary compact"
          disabled={busy}
          onClick={() => void create()}
        >
          Nuevo chat
        </button>
      </div>
      <div className="chat-history-items">
        {conversations.map((c) => (
          <button
            key={c.id}
            type="button"
            className={selected === c.id ? "active" : ""}
            disabled={busy}
            onClick={() => choose(c.id)}
          >
            <strong>
              {c.pinned ? "Fijado · " : ""}
              {c.title}
            </strong>
            <small>{time(c.updatedAt)}</small>
          </button>
        ))}
        {!conversations.length && <p className="hint">Aún no hay conversaciones guardadas.</p>}
      </div>
    </>
  );
  return (
    <div className="persistent-chat">
      <div className={`chat-layout ${config ? "with-config" : ""}`}>
        <section className="chat-main">
          <div className="chat-toolbar">
            <div>
              <span className="tag model-status">
                <Icon name="cube" size={13} />
                Sin modelo conectado
              </span>
              <h1>{detail?.conversation.title ?? "Chat"}</h1>
            </div>
            <div className="toolbar-actions">
              <button
                className="secondary compact"
                type="button"
                disabled={busy}
                onClick={() => void create()}
              >
                Nuevo chat
              </button>
              <button
                className="secondary compact chat-history-toggle"
                type="button"
                onClick={() => historyDialog.current?.showModal()}
              >
                Historial
              </button>
              <button
                className="secondary compact"
                type="button"
                disabled={!detail || busy}
                onClick={exportConversation}
              >
                Exportar
              </button>
              <button
                type="button"
                aria-expanded={config}
                className={config ? "secondary compact active" : "secondary compact"}
                onClick={() => setConfig(!config)}
              >
                Configuración
              </button>
              <details
                className="chat-actions-menu"
                ref={actionsMenu}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.currentTarget.open = false;
                    event.currentTarget.querySelector("summary")?.focus();
                  }
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                    event.currentTarget.open = false;
                }}
              >
                <summary aria-label="Acciones del chat" title="Acciones del chat">
                  <Icon name="more" />
                </summary>
                <div className="chat-actions-list">
                  <button
                    type="button"
                    disabled={!detail || busy}
                    onClick={() => {
                      if (actionsMenu.current) actionsMenu.current.open = false;
                      setConfig(true);
                    }}
                  >
                    Renombrar chat
                  </button>
                  <button
                    type="button"
                    disabled={!detail || busy}
                    onClick={() => {
                      if (actionsMenu.current) actionsMenu.current.open = false;
                      void update(!detail?.conversation.pinned);
                    }}
                  >
                    {detail?.conversation.pinned ? "Desfijar chat" : "Fijar chat"}
                  </button>
                  <button
                    type="button"
                    className="chat-delete-action"
                    disabled={!detail || busy}
                    onClick={() => {
                      if (actionsMenu.current) actionsMenu.current.open = false;
                      void remove();
                    }}
                  >
                    Eliminar conversación
                  </button>
                </div>
              </details>
            </div>
          </div>
          {(error || syncError) && (
            <div className="workspace-alert error" role="alert">
              {error || syncError}
              <button
                className="secondary compact"
                type="button"
                disabled={busy}
                onClick={() =>
                  void refresh().catch(() => setSyncError("No se pudo sincronizar Chat."))
                }
              >
                Actualizar
              </button>
            </div>
          )}
          {notice && (
            <div className="workspace-alert" role="status">
              {notice}
            </div>
          )}
          <div ref={conversationPane} className="conversation persistent-messages">
            {!detail ? (
              <div className="conversation-empty">
                <Icon name="chat" size={26} />
                <h2>Conversaciones persistentes</h2>
                <p>
                  Crea un chat o abre su historial. Los mensajes confirmados se recuperan desde
                  Cubo.
                </p>
                <button
                  className="primary"
                  type="button"
                  disabled={busy}
                  onClick={() => void create()}
                >
                  Nuevo chat
                </button>
              </div>
            ) : (
              <>
                <div className="conversation-context">
                  <div>
                    <Icon name="chat" size={15} />
                    <strong>Conversación persistente</strong>
                    <span>{detail.messages.length} mensajes guardados</span>
                  </div>
                  <span className="tag pending">Agentes pendientes</span>
                </div>
                <p className="conversation-capability">
                  Contexto guardado en Cubo. Respuestas y acciones de agentes todavía no
                  disponibles.
                </p>
                {!detail.messages.length && (
                  <p className="muted">
                    Aún no hay mensajes. Guarda el primero para conservar su contexto.
                  </p>
                )}
                <ol className="chat-message-list">
                  {detail.messages.map((m) => (
                    <li key={m.id}>
                      <div>
                        <strong>Tú</strong>
                        <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
                        <span className="tag">Guardado</span>
                      </div>
                      <p>{m.content}</p>
                      <button
                        type="button"
                        className="secondary compact"
                        onClick={() => void copy(m.content)}
                      >
                        Copiar
                      </button>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </div>
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSave={() => void saveMessage()}
            disabled={!detail}
            busy={busy}
          />
        </section>
        {config && (
          <Configuration
            ref={configDialog}
            className="config-panel"
            aria-label="Configuración del chat"
            onCancel={() => setConfig(false)}
            onClose={() => setConfig(false)}
          >
            <div className="panel-heading">
              <strong>Configuración del chat</strong>
              <button
                className="icon-button"
                type="button"
                aria-label="Cerrar configuración"
                onClick={() => setConfig(false)}
              >
                <Icon name="close" />
              </button>
            </div>
            <div className="form-stack">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void update(detail?.conversation.pinned ?? false, true);
                }}
              >
                <label>
                  Nombre del chat
                  <input
                    maxLength={120}
                    value={title}
                    disabled={!detail || busy}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <button
                  className="secondary"
                  type="submit"
                  disabled={!detail || busy || !title.trim()}
                >
                  Guardar nombre
                </button>
              </form>
              <button
                className="secondary"
                type="button"
                disabled={!detail || busy || !title.trim()}
                onClick={() => void update(!detail?.conversation.pinned)}
              >
                {detail?.conversation.pinned ? "Desfijar chat" : "Fijar chat"}
              </button>
              <button
                className="secondary"
                type="button"
                disabled={!detail || busy}
                onClick={() => void remove()}
              >
                Eliminar conversación
              </button>
              <label>
                Agente
                <select disabled>
                  <option>Integración pendiente</option>
                  <option>Codex</option>
                  <option>OpenCode</option>
                </select>
              </label>
              <label>
                Proveedor / modelo
                <select disabled>
                  <option>Sin conexión</option>
                </select>
              </label>
              <label>
                Nivel de esfuerzo
                <select disabled>
                  <option>No disponible</option>
                </select>
              </label>
              <label>
                Proyecto
                <select disabled>
                  <option>Proyectos pendientes</option>
                </select>
              </label>
              <p className="hint">
                Uso y coste: unavailable. Contexto persistido: solo mensajes del usuario; todavía no
                hay sesión de agente.
              </p>
            </div>
          </Configuration>
        )}
      </div>
      <dialog
        ref={historyDialog}
        className="chat-history-dialog"
        aria-label="Historial de conversaciones"
      >
        <button
          className="icon-button"
          type="button"
          aria-label="Cerrar historial"
          onClick={() => historyDialog.current?.close()}
        >
          <Icon name="close" />
        </button>
        {historyList}
      </dialog>
    </div>
  );
}
