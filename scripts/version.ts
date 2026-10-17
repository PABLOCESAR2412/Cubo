import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
export function advanceVersion(base: string, commits: string[]): string {
  let [major = 1, minor = 0, patch = 0] = base.split(".").map(Number);
  for (const commit of commits) {
    if (/^[\w-]+(?:\([^)]*\))?!:/.test(commit) || /BREAKING CHANGE:/.test(commit)) {
      major++;
      minor = 0;
      patch = 0;
    } else if (/^feat(?:\([^)]*\))?:/.test(commit)) {
      minor++;
      patch = 0;
    } else if (!/^(docs|test|ci|style)(?:\([^)]*\))?:/.test(commit)) {
      patch++;
    }
  }
  return `${major}.${minor}.${patch}`;
}
export function buildVersion(): string {
  const cwd = fileURLToPath(new URL("../", import.meta.url));
  const base = JSON.parse(readFileSync(new URL("../version.json", import.meta.url), "utf8"))
    .version as string;
  const git = (args: string[]) => {
    try {
      return execFileSync("git", args, {
        cwd,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    } catch {
      return "";
    }
  };
  const isDirty = Boolean(git(["diff", "--name-only", "HEAD", "--", "version.json"]));
  if (isDirty) return base;
  const start = git(["log", "-1", "--format=%H", "--", "version.json"]);
  if (!start) return base;
  const commits = git(["log", "--reverse", "--format=%B%x00", `${start}..HEAD`])
    .split("\0")
    .map((s) => s.trim())
    .filter(Boolean);
  return advanceVersion(base, commits);
}
