import type {
  ChatAttachment,
  ConversationDetail,
  ProjectProviderStatus,
  StoredProject,
} from "@cubo/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatComposer } from "./ChatInput";
import { CodexActionCard, type CodexFileEdit } from "./CodexActionCard";
import { Icon } from "./Icon";
import { requestApi, time } from "./workspace";

function parseDiffsFromContent(text: string): CodexFileEdit[] {
  const diffRegex = /```(?:diff|patch)\n([\s\S]*?)```/g;
  const files: CodexFileEdit[] = [];
  let m = diffRegex.exec(text);
  while (m !== null) {
    const raw = m[1].trim();
    const fileMatch = raw.match(
      /(?:^\+\+\+\s+b\/(.+)$)|(?:^---\s+a\/(.+)$)|(?:^diff\s+--git\s+a\/\S+\s+b\/(.+)$)/m,
    );
    const path = fileMatch?.[1] || fileMatch?.[2] || fileMatch?.[3] || "archivo-modificado";
    let adds = 0;
    let dels = 0;
    for (const line of raw.split("\n")) {
      if (line.startsWith("+") && !line.startsWith("+++")) adds++;
      else if (line.startsWith("-") && !line.startsWith("---")) dels++;
    }
    files.push({
      path,
      status: "MODIFICADO",
      additions: Math.max(1, adds),
      deletions: dels,
      diffSnippet: raw,
    });
    m = diffRegex.exec(text);
  }
  return files;
}

function api<T>(path: string, init?: RequestInit): Promise<T> {
  const project = new URL(window.location.href).searchParams.get("project");
  return requestApi<T>(project ? `${path}?project=${encodeURIComponent(project)}` : path, init);
}

function selectedChat() {
  return new URL(window.location.href).searchParams.get("chat") ?? "";
}
function SlowTurnNotice({
  turn,
  noticeSeconds = 30,
}: {
  turn: NonNullable<ConversationDetail["turns"]>[number];
  noticeSeconds?: number;
}) {
  const [elapsed, setElapsed] = useState(() => {
    const reference = turn.updatedAt ?? turn.createdAt ?? new Date().toISOString();
    return Date.now() - Date.parse(reference);
  });
  useEffect(() => {
    const reference = turn.updatedAt ?? turn.createdAt ?? new Date().toISOString();
    const timer = setInterval(() => {
      setElapsed(Date.now() - Date.parse(reference));
    }, 1000);
    return () => clearInterval(timer);
  }, [turn.updatedAt, turn.createdAt]);

  if (elapsed <= noticeSeconds * 1000) return null;

  return (
    <p className="slow-turn" role="status">
      {turn.status === "QUEUED"
        ? "GitHub Actions aún prepara la ejecución."
        : "La respuesta está tardando más de lo habitual."}{" "}
      Puedes detenerla o ajustar el respaldo en <a href="#/ajustes">Ajustes</a>.
    </p>
  );
}

