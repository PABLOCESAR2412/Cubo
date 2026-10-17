import type { RunnerContext, RunnerUpdate } from "@cubo/shared";
export async function executeDemo(
  context: RunnerContext,
  persist: (update: RunnerUpdate) => Promise<void>,
  sleep: (ms: number) => Promise<void>,
): Promise<void> {
  const input = context.task.input;
  if ("type" in input) throw new Error("Ejecutor de demostración incompatible.");
  let cursor = context.checkpoint?.cursor ?? 0;
  let sum = context.checkpoint?.sum ?? 0;
  while (cursor < input.steps) {
    await sleep(input.delaySeconds * 1000);
    cursor++;
    sum += cursor * cursor;
    const outcome =
      cursor === input.steps
        ? "SUCCEEDED"
        : cursor === input.pauseAt && context.task.attempt === 1
          ? "WAITING_APPROVAL"
          : "RUNNING";
    await persist({ sequence: cursor, cursor, sum, outcome });
    if (outcome !== "RUNNING") return;
  }
}
