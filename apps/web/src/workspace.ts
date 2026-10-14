import type {
  Approval,
  Checkpoint,
  RepositorySnapshot,
  Task,
  TaskEvent,
  TaskStatus,
} from "@cubo/shared";
import { useCallback, useEffect, useRef, useState } from "react";

export const labels: Record<TaskStatus, string> = {
  QUEUED: "En cola",
  RUNNING: "En ejecución",
  WAITING_APPROVAL: "Necesita aprobación",
  SUCCEEDED: "Completada",
  FAILED: "Falló",
  CANCELLED: "Cancelada",
};
export type Detail = {
  task: Task;
  events: TaskEvent[];
  checkpoint: Checkpoint | null;
  repositoryCheckpoint?: RepositorySnapshot | null;
  approvals: Approval[];
};
async function api<T>(path: string, body?: unknown, key?: string): Promise<T> {
  return requestApi<T>(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { ...(key ? { "Idempotency-Key": key } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
export async function requestApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(data.error ?? "No fue posible contactar Cubo.");
  return data;
}
export function useWorkspace() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [guard, setGuard] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [password, setPassword] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selected, setSelected] = useState(taskIdFromHash());
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
    if (selectedRef.current === id) return;
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
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear la tarea.");
      return false;
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
  async function logout() {
    setError("");
    try {
      await api("logout", {});
      setAuthenticated(false);
    } catch {
      setError("No se pudo cerrar sesión. Inténtalo de nuevo.");
    }
  }
  function updatePause(value: boolean) {
    setPause(value);
    key.current = null;
  }
  return {
    authenticated,
    guard,
    configured,
    password,
    setPassword,
    tasks,
    selected,
    detail,
    task,
    error,
    pollError,
    busy,
    online,
    pause,
    updatePause,
    lastSync,
    chooseTask,
    refresh,
    login,
    logout,
    create,
    continueTask,
    retry,
  };
}
export type Workspace = ReturnType<typeof useWorkspace>;
export function taskIdFromHash() {
  const part = window.location.hash.slice(1).split("/").at(-1) ?? "";
  return /^[0-9a-f-]{36}$/i.test(part) ? part : "";
}
export function time(value: string) {
  return new Intl.DateTimeFormat("es", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}
