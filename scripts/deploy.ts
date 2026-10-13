import { file, spawn } from "bun";

const config = await file("apps/api/wrangler.jsonc").json();
if (
  config.account_id !== "6fcab192a8cc2a3458247ef5c8108a07" ||
  config.name !== "cubo-dev" ||
  config.vars.GITHUB_REPOSITORY !== "PABLOCESAR2412/Cubo"
)
  throw new Error("Destino no autorizado.");
if (
  config.vars.GITHUB_ZERO_SPEND_VERIFIED !== "true" ||
  process.env.CUBO_FREE_PLAN_VERIFIED !== "true"
)
  throw new Error("Verifica Workers Free y bloqueo de gasto cero; ver README.");
const profile = `${process.env.USERPROFILE ?? process.env.HOME}/.config/cubo/cloudflare-personal`;
const secretsPath = process.env.CUBO_SECRETS_FILE ?? `${profile}/cubo-dev.secrets.json`;
if (!(await file(secretsPath).exists()))
  throw new Error("Falta el archivo privado de credenciales. Sigue docs/cloud-setup.md.");
const secrets = (await file(secretsPath).json()) as {
  GITHUB_TOKEN?: string;
  OWNER_PASSWORD?: string;
  SESSION_SECRET?: string;
};
if (
  !secrets.GITHUB_TOKEN ||
  !secrets.OWNER_PASSWORD ||
  secrets.OWNER_PASSWORD.length < 12 ||
  !secrets.SESSION_SECRET ||
  secrets.SESSION_SECRET.length < 32
)
  throw new Error("Credenciales de desarrollo incompletas.");
async function github(path: string) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${secrets.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "Cubo",
    },
    redirect: "error",
  });
  if (!response.ok)
    throw new Error(`GitHub no permite la comprobación de despliegue (HTTP ${response.status}).`);
  return (await response.json()) as Record<string, unknown>;
}
const user = await github("/user");
if (user.login !== "PABLOCESAR2412") throw new Error("El token no pertenece al GitHub personal.");
const repo = await github("/repos/PABLOCESAR2412/Cubo");
if (repo.private !== true) throw new Error("Cubo debe permanecer privado.");
const workflow = await github("/repos/PABLOCESAR2412/Cubo/actions/workflows/cubo-runner.yml");
if (workflow.state !== "active" || workflow.path !== ".github/workflows/cubo-runner.yml")
  throw new Error("Publica primero el workflow preparado en la rama main.");
const env = { ...process.env, XDG_CONFIG_HOME: profile, CLOUDFLARE_ACCOUNT_ID: config.account_id };
const identity = spawn(["bunx", "--no-install", "wrangler", "whoami", "--json"], {
  env,
  stdout: "pipe",
  stderr: "inherit",
});
const who = (await new Response(identity.stdout).json()) as {
  email: string;
  accounts: Array<{ id: string }>;
};
if (
  (await identity.exited) !== 0 ||
  who.email !== "pablocesar.t.g@gmail.com" ||
  !who.accounts.some((a) => a.id === config.account_id)
)
  throw new Error("El perfil no coincide con la cuenta personal de Cubo.");
for (const command of ["test", "lint", "typecheck", "build"]) {
  const process = spawn(["bun", "run", command], { stdout: "inherit", stderr: "inherit" });
  if ((await process.exited) !== 0) throw new Error("La validación falló; no se desplegó.");
}
const deploy = spawn(
  [
    "bunx",
    "--no-install",
    "wrangler",
    "deploy",
    "--config",
    "apps/api/wrangler.jsonc",
    "--secrets-file",
    secretsPath,
  ],
  { env, stdout: "inherit", stderr: "inherit" },
);
process.exit(await deploy.exited);
