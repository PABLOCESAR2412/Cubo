import { D1TaskStore } from "@cubo/database";
import { GitHubActionsExecutionBackend } from "@cubo/runner";
import { TaskEngine } from "@cubo/tasks";
import type { Env } from "./env";
export function createTaskEngine(env: Env, store = new D1TaskStore(env.DB)) {
  return new TaskEngine(
    store,
    new GitHubActionsExecutionBackend(
      {
        repository: env.GITHUB_REPOSITORY,
        workflow: env.GITHUB_WORKFLOW,
        ref: env.GITHUB_REF,
        token: env.GITHUB_TOKEN ?? "",
        zeroSpendVerified: env.GITHUB_ZERO_SPEND_VERIFIED === "true",
      },
      (id) => store.findExecution(id),
    ),
  );
}
