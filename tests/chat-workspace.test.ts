import { expect, spyOn, test } from "bun:test";
import { D1ChatStore, D1ProjectStore, D1TaskStore } from "@cubo/database";
import { chatTurnInputSchema } from "@cubo/shared";
import { decodeJwt, jwtVerify, SignJWT } from "jose";
import { app } from "../apps/api/src/app";
import { sessionToken } from "../apps/api/src/auth";
import type { Env } from "../apps/api/src/env";
import { providerBlocked, providerKey } from "../apps/api/src/project-providers";
import { encryptSecret } from "../apps/api/src/secret-vault";
import { OpenRouterProvider } from "../packages/providers/src/openrouter";
import { advanceVersion } from "../scripts/version";
import { database } from "./sqlite";

function environment(db: D1Database): Env {
  return {
    DB: db,
    SESSION_SECRET: "s".repeat(40),
    OWNER_PASSWORD: "fixture-password",
    PROJECT_ENCRYPTION_KEY: btoa("a".repeat(32)),
    LOCAL_DEV: "true",
    GITHUB_REPOSITORY: "PABLOCESAR2412/Cubo",
    GITHUB_WORKFLOW: "cubo-runner.yml",
    GITHUB_REF: "main",
    GITHUB_ZERO_SPEND_VERIFIED: "false",
    CUBO_URL: "https://cubo.example",
    TASK_WORKFLOW: {
      create: async () => ({}),
      get: async () => ({ status: async () => ({ status: "queued" }) }),
    } as unknown as Env["TASK_WORKFLOW"],
    ASSETS: {} as Fetcher,
  };
}
test("sesión sin vencimiento de Cubo persiste y logout revoca el token", async () => {
  const { db, sqlite } = database(),
    env = environment(db);
  try {
    const token = await sessionToken(env);
    expect(decodeJwt(token).exp).toBeUndefined();
    expect(decodeJwt(token).jti).toBeString();
    await jwtVerify(token, new TextEncoder().encode(env.SESSION_SECRET), {
      currentDate: new Date("2099-01-01"),
      issuer: "cubo",
      audience: "owner",
    });
    const headers = { Cookie: `cubo_session=${token}`, Origin: "https://cubo.example" };
    const session = await app.request("https://cubo.example/api/session", { headers }, env);
    expect(((await session.json()) as { authenticated: boolean }).authenticated).toBe(true);
    expect(session.headers.get("set-cookie")).toContain("Max-Age=34560000");
    expect(
      (await app.request("https://cubo.example/api/logout", { method: "POST", headers }, env))
        .status,
    ).toBe(200);
    expect(
      (
        (await (
          await app.request("https://cubo.example/api/session", { headers }, env)
        ).json()) as { authenticated: boolean }
      ).authenticated,
    ).toBe(false);
  } finally {
    sqlite.close();
  }
});
test("sesión legacy válida se actualiza sin pedir login", async () => {
  const { db, sqlite } = database(),
    env = environment(db);
  try {
    const token = await new SignJWT({ role: "owner" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuer("cubo")
      .setAudience("owner")
      .setExpirationTime("8h")
      .sign(new TextEncoder().encode(env.SESSION_SECRET));
    const response = await app.request(
      "https://cubo.example/api/session",
      { headers: { Cookie: `cubo_session=${token}` } },
      env,
    );
    expect(((await response.json()) as { authenticated: boolean }).authenticated).toBe(true);
    const next = response.headers.get("set-cookie")?.match(/cubo_session=([^;]+)/)?.[1];
    expect(next).toBeDefined();
    expect(decodeJwt(next ?? "").exp).toBeUndefined();
    expect(decodeJwt(next ?? "").jti).toBeString();
  } finally {
    sqlite.close();
  }
});
test("conexión general cifrada se comparte sin compartir contexto ni revelar la clave", async () => {
  const { db, sqlite } = database(),
    env = environment(db);
  try {
    const p = await new D1ProjectStore(db).create(crypto.randomUUID(), "A", null),
      b = await new D1ProjectStore(db).create(crypto.randomUUID(), "B", null),
      id = crypto.randomUUID();
    const encrypted = await encryptSecret(
      "fixture-key",
      env.PROJECT_ENCRYPTION_KEY ?? "",
      `global:openrouter:${id}`,
    );
    await db
      .prepare("INSERT INTO provider_keys VALUES(?,'openrouter',?,?,?)")
      .bind(id, encrypted.ciphertext, encrypted.iv, new Date().toISOString())
      .run();
    expect(await providerKey(env, p.id, id)).toBe("fixture-key");
    expect(await providerKey(env, b.id, id)).toBe("fixture-key");
    await expect(providerKey(env, p.id, crypto.randomUUID())).rejects.toThrow("no autorizada");
    const chat = await new D1ChatStore(db, p.id).create(crypto.randomUUID(), "A");
    await expect(new D1ChatStore(db, b.id).detail(chat.id)).rejects.toThrow("desconocida");
    expect(
      (await app.request("https://cubo.example/api/providers/openrouter", {}, env)).status,
    ).toBe(401);
  } finally {
    sqlite.close();
  }
});
test("guardar clave general valida, cifra y conserva la conexión sin exponerla", async () => {
  const { db, sqlite } = database(),
    env = environment(db),
    key = `sk-or-v1-${"f".repeat(32)}`;
  const mock = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(async () => Response.json({ data: { limit_remaining: null } }), {
      preconnect: () => {},
    }),
  );
  try {
    const saved = await app.request(
      "http://127.0.0.1/api/providers/openrouter",
      {
        method: "PUT",
        headers: { Origin: "http://127.0.0.1", "Content-Type": "application/json" },
        body: JSON.stringify({ key }),
      },
      env,
    );
    expect(saved.status).toBe(200);
    expect(await saved.json()).toEqual({ configured: true });
    const row = await db
      .prepare("SELECT id,ciphertext FROM provider_keys WHERE provider='openrouter'")
      .first<{ id: string; ciphertext: string }>();
    expect(row).not.toBeNull();
    expect(row?.ciphertext).not.toContain(key);
    expect(await providerKey(env, "", row?.id ?? "")).toBe(key);
  } finally {
    mock.mockRestore();
    sqlite.close();
  }
});
test("adjuntos quedan en mensaje/contexto y nunca en otro proyecto", async () => {
  const { db, sqlite } = database();
  try {
    const p = await new D1ProjectStore(db).create(crypto.randomUUID(), "A", null),
      chat = new D1ChatStore(db, p.id),
      c = await chat.create(crypto.randomUUID(), "Archivos"),
      id = crypto.randomUUID();
    const attachments = [{ name: "guia.md", text: "Fixture de documento", truncated: false }];
    await new D1TaskStore(db).createTask(
      id,
      chatTurnInputSchema.parse({
        type: "CHAT_TURN",
        projectId: p.id,
        conversationId: c.id,
        userMessageId: id,
        keyId: crypto.randomUUID(),
        provider: "openrouter",
        model: "test/model:free",
      }),
      {
        messages: [{ role: "user", content: "Revisa" }],
        projectVersion: 1,
        repositoryRevision: null,
        attachments,
      },
    );
    expect((await chat.detail(c.id)).messages[0].attachments).toEqual(attachments);
  } finally {
    sqlite.close();
  }
});
test("esfuerzo usa solo capacidades anunciadas y respaldo una vez en rechazo explícito", async () => {
  let posts = 0;
  const bodies: Record<string, unknown>[] = [];
  const provider = new OpenRouterProvider(async (path, init) => {
    if (path.endsWith("/models"))
      return Response.json({
        data: ["a/free:free", "b/free:free"].map((id) => ({
          id,
          pricing: { prompt: "0", completion: "0" },
          reasoning: { supported_efforts: ["low", "high"], mandatory: true },
        })),
      });
    posts++;
    bodies.push(JSON.parse(String(init?.body)));
    if (posts === 1) return Response.json({}, { status: 429 });
    return Response.json({
      choices: [{ message: { content: "Fixture respuesta" }, finish_reason: "stop" }],
      usage: { cost: 0 },
    });
  });
  const models = await provider.freeModels();
  expect(models[0].efforts).toEqual(["low", "high"]);
  await expect(provider.complete("fixture", "a/free:free", [], "medium")).rejects.toThrow(
    "FREE_MODEL_REQUIRED",
  );
  expect(posts).toBe(0);
  const result = await provider.completeWithFallback("fixture", "a/free:free", [], {
    effort: "low",
    fallbackModel: "b/free:free",
  });
  expect(result.model).toBe("b/free:free");
  expect(posts).toBe(2);
  expect(bodies[0].reasoning).toEqual({ effort: "low", exclude: true });
  expect(bodies[1].reasoning).toBeUndefined();
  const uncertain = new OpenRouterProvider(async (path) => {
    if (path.endsWith("/models"))
      return Response.json({
        data: [{ id: "a/free:free", pricing: { prompt: "0", completion: "0" } }],
      });
    throw Error("Network timeout");
  });
  await expect(
    uncertain.completeWithFallback("fixture", "a/free:free", [], { fallbackModel: "b/free:free" }),
  ).rejects.toThrow("Network timeout");
});
test("un coste inesperado bloquea la conexión general sin propagar contexto entre proyectos", async () => {
  const { db, sqlite } = database();
  try {
    const a = crypto.randomUUID(),
      b = crypto.randomUUID(),
      id = crypto.randomUUID();
    await db
      .prepare(
        "INSERT INTO tasks(id,title,status,input,execution_id,created_at,updated_at,error) VALUES(?,'Fixture','FAILED',?,?,?,?,'UNEXPECTED_PROVIDER_COST')",
      )
      .bind(
        id,
        JSON.stringify({ type: "CHAT_TURN", provider: "openrouter", projectId: a }),
        `${id}-1`,
        new Date().toISOString(),
        new Date().toISOString(),
      )
      .run();
    expect(await providerBlocked(db, a)).toBe(true);
    expect(await providerBlocked(db, b)).toBe(false);
    expect(await providerBlocked(db, null)).toBe(true);
  } finally {
    sqlite.close();
  }
});
test("versiones se incrementan según intención del cambio, sin contar cambios de documentación", () => {
  expect(advanceVersion("1.0.0", ["fix: detail", "feat: attachments", "fix: polish"])).toBe(
    "1.1.1",
  );
  expect(advanceVersion("1.2.3", ["feat!: new protocol", "fix: follow-up"])).toBe("2.0.1");
  expect(advanceVersion("1.0.0", ["docs: update"])).toBe("1.0.0");
});
test("preferencias globales rechazan presupuestos, respaldo pago y tiempos inválidos", async () => {
  const { db, sqlite } = database(),
    env = environment(db);
  const mock = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(async () => Response.json({ data: [] }), { preconnect: () => {} }),
  );
  try {
    const r = await app.request(
      "http://127.0.0.1/api/providers/openrouter/preferences",
      {
        method: "PUT",
        headers: { Origin: "http://127.0.0.1", "Content-Type": "application/json" },
        body: JSON.stringify({ fallbackModel: "paid/model", noticeSeconds: 30 }),
      },
      env,
    );
    expect(r.status).toBe(400);
    const bad = await app.request(
      "http://127.0.0.1/api/providers/openrouter/preferences",
      {
        method: "PUT",
        headers: { Origin: "http://127.0.0.1", "Content-Type": "application/json" },
        body: JSON.stringify({ fallbackModel: "", noticeSeconds: 1, budget: 10 }),
      },
      env,
    );
    expect(bad.status).toBe(400);
  } finally {
    mock.mockRestore();
    sqlite.close();
  }
});
