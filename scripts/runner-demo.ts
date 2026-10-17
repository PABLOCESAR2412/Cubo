import { CodexAgentAdapter, OpenCodeAgentAdapter } from "../packages/agents/src/index.ts";
import { OpenRouterProvider, ProviderRequestError } from "../packages/providers/src/index.ts";
import { executeDemo, importRepository } from "../packages/runner/src/index.ts";
import {
  type ChatTurnContext,
  isAgentTaskInput,
  isChatTurnInput,
  isImportInput,
  looksLikeSecret,
  type RepositorySnapshot,
  type RunnerContext,
  type RunnerUpdate,
} from "../packages/shared/src/index.ts";

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
  if (isChatTurnInput(context.task.input)) {
    try {
      const input = (await (await request("chat-request", {})).json()) as {
        apiKey: string;
        model: string;
        context: ChatTurnContext;
      };
      console.log(`::add-mask::${input.apiKey}`);
      console.log("Turno adquirido; solicitud al modelo gratuito.");
      const output = await new OpenRouterProvider().completeWithFallback(
        input.apiKey,
        input.model,
        input.context.messages,
        {
          ...(context.task.input.effort ? { effort: context.task.input.effort } : {}),
          ...(context.task.input.fallbackModel
            ? { fallbackModel: context.task.input.fallbackModel }
            : {}),
        },
      );
      if (output.model !== input.model) console.log("Se utilizó el respaldo gratuito autorizado.");
      if (looksLikeSecret(output.content) || output.content.includes(input.apiKey))
        throw new Error("Contenido sensible.");
      await request("chat-result", output);
      console.log("Respuesta y uso guardados en Cubo.");
      return;
    } catch (error) {
      const allowed = [
        "PROVIDER_QUOTA_EXHAUSTED",
        "PROVIDER_MODEL_UNAVAILABLE",
        "PROVIDER_CREDENTIAL_REJECTED",
        "FREE_MODEL_REQUIRED",
        "UNEXPECTED_PROVIDER_COST",
      ];
      const reason =
        error instanceof ProviderRequestError && allowed.includes(error.reason)
          ? error.reason
          : "PROVIDER_REQUEST_FAILED";
      await request("chat-error", { reason });
      throw new Error("El turno no se completó; consulta Cubo.");
    }
  }
  if (isImportInput(context.task.input)) {
    const snapshot = (await (await request("import-checkpoint")).json()) as {
      snapshot: RepositorySnapshot | null;
    };
    let privateKey: string | null = null;
    if (context.task.input.access === "SSH") {
      privateKey = ((await (await request("repository-key")).json()) as { privateKey: string })
        .privateKey;
      for (const line of privateKey.trim().split("\n")) console.log(`::add-mask::${line}`);
    }
    await importRepository(
      context.task.input,
      snapshot.snapshot,
      privateKey,
      async (update) => {
        await request("import-progress", update);
        console.log(`Etapa ${update.sequence} de importación guardada.`);
      },
      { contextDocuments: context.protocolVersion === 2 },
    );
    return;
  }
  if (isAgentTaskInput(context.task.input)) {
    const adapter =
      context.task.input.agent === "codex" ? new CodexAgentAdapter() : new OpenCodeAgentAdapter();
    console.log(`Ejecutando adaptador de agente ${adapter.descriptor.name}...`);
    const result = await adapter.execute({
      task: context.task,
      checkpoint: context.checkpoint,
      signal: AbortSignal.timeout(120000),
    });
    const update: RunnerUpdate = {
      sequence: result.checkpoint.sequence,
      cursor: result.checkpoint.cursor,
      sum: result.checkpoint.sum,
      outcome: result.outcome,
    };
    await request("progress", update);
    console.log(`Agente ${adapter.descriptor.name} guardado con resultado: ${result.outcome}.`);
    return;
  }
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
