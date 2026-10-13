import { describe, expect, test } from "bun:test";
import { D1TaskStore } from "@cubo/database";
import { demoInputSchema, expectedSum } from "@cubo/shared";
import { executeDemo } from "../packages/runner/src/demo.ts";
import { database } from "./sqlite.ts";

describe("persistencia y checkpoints", () => {
  test("creación idempotente y rechazo de la misma clave con otro input", async () => {
    const { db, sqlite } = database();
    const store = new D1TaskStore(db);
    const id = crypto.randomUUID();
    const input = demoInputSchema.parse({});
    await store.createTask(id, input);
    await store.createTask(id, input);
    expect((await store.listTasks()).length).toBe(1);
    await expect(store.createTask(id, { ...input, steps: 2 })).rejects.toThrow("otros datos");
    sqlite.close();
  });
  test("runner nuevo continúa checkpoint aprobado y el runner anterior no puede escribir", async () => {
    const { db, sqlite } = database();
    const store = new D1TaskStore(db);
    let task = await store.createTask(
      crypto.randomUUID(),
      demoInputSchema.parse({ steps: 4, pauseAt: 2 }),
    );
    await store.claim(task.executionId, "10");
    await executeDemo(
      await store.context(task.executionId, "10"),
      (u) => store.saveProgress(task.executionId, "10", u),
      async () => {},
    );
    const paused = await store.findTask(task.id);
    if (!paused) throw new Error("Falta tarea persistida.");
    task = paused;
    expect(task.status).toBe("WAITING_APPROVAL");
    expect(task.progress).toBe(2);
    const approval = (await store.approvals(task.id))[0];
    if (!approval) throw new Error("Falta aprobación persistida.");
    const original = task.executionId;
    task = await store.approve(task.id, approval.id, task.version);
    expect(task.executionId).not.toBe(original);
    expect(task.attempt).toBe(2);
    await store.approve(task.id, approval.id, task.version);
    expect((await store.findTask(task.id))?.attempt).toBe(2);
    await expect(store.context(original, "10")).rejects.toThrow("sustituida");
    await store.claim(task.executionId, "11");
    await executeDemo(
      await store.context(task.executionId, "11"),
      (u) => store.saveProgress(task.executionId, "11", u),
      async () => {},
    );
    const recovered = await new D1TaskStore(db).findTask(task.id);
    expect(recovered?.status).toBe("SUCCEEDED");
    expect(recovered?.result?.sum).toBe(expectedSum(4));
    sqlite.close();
  });
  test("checkpoint repetido no duplica eventos; orden y resultado se validan", async () => {
    const { db, sqlite } = database();
    const store = new D1TaskStore(db);
    const task = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({ steps: 2 }));
    await store.claim(task.executionId, "10");
    const update = { sequence: 1, cursor: 1, sum: 1, outcome: "RUNNING" as const };
    await store.saveProgress(task.executionId, "10", update);
    await store.saveProgress(task.executionId, "10", update);
    expect((await store.events(task.id)).length).toBe(3);
    await expect(store.saveProgress(task.executionId, "10", { ...update, sum: 2 })).rejects.toThrow(
      "inválido",
    );
    await expect(
      store.saveProgress(task.executionId, "10", {
        sequence: 3,
        cursor: 2,
        sum: 5,
        outcome: "SUCCEEDED",
      }),
    ).rejects.toThrow("inválido");
    await expect(store.claim(task.executionId, "other")).rejects.toThrow("Otro runner");
    await store.saveProgress(task.executionId, "10", {
      sequence: 2,
      cursor: 2,
      sum: 5,
      outcome: "SUCCEEDED",
    });
    await store.failExecution(task.executionId, "error tardío");
    expect((await store.findTask(task.id))?.status).toBe("SUCCEEDED");
    sqlite.close();
  });
  test("rechaza saltos, aprobaciones sin pausa y callbacks sin identidad", async () => {
    const { db, sqlite } = database();
    const store = new D1TaskStore(db);
    const task = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({ steps: 4 }));
    await expect(store.context(task.executionId, "10")).rejects.toThrow("autorizado");
    await store.claim(task.executionId, "10");
    await expect(
      store.saveProgress(task.executionId, "10", {
        sequence: 2,
        cursor: 2,
        sum: 5,
        outcome: "RUNNING",
      }),
    ).rejects.toThrow("fuera de orden");
    await expect(store.approve(task.id, "missing", task.version)).rejects.toThrow("desconocida");
    sqlite.close();
  });
  test("cuota agotada conserva tarea y datos; requiere reintento explícito o fecha", async () => {
    const { db, sqlite } = database();
    const store = new D1TaskStore(db);
    const task = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({}));
    await store.deferExecution(task.executionId, "EXECUTION_QUOTA_EXHAUSTED");
    const queued = await store.findTask(task.id);
    expect(queued?.status).toBe("QUEUED");
    expect(queued?.error).toBe("EXECUTION_QUOTA_EXHAUSTED");
    expect(await store.outbox()).toHaveLength(0);
    await store.retryDispatch(task.id);
    expect(await store.outbox()).toHaveLength(1);
    sqlite.close();
  });
});
