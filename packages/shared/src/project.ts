import { z } from "zod";

export interface StoredProject {
  id: string;
  name: string;
  repository: string | null;
  instructions: string;
  memory: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  chatCount: number;
}
const repository = z
  .string()
  .trim()
  .max(240)
  .refine(
    (value) =>
      value === "" ||
      /^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(value),
    "Usa una URL HTTPS de GitHub sin credenciales ni parámetros.",
  )
  .transform((value) => (value ? value.replace(/\/$/, "").replace(/\.git$/, "") : null));
export const projectInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    repository: repository.optional().transform((value) => value ?? null),
  })
  .strict();
export const projectUpdateSchema = z
  .object({
    version: z.number().int().positive(),
    name: z.string().trim().min(1).max(120),
    instructions: z.string().max(3000),
    memory: z.string().max(3000),
  })
  .strict();
