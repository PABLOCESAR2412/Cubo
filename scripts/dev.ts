import { spawn } from "bun";

const assets = spawn(["bun", "run", "scripts/assets.ts"], { stdout: "inherit", stderr: "inherit" });
if ((await assets.exited) !== 0) process.exit(1);

const migration = spawn(["bun", "run", "db:migrate"], { stdout: "inherit", stderr: "inherit" });
if ((await migration.exited) !== 0) process.exit(1);
const build = spawn(["bun", "run", "--cwd", "apps/web", "build"], {
  stdout: "inherit",
  stderr: "inherit",
});
if ((await build.exited) !== 0) process.exit(1);
const children = [
  spawn(
    [
      "bunx",
      "--no-install",
      "wrangler",
      "dev",
      "--config",
      "apps/api/wrangler.jsonc",
      "--port",
      "8787",
      "--var",
      "LOCAL_DEV:true",
    ],
    { stdout: "inherit", stderr: "inherit" },
  ),
  spawn(["bun", "run", "--cwd", "apps/web", "dev"], { stdout: "inherit", stderr: "inherit" }),
];
function stop() {
  for (const child of children) child.kill();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await Promise.race(children.map((child) => child.exited));
stop();
