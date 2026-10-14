import { z } from "zod";

export const importInputSchema = z
  .object({
    type: z.literal("REPOSITORY_IMPORT"),
    steps: z.literal(4).default(4),
    pauseAt: z.null().default(null),
    projectId: z.uuid(),
    repository: z
      .string()
      .regex(/^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/),
    access: z.enum(["PUBLIC", "SSH"]),
    keyId: z.uuid().nullable(),
  })
  .strict()
  .refine((value) => (value.access === "SSH" ? value.keyId !== null : value.keyId === null));
export type RepositoryImportInput = z.infer<typeof importInputSchema>;
const fileSchema = z
  .object({ path: z.string().min(1).max(160), content: z.string().max(4000) })
  .strict();
export const importUpdateSchema = z
  .object({
    sequence: z.number().int().min(1).max(4),
    revision: z.string().regex(/^[a-f0-9]{40,64}$/),
    fileCount: z.number().int().min(0).max(100000),
    inventory: z.array(z.string().min(1).max(160)).max(100),
    files: z.array(fileSchema).max(12),
    summary: z.string().max(2000),
  })
  .strict();
export type RepositoryImportUpdate = z.infer<typeof importUpdateSchema>;
export interface RepositoryImportResult {
  revision: string;
  fileCount: number;
  importedFileCount: number;
  steps: 4;
  sum?: never;
}
export interface RepositorySnapshot extends RepositoryImportUpdate {
  taskId: string;
  projectId: string;
  executionId: string;
  digest: string;
  createdAt: string;
}
export interface RepositoryKeyInfo {
  id: string;
  publicKey: string;
  fingerprint: string;
  createdAt: string;
}
export {
  excludedRepositoryPath,
  isImportInput,
  looksLikeSecret,
  safeRepositoryPath,
} from "./repository-safety";
