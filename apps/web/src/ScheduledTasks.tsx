import { Icon } from "./Icon";

export function ScheduledTasks({ onSwitchToExecutions }: { onSwitchToExecutions?: () => void }) {
  return (
    <div className="sched-stitch-container">
      <div className="sched-stitch-header">
        <div>
          <span className="sched-breadcrumb">PLANIFICADOR</span>
          <h1 className="sched-title">Tareas Programadas</h1>
        </div>
        <div className="sched-header-actions">
          <div className="sched-mode-segmented">
            <button type="button" className="sched-mode-btn" onClick={onSwitchToExecutions}>
              <span>Ejecuciones activas</span>
            </button>
            <button type="button" className="sched-mode-btn active">
              <span>Programadas</span>
            </button>
          </div>
        </div>
      </div>

      <div className="empty-inline">
        <Icon name="clock" size={28} />
        <h2>Sin automatizaciones registradas</h2>
        <p>
          El backend de Cubo todavía no registra automatizaciones cron. Cuando llegue la vertical de
          tareas programadas aparecerán aquí su programación real, historial y estado persistido.
          Cubo no muestra datos simulados.
        </p>
        {onSwitchToExecutions && (
          <button type="button" className="secondary" onClick={onSwitchToExecutions}>
            Ver ejecuciones activas
          </button>
        )}
      </div>
    </div>
  );
}
