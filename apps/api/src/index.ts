import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { D1TaskStore } from "@cubo/database";
import { app, dispatchOutbox } from "./app.ts";
import type { Env } from "./env.ts";
import { createTaskEngine } from "./execution-engine";
export class TaskWorkflow extends WorkflowEntrypoint<Env, { executionId: string }> {
  async run(event: WorkflowEvent<{ executionId: string }>, step: WorkflowStep): Promise<void> {
    const store = new D1TaskStore(this.env.DB);
    if (!this.env.GITHUB_TOKEN || this.env.GITHUB_ZERO_SPEND_VERIFIED !== "true") {
      await step.do("configuration-blocked", () =>
        store.deferExecution(
          event.payload.executionId,
          this.env.GITHUB_ZERO_SPEND_VERIFIED !== "true"
            ? "COST_GUARD_NOT_VERIFIED"
            : "EXECUTION_CONFIGURATION_REQUIRED",
        ),
      );
      return;
    }
    const engine = createTaskEngine(this.env, store);
    await engine.run(event.payload.executionId, {
      do: async (name, action) =>
        step.do(
          name,
          {
            retries: { limit: 2, delay: "5 seconds", backoff: "exponential" },
            timeout: "1 minute",
          },
          action,
        ),
      sleep: async (name, milliseconds) => step.sleep(name, milliseconds),
    });
  }
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) return app.fetch(request, env);
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller: ScheduledController, env: Env): Promise<void> {
    const store = new D1TaskStore(env.DB),
      engine = createTaskEngine(env, store);
    for (const id of await store.pendingCancellations()) await engine.reconcileCancellation(id);
    await dispatchOutbox(env);
    await new D1TaskStore(env.DB).cleanupLoginLimits();
  },
} satisfies ExportedHandler<Env>;
