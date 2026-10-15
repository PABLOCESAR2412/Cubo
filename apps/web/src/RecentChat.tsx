import type { Conversation } from "@cubo/shared";
import { useRef, useState } from "react";
import { Icon } from "./Icon";
import { requestApi } from "./workspace";
export function RecentChat({
  chat,
  active,
  open,
  removed,
}: {
  chat: Conversation;
  active: boolean;
  open: () => void;
  removed: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [name, setName] = useState(chat.title);
  const dialog = useRef<HTMLDialogElement>(null);
  const path = `conversations/${chat.id}${chat.projectId ? `?project=${chat.projectId}` : ""}`;
  async function change(kind: "rename" | "pin" | "delete") {
    if (busy) return;
    if (
      kind === "delete" &&
      !confirm(`Eliminar «${chat.title}» y sus mensajes? Esta acción no se puede deshacer.`)
    )
      return;
    setBusy(true);
    setError("");
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
  return (
    <>
      <div className={`recent-chat-row ${active ? "active" : ""}`}>
        <button className="recent-chat-title" type="button" title={chat.title} onClick={open}>
          <Icon name="chat" size={14} />
          <span>{chat.title}</span>
        </button>
        <div className="recent-chat-actions">
          <button
            type="button"
            title="Renombrar chat"
            aria-label={`Renombrar ${chat.title}`}
            disabled={busy}
            onClick={() => {
              setName(chat.title);
              dialog.current?.showModal();
            }}
          >
            <Icon name="edit" size={13} />
          </button>
          <button
            type="button"
            title={chat.pinned ? "Desfijar chat" : "Fijar chat"}
            aria-label={`${chat.pinned ? "Desfijar" : "Fijar"} ${chat.title}`}
            disabled={busy}
            onClick={() => void change("pin")}
          >
            <Icon name="pin" size={13} />
          </button>
          <button
            type="button"
            title="Eliminar chat"
            aria-label={`Eliminar ${chat.title}`}
            disabled={busy}
            onClick={() => void change("delete")}
          >
            <Icon name="trash" size={13} />
          </button>
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
