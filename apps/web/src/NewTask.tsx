import { useEffect, useRef } from "react";
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
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="new-task-dialog"
      aria-label="Nueva tarea"
      onCancel={close}
      onClose={close}
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
        <div className="field-grid">
          <label>
            Proyecto
            <select disabled>
              <option>Sin proyectos conectados</option>
            </select>
          </label>
          <label>
            Agente
            <select disabled>
              <option>Seleccionar agente · pendiente</option>
              <option>OpenCode</option>
              <option>Codex</option>
            </select>
          </label>
          <label>
            Modelo
            <select disabled>
              <option>Sin proveedor configurado</option>
            </select>
          </label>
          <label>
            Esfuerzo
            <select disabled>
              <option>Auto · integración pendiente</option>
            </select>
          </label>
        </div>
        <label>
          Instrucción
          <textarea
            disabled
            placeholder="Describe el trabajo que debe realizar el agente…"
            rows={4}
          />
        </label>
        <button className="secondary" type="button" disabled>
          Adjuntar archivos · pendiente
        </button>
        <p className="hint">
          La ejecución de instrucciones requiere agentes y proyectos conectados. Todavía no está
          disponible.
        </p>
        <button className="primary" type="button" disabled>
          Ejecutar · integración pendiente
        </button>
        <details className="validation-task">
          <summary>Validar el motor durable existente</summary>
          <SectionCard title="Validación durable">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (await w.create()) created();
              }}
            >
              <p className="hint">
                Runner de GitHub Actions · 6 pasos de 10 segundos · resultado: suma de cuadrados. No
                ejecuta instrucciones de IA.
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
              {w.error && (
                <p role="alert" className="error">
                  {w.error}
                </p>
              )}
              <button className="secondary" type="submit" disabled={w.busy || !w.online}>
                {w.busy ? "Guardando…" : "Ejecutar validación durable"}
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
