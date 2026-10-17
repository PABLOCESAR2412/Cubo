import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { SectionCard } from "./ui";
import type { Workspace } from "./workspace";

export function NewTask({
  w,
  close,
  created,
}: {
  w: Workspace;
  close: () => void;
  created: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [agent, setAgent] = useState<"opencode" | "codex">("opencode");
  const [actionRequested, setActionRequested] = useState<"plan" | "edit" | "commit" | "push">(
    "edit",
  );
  const [instructions, setInstructions] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  async function handleLaunchAgent() {
    if (!instructions.trim()) {
      setLocalError("Escribe las instrucciones para el agente.");
      return;
    }
    setLocalError("");
    const ok = await w.create({
      type: "AGENT_TASK",
      agent,
      instructions: instructions.trim(),
      actionRequested,
      targetRef: "main",
    });
    if (ok) created();
  }

  return (
    <dialog
      ref={dialog}
      className="new-task-dialog"
      aria-label="Nueva tarea"
      onCancel={close}
      onClose={close}
    >
      <div className="panel-heading">
        <h2>Nueva tarea de agente</h2>
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
        <div className="field-grid">
          <label>
            Agente
            <select
              value={agent}
              disabled={w.busy}
              onChange={(e) => setAgent(e.target.value as "opencode" | "codex")}
            >
              <option value="opencode">OpenCode · adaptativo con checkpoints</option>
              <option value="codex">Codex · ingeniería y refactorización</option>
            </select>
          </label>
          <label>
            Acción solicitada
            <select
              value={actionRequested}
              disabled={w.busy}
              onChange={(e) =>
                setActionRequested(e.target.value as "plan" | "edit" | "commit" | "push")
              }
            >
              <option value="edit">Edición · propone cambios de código</option>
              <option value="commit">Commit · requiere aprobación de diff</option>
              <option value="push">Push · requiere aprobación de repositorio</option>
              <option value="plan">Planificación · análisis sin mutación</option>
            </select>
          </label>
        </div>
        <label>
          Instrucciones
          <textarea
            value={instructions}
            disabled={w.busy}
            placeholder="Describe el trabajo que debe realizar el agente (ej: refactorizar módulo de autenticación)..."
            rows={4}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </label>
        {localError && (
          <p role="alert" className="error">
            {localError}
          </p>
        )}
        {w.error && (
          <p role="alert" className="error">
            {w.error}
          </p>
        )}
        <p className="hint">
          Las acciones Git de escritura (commit, push) activan la barrera de seguridad de Cubo y
          quedan en espera de aprobación explícita antes de cualquier cambio en el repositorio.
        </p>
        <button
          className="primary"
          type="button"
          disabled={w.busy || !w.online}
          onClick={() => void handleLaunchAgent()}
        >
          {w.busy ? "Lanzando…" : `Lanzar tarea con ${agent === "codex" ? "Codex" : "OpenCode"}`}
        </button>
        <details className="validation-task">
          <summary>Validar con prueba sintética (Suma de cuadrados)</summary>
          <SectionCard title="Validación durable de prueba">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await w.create()) created();
              }}
            >
              <p className="hint">
                Runner de GitHub Actions · 6 pasos de 10 segundos · resultado: suma de cuadrados.
              </p>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={w.pause}
                  disabled={w.busy}
                  onChange={(e) => w.updatePause(e.target.checked)}
                />
                <span>Pausar en el paso 3 y solicitar aprobación para continuar.</span>
              </label>
              <button className="secondary" type="submit" disabled={w.busy || !w.online}>
                {w.busy ? "Guardando…" : "Ejecutar validación sintética"}
              </button>
            </form>
          </SectionCard>
        </details>
      </div>
      <div className="dialog-actions">
        <button type="button" className="secondary" onClick={close} disabled={w.busy}>
          Cerrar
        </button>
      </div>
    </dialog>
  );
}
