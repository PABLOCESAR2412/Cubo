import { spawn } from "bun";

for (const command of [
  ["bun", "run", "scripts/assets.ts"],
  ["bun", "run", "--cwd", "apps/web", "build"],
  [
    "bunx",
    "--no-install",
    "wrangler",
    "deploy",
    "--config",
    "apps/api/wrangler.jsonc",
    "--dry-run",
    "--outdir",
    "dist",
  ],
]) {
  const result = spawn(command, { stdout: "inherit", stderr: "inherit" });
  const code = await result.exited;
  if (code !== 0) process.exit(code);
}