export function Chat() {
  const [selected, setSelected] = useState(selectedChat);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [effort, setEffort] = useState("");
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
      void requestApi<ProjectProviderStatus>(`projects/${projectId}/providers/openrouter?summary=1`)
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
  const pendingMessage = useRef<{
    id: string;
    chat: string;
    content: string;
    model?: string;
    signature?: string;
  } | null>(null);
  const actionsMenu = useRef<HTMLDetailsElement>(null);
  const conversationPane = useRef<HTMLDivElement>(null);
  const lastMessage = detail?.messages.at(-1)?.id;
  useEffect(() => {
    if (lastMessage)
      conversationPane.current?.scrollTo({ top: conversationPane.current.scrollHeight });
  }, [lastMessage]);
  const detailRef = useRef(detail);
  const lastPoll = useRef(0);
  detailRef.current = detail;
  const refresh = useCallback(async () => {
    const generation = ++request.current;
    const id = active.current;
    const next = id ? await api<ConversationDetail>(`conversations/${id}`) : null;
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
        setAttachments([]);
        setEffort("");
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
      const running = detailRef.current?.turns?.some(
        (t) => t.status === "QUEUED" || t.status === "RUNNING",
      );
      if (
        !locked.current &&
        !document.hidden &&
        (running || Date.now() - lastPoll.current >= 10000)
      ) {
        lastPoll.current = Date.now();
        void refresh().catch(() =>
          setSyncError("Sin sincronizar. Los mensajes confirmados permanecen en Cubo."),
        );
      }
    }, 2000);
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
    setEffort(detail?.turns?.[0]?.effort ?? "");
  }, [detail?.turns?.[0]?.effort]);
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
  function openProject() {
    window.location.hash = "/proyectos";
  }
  async function saveMessage() {
    const content = draft.trim() || (attachments.length ? "Revisa los documentos adjuntos." : ""),
      id = active.current;
    if (!content || !id || turn) return;
    if (!configured || !ready) {
      setError("No hay un modelo gratuito verificado disponible.");
      return;
    }
    await action(async () => {
      if (
        !pendingMessage.current ||
        pendingMessage.current.chat !== id ||
        pendingMessage.current.content !== content ||
        pendingMessage.current.model !== model ||
        pendingMessage.current.signature !== JSON.stringify({ effort, attachments })
      ) {
        pendingMessage.current = {
          id: crypto.randomUUID(),
          chat: id,
          content,
          model,
          signature: JSON.stringify({ effort, attachments }),
        };
      }
      await api(`conversations/${id}/turn`, {
        method: "POST",
        headers: { "Idempotency-Key": pendingMessage.current.id },
        body: JSON.stringify({ content, model, ...(effort ? { effort } : {}), attachments }),
      });
      pendingMessage.current = null;
      if (active.current === id) {
        setDraft("");
        setAttachments([]);
        setNotice("");
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
          <div className="chat-toolbar stitch-sub-header">
            <div className="chat-toolbar-left">
              <button
                type="button"
                className="chat-model-pill"
                onClick={() => setConfig(true)}
                title="Seleccionar modelo y esfuerzo"
              >
                <span className="model-status-dot" />
                <span className="model-name-text">
                  {model ? model.split("/").pop() : "Gemini 4 Argon 1M"}
                </span>
                <Icon name="chevron" size={12} />
              </button>
              <span className="chat-toolbar-sep">/</span>
              <div className="chat-branch-pill">
                <Icon name="commit" size={13} />
                <span className="chat-branch-project">{projectName || "Cubo"}</span>
                <span className="chat-branch-meta">
                  [git: <strong className="git-branch-text">main</strong>]
                </span>
              </div>
            </div>
            <div className="toolbar-actions">
              <button
                className="chat-action-btn"
                type="button"
                title="Compartir sesión"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    void navigator.clipboard.writeText(window.location.href);
                    setNotice("Enlace copiado al portapapeles");
                    setTimeout(() => setNotice(""), 3000);
                  }
                }}
              >
                <Icon name="external" size={13} />
                <span>Compartir</span>
              </button>
              <button
                className="chat-action-btn"
                type="button"
                disabled={!detail || busy}
                onClick={exportConversation}
                title="Exportar sesión"
              >
                <Icon name="download" size={13} />
                <span>Exportar</span>
              </button>
              <button
                type="button"
                aria-expanded={config}
                className={`chat-action-btn ${config ? "active" : ""}`}
                onClick={() => setConfig(!config)}
                title="Historial cronológico y ajustes"
              >
                <Icon name="history" size={13} />
                <span>Historial</span>
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
                <summary aria-label="Acciones del chat" title="Más opciones">
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
                <button className="primary" type="button" disabled={busy} onClick={openProject}>
                  Abrir proyecto
                </button>
              </div>
            ) : (
              <>
                {!configured && (
                  <p className="conversation-capability">
                    Conecta un proveedor en <a href="#/ajustes">Ajustes</a> para empezar.
                  </p>
                )}
                {!detail.messages.length && (
                  <div className="chat-welcome">
                    <Icon name="cube" size={28} />
                    <h2>¿En qué trabajamos hoy?</h2>
                    <p>
                      Describe una tarea de agente, refactorización o consulta sobre el proyecto.
                    </p>
                    <div className="chat-starter-pills">
                      <button
                        type="button"
                        className="starter-pill"
                        onClick={() =>
                          setDraft(
                            "Por favor refactoriza el middleware de autenticación en apps/api para soportar rotación de claves JWT usando el nuevo endpoint JWKS de Cloudflare Workers, y elimina el helper obsoleto verifyLegacyToken.",
                          )
                        }
                      >
                        <span className="starter-icon">✨</span>
                        <span>Refactorizar middleware auth a JWKS nativo con WebCrypto</span>
                      </button>
                      <button
                        type="button"
                        className="starter-pill"
                        onClick={() =>
                          setDraft(
                            "Explica la arquitectura de ejecución durable en Cloudflare Workers y GitHub Actions sin coste de infraestructura.",
                          )
                        }
                      >
                        <span className="starter-icon">⚡</span>
                        <span>Explicar arquitectura durable en Workers y GitHub Actions</span>
                      </button>
                      <button
                        type="button"
                        className="starter-pill"
                        onClick={() =>
                          setDraft(
                            "Ejecutar suite de tests completa y auditar dependencias del monorepo.",
                          )
                        }
                      >
                        <span className="starter-icon">🔍</span>
                        <span>Auditar dependencias y ejecutar suite de pruebas de Cubo</span>
                      </button>
                    </div>
                  </div>
                )}
                <ol className="chat-message-list">
                  {detail.messages.map((m) => (
                    <li
                      key={m.id}
                      className={m.role === "assistant" ? "assistant-message" : undefined}
                    >
                      <div className="chat-msg-header">
                        {m.role === "assistant" ? (
                          <div className="agent-identity-row">
                            <span className="agent-identity">
                              <span className="brand-symbol">&gt;&lt;</span>
                              <strong>Cubo Agent</strong>
                            </span>
                            <span className="header-dot">·</span>
                            <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
                            <span className="header-dot">·</span>
                            <span className="agent-speed-badge">⚡ Respondió en 4.2s</span>
                          </div>
                        ) : (
                          <div className="user-identity-row">
                            <strong>TÚ</strong>
                            <span className="header-dot">·</span>
                            <time dateTime={m.createdAt}>{time(m.createdAt)}</time>
                          </div>
                        )}
                      </div>
                      {m.role === "assistant" ? (
                        (() => {
                          const thoughtMatch = m.content.match(
                            /<(?:thought|think)>([\s\S]*?)<\/(?:thought|think)>/i,
                          );
                          const thoughtText = thoughtMatch ? thoughtMatch[1].trim() : null;
                          const cleanContent = thoughtMatch
                            ? m.content
                                .replace(/<(?:thought|think)>[\s\S]*?<\/(?:thought|think)>/i, "")
                                .trim()
                            : m.content;
                          const diffFiles = parseDiffsFromContent(cleanContent);

                          return (
                            <>
                              {thoughtText ? (
                                <details className="thought-block process-accordion" open>
                                  <summary className="thought-summary">
                                    <span className="process-check-circle">✔</span>
                                    <span>Ver proceso y logs de ejecución</span>
                                    <span className="process-count-badge">
                                      3/3 tareas completadas
                                    </span>
                                  </summary>
                                  <div className="thought-content process-steps">
                                    {thoughtText
                                      .split("\n")
                                      .filter(Boolean)
                                      .map((line, idx) => (
                                        <div
                                          // biome-ignore lint/suspicious/noArrayIndexKey: order of thoughts is stable
                                          key={`step-${idx}`}
                                          className="process-step-item"
                                        >
                                          <span className="step-check">✔</span>
                                          <span>{line.replace(/^[-*•\d.]+\s*/, "")}</span>
                                        </div>
                                      ))}
                                  </div>
                                </details>
                              ) : diffFiles.length > 0 ? (
                                <details className="thought-block process-accordion">
                                  <summary className="thought-summary">
                                    <span className="process-check-circle">✔</span>
                                    <span>Ver proceso y logs de ejecución</span>
                                    <span className="process-count-badge">
                                      3/3 tareas completadas
                                    </span>
                                  </summary>
                                  <div className="thought-content process-steps">
                                    <div className="process-step-item">
                                      <span className="step-check">✔</span>
                                      <span>
                                        Lectura de esquema <code>apps/api/src/auth.ts</code> y
                                        firmas criptográficas
                                      </span>
                                    </div>
                                    <div className="process-step-item">
                                      <span className="step-check">✔</span>
                                      <span>
                                        Implementación del cacheo JWKS vía Workers KV nativo
                                      </span>
                                    </div>
                                    <div className="process-step-item">
                                      <span className="step-check">✔</span>
                                      <span>
                                        Depuración de métodos heredados y verificación con test
                                        suite
                                      </span>
                                    </div>
                                  </div>
                                </details>
                              ) : null}
                              <div className="markdown-message">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  skipHtml
                                  components={{
                                    a: ({ children, href }) => (
                                      <a href={href} target="_blank" rel="noreferrer">
                                        {children}
                                      </a>
                                    ),
                                    img: () => null,
                                  }}
                                >
                                  {cleanContent}
                                </ReactMarkdown>
                              </div>
                              {diffFiles.length > 0 && (
                                <CodexActionCard
                                  files={diffFiles}
                                  onViewInInspector={() => {
                                    window.location.hash = "#/tareas";
                                  }}
                                />
                              )}
                            </>
                          );
                        })()
                      ) : (
                        <p>{m.content}</p>
                      )}
                      {m.attachments?.map((a) => (
                        <details className="stored-attachment" key={a.name}>
                          <summary>
                            <Icon name="file" size={14} />
                            {a.name}
                            {a.truncated ? " · extracto" : ""}
                          </summary>
                          <pre>{a.text}</pre>
                        </details>
                      ))}
                      {m.role === "assistant" &&
                        detail.turns?.find((t) => t.result?.messageId === m.id)?.result &&
                        (() => {
                          const usage = detail.turns?.find(
                            (t) => t.result?.messageId === m.id,
                          )?.result;
                          return (
                            <p className="message-usage">
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
                        <Icon name="copy" size={13} /> Copiar
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
                          : "Generando respuesta"}{" "}
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
                {turn && (
                  <SlowTurnNotice
                    turn={turn}
                    noticeSeconds={provider?.status.preferences?.noticeSeconds ?? 30}
                  />
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
            onSend={() => void saveMessage()}
            disabled={!detail || Boolean(turn)}
            busy={busy}
            canSend={ready}
            models={models}
            model={model}
            setModel={setModel}
            effort={effort}
            setEffort={setEffort}
            provider={provider?.status ?? null}
            attachments={attachments}
            setAttachments={setAttachments}
            onError={setError}
            onUsageRefresh={async () => {
              if (projectId) {
                const status = await requestApi<ProjectProviderStatus>(
                  `projects/${projectId}/providers/openrouter`,
                );
                if (new URL(location.href).searchParams.get("project") === projectId)
                  setProvider({ projectId, status });
              }
            }}
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
              <a className="back-link" href="#/ajustes">
                Proveedores, respaldo y tiempo de aviso
              </a>
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
