import type { Conversation, TaskStatus } from "@cubo/shared";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { requestApi } from "./workspace";

export function RecentChat({
  chat,
  active,
  executionStatus,
  open,
  removed,
}: {
  chat: Conversation;
  active: boolean;
  executionStatus?: TaskStatus | undefined;
  open: () => void;
  removed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(chat.title);
  const [menuOpen, setMenuOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const path = `conversations/${chat.id}${chat.projectId ? `?project=${chat.projectId}` : ""}`;

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  async function change(kind: "rename" | "pin" | "delete") {
    if (busy) return;
    if (
      kind === "delete" &&
      !confirm(`¿Eliminar «${chat.title}» y sus mensajes? Esta acción no se puede deshacer.`)
    ) {
      setMenuOpen(false);
      return;
    }
    setBusy(true);
    setError("");
    setMenuOpen(false);
    try {
      await requestApi(path, {
        method: kind === "delete" ? "DELETE" : "PUT",
        body: JSON.stringify(
          kind === "delete"
            ? { version: chat.version }
            : {
                version: chat.version,
                title: kind === "rename" ? name.trim() : chat.title,
                pinned: kind === "pin" ? !chat.pinned : chat.pinned,
              },
        ),
      });
      dialog.current?.close();
      window.dispatchEvent(new Event("cubo-conversations-changed"));
      window.dispatchEvent(new Event("cubo-chat-selected"));
      if (kind === "delete") removed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar el chat.");
    } finally {
      setBusy(false);
    }
  }

  const isRunning = executionStatus === "RUNNING" || executionStatus === "QUEUED";
  const needsReviewOrDone =
    executionStatus === "WAITING_APPROVAL" || executionStatus === "SUCCEEDED";

  return (
    <>
      <div className={`recent-chat-row ${active ? "active" : ""}`}>
        <button className="recent-chat-title" type="button" title={chat.title} onClick={open}>
          {isRunning ? (
            <span
              className="chat-loading-spinner"
              role="status"
              title="En ejecución..."
              aria-label="En ejecución"
            />
          ) : needsReviewOrDone ? (
            <span
              className="chat-status-dot"
              role="status"
              title="Completado / Pendiente de revisión"
              aria-label="Pendiente de revisión"
            />
          ) : (
            <Icon name="chat" size={14} />
          )}
          <span className="chat-title-text">{chat.title}</span>
        </button>

        <div className="recent-chat-menu-container" ref={menuRef}>
          <button
            type="button"
            className={`recent-chat-more-btn ${menuOpen ? "open" : ""}`}
            title="Más opciones de chat"
            aria-label={`Opciones de ${chat.title}`}
            aria-expanded={menuOpen}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((prev) => !prev);
            }}
          >
            <Icon name="more" size={13} />
          </button>

          {menuOpen && (
            <div className="recent-chat-dropdown" role="menu">
              <button
                type="button"
                className="recent-chat-menu-item"
                role="menuitem"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  setName(chat.title);
                  setMenuOpen(false);
                  dialog.current?.showModal();
                }}
              >
                <Icon name="edit" size={13} />
                <span>Renombrar</span>
              </button>

              <button
                type="button"
                className="recent-chat-menu-item"
                role="menuitem"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  void change("pin");
                }}
              >
                <Icon name="pin" size={13} />
                <span>{chat.pinned ? "Desfijar" : "Fijar"}</span>
              </button>

              <button
                type="button"
                className="recent-chat-menu-item is-danger"
                role="menuitem"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  void change("delete");
                }}
              >
                <Icon name="trash" size={13} />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="hint error" role="alert">
          {error}
        </p>
      )}

      <dialog ref={dialog} className="small-dialog">
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void change("rename");
          }}
        >
          <h2>Renombrar chat</h2>
          <label>
            Nombre
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
            />
          </label>
          <div className="toolbar-actions">
            <button className="primary compact" disabled={busy || !name.trim()} type="submit">
              Guardar nombre
            </button>
            <button
              className="secondary compact"
              type="button"
              onClick={() => dialog.current?.close()}
            >
              Cancelar
            </button>
          </div>
          {error && <p role="alert">{error}</p>}
        </form>
      </dialog>
    </>
  );
}
