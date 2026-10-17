import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import type { Workspace } from "./workspace";

export function NewTask({
  w,
  close,
  created,
}: {
  w: Workspace;
  close: () => void;
  created: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [agent, setAgent] = useState<"opencode" | "codex">("codex");
  const [model, setModel] = useState("qwen-2.5-coder-32b");
  const [effort, setEffort] = useState<"leve" | "normal" | "alto">("alto");
  const [instructions, setInstructions] = useState("");
  const [contextFiles, setContextFiles] = useState<string[]>([
    "apps/api/src/auth.ts",
    "tests/api.test.ts",
  ]);
  const [localError, setLocalError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  const removeFile = (fileToRemove: string) => {
    setContextFiles((prev) => prev.filter((f) => f !== fileToRemove));
  };

  const addFilePrompt = () => {
    const input = window.prompt("Ruta del archivo a incluir en contexto:", "apps/api/src/auth.ts");
    if (input?.trim() && !contextFiles.includes(input.trim())) {
      setContextFiles((prev) => [...prev, input.trim()]);
    }
  };

  async function handleLaunchAgent() {
    if (!instructions.trim()) {
      setLocalError("Escribe las instrucciones para el agente.");
      return;
    }
    setLocalError("");
    setIsSubmitting(true);
    try {
      const ok = await w.create({
        type: "AGENT_TASK",
        agent,
        instructions: instructions.trim(),
        actionRequested: "edit",
        targetRef: "main",
      });
      if (ok) created();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="dispatch-modal-dialog"
      aria-labelledby="dispatch-modal-headline"
      onCancel={close}
      onClose={close}
    >
      <div className="dispatch-modal-window">
        {/* 1. Header */}
        <div className="dispatch-modal-header">
          <div className="dispatch-header-title">
            <span className="dispatch-status-dot" />
            <h2 id="dispatch-modal-headline">Despachar Tarea a Agente Autónomo</h2>
          </div>
          <button
            className="dispatch-close-btn"
            type="button"
            aria-label="Cerrar modal"
            onClick={close}
          >
            <Icon name="close" size={17} />
          </button>
        </div>

        {/* 2. Body */}
        <div className="dispatch-modal-body">
          {localError && (
            <div className="inline-notice error" role="alert">
              {localError}
            </div>
          )}

          {/* Repo & Root Context */}
          <div className="dispatch-field">
            <div className="dispatch-field-label-row">
              <span className="dispatch-field-label">Repositorio &amp; Contexto Raíz</span>
              <span className="dispatch-clean-badge">git:clean</span>
            </div>
            <div className="dispatch-repo-select-box">
              <div className="dispatch-repo-info">
                <Icon name="folder" size={15} />
                <span className="dispatch-repo-name">PABLOCESAR2412/Cubo</span>
                <span className="dispatch-branch-pill">rama main</span>
              </div>
              <Icon name="chevron" size={14} />
            </div>
          </div>

          {/* Agent Selection (Segmented Control) */}
          <div className="dispatch-field">
            <span className="dispatch-field-label">Especialización de Agente</span>
            <div className="dispatch-agent-segmented">
              <button
                type="button"
                aria-pressed={agent === "opencode"}
                className={`dispatch-agent-btn ${agent === "opencode" ? "active" : ""}`}
                onClick={() => setAgent("opencode")}
              >
                <Icon name="bolt" size={14} />
                <span className="agent-title">OpenCode</span>
                <span className="agent-sub">(Fast Execution)</span>
              </button>
              <button
                type="button"
                aria-pressed={agent === "codex"}
                className={`dispatch-agent-btn ${agent === "codex" ? "active" : ""}`}
                onClick={() => setAgent("codex")}
              >
                <Icon name="terminal" size={14} />
                <span className="agent-title">Codex</span>
                <span className="agent-sub">(Deep Architecture)</span>
              </button>
            </div>
          </div>

          {/* Model & Reasoning Effort */}
          <div className="dispatch-grid-two">
            <div className="dispatch-field">
              <span className="dispatch-field-label">Modelo LLM</span>
              <div className="dispatch-model-box">
                <div className="dispatch-model-inner">
                  <span className="dispatch-model-dot" />
                  <select
                    className="dispatch-model-select"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                  >
                    <option value="qwen-2.5-coder-32b">Qwen 2.5 Coder 32B</option>
                    <option value="gemini-flash">Gemini 2.5 Flash</option>
                    <option value="claude-sonnet">Claude 3.5 Sonnet</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="dispatch-field">
              <span className="dispatch-field-label">Esfuerzo Razonamiento</span>
              <div className="dispatch-effort-segmented">
                <button
                  type="button"
                  className={`effort-btn ${effort === "leve" ? "active" : ""}`}
                  onClick={() => setEffort("leve")}
                >
                  Leve
                </button>
                <button
                  type="button"
                  className={`effort-btn ${effort === "normal" ? "active" : ""}`}
                  onClick={() => setEffort("normal")}
                >
                  Normal
                </button>
                <button
                  type="button"
                  className={`effort-btn ${effort === "alto" ? "active" : ""}`}
                  onClick={() => setEffort("alto")}
                >
                  Alto IIIII
                </button>
              </div>
            </div>
          </div>

          {/* Prompt Instruction */}
          <div className="dispatch-field">
            <div className="dispatch-field-label-row">
              <label htmlFor="task-prompt-input" className="dispatch-field-label">
                Instrucción del Prompt de Trabajo
              </label>
              <span className="dispatch-meta-hint">Markdown &amp; AST paths soportados</span>
            </div>
            <div className="dispatch-textarea-wrapper">
              <textarea
                id="task-prompt-input"
                className="dispatch-textarea"
                rows={4}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void handleLaunchAgent();
                  }
                }}
                placeholder="Describe el cambio, refactorización o bug a resolver... (ej: Migrar auth middleware a JWKS con WebCrypto)"
              />
              <div className="dispatch-textarea-footer">
                <span className="dispatch-tokens-hint">
                  Context Window: ~131k tokens disponibles
                </span>
                <kbd className="dispatch-kbd">Ctrl + Enter para enviar</kbd>
              </div>
            </div>
          </div>

          {/* Context Attachments */}
          <div className="dispatch-field">
            <span className="dispatch-field-label">Documentos &amp; Archivos en Contexto</span>
            <div className="dispatch-files-row">
              <button type="button" className="dispatch-add-file-btn" onClick={addFilePrompt}>
                <Icon name="plus" size={13} />
                <span>Adjuntar archivo o diff</span>
              </button>
              {contextFiles.map((file) => (
                <div key={file} className="dispatch-file-chip">
                  <Icon name="file" size={12} />
                  <span className="chip-filename">{file}</span>
                  <button
                    type="button"
                    className="chip-remove-btn"
                    title="Remover archivo"
                    onClick={() => removeFile(file)}
                  >
                    <Icon name="close" size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Footer */}
        <div className="dispatch-modal-footer">
          <div className="dispatch-footer-runner">
            <Icon name="check" size={14} />
            <span>Ejecución en runner efímero GitHub Actions (0 coste)</span>
          </div>
          <div className="dispatch-footer-actions">
            <button type="button" className="dispatch-cancel-btn" onClick={close}>
              Cancelar
            </button>
            <button
              type="button"
              className="dispatch-submit-btn"
              disabled={isSubmitting || w.busy}
              onClick={() => void handleLaunchAgent()}
            >
              <span>{isSubmitting || w.busy ? "Despachando…" : "Despachar Tarea"}</span>
              <span className="play-arrow">▶</span>
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
