import { Database } from "bun:sqlite";
import { readFileSync } from "node:fs";
export function database(path = ":memory:"): { sqlite: Database; db: D1Database } {
  const sqlite = new Database(path);
  sqlite.exec(readFileSync("packages/database/migrations/0001_tasks.sql", "utf8"));
  for (const name of ["0002_chat.sql", "0003_projects.sql", "0004_repository_imports.sql"])
    sqlite.exec(readFileSync(`packages/database/migrations/${name}`, "utf8"));
  function prepare(sql: string, params: unknown[] = []) {
    return {
      bind: (...values: unknown[]) => prepare(sql, values),
      first: async () => sqlite.query(sql).get(...(params as Array<string | number | null>)),
      all: async () => ({
        results: sqlite.query(sql).all(...(params as Array<string | number | null>)),
      }),
      run: async () => {
        const info = sqlite.query(sql).run(...(params as Array<string | number | null>));
        return { success: true, meta: { changes: info.changes } };
      },
      sql,
      params,
    };
  }
  const db = {
    prepare,
    batch: async (statements: Array<ReturnType<typeof prepare>>) =>
      sqlite.transaction(() =>
        statements.map((s) => {
          const info = sqlite.query(s.sql).run(...(s.params as Array<string | number | null>));
          return { success: true, meta: { changes: info.changes } };
        }),
      )(),
  };
  return { sqlite, db: db as unknown as D1Database };
}
