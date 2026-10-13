import { executeDemo } from "../packages/runner/src/demo.ts";
import type { RunnerContext, RunnerUpdate } from "../packages/shared/src/index.ts";

async function main(): Promise<void> {
  const executionId = process.env.EXECUTION_ID ?? "";
  if (!/^[0-9a-f-]{36}-\d+$/.test(executionId)) throw new Error("Identificador inválido.");
  const url = new URL(process.env.CUBO_URL ?? "");
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  )
    throw new Error("Configura CUBO_URL con el origen HTTPS de Cubo.");
  const oidcUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const oidcRequestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!oidcUrl || !oidcRequestToken) throw new Error("El runner necesita id-token: write.");
  async function request(path: string, body?: unknown): Promise<Response> {
    const identity = await fetch(`${oidcUrl}&audience=${encodeURIComponent(url.origin)}`, {
      headers: { Authorization: `Bearer ${oidcRequestToken}` },
      signal: AbortSignal.timeout(15000),
    });
    if (!identity.ok) throw new Error("No se pudo autenticar el runner.");
    const { value } = (await identity.json()) as { value: string };
    // El token nunca se guarda en checkpoints ni se muestra en logs.
    console.log(`::add-mask::${value}`);
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const response = await fetch(new URL(`/api/executions/${executionId}/${path}`, url), {
          method: body === undefined ? "GET" : "POST",
          headers: { Authorization: `Bearer ${value}`, "Content-Type": "application/json" },
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          signal: AbortSignal.timeout(15000),
          redirect: "error",
        });
        if (response.ok) return response;
        if (response.status < 500 && response.status !== 429)
          throw new Error("Cubo rechazó el callback del runner.");
      } catch (error) {
        if (attempt === 4) throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
    throw new Error("No se pudo guardar el progreso.");
  }
  await request("claim", {});
  const context = (await (await request("context")).json()) as RunnerContext;
  await executeDemo(
    context,
    async (update: RunnerUpdate) => {
      await request("progress", update);
      console.log(`Paso ${update.cursor} guardado: ${update.outcome}.`);
    },
    (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  );
}
main().catch(() => {
  console.error("La ejecución no pudo completar o guardar el trabajo. Consulta Cubo.");
  process.exitCode = 1;
});
