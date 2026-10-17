import { useState } from "react";
import { Icon } from "./Icon";

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  diffText: string;
}

export function DiffInspector({
  files,
  commitMessage,
  targetBranch = "main",
  onApprove,
  onReject,
  isPending = false,
}: {
  files: DiffFile[];
  commitMessage?: string | undefined;
  targetBranch?: string | undefined;
  onApprove?: (() => void) | undefined;
  onReject?: (() => void) | undefined;
  isPending?: boolean | undefined;
}) {
  const [mode, setMode] = useState<"unified" | "split">("unified");
  const [selectedFilePath, setSelectedFilePath] = useState<string>(files[0]?.path ?? "");

  const currentFile = files.find((f) => f.path === selectedFilePath) || files[0];
  const totalAdditions = files.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = files.reduce((acc, f) => acc + f.deletions, 0);

  const renderUnifiedLines = (diffText: string) => {
    const lines = diffText.split("\n");
    return lines.map((line, idx) => {
      const isAdd = line.startsWith("+") && !line.startsWith("+++");
      const isRem = line.startsWith("-") && !line.startsWith("---");
      const isHunk = line.startsWith("@@");

      return (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: diff lines are static ordered text
          key={`line-${idx}`}
          className={`diff-line ${isAdd ? "diff-line-add" : isRem ? "diff-line-rem" : isHunk ? "diff-line-hunk" : ""}`}
        >
          <span className="diff-line-num">{idx + 1}</span>
          <span className="diff-line-content">{line}</span>
        </div>
      );
    });
  };

  const renderSplitLines = (diffText: string) => {
    const lines = diffText.split("\n");
    const left: string[] = [];
    const right: string[] = [];

    for (const line of lines) {
      if (line.startsWith("-") && !line.startsWith("---")) {
        left.push(line);
      } else if (line.startsWith("+") && !line.startsWith("+++")) {
        right.push(line);
      } else {
        left.push(line);
        right.push(line);
      }
    }

    const maxLen = Math.max(left.length, right.length);
    const rows = [];
    for (let i = 0; i < maxLen; i++) {
      const l = left[i] ?? "";
      const r = right[i] ?? "";
      const lRem = l.startsWith("-") && !l.startsWith("---");
      const rAdd = r.startsWith("+") && !r.startsWith("+++");

      rows.push(
        <div key={`split-row-${i}`} className="diff-split-row">
          <div className={`diff-split-cell left ${lRem ? "diff-line-rem" : ""}`}>
            <span className="diff-line-num">{i + 1}</span>
            <span className="diff-line-content">{l}</span>
          </div>
          <div className={`diff-split-cell right ${rAdd ? "diff-line-add" : ""}`}>
            <span className="diff-line-num">{i + 1}</span>
            <span className="diff-line-content">{r}</span>
          </div>
        </div>,
      );
    }
    return rows;
  };

  if (!files || files.length === 0) {
    return (
      <div className="diff-empty-state">
        <Icon name="check" size={24} />
        <h3>Sin cambios pendientes</h3>
        <p className="hint">No hay diferencias de código ni diffs pendientes para revisar.</p>
      </div>
    );
  }

  return (
    <div className="diff-inspector">
      <div className="diff-inspector-header">
        <div className="diff-header-summary">
          <span className="diff-files-count">
            <strong>{files.length}</strong> {files.length === 1 ? "archivo" : "archivos"}
          </span>
          <span className="diff-stats-pill">
            <span className="diff-stat-add">+{totalAdditions}</span>
            <span className="diff-stat-rem">−{totalDeletions}</span>
          </span>
          <span className="diff-branch-badge">
            <Icon name="git-branch" size={13} />
            {targetBranch}
          </span>
        </div>

        <div className="diff-view-toggle">
          <button
            type="button"
            className={`diff-mode-btn ${mode === "unified" ? "active" : ""}`}
            onClick={() => setMode("unified")}
            title="Vista unificada"
          >
            Unificado
          </button>
          <button
            type="button"
            className={`diff-mode-btn ${mode === "split" ? "active" : ""}`}
            onClick={() => setMode("split")}
            title="Vista lado a lado (Side-by-side)"
          >
            Side-by-side
          </button>
        </div>
      </div>

      <div className="diff-file-tabs">
        {files.map((file) => (
          <button
            key={file.path}
            type="button"
            className={`diff-file-tab ${file.path === selectedFilePath ? "active" : ""}`}
            onClick={() => setSelectedFilePath(file.path)}
          >
            <Icon name="file" size={13} />
            <span className="diff-file-name" title={file.path}>
              {file.path.split("/").pop()}
            </span>
            <span className="diff-file-microstats">
              <span className="diff-stat-add">+{file.additions}</span>
              <span className="diff-stat-rem">−{file.deletions}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="diff-content-viewer">
        <div className="diff-file-meta-bar">
          <span className="diff-file-full-path">{currentFile?.path}</span>
        </div>
        <div className="diff-code-container">
          {mode === "unified"
            ? renderUnifiedLines(currentFile?.diffText ?? "")
            : renderSplitLines(currentFile?.diffText ?? "")}
        </div>
      </div>

      {(onApprove || onReject) && (
        <div className="diff-approval-bar">
          <div className="diff-approval-info">
            <strong>Aprobación de cambios en repositorio</strong>
            <p className="hint">
              {commitMessage
                ? `Commit: "${commitMessage}"`
                : "Se creará un commit verificado y se enviará a la rama autorizada."}
            </p>
          </div>
          <div className="diff-approval-actions">
            {onReject && (
              <button
                type="button"
                className="secondary compact"
                onClick={onReject}
                disabled={isPending}
              >
                Rechazar
              </button>
            )}
            {onApprove && (
              <button
                type="button"
                className="primary compact"
                onClick={onApprove}
                disabled={isPending}
              >
                {isPending ? "Ejecutando…" : "Aprobar Commit y Push"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
