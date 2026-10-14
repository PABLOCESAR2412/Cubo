import { D1TaskStore, StoreError } from "@cubo/database";
import { demoInputSchema, runnerUpdateSchema } from "@cubo/shared";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { deleteCookie, setCookie } from "hono/cookie";
import { z } from "zod";
import {
  localAccess,
  ownerAuthorized,
  passwordMatches,
  runnerAuthorized,
  sessionToken,
} from "./auth.ts";
import { chatRoutes } from "./chat";
import type { Env } from "./env.ts";
import { projectRoutes } from "./projects";
export async function dispatchOutbox(env: Env): Promise<void> {
  const store = new D1TaskStore(env.DB);
  for (const item of await store.outbox()) {
    const id = `${item.id}-dispatch-${item.orchestration_attempt}`;
    try {
      await env.TASK_WORKFLOW.create({ id, params: { executionId: item.id } });
      await store.markWorkflowCreated(item.id);
    } catch {
      // Si create tuvo efecto y se perdió la respuesta, comprobar la instancia antes de reintentar.
      try {
        await (await env.TASK_WORKFLOW.get(id)).status();
        await store.markWorkflowCreated(item.id);
      } catch {
        /* La cola persistida se reconciliará con el cron. */
      }
    }
  }
}
const app = new Hono<{ Bindings: Env; Variables: { runnerId: string } }>();
app.use(
  "/api/*",
  bodyLimit({
    maxSize: 8192,
    onError: (c) => c.json({ error: "Solicitud demasiado grande." }, 413),
  }),
);
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  if (
    ["POST", "DELETE", "PUT"].includes(c.req.method) &&
    !c.req.path.startsWith("/api/executions/")
  ) {
    const origin = c.req.header("Origin");
    const expected = localAccess(c) ? "http://127.0.0.1:5173" : new URL(c.req.url).origin;
    if (origin !== expected && origin !== new URL(c.req.url).origin)
      return c.json({ error: "Origen no autorizado." }, 403);
  }
  await next();
});
app.get("/api/health", (c) =>
  c.json({ ok: true, service: "cubo", executionBackend: "github-actions" }),
);
app.get("/api/session", async (c) =>
  c.json({
    authenticated: await ownerAuthorized(c),
    executionConfigured: Boolean(c.env.GITHUB_TOKEN),
    local: localAccess(c),
    costGuardVerified: c.env.GITHUB_ZERO_SPEND_VERIFIED === "true",
  }),
);
app.post("/api/login", async (c) => {
  if (!c.env.OWNER_PASSWORD || !c.env.SESSION_SECRET)
    return c.json({ error: "Configura el acceso personal del backend." }, 503);
  const store = new D1TaskStore(c.env.DB);
  if (!(await store.allowLogin(c.req.header("CF-Connecting-IP") ?? "local")))
    return c.json({ error: "Demasiados intentos. Espera un minuto." }, 429);
  const body = z
    .object({ password: z.string().min(1).max(256) })
    .strict()
    .safeParse(await c.req.json());
  if (!body.success || !(await passwordMatches(body.data.password, c.env.OWNER_PASSWORD)))
    return c.json({ error: "Clave incorrecta." }, 401);
  setCookie(c, "cubo_session", await sessionToken(c.env), {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Strict",
    path: "/",
    maxAge: 28800,
  });
  return c.json({ authenticated: true });
});
app.post("/api/logout", (c) => {
  deleteCookie(c, "cubo_session", { path: "/" });
  return c.json({ ok: true });
});
app.use("/api/tasks/*", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  await next();
});
app.use("/api/tasks", async (c, next) => {
  if (!(await ownerAuthorized(c)))
    return c.json({ error: "Inicia sesión para acceder a Cubo." }, 401);
  await next();
});
app.get("/api/tasks", async (c) => c.json({ tasks: await new D1TaskStore(c.env.DB).listTasks() }));
app.post("/api/tasks", async (c) => {
  const key = z.uuid().safeParse(c.req.header("Idempotency-Key"));
  const input = demoInputSchema.safeParse(await c.req.json());
  if (!key.success || !input.success)
    return c.json({ error: "Datos de tarea o clave de creación inválidos." }, 400);
  const task = await new D1TaskStore(c.env.DB).createTask(key.data, input.data);
  // La persistencia y el cron cubren cierres del cliente durante el envío.
  await dispatchOutbox(c.env);
  return c.json({ task }, 202);
});
app.get("/api/tasks/:id", async (c) => {
  const store = new D1TaskStore(c.env.DB);
  const task = await store.findTask(c.req.param("id"));
  if (!task) return c.json({ error: "Tarea desconocida." }, 404);
  return c.json({
    task,
    events: await store.events(task.id),
    checkpoint: await store.latestCheckpoint(task.id),
    approvals: await store.approvals(task.id),
  });
});
app.post("/api/tasks/:id/approve", async (c) => {
  const body = z
    .object({ approvalId: z.string().min(1).max(100), version: z.number().int().positive() })
    .strict()
    .safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Datos de aprobación inválidos." }, 400);
  const task = await new D1TaskStore(c.env.DB).approve(
    c.req.param("id"),
    body.data.approvalId,
    body.data.version,
  );
  await dispatchOutbox(c.env);
  return c.json({ task }, 202);
});
app.post("/api/tasks/:id/retry-dispatch", async (c) => {
  if (c.env.GITHUB_ZERO_SPEND_VERIFIED !== "true")
    return c.json({ error: "COST_GUARD_NOT_VERIFIED" }, 409);
  if (!c.env.GITHUB_TOKEN) return c.json({ error: "EXECUTION_CONFIGURATION_REQUIRED" }, 409);
  const task = await new D1TaskStore(c.env.DB).retryDispatch(c.req.param("id"));
  await dispatchOutbox(c.env);
  return c.json({ task }, 202);
});
app.use("/api/executions/*", async (c, next) => {
  try {
    c.set("runnerId", await runnerAuthorized(c));
  } catch {
    return c.json({ error: "Identidad de runner inválida." }, 401);
  }
  await next();
});
app.post("/api/executions/:id/claim", async (c) => {
  await new D1TaskStore(c.env.DB).claim(c.req.param("id"), c.get("runnerId"));
  return c.json({ ok: true });
});
app.get("/api/executions/:id/context", async (c) =>
  c.json(await new D1TaskStore(c.env.DB).context(c.req.param("id"), c.get("runnerId"))),
);
app.post("/api/executions/:id/progress", async (c) => {
  const body = runnerUpdateSchema.safeParse(await c.req.json());
  if (!body.success) return c.json({ error: "Checkpoint inválido." }, 400);
  await new D1TaskStore(c.env.DB).saveProgress(c.req.param("id"), c.get("runnerId"), body.data);
  return c.json({ ok: true });
});
app.notFound((c) => c.json({ error: "Ruta desconocida." }, 404));
app.route("/api/conversations", chatRoutes);
app.route("/api/projects", projectRoutes);
app.onError((error, c) => {
  if (error instanceof StoreError)
    return c.json({ error: error.message }, error.code as 400 | 403 | 404 | 409 | 429);
  if (error instanceof SyntaxError) return c.json({ error: "JSON inválido." }, 400);
  // No enviar ni registrar errores crudos que puedan contener credenciales.
  return c.json({ error: "No fue posible completar la operación. Reintenta." }, 500);
});

export { app };
