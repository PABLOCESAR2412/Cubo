import { z } from "zod";

export const agentTaskInputSchema = z
  .object({
    type: z.literal("AGENT_TASK"),
    agent: z.enum(["opencode", "codex"]),
    instructions: z.string().min(1).max(10000),
    projectId: z.string().uuid().nullable().optional(),
    repository: z.string().nullable().optional(),
    targetRef: z.string().default("main"),
    actionRequested: z.enum(["plan", "edit", "commit", "push"]).default("edit"),
  })
  .strict();

export type AgentTaskInput = z.infer<typeof agentTaskInputSchema>;

export interface AgentTaskResult {
  agent: "opencode" | "codex";
  summary: string;
  diff?: string;
  diffDigest?: string;
  gitAction?: "git.commit" | "git.push" | "github.pull-request.create";
  stepsCompleted: number;
}

export function isAgentTaskInput(input: unknown): input is AgentTaskInput {
  return (
    typeof input === "object" &&
    input !== null &&
    (input as { type?: unknown }).type === "AGENT_TASK"
  );
}
