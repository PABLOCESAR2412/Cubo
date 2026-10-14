export interface Env {
  DB: D1Database;
  TASK_WORKFLOW: Workflow<{ executionId: string }>;
  ASSETS: Fetcher;
  GITHUB_REPOSITORY: string;
  GITHUB_WORKFLOW: string;
  GITHUB_REF: string;
  GITHUB_TOKEN?: string;
  GITHUB_ZERO_SPEND_VERIFIED: string;
  CUBO_URL: string;
  OWNER_PASSWORD?: string;
  SESSION_SECRET?: string;
  LOCAL_DEV?: string;
  PROJECT_ENCRYPTION_KEY?: string;
}
