import { z } from "zod";
import type { ChatProviderAdapter } from "./openrouter.ts";

export class TypeSafeAiError extends Error {
  readonly code: "JSON_PARSE_ERROR" | "SCHEMA_VALIDATION_ERROR" | "PROVIDER_ERROR";
  constructor(
    message: string,
    code: "JSON_PARSE_ERROR" | "SCHEMA_VALIDATION_ERROR" | "PROVIDER_ERROR",
  ) {
    super(message);
    this.name = "TypeSafeAiError";
    this.code = code;
  }
}

// 1. Esquema para Propuestas de Tareas y Refactorizaciones
export const taskProposalSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(1000),
  suggestedAgent: z.enum(["codex", "opencode"]),
  category: z.enum(["refactor", "feature", "bugfix", "test", "docs"]),
  rationale: z.string().max(500),
  estimatedSteps: z.array(z.string()).min(1).max(10),
  impactAssessment: z.string().max(300),
});
export type TaskProposal = z.infer<typeof taskProposalSchema>;

// 2. Esquema para Síntesis y Actualización de Memoria de Proyecto
export const projectMemorySchema = z.object({
  summary: z.string().max(500),
  keyDecisions: z.array(z.string()).max(10),
  architecturePatterns: z.array(z.string()).max(10),
  pendingDecisions: z.array(z.string()).max(10),
  updatedMemoryMarkdown: z.string().max(3000),
});
export type ProjectMemoryUpdate = z.infer<typeof projectMemorySchema>;

// 3. Esquema para Sugerencias Contextuales y Acciones Rápidas
export const suggestionListSchema = z.object({
  contextTopic: z.string(),
  suggestions: z
    .array(
      z.object({
        title: z.string().min(2).max(100),
        prompt: z.string().min(5).max(300),
        actionType: z.enum(["query", "refactor", "task", "diagnose"]),
        confidence: z.number().min(0).max(1),
      }),
    )
    .min(1)
    .max(6),
});
export type SuggestionList = z.infer<typeof suggestionListSchema>;

// 4. Esquema para Revisión y Propuesta de Cambios de Código
export const codeReviewProposalSchema = z.object({
  summary: z.string().max(400),
  positives: z.array(z.string()).max(6),
  risks: z.array(z.string()).max(6),
  recommendedActions: z.array(z.string()).min(1).max(8),
});
export type CodeReviewProposal = z.infer<typeof codeReviewProposalSchema>;

/**
 * Ejecutor Type-Safe para estructurar salidas de LLMs garantizando estricta validación de esquemas Zod.
 */
export async function generateTypeSafe<T>(
  adapter: ChatProviderAdapter,
  key: string,
  model: string,
  prompt: string,
  schema: z.ZodType<T>,
  systemContext = "Eres un asistente de ingeniería de software en Cubo. Devuelve ÚNICAMENTE un JSON válido que cumpla con el esquema requerido, sin comentarios ni explicaciones adicionales.",
): Promise<T> {
  const messages = [
    {
      role: "system" as const,
      content: `${systemContext}\nIMPORTANTE: Tu respuesta debe ser un objeto JSON puro válido sin bloques de markdown (\`\`\`json).`,
    },
    {
      role: "user" as const,
      content: prompt,
    },
  ];

  const result = await adapter.complete(key, model, messages);
  let rawContent = result.content.trim();

  // Eliminar delimitadores de markdown si el modelo los incluye
  if (rawContent.startsWith("```")) {
    rawContent = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawContent);
  } catch (err) {
    throw new TypeSafeAiError(
      `El modelo no devolvió un JSON válido: ${err instanceof Error ? err.message : String(err)}`,
      "JSON_PARSE_ERROR",
    );
  }

  const validation = schema.safeParse(parsedJson);
  if (!validation.success) {
    throw new TypeSafeAiError(
      `La salida no cumple con el contrato Type-Safe: ${validation.error.issues.map((i: z.ZodIssue) => `${i.path.join(".")}: ${i.message}`).join(", ")}`,
      "SCHEMA_VALIDATION_ERROR",
    );
  }

  return validation.data;
}

/**
 * Generador especializado de propuestas de tareas para agentes (Codex / OpenCode)
 */
export async function generateTaskProposal(
  adapter: ChatProviderAdapter,
  key: string,
  model: string,
  input: { projectContext: string; userIntent: string },
): Promise<TaskProposal> {
  const prompt = `Contexto del Proyecto:\n${input.projectContext}\n\nIntención del Usuario:\n${input.userIntent}\n\nGenera una propuesta estructurada para ejecutar esta tarea con un agente de Cubo.`;
  return generateTypeSafe(adapter, key, model, prompt, taskProposalSchema);
}

/**
 * Síntesis type-safe de memoria de proyecto a partir de cambios y decisiones
 */
export async function synthesizeProjectMemory(
  adapter: ChatProviderAdapter,
  key: string,
  model: string,
  input: { currentMemory: string; recentTurns: string },
): Promise<ProjectMemoryUpdate> {
  const prompt = `Memoria Actual:\n${input.currentMemory}\n\nNuevas Interacciones / Decisiones:\n${input.recentTurns}\n\nSintetiza las decisiones y actualiza la memoria técnica del proyecto preservando hechos clave.`;
  return generateTypeSafe(adapter, key, model, prompt, projectMemorySchema);
}

/**
 * Generador type-safe de sugerencias y siguientes pasos para el usuario
 */
export async function generateSuggestions(
  adapter: ChatProviderAdapter,
  key: string,
  model: string,
  input: { conversationContext: string },
): Promise<SuggestionList> {
  const prompt = `Historial de la conversación:\n${input.conversationContext}\n\nGenera de 2 a 4 sugerencias concisas y relevantes para que el desarrollador continúe trabajando.`;
  return generateTypeSafe(adapter, key, model, prompt, suggestionListSchema);
}
