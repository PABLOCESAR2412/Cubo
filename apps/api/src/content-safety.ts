import type { Env } from "./env";

export function containsSecret(text: string, env: Env): boolean {
  return (
    [env.GITHUB_TOKEN, env.OWNER_PASSWORD, env.SESSION_SECRET, env.PROJECT_ENCRYPTION_KEY].some(
      (value) => !!value && text.includes(value),
    ) ||
    // Cubre los prefijos de claves que la propia app acepta en Ajustes (project-providers).
    /(?:github_pat_|gh[pousr]_|sk-(?:proj-)?)[A-Za-z0-9_-]{16,}|AIzaSy[A-Za-z0-9_-]{25,}|gsk_[A-Za-z0-9]{40,}|nvapi-[A-Za-z0-9_-]{28,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(
      text,
    )
  );
}
