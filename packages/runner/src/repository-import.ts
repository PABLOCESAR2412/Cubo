import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import type {
  RepositoryImportInput,
  RepositoryImportUpdate,
  RepositorySnapshot,
} from "../../shared/src/repository.ts";
import {
  excludedRepositoryPath,
  looksLikeSecret,
  repositoryContextRole,
  safeRepositoryPath,
} from "../../shared/src/repository-safety.ts";

const hostKey =
  "github.com ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIOMqqnkVzrm0SdG6UOoqKLsabgH5C9okWi0dh2l9GKJl\n";
function command(args: string[], env: NodeJS.ProcessEnv, limit = 2 * 1024 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      env,
      stdio: ["ignore", "pipe", "ignore"],
      windowsHide: true,
    });
    const chunks: Uint8Array[] = [];
    let size = 0;
    const timer = setTimeout(() => child.kill("SIGKILL"), 90000);
    child.stdout.on("data", (chunk: Uint8Array) => {
      size += chunk.length;
      if (size > limit) child.kill("SIGKILL");
      else chunks.push(chunk);
    });
    child.once("error", () => {
      clearTimeout(timer);
      reject(new Error("No se pudo leer el repositorio."));
    });
    child.once("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 || size > limit)
        reject(new Error("No se pudo leer el repositorio dentro de los límites."));
      else {
        const output = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) {
          output.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(new TextDecoder().decode(output));
      }
    });
  });
}
export async function importRepository(
  input: RepositoryImportInput,
  previous: RepositorySnapshot | null,
  privateKey: string | null,
  persist: (update: RepositoryImportUpdate) => Promise<void>,
  options: { contextDocuments?: boolean } = {},
): Promise<void> {
  if (!/^https:\/\/github\.com\/[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(input.repository))
    throw new Error("Repositorio inválido.");
  const scratch = await mkdtemp(join(tmpdir(), "cubo-import-"));
  const repo = join(scratch, "repository");
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: scratch,
    SYSTEMROOT: process.env.SYSTEMROOT,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: join(scratch, "config"),
    GIT_TERMINAL_PROMPT: "0",
    GIT_LFS_SKIP_SMUDGE: "1",
    GIT_OPTIONAL_LOCKS: "0",
  };
  await writeFile(join(scratch, "config"), "");
  let remote = input.repository;
  try {
    if (input.access === "SSH") {
      if (!privateKey || !/^[A-Za-z0-9_./-]+$/.test(scratch))
        throw new Error("Conexión SSH no disponible.");
      const identity = join(scratch, "identity"),
        hosts = join(scratch, "known_hosts");
      await writeFile(identity, privateKey, { mode: 0o600 });
      await writeFile(hosts, hostKey, { mode: 0o600 });
      env.GIT_SSH_COMMAND = `ssh -F /dev/null -i ${identity} -o IdentitiesOnly=yes -o BatchMode=yes -o StrictHostKeyChecking=yes -o HostKeyAlgorithms=ssh-ed25519 -o UserKnownHostsFile=${hosts}`;
      remote = `git@github.com:${input.repository.slice("https://github.com/".length)}.git`;
    }
    const guard = [
      "-c",
      `core.hooksPath=${join(scratch, "disabled-hooks")}`,
      "-c",
      "protocol.file.allow=never",
      "-c",
      "protocol.ext.allow=never",
      "-c",
      "credential.helper=",
    ];
    await command(
      [
        ...guard,
        "clone",
        "--filter=blob:none",
        "--depth",
        "1",
        "--no-tags",
        "--no-checkout",
        "--single-branch",
        "--",
        remote,
        repo,
      ],
      env,
    );
    const git = (...args: string[]) => command([...guard, "-C", repo, ...args], env);
    const revision = (await git("rev-parse", "HEAD")).trim();
    if (!/^[a-f0-9]{40,64}$/.test(revision)) throw new Error("Revisión inválida.");
    if (previous && previous.revision !== revision)
      throw new Error("La revisión remota cambió; crea una nueva importación.");
    let update: RepositoryImportUpdate = {
      sequence: 1,
      revision,
      fileCount: 0,
      inventory: [],
      files: [],
      summary: "",
    };
    if (!previous || previous.sequence < 1) await persist(update);
    const entries = (await git("ls-tree", "-rz", "--full-tree", revision))

      .split("\0")
      .filter(Boolean);
    const clean = entries.flatMap((entry) => {
      const match = /^(100644|100755) blob ([a-f0-9]{40,64})\t(.+)$/.exec(entry);
      if (
        !match ||
        !safeRepositoryPath(match[3]) ||
        excludedRepositoryPath(match[3]) ||
        looksLikeSecret(match[3]) ||
        Buffer.byteLength(match[3], "utf8") > 160
      )
        return [];
      return [{ path: match[3], sha: match[2] }];
    });
    clean.sort(
      (a, b) =>
        Number(Boolean(repositoryContextRole(b.path))) -
          Number(Boolean(repositoryContextRole(a.path))) || a.path.localeCompare(b.path),
    );
    const inventory = clean.slice(0, 100).map((item) => item.path);
    update = { ...update, sequence: 2, fileCount: entries.length, inventory };
    if (!previous || previous.sequence < 2) await persist(update);
    const candidates = clean
      .filter(
        (item) =>
          inventory.includes(item.path) &&
          /(?:^|\/)(?:README(?:\.[\w-]+)?|AGENTS\.md|CLAUDE\.md|package\.json|Cargo\.toml|pyproject\.toml|go\.mod)$|\.(?:md|ts|tsx|js|jsx|json|yaml|yml|toml|css|html|py|rs|go)$/i.test(
            item.path,
          ),
      )
      .sort((a, b) => {
        const rank = (path: string) =>
          repositoryContextRole(path) ? 0 : /(?:^|\/)(?:README|package\.json)/i.test(path) ? 1 : 2;
        return rank(a.path) - rank(b.path) || a.path.localeCompare(b.path);
      });
    const files: RepositoryImportUpdate["files"] = [];
    for (const item of candidates) {
      if (files.length >= 12) break;
      const size = Number(await git("cat-file", "-s", item.sha));
      const contextFile =
        options.contextDocuments !== false && Boolean(repositoryContextRole(item.path));
      if (!Number.isSafeInteger(size) || size > (contextFile ? 64000 : 4000)) continue;
      const content = await git("cat-file", "blob", item.sha);
      if (content.includes("\0") || content.includes("\uFFFD") || looksLikeSecret(content))
        continue;
      files.push({
        path: item.path,
        content: content.slice(0, 4000),
        ...(content.length > 4000 ? { truncated: true } : {}),
      });
    }
    const summary = `Repositorio: ${input.repository}\nRevisión: ${revision}\nArchivos en Git: ${entries.length}. Inventario disponible: ${inventory.length}. Textos importados: ${files.length}.\nImportación acotada y de lectura; archivos excluidos o grandes no forman parte del contexto.`;
    update = { ...update, sequence: 3, files, summary };
    if (Buffer.byteLength(JSON.stringify(update), "utf8") > 120000)
      throw new Error("Snapshot demasiado grande.");
    if (!previous || previous.sequence < 3) await persist(update);
    await persist({ ...update, sequence: 4 });
  } finally {
    if (resolve(scratch).startsWith(`${resolve(tmpdir())}${sep}cubo-import-`))
      await rm(scratch, { recursive: true, force: true });
  }
}
