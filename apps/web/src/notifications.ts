import type { TaskStatus } from "@cubo/shared";

export interface NotificationPreferences {
  enabled: boolean;
  notifyTaskCompleted: boolean;
  notifyTaskFailed: boolean;
  notifyTaskApproval: boolean;
}

const PREF_KEY = "cubo_notification_prefs";

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const prefs = getNotificationPreferences();
      saveNotificationPreferences({ ...prefs, enabled: true });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getNotificationPreferences(): NotificationPreferences {
  if (typeof localStorage === "undefined") {
    return {
      enabled: false,
      notifyTaskCompleted: true,
      notifyTaskFailed: true,
      notifyTaskApproval: true,
    };
  }
  try {
    const stored = localStorage.getItem(PREF_KEY);
    if (!stored) {
      return {
        enabled: isNotificationSupported() && Notification.permission === "granted",
        notifyTaskCompleted: true,
        notifyTaskFailed: true,
        notifyTaskApproval: true,
      };
    }
    return JSON.parse(stored) as NotificationPreferences;
  } catch {
    return {
      enabled: false,
      notifyTaskCompleted: true,
      notifyTaskFailed: true,
      notifyTaskApproval: true,
    };
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* localStorage unavailable */
  }
}

export function notifyTaskStatus(task: {
  id: string;
  title: string;
  status: TaskStatus;
  error?: string | null;
}): void {
  if (!isNotificationSupported() || Notification.permission !== "granted") return;
  const prefs = getNotificationPreferences();
  if (!prefs.enabled) return;

  let title = "";
  let body = "";

  if (task.status === "WAITING_APPROVAL" && prefs.notifyTaskApproval) {
    title = "Cubo · Decisión requerida";
    body = `La tarea "${task.title}" requiere tu aprobación para continuar.`;
  } else if (task.status === "SUCCEEDED" && prefs.notifyTaskCompleted) {
    title = "Cubo · Tarea completada";
    body = `La tarea "${task.title}" ha finalizado con éxito.`;
  } else if (task.status === "FAILED" && prefs.notifyTaskFailed) {
    title = "Cubo · Tarea falló";
    body = `La tarea "${task.title}" se detuvo con error: ${task.error ?? "desconocido"}.`;
  } else {
    return;
  }

  try {
    const notification = new Notification(title, {
      body,
      icon: "/icon-192.png",
      tag: `cubo-task-${task.id}-${task.status}`,
    });

    notification.onclick = () => {
      window.focus();
      const url = new URL(window.location.href);
      url.hash = `#/tareas/${task.id}`;
      window.location.href = url.toString();
      notification.close();
    };
  } catch {
    /* Ignorar restricciones de invocación en segundo plano */
  }
}
