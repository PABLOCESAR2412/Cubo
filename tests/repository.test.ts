import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { D1ProjectStore, D1RepositoryStore, D1TaskStore } from "@cubo/database";
import {
  demoInputSchema,
  excludedRepositoryPath,
  importInputSchema,
  looksLikeSecret,
  safeRepositoryPath,
} from "@cubo/shared";
import { decryptProjectKey, generateProjectKey } from "../apps/api/src/repository-keys";
import { database } from "./sqlite";

test("importación conserva checkpoints, revisión y contexto por proyecto", async () => {
  const { db, sqlite } = database();
  const projects = new D1ProjectStore(db),
    store = new D1TaskStore(db),
    repo = new D1RepositoryStore(db);
  const a = await projects.create(
    crypto.randomUUID(),
    "A",
    "https://github.com/octocat/Hello-World",
  );
  const b = await projects.create(crypto.randomUUID(), "B", null);
  const input = importInputSchema.parse({
    type: "REPOSITORY_IMPORT",
    projectId: a.id,
    repository: a.repository,
    access: "PUBLIC",
    keyId: null,
  });
  const task = await store.createTask(crypto.randomUUID(), input);
  await store.claim(task.executionId, "run");
  const base = {
    revision: "a".repeat(40),
    fileCount: 1,
    inventory: ["README.md"],
    files: [],
    summary: "",
  };
  await expect(
    repo.saveProgress(task.executionId, "run", { ...base, sequence: 2 }),
  ).rejects.toThrow("fuera de orden");
  for (const sequence of [1, 2, 3, 4]) {
    if (sequence === 4)
      await expect(
        repo.saveProgress(task.executionId, "run", {
          ...base,
          sequence,
          fileCount: 2,
          files: [{ path: "README.md", content: "Contexto A" }],
          summary: "Resumen A",
        }),
      ).rejects.toThrow("resultado cambió");
    await repo.saveProgress(task.executionId, "run", {
      ...base,
      sequence,
      files: sequence >= 3 ? [{ path: "README.md", content: "Contexto A" }] : [],
      summary: sequence >= 3 ? "Resumen A" : "",
    });
  }
  await repo.saveProgress(task.executionId, "run", {
    ...base,
    sequence: 4,
    files: [{ path: "README.md", content: "Contexto A" }],
    summary: "Resumen A",
  });
  expect((await store.findTask(task.id))?.status).toBe("SUCCEEDED");
  expect((await repo.latest(a.id))?.files[0].content).toBe("Contexto A");
  expect(await repo.latest(b.id)).toBeNull();
  expect((await store.events(task.id)).length).toBe(6);
  await expect(
    repo.saveProgress(task.executionId, "other", { ...base, sequence: 4 }),
  ).rejects.toThrow("no autorizado");
  await expect(projects.remove(a.id, a.version)).rejects.toThrow("importaciones");
  sqlite.close();
});
test("una sola ejecución puede reservar y reclamar el runner", async () => {
  const { db, sqlite } = database();
  const store = new D1TaskStore(db);
  const a = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({}));
  const b = await store.createTask(crypto.randomUUID(), demoInputSchema.parse({}));
  expect(await store.reserveExecution(a.executionId)).toBe(true);
  expect(await store.reserveExecution(b.executionId)).toBe(false);
  await expect(store.claim(b.executionId, "run-b")).rejects.toThrow("activa");
  await store.failExecution(a.executionId, "Fin de prueba");
  expect(await store.reserveExecution(b.executionId)).toBe(true);
  await store.claim(b.executionId, "run-b");
  sqlite.close();
});
test("clave SSH válida, cifrada e idempotente; AAD impide mezclar proyectos", async () => {
  const { db, sqlite } = database();
  const p = await new D1ProjectStore(db).create(crypto.randomUUID(), "A", null);
  const master = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
  const key = await generateProjectKey(db, p.id, master);
  const again = await generateProjectKey(db, p.id, master);
  expect(again.id).toBe(key.id);
  expect(key.ciphertext.includes("PRIVATE KEY")).toBe(false);
  const privateKey = await decryptProjectKey(key, master);
  expect(privateKey.startsWith("-----BEGIN OPENSSH PRIVATE KEY-----")).toBe(true);
  await expect(
    decryptProjectKey({ ...key, projectId: crypto.randomUUID() }, master),
  ).rejects.toThrow();
  const dir = await mkdtemp(join(tmpdir(), "cubo-key-test-"));
  try {
    const path = join(dir, "identity");
    await writeFile(path, privateKey, { mode: 0o600 });
    if (process.platform === "win32") {
      const acl = Bun.spawn(
        ["icacls", path, "/inheritance:r", "/grant:r", `${process.env.USERNAME}:F`],
        { stdout: "ignore", stderr: "ignore" },
      );
      expect(await acl.exited).toBe(0);
    }
    const child = Bun.spawn(["ssh-keygen", "-y", "-f", path], { stdout: "pipe", stderr: "pipe" });
    const publicKey = (await new Response(child.stdout).text()).trim();
    const keyError = await new Response(child.stderr).text();
    expect(Boolean(keyError)).toBe(false);
    expect(await child.exited).toBe(0);
    expect(publicKey.split(" ").slice(0, 2).join(" ")).toBe(
      key.publicKey.split(" ").slice(0, 2).join(" "),
    );
  } finally {
    if (resolve(dir).startsWith(`${resolve(tmpdir())}${sep}cubo-key-test-`))
      await rm(dir, { recursive: true, force: true });
    sqlite.close();
  }
});
test("importación excluye rutas sensibles y no permite escape o secretos", () => {
  expect(excludedRepositoryPath(".env.example")).toBe(true);
  expect(excludedRepositoryPath("certs/server.key")).toBe(true);
  expect(safeRepositoryPath("../outside")).toBe(false);
  expect(safeRepositoryPath("src/code.ts")).toBe(true);
  expect(looksLikeSecret(`ghp_${"a".repeat(32)}`)).toBe(true);
  expect(looksLikeSecret("contexto normal")).toBe(false);
});
