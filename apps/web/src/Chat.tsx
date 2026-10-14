import type {
  Conversation,
  ConversationDetail,
  ProjectProviderStatus,
  StoredProject,
} from "@cubo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { ChatComposer } from "./ui";
import { requestApi, time } from "./workspace";

function api<T>(path: string, init?: RequestInit): Promise<T> {
  const project = new URL(window.location.href).searchParams.get("project");
  return requestApi<T>(project ? `${path}?project=${encodeURIComponent(project)}` : path, init);
}

function selectedChat() {
  return new URL(window.location.href).searchParams.get("chat") ?? "";
}
export function Chat() {
  const [selected, setSelected] = useState(selectedChat);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [title, setTitle] = useState("");
  const [config, setConfig] = useState(false);
  const projectId = new URL(window.location.href).searchParams.get("project");
  const [projectName, setProjectName] = useState("");
  const [provider, setProvider] = useState<{
    projectId: string;
    status: ProjectProviderStatus;
  } | null>(null);
  const [model, setModel] = useState("");
  useEffect(() => {
    let disposed = false;
    setProvider(null);
    setModel("");
    if (projectId)
      void requestApi<ProjectProviderStatus>(`projects/${projectId}/providers/openrouter`)
        .then((status) => {
          if (!disposed) setProvider({ projectId, status });
        })
        .catch(() => {
          if (!disposed) setProvider(null);
        });
    return () => {
      disposed = true;
    };
  }, [projectId]);
  const configured = provider?.projectId === projectId && provider.status.configured;
  const models = provider?.projectId === projectId ? provider.status.models : [];
  const ready = Boolean(
    configured && !provider?.status.blockedReason && models.some((m) => m.id === model),
  );
  const turn = detail?.turns?.find((t) => t.status === "QUEUED" || t.status === "RUNNING");
  const lastTurn = detail?.turns?.[0];
  useEffect(() => {
    if (!selected) {
      setModel("");
      return;
    }
    const previous = detail?.turns?.[0]?.model;
    setModel(previous ?? models[0]?.id ?? "");
  }, [selected, detail?.turns?.[0]?.model, models[0]?.id]);
  useEffect(() => {
    let disposed = false;
    setProjectName("");
    if (projectId)
      void requestApi<{ project: StoredProject }>(`projects/${projectId}`)
        .then((result) => {
          if (!disposed) setProjectName(result.project.name);
        })
        .catch(() => {
          if (!disposed) setProjectName("Proyecto no disponible");
        });
    return () => {
      disposed = true;
    };
  }, [projectId]);
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
  const pendingMessage = useRef<{
    id: string;
    chat: string;
    content: string;
    model?: string;
  } | null>(null);
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
    if (!projectId) {
      window.location.hash = "/proyectos";
      return;
    }
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
    });
  }
  async function saveMessage() {
    const content = draft.trim(),
      id = active.current;
    if (!content || !id || turn) return;
    if (configured && !ready) {
      setError("No hay un modelo gratuito verificado disponible.");
      return;
    }
    await action(async () => {
      if (
        !pendingMessage.current ||
        pendingMessage.current.chat !== id ||
        pendingMessage.current.content !== content ||
        pendingMessage.current.model !== (configured ? model : undefined)
      ) {
        pendingMessage.current = {
          id: crypto.randomUUID(),
          chat: id,
          content,
          ...(configured ? { model } : {}),
        };
      }
      const saved = await api<ConversationDetail>(
        `conversations/${id}/${configured ? "turn" : "messages"}`,
        {
          method: "POST",
          headers: { "Idempotency-Key": pendingMessage.current.id },
          body: JSON.stringify({ content, ...(configured ? { model } : {}) }),
        },
      );
      pendingMessage.current = null;
      if (active.current === id) {
        if (!configured) setDetail(saved);
        setDraft("");
        setNotice(
          configured
            ? "Turno guardado en Cubo. Puedes cerrar el cliente; la ejecución es remota."
            : "Mensaje guardado. Configura OpenRouter en el proyecto para obtener respuestas.",
        );
      }
    });
  }
  async function stop() {
    if (!turn) return;
    await action(async () => {
      const result = await requestApi<{ task: { status: string; error: string | null } }>(
        `tasks/${turn.taskId}/cancel`,
        { method: "POST", body: "{}" },
      );
      setNotice(
        result.task.status === "CANCELLED"
          ? "Cancelación confirmada."
          : result.task.error === "CANCELLATION_REQUESTED"
            ? "Cancelación solicitada. Esperando confirmación del runner."
            : "El turno ya había terminado.",
      );
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
    const text = `# ${detail.conversation.title}\n\n${detail.messages.map((m) => `## ${m.role === "assistant" ? "Asistente" : "Usuario"} · ${m.createdAt}\n\n${m.content}`).join("\n\n")}`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cubo-chat-${detail.conversation.id}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="persistent-chat">
      <div className={`chat-layout ${config ? "with-config" : ""}`}>
        <section className="chat-main">
          <div className="chat-toolbar">
            <div>
              <span className="tag model-status">
                <Icon name="cube" size={13} />
                {configured ? "OpenRouter · API de texto" : "Sin modelo conectado"}
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
                {projectId ? "Nuevo chat" : "Abrir proyectos"}
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
          {provider?.status.blockedReason && (
            <p className="workspace-alert error" role="alert">
              OpenRouter detenido para este proyecto por coste inesperado. Requiere revisión antes
              de continuar.
            </p>
          )}
          <div ref={conversationPane} className="conversation persistent-messages">
            {!detail ? (
              <div className="conversation-empty">
                <Icon name="chat" size={26} />
                <h2>{projectName || "Elige un proyecto"}</h2>
                <p>
                  {projectId
                    ? "Abre una conversación de este proyecto desde la barra lateral."
                    : "Los chats se abren desde cada proyecto o desde Recientes."}{" "}
                </p>
                <button
                  className="primary"
                  type="button"
                  disabled={busy}
                  onClick={() => void create()}
                >
                  {projectId ? "Nuevo chat" : "Abrir proyectos"}
                </button>
              </div>
            ) : (
              <>
                <div className="conversation-context">
                  <div>
                    <Icon name="chat" size={15} />
                    <strong>{projectName || "Chat"}</strong>
                    <span>
                      {detail.messages.length}{" "}
                      {detail.messages.length === 1 ? "mensaje" : "mensajes"}
                    </span>
                  </div>
                  <span className="tag pending">
                    {configured ? "Sin herramientas" : "Proveedor pendiente"}
                  </span>
                </div>
                {!configured && projectId && (
                  <p className="conversation-capability">
                    <a
                      className="back-link"
                      href={`?project=${projectId}&panel=provider#/proyectos`}
                    >
                      Conectar OpenRouter
                    </a>{" "}
                    para obtener respuestas remotas.
                  </p>
                )}
                {!detail.messages.length && (
                  <p className="muted">
                    Aún no hay mensajes. Guarda el primero para conservar su contexto.
                  </p>
                )}
                <ol className="chat-message-list">
                  {detail.messages.map((m) => (
                    <li
                      key={m.id}
                      className={m.role === "assistant" ? "assistant-message" : undefined}
                    >
                      <div>
                        <strong>{m.role === "assistant" ? "Asistente" : "Tú"}</strong>
                        <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
                        <span className="tag">Guardado</span>
                      </div>
                      <p>{m.content}</p>
                      {m.role === "assistant" &&
                        detail.turns?.find((t) => t.result?.messageId === m.id)?.result &&
                        (() => {
                          const usage = detail.turns?.find(
                            (t) => t.result?.messageId === m.id,
                          )?.result;
                          return (
                            <p className="hint">
                              {usage?.model} · entrada {usage?.inputTokens ?? "unavailable"} ·
                              salida {usage?.outputTokens ?? "unavailable"} tokens · USD{" "}
                              {usage?.costUsd} ({usage?.costQuality})
                              {usage?.finishReason === "length"
                                ? " · salida alcanzó el límite de tokens"
                                : ""}
                            </p>
                          );
                        })()}
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
                {turn && (
                  <div className="turn-state" role="status">
                    <span>
                      {turn.error === "CANCELLATION_REQUESTED"
                        ? "Cancelación pendiente de confirmar"
                        : turn.status === "QUEUED"
                          ? "En cola"
                          : "Solicitud al modelo en ejecución"}{" "}
                      · {turn.model}
                    </span>
                    <button
                      className="secondary compact"
                      type="button"
                      disabled={busy}
                      onClick={() => void stop()}
                    >
                      {turn.error === "CANCELLATION_REQUESTED"
                        ? "Comprobar cancelación"
                        : "Detener"}
                    </button>
                  </div>
                )}
                {lastTurn?.status === "FAILED" && (
                  <p className="inline-notice error" role="alert">
                    El último turno falló: {lastTurn.error ?? "Error de ejecución"}. No se usó un
                    modelo de pago.
                  </p>
                )}
                {lastTurn?.status === "CANCELLED" && (
                  <p className="turn-state" role="status">
                    Último turno cancelado.
                    <a className="back-link" href={`#/tareas/${lastTurn.taskId}`}>
                      Ver proceso
                    </a>
                  </p>
                )}
              </>
            )}
          </div>
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSave={() => void saveMessage()}
            disabled={!detail || Boolean(turn) || (Boolean(configured) && !ready)}
            busy={busy}
            submitLabel={configured ? "Enviar" : "Guardar"}
            controls={
              projectId ? (
                <label className="chat-model-picker">
                  Modelo
                  <select
                    aria-label="Modelo de OpenRouter"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    disabled={!configured || busy || Boolean(turn)}
                  >
                    {!models.length && <option value="">Sin modelo conectado</option>}
                    {model && !models.some((m) => m.id === model) && (
                      <option value={model}>Modelo anterior no disponible</option>
                    )}
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : undefined
            }
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
                disabled={!detail || busy || Boolean(turn)}
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
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={!configured || busy || Boolean(turn)}
                >
                  {!models.length && <option value="">Sin conexión</option>}
                  {model && !models.some((m) => m.id === model) && (
                    <option value={model}>Modelo anterior no disponible</option>
                  )}
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      OpenRouter · {m.name}
                    </option>
                  ))}
                </select>
              </label>
              {projectId && (
                <a className="back-link" href={`?project=${projectId}&panel=provider#/proyectos`}>
                  Configurar OpenRouter en el proyecto
                </a>
              )}
              <label>
                Nivel de esfuerzo
                <select disabled>
                  <option>No disponible</option>
                </select>
              </label>
              <label>
                Proyecto
                <input
                  readOnly
                  value={
                    projectId
                      ? projectName || "Cargando proyecto…"
                      : "Sin proyecto (conversación existente)"
                  }
                />
              </label>
              <p className="hint">
                {lastTurn?.result
                  ? `Último turno: ${lastTurn.result.inputTokens ?? "unavailable"} tokens de entrada, ${lastTurn.result.outputTokens ?? "unavailable"} de salida; USD ${lastTurn.result.costUsd} (${lastTurn.result.costQuality}).`
                  : "Uso y coste: unavailable hasta recibir una respuesta del proveedor."}{" "}
                No hay sesión de agente ni herramientas habilitadas.
              </p>
            </div>
          </Configuration>
        )}
      </div>
    </div>
  );
}
