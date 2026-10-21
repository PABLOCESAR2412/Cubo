import { beforeEach, describe, expect, it, mock } from "bun:test";
import {
  getNotificationPermission,
  getNotificationPreferences,
  isNotificationSupported,
  notifyTaskStatus,
  requestNotificationPermission,
  saveNotificationPreferences,
} from "../apps/web/src/notifications";

describe("Notifications Service", () => {
  beforeEach(() => {
    // @ts-expect-error Mock window in test runner
    globalThis.window = globalThis;
    // Mock localStorage
    const store: Record<string, string> = {};
    globalThis.localStorage = {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, val: string) => {
        store[key] = val;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        for (const k of Object.keys(store)) delete store[k];
      },
      key: (i: number) => Object.keys(store)[i] ?? null,
      length: Object.keys(store).length,
    };
  });

  it("checks notification support correctly", () => {
    expect(typeof isNotificationSupported()).toBe("boolean");
  });

  it("persists and reads user notification preferences", () => {
    const defaultPrefs = getNotificationPreferences();
    expect(defaultPrefs.notifyTaskCompleted).toBe(true);

    saveNotificationPreferences({
      enabled: true,
      notifyTaskCompleted: false,
      notifyTaskFailed: true,
      notifyTaskApproval: true,
    });

    const updated = getNotificationPreferences();
    expect(updated.enabled).toBe(true);
    expect(updated.notifyTaskCompleted).toBe(false);
  });

  it("handles requestNotificationPermission when Notification API exists", async () => {
    globalThis.Notification = {
      permission: "granted" as NotificationPermission,
      requestPermission: mock(async () => "granted" as NotificationPermission),
    } as unknown as typeof Notification;

    const granted = await requestNotificationPermission();
    expect(granted).toBe(true);
    expect(getNotificationPermission()).toBe("granted");
  });

  it("dispatches notifications for critical task status transitions", () => {
    const instances: Array<{ title: string; options: unknown }> = [];

    // @ts-expect-error Mock Notification constructor
    globalThis.Notification = class MockNotification {
      static permission = "granted";
      static requestPermission = async () => "granted";
      constructor(title: string, options: unknown) {
        instances.push({ title, options });
      }
      close() {}
    };

    saveNotificationPreferences({
      enabled: true,
      notifyTaskCompleted: true,
      notifyTaskFailed: true,
      notifyTaskApproval: true,
    });

    notifyTaskStatus({
      id: "t-1",
      title: "Generar componente",
      status: "WAITING_APPROVAL",
    });

    expect(instances.length).toBe(1);
    expect(instances[0].title).toBe("Cubo · Decisión requerida");

    notifyTaskStatus({
      id: "t-2",
      title: "Test de build",
      status: "SUCCEEDED",
    });

    expect(instances.length).toBe(2);
    expect(instances[1].title).toBe("Cubo · Tarea completada");

    notifyTaskStatus({
      id: "t-3",
      title: "Prueba fallida",
      status: "FAILED",
      error: "OOM",
    });

    expect(instances.length).toBe(3);
    expect(instances[2].title).toBe("Cubo · Tarea falló");

    // RUNNING should NOT trigger notification
    notifyTaskStatus({
      id: "t-4",
      title: "En progreso",
      status: "RUNNING",
    });

    expect(instances.length).toBe(3);
  });
});
