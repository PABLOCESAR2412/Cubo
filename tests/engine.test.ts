import { expect, test } from "bun:test";
import { D1TaskStore } from "@cubo/database";
import type { ExecutionBackend } from "@cubo/runner";
import { demoInputSchema, ExecutionBlockedError } from "@cubo/shared";
import { type DurableSteps, TaskEngine } from "@cubo/tasks";
import { executeDemo } from "../packages/runner/src/demo.ts";
import { database } from "./sqlite.ts";

test("motor independiente del cliente y del proveedor guarda el resultado remoto", async () => {
  const { db, sqlite } = database();
  const store = new D1TaskStore(db);
  const task = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({ steps: 2 }));
  let runs = 0;
  const backend: ExecutionBackend = {
    start: async () => {
      runs++;
      await store.claim(task.executionId, "run");
      const execution = await store.findExecution(task.executionId);
      if (!execution) throw new Error("Falta ejecución persistida.");
      return execution;
    },
    cancel: async () => {},
    getStatus: async () => {
      await executeDemo(
        await store.context(task.executionId, "run"),
        (u) => store.saveProgress(task.executionId, "run", u),
        async () => {},
      );
      return "SUCCEEDED";
    },
  };
  const steps: DurableSteps = { do: async (_name, action) => action(), sleep: async () => {} };
  await new TaskEngine(store, backend).run(task.executionId, steps);
  expect((await new D1TaskStore(db).findTask(task.id))?.result).toEqual({ sum: 5, steps: 2 });
  await new TaskEngine(store, backend).run(task.executionId, steps);
  expect(runs).toBe(1);
  sqlite.close();
});
test("cuota no convierte tarea en fallo ni mantiene un runner esperando", async () => {
  const { db, sqlite } = database();
  const store = new D1TaskStore(db);
  const task = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({}));
  const backend: ExecutionBackend = {
    start: async () => {
      throw new ExecutionBlockedError("EXECUTION_QUOTA_EXHAUSTED");
    },
    cancel: async () => {},
    getStatus: async () => "UNKNOWN",
  };
  let sleeps = 0;
  await new TaskEngine(store, backend).run(task.executionId, {
    do: async (_n, action) => action(),
    sleep: async () => {
      sleeps++;
    },
  });
  expect((await store.findTask(task.id))?.status).toBe("QUEUED");
  expect((await store.findTask(task.id))?.error).toBe("EXECUTION_QUOTA_EXHAUSTED");
  expect(sleeps).toBe(0);
  sqlite.close();
});
