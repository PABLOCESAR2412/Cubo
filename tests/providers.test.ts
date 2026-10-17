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
} from "@cubo/providers";

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
