import { expect, spyOn, test } from "bun:test";
import { D1ChatExecutionStore, D1ChatStore, D1ProjectStore, D1TaskStore } from "@cubo/database";
import type { ExecutionBackend } from "@cubo/runner";
import { type ChatTurnContext, chatTurnInputSchema, demoInputSchema } from "@cubo/shared";
import { TaskEngine } from "@cubo/tasks";
import { app } from "../apps/api/src/app";
import type { Env } from "../apps/api/src/env";
import { providerKey } from "../apps/api/src/project-providers";
import { decryptSecret, encryptSecret } from "../apps/api/src/secret-vault";
import { OpenRouterProvider } from "../packages/providers/src/openrouter";
import { repositoryContextRole } from "../packages/shared/src/repository-safety";
import { database } from "./sqlite";

const context: ChatTurnContext = {
  projectVersion: 1,
  repositoryRevision: null,
  messages: [
    { role: "system", content: "Proyecto de prueba" },
    { role: "user", content: "Mensaje de prueba" },
  ],
};
test("turno durable conserva usuario, contexto, respuesta y uso sin duplicar", async () => {
  const { db, sqlite } = database();
  try {
    const p = await new D1ProjectStore(db).create(crypto.randomUUID(), "A", null),
      chat = new D1ChatStore(db, p.id);
    const c = await chat.create(crypto.randomUUID(), "Chat"),
      store = new D1TaskStore(db),
      turns = new D1ChatExecutionStore(db),
      id = crypto.randomUUID();
    const input = chatTurnInputSchema.parse({
      type: "CHAT_TURN",
      projectId: p.id,
      conversationId: c.id,
      userMessageId: id,
      keyId: crypto.randomUUID(),
      provider: "openrouter",
      model: "test/model:free",
    });
    const task = await store.createTask(id, input, context);
    await store.createTask(id, input, context);
    expect((await chat.detail(c.id)).messages.length).toBe(1);
    await expect(chat.append(c.id, crypto.randomUUID(), "Otro mensaje")).rejects.toThrow(
      "turno activo",
    );
    const secondId = crypto.randomUUID();
    await expect(
      store.createTask(secondId, { ...input, userMessageId: secondId }, context),
    ).rejects.toThrow("active turn");
    expect(await store.findTask(secondId)).toBeNull();
    await store.beginDispatch(task.executionId);
    await store.claim(task.executionId, "run");
    await expect(turns.acquire(task.executionId, "other")).rejects.toThrow("no autorizado");
    const frozen = await turns.acquire(task.executionId, "run");
    expect(frozen.context).toEqual(context);
    await expect(turns.acquire(task.executionId, "run")).rejects.toThrow("ya fue entregada");
    const response = {
      content: "Respuesta de fixture",
      model: input.model,
      inputTokens: 10,
      outputTokens: 3,
      costUsd: 0 as const,
      costQuality: "exact" as const,
    };
    await turns.complete(task.executionId, "run", response);
    await turns.complete(task.executionId, "run", response);
    const detail = await chat.detail(c.id);
    expect(detail.messages.length).toBe(2);
    expect(detail.messages[1].role).toBe("assistant");
    expect(detail.turns?.[0].result?.inputTokens).toBe(10);
    expect((await store.findTask(id))?.status).toBe("SUCCEEDED");
    await expect(
      turns.complete(task.executionId, "run", { ...response, content: "Distinta" }),
    ).rejects.toThrow("terminado");
    const b = await new D1ProjectStore(db).create(crypto.randomUUID(), "B", null);
    const invalidId = crypto.randomUUID();
    await expect(
      store.createTask(invalidId, { ...input, projectId: b.id, userMessageId: invalidId }, context),
    ).rejects.toThrow("scope mismatch");
    expect(await store.findTask(invalidId)).toBeNull();
    await expect(new D1ChatStore(db, b.id).detail(c.id)).rejects.toThrow("desconocida");
    await chat.remove(c.id, detail.conversation.version);
    expect((await chat.recent()).length).toBe(0);
  } finally {
    sqlite.close();
  }
});
test("API inicia chat por proyecto con contexto congelado y claves nunca públicas", async () => {
  const { db, sqlite } = database(),
    master = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const env: Env = {
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
    PROJECT_ENCRYPTION_KEY: master,
  };
  const mock = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async () =>
        Response.json({
          data: [
            {
              id: "test/free:free",
              name: "Fixture gratuito",
              pricing: { prompt: "0", completion: "0" },
            },
          ],
        }),
      { preconnect: () => {} },
    ),
  );
  try {
    const projects = new D1ProjectStore(db),
      a = await projects.create(crypto.randomUUID(), "A", null),
      b = await projects.create(crypto.randomUUID(), "B", null);
    await projects.update(a.id, a.version, a.name, "ONLY_A", "");
    await projects.update(b.id, b.version, b.name, "ONLY_B", "");
    const chat = await new D1ChatStore(db, a.id).create(crypto.randomUUID(), "Chat"),
      keyId = crypto.randomUUID();
    const encrypted = await encryptSecret("fixture", master, `${a.id}:openrouter:${keyId}`);
    await db
      .prepare("INSERT INTO project_provider_keys VALUES(?,?,'openrouter',?,?,?)")
      .bind(keyId, a.id, encrypted.ciphertext, encrypted.iv, new Date().toISOString())
      .run();
    const id = crypto.randomUUID(),
      url = `http://127.0.0.1/api/conversations/${chat.id}/turn?project=${a.id}`,
      options = {
        method: "POST",
        headers: {
          Origin: "http://127.0.0.1",
          "Content-Type": "application/json",
          "Idempotency-Key": id,
        },
        body: JSON.stringify({ model: "test/free:free", content: "Hola" }),
      };
    expect((await app.request(url, options, env)).status).toBe(202);
    expect((await app.request(url, options, env)).status).toBe(202);
    const task = await new D1TaskStore(db).findTask(id);
    expect(task?.status).toBe("QUEUED");
    const frozen = await db
      .prepare("SELECT context FROM chat_turns WHERE task_id=?")
      .bind(id)
      .first<{ context: string }>();
    expect(frozen?.context).toContain("ONLY_A");
    expect(frozen?.context).not.toContain("ONLY_B");
    expect((await app.request(url.replace(a.id, b.id), options, env)).status).toBe(404);
    await expect(providerKey(env, b.id, keyId)).rejects.toThrow("no autorizada");
    const recents = (await (
      await app.request("http://127.0.0.1/api/conversations/recent", {}, env)
    ).json()) as { conversations: Array<{ projectId: string }>; messages?: unknown };
    expect(recents.conversations[0].projectId).toBe(a.id);
    expect(recents.messages).toBeUndefined();
    expect(
      (
        await app.request(
          `http://127.0.0.1/api/executions/${id}-1/chat-request`,
          { method: "POST", body: "{}" },
          env,
        )
      ).status,
    ).toBe(401);
  } finally {
    mock.mockRestore();
    sqlite.close();
  }
});
test("cancelación revoca callbacks y espera confirmación del backend", async () => {
  const { db, sqlite } = database();
  try {
    const store = new D1TaskStore(db),
      task = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({}));
    await store.beginDispatch(task.executionId);
    await store.claim(task.executionId, "run");
    await store.requestCancellation(task.id);
    let cancelled = false;
    const backend: ExecutionBackend = {
      start: async () => {
        throw Error("No iniciar");
      },
      cancel: async () => {},
      getStatus: async () => (cancelled ? "CANCELLED" : "RUNNING"),
    };
    const engine = new TaskEngine(store, backend);
    expect(await engine.reconcileCancellation(task.executionId)).toBe(false);
    expect((await store.findTask(task.id))?.status).toBe("RUNNING");
    await expect(store.context(task.executionId, "run")).rejects.toThrow("revocados");
    await store.failExecution(task.executionId, "No sustituir cancelación");
    expect((await store.findTask(task.id))?.status).toBe("RUNNING");
    cancelled = true;
    expect(await engine.reconcileCancellation(task.executionId)).toBe(true);
    expect((await store.findTask(task.id))?.status).toBe("CANCELLED");
    const queued = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({}));
    await store.requestCancellation(queued.id);
    expect(await engine.reconcileCancellation(queued.executionId)).toBe(true);
    expect(await store.beginDispatch(queued.executionId)).toBe(false);
    const legacyId = `legacy-${crypto.randomUUID()}`;
    await db
      .prepare(
        "INSERT INTO executions(id,task_id,backend,status,created_at) VALUES(?,?,'github-actions','QUEUED',?)",
      )
      .bind(legacyId, queued.id, new Date().toISOString())
      .run();
    expect((await store.findExecution(legacyId))?.dispatchStarted).toBe(true);
  } finally {
    sqlite.close();
  }
});
test("OpenRouter bloquea modelos pagos y conserva solo cuotas expuestas", async () => {
  let completions = 0;
  const provider = new OpenRouterProvider(async (url, init) => {
    if (url.endsWith("models"))
      return Response.json({
        data: [
          { id: "test/free:free", name: "Free", pricing: { prompt: "0", completion: "0" } },
          { id: "test/paid", pricing: { prompt: "1", completion: "1" } },
        ],
      });
    if (url.endsWith("key")) return Response.json({ data: { limit_remaining: null } });
    completions++;
    const body = JSON.parse(String(init?.body));
    expect(body.model).toBe("test/free:free");
    expect(body.provider.allow_fallbacks).toBe(false);
    expect(body.plugins).toEqual([]);
    return Response.json({
      choices: [{ message: { content: "Fixture" } }],
      usage: { prompt_tokens: 9, completion_tokens: 2, cost: 0 },
    });
  });
  expect((await provider.freeModels()).length).toBe(1);
  await expect(provider.complete("fixture", "test/paid", [])).rejects.toThrow(
    "FREE_MODEL_REQUIRED",
  );
  expect(completions).toBe(0);
  const quota = await provider.quota("fixture");
  expect(quota.quality).toBe("unavailable");
  expect(quota.requestsRemaining).toBeNull();
  const response = await provider.complete("fixture", "test/free:free", context.messages);
  expect(response.costQuality).toBe("exact");
  expect(response.inputTokens).toBe(9);
  const limited = new OpenRouterProvider(async () =>
    Response.json({ secret: "do-not-log" }, { status: 429 }),
  );
  await expect(limited.quota("fixture")).rejects.toThrow("PROVIDER_QUOTA_EXHAUSTED");
  const unexpected = new OpenRouterProvider(async (url) =>
    url.endsWith("models")
      ? Response.json({
          data: [{ id: "test/free:free", pricing: { prompt: "0", completion: "0" } }],
        })
      : Response.json({ choices: [{ message: { content: "Fixture" } }], usage: { cost: 0.1 } }),
  );
  await expect(unexpected.complete("fixture", "test/free:free", context.messages)).rejects.toThrow(
    "UNEXPECTED_PROVIDER_COST",
  );
});
test("secretos de proveedor y fuentes de contexto mantienen aislamiento", async () => {
  const master = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const encrypted = await encryptSecret("fixture", master, "project-a:provider:key");
  expect(await decryptSecret(encrypted, master, "project-a:provider:key")).toBe("fixture");
  await expect(decryptSecret(encrypted, master, "project-b:provider:key")).rejects.toThrow();
  expect(repositoryContextRole("AGENTS.md")).toBe("INSTRUCTIONS");
  expect(repositoryContextRole("MEMORY.md")).toBe("MEMORY");
  expect(repositoryContextRole("another-project/MEMORY.md")).toBeNull();
});
