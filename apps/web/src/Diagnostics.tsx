import { useRef } from "react";
import { Icon } from "./Icon";
import type { Workspace } from "./workspace";
import { time } from "./workspace";

export function Diagnostics({ w }: { w: Workspace }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const synced = w.online && Boolean(w.lastSync) && !w.pollError;
  return (
    <>
      <button
        type="button"
        className="secondary compact"
        onClick={() => dialog.current?.showModal()}
      >
        <Icon name="logs" /> Diagnóstico
      </button>
      <dialog
        ref={dialog}
        className="new-task-dialog diagnostics-dialog"
        aria-labelledby="diagnostics-title"
      >
        <div className="panel-heading">
          <h2 id="diagnostics-title">Diagnóstico de Cubo</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Cerrar diagnóstico"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <dl className="diagnostics-values">
          <div>
            <dt>API</dt>
            <dd>{synced ? "Sincronizada" : "Sin sincronizar"}</dd>
          </div>
          <div>
            <dt>Última sincronización</dt>
            <dd>{w.lastSync ? time(w.lastSync) : "Sin datos"}</dd>
          </div>
          <div>
            <dt>API de Cubo</dt>
            <dd>{synced ? "Disponible" : "Disponibilidad sin confirmar"}</dd>
          </div>
          <div>
            <dt>GitHub Actions</dt>
            <dd>{w.configured ? "Configurado" : "Pendiente de configurar"}</dd>
          </div>
          <div>
            <dt>Presupuesto de infraestructura</dt>
            <dd>USD 0</dd>
          </div>
          <div>
            <dt>Bloqueo de gasto</dt>
            <dd>{w.guard ? "Verificado en configuración" : "Pendiente de verificar"}</dd>
          </div>
        </dl>
        <p className="hint">
          La sincronización confirma acceso a Cubo; no mide disponibilidad ni cuota de los runners.
        </p>
      </dialog>
    </>
  );
}
