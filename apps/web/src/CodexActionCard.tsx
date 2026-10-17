import { useState } from "react";
import { Icon } from "./Icon";

export interface CodexFileEdit {
  path: string;
  status?: "MODIFICADO" | "CREADO" | "ELIMINADO" | string;
  additions: number;
  deletions: number;
  diffSnippet?: string;
}

export function CodexActionCard({
  files,
  onViewInInspector,
  onUndo,
  suggestion = "¿Deseas desplegar una vista previa con wrangler deploy --dry-run para verificar la latencia de JWKS?",
  onAcceptSuggestion,
}: {
  files: CodexFileEdit[];
  onViewInInspector?: () => void;
  onUndo?: () => void;
  suggestion?: string;
  onAcceptSuggestion?: () => void;
}) {
  const [expandedFile, setExpandedFile] = useState<string | null>(files[0]?.path ?? null);
  const totalAdditions = files.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = files.reduce((acc, f) => acc + f.deletions, 0);

  return (
    <div className="codex-action-card">
      <div className="codex-card-header">
        <div className="codex-card-title-group">
          <div className="codex-card-icon" aria-hidden="true">
            <Icon name="diff" size={16} />
          </div>
          <div className="codex-card-title-row">
            <span className="codex-card-title">
              Se {files.length === 1 ? "editó 1 archivo" : `editaron ${files.length} archivos`}
            </span>
            <div className="codex-delta-pills">
              <span className="delta-add">+{totalAdditions}</span>
              <span className="delta-rem">-{totalDeletions}</span>
            </div>
          </div>
        </div>
        <div className="codex-card-actions">
          {onUndo && (
            <button type="button" className="secondary compact" onClick={onUndo}>
              <Icon name="refresh" size={13} />
              <span>Deshacer</span>
            </button>
          )}
          {onViewInInspector && (
            <button type="button" className="codex-view-btn compact" onClick={onViewInInspector}>
              <Icon name="external" size={13} />
              <span>Ver cambios en inspector</span>
            </button>
          )}
        </div>
      </div>

      <div className="codex-files-list">
        {files.map((file) => {
          const isExpanded = expandedFile === file.path;
          return (
            <div key={file.path} className="codex-file-row-group">
              <button
                type="button"
                className={`codex-file-row ${isExpanded ? "active" : ""}`}
                onClick={() => setExpandedFile(isExpanded ? null : file.path)}
              >
                <div className="codex-file-left">
                  <Icon name="file" size={14} />
                  <span className="codex-file-path mono">{file.path}</span>
                  <span className="codex-file-status-badge">{file.status ?? "MODIFICADO"}</span>
                </div>
                <div className="codex-file-right">
                  <span className="file-delta-add">+{file.additions}</span>
                  <span className="file-delta-rem">-{file.deletions}</span>
                  <Icon
                    name="chevron"
                    size={12}
                    className={`file-chevron ${isExpanded ? "rotated" : ""}`}
                  />
                </div>
              </button>

              {isExpanded && file.diffSnippet && (
                <div className="codex-inline-diff-view">
                  <div className="inline-diff-header">
                    <span>DIFF VIEW — {file.path}</span>
                    <span className="unified-badge">unified format</span>
                  </div>
                  <pre className="inline-diff-code">
                    {file.diffSnippet.split("\n").map((line, i) => {
                      const isAdd = line.startsWith("+") && !line.startsWith("+++");
                      const isRem = line.startsWith("-") && !line.startsWith("---");
                      return (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: diff lines are ordered static text
                          key={`inline-line-${i}`}
                          className={`inline-diff-line ${isAdd ? "is-add" : isRem ? "is-rem" : ""}`}
                        >
                          <span className="diff-num">{i + 1}</span>
                          <span className="diff-text">{line}</span>
                        </div>
                      );
                    })}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {suggestion && (
        <div className="codex-suggestion-row">
          <span className="suggestion-icon">ⓘ</span>
          <span className="suggestion-text">{suggestion}</span>
          {onAcceptSuggestion && (
            <button type="button" className="suggestion-accept-btn" onClick={onAcceptSuggestion}>
              Ejecutar
            </button>
          )}
        </div>
      )}
    </div>
  );
}
