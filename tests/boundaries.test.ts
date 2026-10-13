import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("frontend solo depende de contratos; motor no importa el adaptador concreto", () => {
  const web = JSON.parse(readFileSync("apps/web/package.json", "utf8"));
  expect(Object.keys(web.dependencies).filter((k) => k.startsWith("@cubo/"))).toEqual([
    "@cubo/shared",
  ]);
  const core = readFileSync("packages/tasks/src/index.ts", "utf8");
  expect(core).not.toContain("GitHubActionsExecutionBackend");
  expect(core).not.toContain("cloudflare:workers");
  for (const file of new Bun.Glob("apps/web/src/**/*.{ts,tsx}").scanSync(".")) {
    const source = readFileSync(file, "utf8");
    expect(source).not.toMatch(
      /@cubo\/(api|database|runner|tasks)|GITHUB_TOKEN|OWNER_PASSWORD|SESSION_SECRET/,
    );
  }
});
test("config solo declara servicios gratuitos y el runner estándar", () => {
  const config = JSON.parse(readFileSync("apps/api/wrangler.jsonc", "utf8"));
  expect(config.containers).toBeUndefined();
  expect(config.r2_buckets).toBeUndefined();
  expect(config.durable_objects).toBeUndefined();
  expect(config.account_id).toBe("6fcab192a8cc2a3458247ef5c8108a07");
  expect(config.name).toBe("cubo-dev");
  const workflow = readFileSync(".github/workflows/cubo-runner.yml", "utf8");
  expect(workflow).toContain("runs-on: ubuntu-latest");
  expect(workflow).toContain("timeout-minutes: 10");
  expect(workflow).not.toContain("upload-artifact");
  expect(workflow).not.toContain("cache:");
  expect(workflow).toContain("persist-credentials: false");
  const ignores = readFileSync(".gitignore", "utf8");
  expect(ignores).toContain("*.secrets.json");
  expect(ignores).toContain(".dev.vars");
});
test("ningún nombre de secreto ni patrón de token llega al bundle publicado", async () => {
  for (const file of new Bun.Glob("apps/web/dist/assets/*.js").scanSync(".")) {
    const source = readFileSync(file, "utf8");
    expect(source).not.toMatch(
      /GITHUB_TOKEN|OWNER_PASSWORD|SESSION_SECRET|github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,}/,
    );
  }
});
