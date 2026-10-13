import { expect, test } from "bun:test";
import { app } from "../apps/api/src/app.ts";
import { passwordMatches, verifyRunnerClaims } from "../apps/api/src/auth.ts";
import type { Env } from "../apps/api/src/env.ts";
import { database } from "./sqlite.ts";

function environment(db: D1Database): Env {
  return {
    DB: db,
    TASK_WORKFLOW: {
      create: async () => ({}),
      get: async () => ({ status: async () => ({ status: "queued" }) }),
    } as unknown as Env["TASK_WORKFLOW"],
    ASSETS: {} as Fetcher,
    GITHUB_REPOSITORY: "PABLOCESAR2412/Cubo",
    GITHUB_WORKFLOW: "cubo-runner.yml",
    GITHUB_REF: "main",
    GITHUB_ZERO_SPEND_VERIFIED: "false",
    CUBO_URL: "https://cubo.example",
    LOCAL_DEV: "true",
  };
}
test("API crea y recupera tarea desde una solicitud nueva; auth remota falla cerrada", async () => {
  const { db, sqlite } = database();
  const env = environment(db);
  const id = crypto.randomUUID();
  const create = await app.request(
    "http://127.0.0.1/api/tasks",
    {
      method: "POST",
      headers: {
        Origin: "http://127.0.0.1",
        "Content-Type": "application/json",
        "Idempotency-Key": id,
      },
      body: "{}",
    },
    env,
  );
  expect(create.status).toBe(202);
  const restored = await app.request(`http://127.0.0.1/api/tasks/${id}`, {}, environment(db));
  expect(restored.status).toBe(200);
  expect(((await restored.json()) as { task: { id: string } }).task.id).toBe(id);
  expect((await app.request("https://cubo.example/api/tasks", {}, env)).status).toBe(401);
  expect(
    (
      await app.request(
        "http://127.0.0.1/api/tasks",
        { method: "POST", headers: { Origin: "https://evil.example" }, body: "{}" },
        env,
      )
    ).status,
  ).toBe(403);
  expect(
    (
      await app.request(
        `http://127.0.0.1/api/executions/${id}/claim`,
        { method: "POST", body: "{}" },
        env,
      )
    ).status,
  ).toBe(401);
  sqlite.close();
});
test("identidad runner exige repo, workflow, ref y evento correctos", () => {
  const { db, sqlite } = database();
  const env = environment(db);
  const claims = {
    repository: env.GITHUB_REPOSITORY,
    ref: "refs/heads/main",
    workflow_ref: "PABLOCESAR2412/Cubo/.github/workflows/cubo-runner.yml@refs/heads/main",
    event_name: "workflow_dispatch",
    runner_environment: "github-hosted",
    run_id: "10",
  };
  expect(verifyRunnerClaims(claims, env)).toBe("10");
  expect(() => verifyRunnerClaims({ ...claims, repository: "someone/other" }, env)).toThrow();
  expect(() => verifyRunnerClaims({ ...claims, event_name: "pull_request" }, env)).toThrow();
  expect(() => verifyRunnerClaims({ ...claims, workflow_ref: "different" }, env)).toThrow();
  sqlite.close();
});
test("comparación de clave y esquema acotado", async () => {
  expect(await passwordMatches("right", "right")).toBe(true);
  expect(await passwordMatches("wrong", "right")).toBe(false);
});
