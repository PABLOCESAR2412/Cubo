import { describe, expect, it } from "bun:test";
import {
  GeminiProvider,
  GroqProvider,
  generateSuggestions,
  generateTaskProposal,
  generateTypeSafe,
  NvidiaProvider,
  synthesizeProjectMemory,
  taskProposalSchema,
  ZenProvider,
} from "@cubo/providers";

function zenFetcher(
  modelIds: string[],
  overrides: Record<string, { status: number; body: unknown }> = {},
) {
  return (input: string): Promise<Response> => {
    const override = Object.entries(overrides).find(([key]) => input.includes(key))?.[1];
    if (override) {
      return Promise.resolve(
        new Response(JSON.stringify(override.body), {
          status: override.status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    }
    return Promise.resolve(
      new Response(JSON.stringify({ object: "list", data: modelIds.map((id) => ({ id })) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  };
}

describe("Adaptador OpenCode Zen (gama gratuita verificada)", () => {
  it("freeModels solo publica los modelos gratuitos que siguen en el catálogo vivo", async () => {
    const vivo = ["glm-5.3-flash-free", "big-pickle", "claude-opus-5", "test"];
    const zen = new ZenProvider(zenFetcher(vivo));
    const models = await zen.freeModels();
    expect(models.map((m) => m.id)).toEqual(["glm-5.3-flash-free", "big-pickle"]);
    // los modelos de pago y las entradas internas nunca aparecen
    expect(models.some((m) => m.id === "claude-opus-5" || m.id === "test")).toBe(false);
  });

  it("quota valida la credencial contra la API sin gasto de tokens", async () => {
    const clave = `sk-${"a".repeat(64)}`;
    const zenOk = new ZenProvider(zenFetcher(["glm-5.3-flash-free"]));
    const quota = await zenOk.quota(clave);
    expect(quota.quality).toBe("unavailable");
    expect(quota.requestsRemaining).toBeNull();

    const zenRepedido = new ZenProvider(
      zenFetcher([], { "/v1/models": { status: 401, body: {} } }),
    );
    expect(zenRepedido.quota(clave)).rejects.toThrow("PROVIDER_CREDENTIAL_REJECTED");

    const zenNull = new ZenProvider(zenFetcher(["glm-5.3-flash-free"]));
    expect(zenNull.quota(`sk-${"b".repeat(63)}`)).rejects.toThrow();
  });

  it("complete rechaza modelos fuera de la gama gratuita y valida la salida", async () => {
    const clave = `sk-${"c".repeat(64)}`;
    const zen = new ZenProvider(zenFetcher([]));
    expect(zen.complete(clave, "claude-opus-5", [])).rejects.toThrow("FREE_MODEL_REQUIRED");

    const zenFt = new ZenProvider(
      zenFetcher([], {
        "chat/completions": {
          status: 403,
          body: {
            type: "error",
            error: {
              type: "FreeTierError",
              message: "OpenCode's free tier can only be used from within OpenCode.",
            },
          },
        },
      }),
    );
    expect(
      zenFt.complete(clave, "glm-5.3-flash-free", [{ role: "user", content: "ping" }]),
    ).rejects.toThrow("PROVIDER_MODEL_UNAVAILABLE");

    const zenOk = new ZenProvider(
      zenFetcher([], {
        "chat/completions": {
          status: 200,
          body: {
            choices: [{ message: { content: "Hola desde Zen" }, finish_reason: "stop" }],
            usage: { prompt_tokens: 3, completion_tokens: 5 },
          },
        },
      }),
    );
    const salida = await zenOk.complete(clave, "glm-5.3-flash-free", [
      { role: "user", content: "ping" },
    ]);
    expect(salida.content).toBe("Hola desde Zen");
    expect(salida.costUsd).toBe(0);
    expect(salida.costQuality).toBe("estimated");
    expect(salida.finishReason).toBe("stop");
  });
});

describe("Adaptadores de Proveedores (Gemini, Groq, NVIDIA, OpenRouter)", () => {
  it("GeminiProvider expone modelos gratuitos y valida formato de credencial", async () => {
    const provider = new GeminiProvider();
    const models = await provider.freeModels();
    expect(models.length).toBeGreaterThanOrEqual(4);
    expect(models.some((m) => m.id === "gemini-2.0-flash")).toBe(true);

    // Formato inválido falla cerrado
    expect(provider.quota("clave-invalida")).rejects.toThrow();
  });

  it("GroqProvider expone modelos gratuitos y valida formato de credencial", async () => {
    const provider = new GroqProvider();
    const models = await provider.freeModels();
    expect(models.length).toBeGreaterThanOrEqual(4);
    expect(models.some((m) => m.id === "llama-3.3-70b-versatile")).toBe(true);

    // Formato inválido falla cerrado
    expect(provider.quota("clave-invalida")).rejects.toThrow();
  });

  it("NvidiaProvider expone modelos gratuitos y valida formato de credencial", async () => {
    const provider = new NvidiaProvider();
    const models = await provider.freeModels();
    expect(models.length).toBeGreaterThanOrEqual(4);
    expect(models.some((m) => m.id === "meta/llama-3.3-70b-instruct")).toBe(true);

    // Formato inválido falla cerrado
    expect(provider.quota("clave-invalida")).rejects.toThrow();
  });
});

describe("Motor Type-Safe AI (Salidas estructuradas con validación Zod)", () => {
  it("generateTypeSafe valida y parsea contratos Zod estructurados correctamente", async () => {
    const mockAdapter = {
      freeModels: async () => [{ id: "mock-model", name: "Mock Model" }],
      quota: async () => ({
        checkedAt: new Date().toISOString(),
        requestsRemaining: 100,
        requestsLimit: 100,
        creditsRemaining: null,
        quality: "exact" as const,
      }),
      complete: async () => ({
        content: JSON.stringify({
          title: "Refactorizar autenticación",
          description: "Migrar a JWKS nativo de Cloudflare Workers",
          suggestedAgent: "codex",
          category: "refactor",
          rationale: "Eliminar helpers legacy y mejorar seguridad",
          estimatedSteps: ["Paso 1: esquema", "Paso 2: implementación", "Paso 3: pruebas"],
          impactAssessment: "Bajo riesgo, cubierto por tests de integración",
        }),
        model: "mock-model",
        inputTokens: 50,
        outputTokens: 80,
        costUsd: 0 as const,
        costQuality: "exact" as const,
      }),
    };

    const proposal = await generateTaskProposal(mockAdapter, "dummy-key", "mock-model", {
      projectContext: "Proyecto Cubo con Cloudflare Workers",
      userIntent: "Refactorizar autenticación a JWKS",
    });

    expect(proposal.title).toBe("Refactorizar autenticación");
    expect(proposal.suggestedAgent).toBe("codex");
    expect(proposal.category).toBe("refactor");
    expect(proposal.estimatedSteps.length).toBe(3);
  });

  it("generateTypeSafe rechaza respuestas que no cumplan el esquema", async () => {
    const brokenAdapter = {
      freeModels: async () => [],
      quota: async () => ({
        checkedAt: new Date().toISOString(),
        requestsRemaining: null,
        requestsLimit: null,
        creditsRemaining: null,
        quality: "unavailable" as const,
      }),
      complete: async () => ({
        content: JSON.stringify({
          notAProposal: 123,
        }),
        model: "mock-model",
        inputTokens: 10,
        outputTokens: 10,
        costUsd: 0 as const,
        costQuality: "exact" as const,
      }),
    };

    expect(
      generateTypeSafe(brokenAdapter, "dummy-key", "mock-model", "Test prompt", taskProposalSchema),
    ).rejects.toThrow("La salida no cumple con el contrato Type-Safe");
  });

  it("synthesizeProjectMemory genera estructura validada de memoria técnica", async () => {
    const memoryAdapter = {
      freeModels: async () => [],
      quota: async () => ({
        checkedAt: new Date().toISOString(),
        requestsRemaining: null,
        requestsLimit: null,
        creditsRemaining: null,
        quality: "unavailable" as const,
      }),
      complete: async () => ({
        content: JSON.stringify({
          summary: "Cubo adopta arquitectura multi-proveedor con contratos Zod",
          keyDecisions: ["Usar SQLite/D1 para llaves cifradas", "Soportar Gemini, Groq, NVIDIA"],
          architecturePatterns: ["Type-Safe AI Assistant", "Zero Cost Guarantee"],
          pendingDecisions: ["Aceptación SSH privada"],
          updatedMemoryMarkdown: "## Memoria\nDecisiones consolidadas.",
        }),
        model: "mock-model",
        inputTokens: 20,
        outputTokens: 40,
        costUsd: 0 as const,
        costQuality: "exact" as const,
      }),
    };

    const memory = await synthesizeProjectMemory(memoryAdapter, "dummy-key", "mock-model", {
      currentMemory: "Memoria inicial",
      recentTurns: "Se implementaron proveedores Gemini, Groq y NVIDIA",
    });

    expect(memory.summary).toContain("multi-proveedor");
    expect(memory.keyDecisions.length).toBe(2);
    expect(memory.architecturePatterns.length).toBe(2);
  });

  it("generateSuggestions genera lista válida de siguientes pasos", async () => {
    const suggestAdapter = {
      freeModels: async () => [],
      quota: async () => ({
        checkedAt: new Date().toISOString(),
        requestsRemaining: null,
        requestsLimit: null,
        creditsRemaining: null,
        quality: "unavailable" as const,
      }),
      complete: async () => ({
        content: `\`\`\`json
{
  "contextTopic": "Optimización de UI",
  "suggestions": [
    {
      "title": "Verificar contraste en modo claro",
      "prompt": "Comprobar contraste WCAG AA en modo claro para todas las vistas",
      "actionType": "diagnose",
      "confidence": 0.95
    },
    {
      "title": "Configurar clave de Gemini",
      "prompt": "Abrir Ajustes y añadir API key de Google Gemini",
      "actionType": "task",
      "confidence": 0.9
    }
  ]
}
\`\`\``,
        model: "mock-model",
        inputTokens: 25,
        outputTokens: 60,
        costUsd: 0 as const,
        costQuality: "exact" as const,
      }),
    };

    const suggestions = await generateSuggestions(suggestAdapter, "dummy-key", "mock-model", {
      conversationContext: "Revisando modo claro y proveedores",
    });

    expect(suggestions.contextTopic).toBe("Optimización de UI");
    expect(suggestions.suggestions.length).toBe(2);
    expect(suggestions.suggestions[0].actionType).toBe("diagnose");
  });
});
