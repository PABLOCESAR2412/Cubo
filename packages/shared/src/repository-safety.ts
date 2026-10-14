import type { RepositoryImportInput } from "./repository";
export function isImportInput(input: unknown): input is RepositoryImportInput {
  return (
    !!input && typeof input === "object" && "type" in input && input.type === "REPOSITORY_IMPORT"
  );
}
export function safeRepositoryPath(path: string): boolean {
  return (
    path.length <= 160 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").some((p) => p === ".." || p === "" || p === ".git") &&
    !Array.from(path).some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)
  );
}
export function excludedRepositoryPath(path: string): boolean {
  return /(^|\/)(?:\.env(?:\..*)?|\.ssh|\.aws|\.git|node_modules|vendor|dist|build|coverage|\.next)(\/|$)|(?:^|\/)(?:credentials|secrets)(?:[./-]|$)|\.(?:pem|key|p12|pfx|keystore)$/i.test(
    path,
  );
}
export function looksLikeSecret(text: string): boolean {
  return /(?:github_pat_|gh[pousr]_|sk-(?:proj-)?)[A-Za-z0-9_-]{16,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|AKIA[A-Z0-9]{16}|(?:api[_-]?key|secret|password|token)\s*[:=]\s*["']?[A-Za-z0-9_\-+/=]{16,}/i.test(
    text,
  );
}
