import type { Env } from "./env";

export function containsSecret(text: string, env: Env): boolean {
  return (
    [env.GITHUB_TOKEN, env.OWNER_PASSWORD, env.SESSION_SECRET, env.PROJECT_ENCRYPTION_KEY].some(
      (value) => !!value && text.includes(value),
    ) ||
    /(?:github_pat_|gh[pousr]_|sk-(?:proj-)?)[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
      text,
    )
  );
}
