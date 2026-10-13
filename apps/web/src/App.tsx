import type { Approval, Checkpoint, Task, TaskEvent, TaskStatus } from "@cubo/shared";
import { useCallback, useEffect, useRef, useState } from "react";

const labels: Record<TaskStatus, string> = {
  QUEUED: "En cola",
  RUNNING: "En ejecución",
  WAITING_APPROVAL: "Necesita aprobación",
  SUCCEEDED: "Completada",
  FAILED: "Falló",
  CANCELLED: "Cancelada",
};
type Detail = {
  task: Task;
  events: TaskEvent[];
  checkpoint: Checkpoint | null;
  approvals: Approval[];
};
async function api<T>(path: string, body?: unknown, key?: string): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    credentials: "same-origin",
    cache: "no-store",
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "No fue posible contactar Cubo.");
  return data;
}
function time(value: string) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [guard, setGuard] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState(window.location.hash.slice(1));
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [pollError, setPollError] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const [pause, setPause] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const key = useRef<string | null>(null);
  const selectedRef = useRef(selected);
  const generation = useRef(0);
  const chooseTask = useCallback((id: string) => {
    selectedRef.current = id;
    generation.current += 1;
    setSelected(id);
    setDetail(null);
  }, []);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    const data = await api<{ tasks: Task[] }>("tasks");
    if (request !== generation.current) return;
    setTasks(data.tasks);
    const id = selected || data.tasks[0]?.id;
    if (id) {
      if (!selectedRef.current) {
        chooseTask(id);
        return;
      }
      const next = await api<Detail>(`tasks/${id}`);
      if (request !== generation.current || id !== selectedRef.current) return;
      setDetail(next);
    }
    setLastSync(new Date().toISOString());
  }, [chooseTask, selected]);
  useEffect(() => {
    api<{ authenticated: boolean; costGuardVerified: boolean; executionConfigured: boolean }>(
      "session",
    )
      .then((s) => {
        setAuthenticated(s.authenticated);
        setGuard(s.costGuardVerified);
        setConfigured(s.executionConfigured);
      })
      .catch(() => {
        setError("No se pudo conectar con Cubo. Revisa la conexión.");
        setAuthenticated(false);
      });
  }, []);
  useEffect(() => {
    const change = () => setOnline(navigator.onLine);
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  }, []);
  useEffect(() => {
    if (!authenticated || !online) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        await refresh();
        if (active) setPollError("");
      } catch (e) {
        if (active) setPollError(e instanceof Error ? e.message : "No se pudo actualizar.");
      }
      if (active) timer = setTimeout(poll, document.hidden ? 30000 : 5000);
    };
    void poll();
    return () => {
      active = false;
      generation.current += 1;
      clearTimeout(timer);
    };
  }, [authenticated, online, refresh]);
  useEffect(() => {
    if (selected) history.replaceState(null, "", `#${selected}`);
  }, [selected]);
  async function login(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("login", { password });
      setPassword("");
      setAuthenticated(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar sesión.");
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    setBusy(true);
    setError("");
    key.current ??= crypto.randomUUID();
    try {
      const { task } = await api<{ task: Task }>(
        "tasks",
        { steps: 6, delaySeconds: 10, pauseAt: pause ? 3 : null },
        key.current,
      );
      key.current = null;
      chooseTask(task.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la tarea.");
    } finally {
      setBusy(false);
    }
  }
  async function continueTask() {
    if (!detail || detail.task.id !== selectedRef.current) return;
    const approval = detail.approvals.find((a) => a.status === "PENDING");
    if (!approval) return;
    setBusy(true);
    setError("");
    try {
      await api(`tasks/${detail.task.id}/approve`, {
        approvalId: approval.id,
        version: detail.task.version,
      });
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo continuar.");
    } finally {
      setBusy(false);
    }
  }
  async function retry() {
    if (!detail || detail.task.id !== selectedRef.current) return;
    setBusy(true);
    setError("");
    try {
      await api(`tasks/${detail.task.id}/retry-dispatch`, {});
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo reanudar.");
    } finally {
      setBusy(false);
    }
  }
  const task = detail?.task.id === selected ? detail.task : undefined;
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 md:px-10">
        <a className="brand flex items-center gap-3" href="/" aria-label="Cubo, inicio">
          <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true">
            <path
              d="M32 12 50 22v20L32 52 14 42V22zM14 22l18 10 18-10M32 32v20"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
          <span>Cubo</span>
        </a>
        <div className="flex items-center gap-3 text-sm">
          <span className={online ? "connection online" : "connection"}>
            {online ? "Conectado" : "Sin conexión"}
          </span>
          {authenticated && (
            <button
              className="quiet"
              type="button"
              onClick={() => {
                void api("logout", {}).then(() => setAuthenticated(false));
              }}
            >
              Salir
            </button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        <div className="mb-8">
          <h1 className="text-3xl font-medium tracking-tight">Tu trabajo sigue.</h1>
          <p className="mt-2 max-w-xl text-muted">
            Lanza una tarea. Cierra Cubo. Vuelve a su progreso y resultado guardados.
          </p>
        </div>
        {(error || pollError) && (
          <div className="notice error mb-5" role="alert">
            {error || pollError}
          </div>
        )}
        {!online && (
          <div className="notice mb-5" role="status">
            El cliente está sin conexión. La ejecución remota sigue su propio ciclo; reconecta para
            consultar su estado.
          </div>
        )}
        {authenticated === null ? (
          <p role="status">Conectando con Cubo…</p>
        ) : !authenticated ? (
          <form onSubmit={login} className="login">
            <h2 className="text-xl font-medium">Acceso personal</h2>
            <p className="mt-2 text-sm text-muted">
              Usa la clave configurada en el backend de Cubo.
            </p>
            <label htmlFor="password" className="mt-6 block text-sm">
              Clave de acceso
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={256}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full"
            />
            <button type="submit" className="primary mt-4" disabled={busy || !online}>
              {busy ? "Verificando…" : "Entrar a Cubo"}
            </button>
          </form>
        ) : (
          <>
            {(!guard || !configured) && (
              <div className="notice mb-6">
                Ejecución remota pendiente de conectar. Las tareas permanecerán guardadas en cola
                hasta completar la configuración y verificar el límite de gasto USD 0.
              </div>
            )}
            <div className="console grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="min-w-0">
                <section className="composer">
                  <h2 className="text-lg font-medium">Primera tarea durable</h2>
                  <p className="mt-2 text-sm text-muted">
                    Seis pasos, diez segundos por paso. El resultado y cada checkpoint se guardan en
                    Cubo.
                  </p>
                  <label className="mt-5 flex items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={pause}
                      disabled={busy}
                      onChange={(e) => {
                        setPause(e.target.checked);
                        key.current = null;
                      }}
                    />
                    <span>Pausar a mitad y pedir aprobación para continuar en otro runner.</span>
                  </label>
                  <button
                    type="button"
                    className="primary mt-5 w-full"
                    disabled={busy || !online}
                    onClick={() => void create()}
                  >
                    {busy ? "Guardando…" : "Crear tarea"}
                  </button>
                </section>
                <div className="mt-8 flex items-center justify-between">
                  <h2 className="font-medium">Tareas</h2>
                  <span className="text-sm text-muted">{tasks.length}</span>
                </div>
                <ul className="mt-3 task-list">
                  {tasks.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={selected === t.id ? "task-row selected" : "task-row"}
                        aria-pressed={selected === t.id}
                        onClick={() => {
                          chooseTask(t.id);
                        }}
                      >
                        <span className="flex justify-between gap-2">
                          <span>{t.title}</span>
                          <span className="text-xs text-muted">{time(t.createdAt)}</span>
                        </span>
                        <span className="mt-2 flex justify-between text-sm">
                          <span className={`state ${t.status.toLowerCase()}`}>
                            {labels[t.status]}
                          </span>
                          <span className="text-muted tabular-nums">
                            {t.progress}/{t.input.steps}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                {tasks.length === 0 && (
                  <p className="py-5 text-sm text-muted">
                    Todavía no hay tareas. Crea la primera para comprobar la continuidad.
                  </p>
                )}
              </aside>
              <section className="detail min-w-0" aria-label="Detalle de tarea">
                <p className="sr-only" aria-live="polite" aria-atomic="true">
                  {task
                    ? `${labels[task.status]}. ${task.progress} de ${task.input.steps} pasos guardados.`
                    : ""}
                </p>
                {!task ? (
                  <div className="empty">
                    <div className="empty-mark" aria-hidden="true" />
                    <h2 className="text-xl font-medium">Un lugar para volver.</h2>
                    <p className="mt-3 max-w-sm text-sm text-muted">
                      Selecciona una tarea para ver progreso, checkpoints y resultados persistidos.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-medium">{task.title}</h2>
                        <p className="mt-2 text-sm text-muted">
                          Ejecución {task.attempt} · creada a las {time(task.createdAt)}
                        </p>
                      </div>
                      <span className={`status-label ${task.status.toLowerCase()}`}>
                        {labels[task.status]}
                      </span>
                    </div>
                    <div className="mt-7">
                      <div className="mb-2 flex justify-between text-sm">
                        <span>Progreso guardado</span>
                        <span className="tabular-nums">
                          {task.progress} de {task.input.steps} pasos
                        </span>
                      </div>
                      <progress
                        value={task.progress}
                        max={task.input.steps}
                        aria-label="Progreso guardado"
                        className="w-full"
                      />
                    </div>
                    {task.error && (
                      <div className="notice mt-5">
                        <p>
                          {task.error === "EXECUTION_QUOTA_EXHAUSTED"
                            ? "Cuota gratuita agotada. Tarea pendiente hasta recuperar capacidad."
                            : task.error === "EXECUTION_CONFIGURATION_REQUIRED"
                              ? "La ejecución remota todavía no está conectada. Tu tarea sigue guardada."
                              : task.error === "COST_GUARD_NOT_VERIFIED"
                                ? "Bloqueo de gasto cero pendiente de verificar."
                                : task.error}
                        </p>
                        {task.status === "QUEUED" && guard && (
                          <button
                            type="button"
                            className="quiet mt-3"
                            disabled={busy || !online}
                            onClick={() => void retry()}
                          >
                            Comprobar capacidad de nuevo
                          </button>
                        )}
                      </div>
                    )}
                    {task.status === "WAITING_APPROVAL" && (
                      <div className="approval mt-6">
                        <h3 className="font-medium">Checkpoint guardado. Runner liberado.</h3>
                        <p className="mt-2 text-sm text-muted">
                          Tu aprobación abrirá otra ejecución desde el paso {task.progress + 1}. No
                          autoriza commits, pushes ni PR.
                        </p>
                        <button
                          type="button"
                          className="primary mt-4"
                          disabled={busy || !online}
                          onClick={() => void continueTask()}
                        >
                          Aprobar continuación
                        </button>
                      </div>
                    )}
                    {task.result && (
                      <div className="result mt-7">
                        <h3 className="text-sm text-muted">Resultado persistido</h3>
                        <p className="mt-2 text-3xl tabular-nums">{task.result.sum}</p>
                        <p className="mt-1 text-sm text-muted">
                          Suma de los cuadrados del 1 al {task.result.steps}.
                        </p>
                      </div>
                    )}
                    <div className="mt-8 border-t border-line pt-5">
                      <h3 className="font-medium">Registro de actividad</h3>
                      <ol className="mt-4 space-y-4">
                        {detail?.events.map((event) => (
                          <li key={event.id} className="flex gap-4 text-sm">
                            <time
                              className="shrink-0 font-mono text-xs text-muted"
                              dateTime={event.createdAt}
                            >
                              {time(event.createdAt)}
                            </time>
                            <span>{event.message}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                    <details className="mt-7 text-sm">
                      <summary className="cursor-pointer text-muted">
                        Identificadores y checkpoint
                      </summary>
                      <pre className="mt-3 overflow-x-auto text-xs">
                        {JSON.stringify(
                          {
                            taskId: task.id,
                            executionId: task.executionId,
                            checkpoint: detail?.checkpoint,
                          },
                          null,
                          2,
                        )}
                      </pre>
                    </details>
                  </>
                )}
              </section>
            </div>
            <footer className="mt-8 flex flex-wrap justify-between gap-3 border-t border-line pt-5 text-xs text-muted">
              <span>Demo del motor durable · agentes todavía pendientes</span>
              <span>{lastSync ? `Última consulta ${time(lastSync)}` : "Sin sincronizar"}</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}
