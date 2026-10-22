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

// Resultado final que el runner reporta por tarea de agente. No comparte el
// checkpoint aritmético de la demo (sin expectedSum: los adaptadores usan
// cursor=index y el digest del checkpoint ligará el diff cuando exista).
export const agentProgressSchema = z
  .object({
    sequence: z.number().int().min(1).max(12),
    cursor: z.number().int().min(1).max(12),
    sum: z.number().int().min(1).max(12),
    outcome: z.enum(["SUCCEEDED", "WAITING_APPROVAL"]),
    summary: z.string().min(1).max(2000).optional(),
    diff: z.string().min(1).max(100000).optional(),
  })
  .strict();
export type AgentProgressUpdate = z.infer<typeof agentProgressSchema>;

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
