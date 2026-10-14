import type { Task, TaskEvent } from "@cubo/shared";
import { type ReactNode, type RefObject, useEffect, useRef } from "react";
import { Icon, type IconName } from "./Icon";
import { labels, time } from "./workspace";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="workspace-shell">{children}</div>;
}
export function Sidebar({
  mobile,
  dialogRef,
  close,
  children,
}: {
  mobile: boolean;
  dialogRef: RefObject<HTMLDialogElement | null>;
  close: () => void;
  children: ReactNode;
}) {
  const Element = mobile ? "dialog" : "aside";
  return (
    <Element
      ref={dialogRef}
      id="workspace-navigation"
      className="sidebar"
      aria-label="Navegación del workspace"
      onCancel={close}
      onClose={close}
    >
      {children}
    </Element>
  );
}
export function TopBar({ children }: { children: ReactNode }) {
  return <header className="systembar">{children}</header>;
}
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions}
    </div>
  );
}
export function StatusBadge({
  children,
  status = "pending",
}: {
  children: ReactNode;
  status?: string;
}) {
  return (
    <span className={`status-badge ${status}`}>
      <i />
      {children}
    </span>
  );
}
export function MetricCard({
  label,
  value,
  detail,
  icon = "chart",
}: {
  label: string;
  value: ReactNode;
  detail: string;
  icon?: IconName;
}) {
  return (
    <div className="metric-card">
      <div>
        <span>{label}</span>
        <Icon name={icon} size={16} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
export function SectionCard({
  title,
  actions,
  children,
}: {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="section-card">
      <div className="panel-heading">
        <h2>{title}</h2>
        {actions}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}
export function Tabs({
  names,
  value,
  onChange,
  label,
}: {
  names: string[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <nav className="tabs" aria-label={label}>
      {names.map((name) => (
        <button
          key={name}
          type="button"
          aria-pressed={value === name}
          className={value === name ? "active" : ""}
          onClick={() => onChange(name)}
        >
          {name}
        </button>
      ))}
    </nav>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function AgentBadge({ name }: { name: string }) {
  return <span className="tag agent-badge">{name}</span>;
}
export function TaskRow({
  task,
  selected,
  open,
}: {
  task: Task;
  selected: boolean;
  open: () => void;
}) {
  return (
    <article className={`task-item ${selected ? "selected" : ""}`}>
      <div className="task-item-top">
        <StatusBadge status={task.status.toLowerCase()}>{labels[task.status]}</StatusBadge>
      </div>
      <div className="task-row-body">
        <div className="task-row-content">
          <button className="task-title" type="button" onClick={open}>
            {task.title}
          </button>
          <div className="task-row-meta" title="Proyecto y modelo aún no disponibles">
            <AgentBadge
              name={
                "type" in task.input
                  ? task.input.type === "CHAT_TURN"
                    ? "OpenRouter · API"
                    : "Importador de repositorio"
                  : "Runner de validación"
              }
            />
            <span>{task.input.steps} pasos</span>
            {task.input.pauseAt && <span>Pausa con aprobación</span>}
          </div>
        </div>
        <div className="task-row-side">
          <div className="task-row-identity">
            <span className="mono" title={task.id}>
              ID {task.id.slice(0, 8)}
            </span>
            <time dateTime={task.updatedAt} title="Última actualización">
              {time(task.updatedAt)}
            </time>
          </div>
          <div className="task-row-controls">
            <div className="task-row-progress">
              <span>
                {task.progress}/{task.input.steps}
              </span>
              <progress
                max={task.input.steps}
                value={task.progress}
                aria-label={`Progreso de ${task.id.slice(0, 8)}`}
              />
            </div>
            <button className="secondary compact" type="button" onClick={open}>
              <Icon name="logs" size={15} />
              Ver proceso
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
export function ProjectRow({ children }: { children: ReactNode }) {
  return <div className="project-row">{children}</div>;
}
export function ProviderCard({ name, kind }: { name: string; kind: "AGENTE" | "PROVEEDOR" }) {
  return (
    <section className="provider-card">
      <div className="provider-card-header">
        <div>
          <AgentBadge name={kind} />
          <h3>{name}</h3>
        </div>
        <StatusBadge>Integración pendiente</StatusBadge>
      </div>
      <div className="provider-fields">
        <label>
          Estado
          <input disabled value="Sin configurar" readOnly />
        </label>
        <label>
          Modelos disponibles
          <input disabled value="No disponibles" readOnly />
        </label>
        <label>
          Configuración
          <input
            disabled
            placeholder={kind === "AGENTE" ? "Adaptador pendiente" : "Conexión pendiente"}
          />
        </label>
        <label>
          Uso
          <input disabled value="Sin datos todavía" readOnly />
        </label>
      </div>
      <div className="provider-footer">
        <span>Uso, tokens y coste · unavailable</span>
        <button className="secondary compact" type="button" disabled>
          Guardar configuración
        </button>
      </div>
    </section>
  );
}
export function ProcessEvent({ event }: { event: TaskEvent }) {
  return (
    <li>
      <time dateTime={event.createdAt}>{time(event.createdAt)}</time>
      <div>
        <span className={`event-dot ${event.type.toLowerCase()}`} />
        <p>{event.message}</p>
      </div>
    </li>
  );
}
export function RightPanel({
  open,
  close,
  title,
  children,
}: {
  open: boolean;
  close: () => void;
  title: string;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className="right-panel"
      aria-label={title}
      onCancel={close}
      onClose={close}
    >
      <div className="panel-heading">
        <h2>{title}</h2>
        <button className="icon-button" type="button" aria-label="Cerrar detalle" onClick={close}>
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ChatComposer({
  value,
  onChange,
  onSave,
  disabled,
  busy,
  controls,
  submitLabel = "Guardar",
}: {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  disabled: boolean;
  busy: boolean;
  controls?: ReactNode;
  submitLabel?: string;
}) {
  return (
    <form
      className="chat-composer"
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <label className="sr-only" htmlFor="chat-message">
        Mensaje · máximo 2000 caracteres
      </label>
      <textarea
        id="chat-message"
        maxLength={2000}
        value={value}
        disabled={disabled || busy}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escribe una tarea o mensaje…"
      />
      <div className="composer-controls">
        <div>
          <button
            className="icon-button"
            type="button"
            disabled
            aria-label="Adjuntar · integración pendiente"
          >
            <Icon name="plus" />
          </button>
          <button
            className="icon-button"
            type="button"
            disabled
            aria-label="Herramientas · integración pendiente"
          >
            <Icon name="settings" />
          </button>
          {controls ?? (
            <button className="secondary compact" type="button" disabled>
              Modelo / agente pendiente
            </button>
          )}
        </div>
        <button
          className="primary compact"
          type="submit"
          disabled={disabled || busy || !value.trim()}
          aria-label={`${submitLabel} mensaje`}
        >
          {busy ? (
            "Guardando…"
          ) : (
            <>
              <Icon name="arrow" size={16} />
              <span>{submitLabel}</span>
            </>
          )}
        </button>
      </div>
      <fieldset className="effort-controls" aria-label="Nivel de esfuerzo · integración pendiente">
        {["Auto", "Mínimo", "Bajo", "Medio", "Alto", "Muy alto"].map((name) => (
          <button type="button" disabled key={name}>
            {name}
          </button>
        ))}
        <button type="button" disabled>
          Uso
        </button>
      </fieldset>
      <p className="hint">
        {submitLabel === "Enviar"
          ? "Turno remoto durable · herramientas, adjuntos y esfuerzo pendientes."
          : "Mensajes persistentes · proveedor pendiente de configurar."}
      </p>
    </form>
  );
}
