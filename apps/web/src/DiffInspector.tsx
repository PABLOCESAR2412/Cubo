import { useState } from "react";
import { Icon } from "./Icon";

export interface DiffFile {
  path: string;
  additions: number;
  deletions: number;
  diffText: string;
  fileType?: string;
  totalLinesModified?: number;
}

export function DiffInspector({
  files = [],
  executionId = "#1042",
  taskTitle = "Refactorización JWKS & Auth Middleware",
  commitMessage = "feat(auth): integrate JWKS key rotation for Cloudflare Workers",
  targetBranch = "main",
  runner = "Cloudflare Worker Local #2",
  duration = "4.2s",
  tokens = "1,420 prompt · 384 output",
  onApprove,
  onReject,
  isPending = false,
}: {
  files?: DiffFile[] | undefined;
  executionId?: string | undefined;
  taskTitle?: string | undefined;
  commitMessage?: string | undefined;
  targetBranch?: string | undefined;
  runner?: string | undefined;
  duration?: string | undefined;
  tokens?: string | undefined;
  onApprove?: (() => void) | undefined;
  onReject?: (() => void) | undefined;
  isPending?: boolean | undefined;
}) {
  const [activeTab, setActiveTab] = useState<"logs" | "diff" | "checkpoints">("diff");
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({
    "src/auth.ts": true,
  });

  const defaultFiles: DiffFile[] = [
    {
      path: "src/auth.ts",
      additions: 36,
      deletions: 12,
      fileType: "TYPESCRIPT",
      totalLinesModified: 48,
      diffText: `14 14    import { Context, Next } from 'hono';
15 -  - import { verify } from 'jsonwebtoken';
16 -  - const STATIC_SECRET = process.env.JWT_SECRET || 'dev fallback';
+ 15  + import { jwtVerify, createRemoteJWKSet } from 'jose';
+ 16  + import { AUTH_JWKS_CACHE_TTL, JWKS_ENDPOINT } from './config/constants';
+ 17  + let remoteJWKSetInstance: ReturnType | null = null;
17 18    export async function authMiddleware(c: Context, next: Next) {
18 19      const authHeader = c.req.header('Authorization');
19 20      if (!authHeader?.startsWith('Bearer ')) {
20 21        return c.json({ error: 'Missing or malformed token' }, 401);
21 22      }
23 -  -   const token = authHeader.split(' ')[1];
24 -  -   try {
25 -  -     const decoded = verify(token, STATIC_SECRET);
26 -  -     c.set('user', decoded);
+ 24  +   const token = authHeader.slice(7);
+ 25  +   if (!remoteJWKSetInstance) {
+ 26  +     remoteJWKSetInstance = createRemoteJWKSet(new URL(JWKS_ENDPOINT), {
+ 27  +       cacheMaxAge: AUTH_JWKS_CACHE_TTL,
+ 28  +       cooldownDuration: 30000,
+ 29  +     });
+ 30  +   }
+ 31  +   try {
+ 32  +     const { payload } = await jwtVerify(token, remoteJWKSetInstance, {
+ 33  +       algorithms: ['RS256', 'ES256'],
+ 34  +       issuer: 'https://auth.cubo.systems/v1',
+ 35  +     });
+ 36  +     c.set('user', payload);
27 37      await next();
28 38    } catch (err: any) {
29 39      return c.json({ error: 'Invalid or expired signature' }, 401);
30 40    }
31 41  }`,
    },
    {
      path: "src/config/constants.ts",
      additions: 12,
      deletions: 7,
      fileType: "TYPESCRIPT",
      totalLinesModified: 19,
      diffText: `1 1    export const AUTH_JWKS_CACHE_TTL = 600000;
2 2    export const JWKS_ENDPOINT = 'https://auth.cubo.systems/.well-known/jwks.json';`,
    },
  ];

  const displayFiles = files && files.length > 0 ? files : defaultFiles;
  const totalAdditions = displayFiles.reduce((acc, f) => acc + f.additions, 0);
  const totalDeletions = displayFiles.reduce((acc, f) => acc + f.deletions, 0);

  const toggleFile = (path: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  return (
    <div className="diff-stitch-container">
      {/* 1. Execution Info Bar */}
      <div className="diff-stitch-exec-header">
        <div className="diff-exec-left">
          <span className="diff-exec-breadcrumb">
            Tareas / Ejecución {executionId} · {taskTitle}
          </span>
        </div>
        <div className="diff-exec-right">
          <span className="status-waiting-pill">
            <span className="status-amber-dot" />
            <span>En espera de aprobación del desarrollador</span>
          </span>
        </div>
      </div>

      {/* Meta Row */}
      <div className="diff-meta-row">
        <span className="meta-item">
          <Icon name="terminal" size={13} />
          <span>rama: {targetBranch}</span>
        </span>
        <span className="meta-sep">·</span>
        <span className="meta-item">
          <Icon name="file" size={13} />
          <span>
            {displayFiles.length} archivos modificados (+{totalAdditions}) (-{totalDeletions})
          </span>
        </span>
        <span className="meta-sep">·</span>
        <span className="meta-item">
          <span className="meta-icon-box">☁</span>
          <span>Runner: {runner}</span>
        </span>
        <span className="meta-sep">·</span>
        <span className="meta-item">
          <Icon name="clock" size={13} />
          <span>Tiempo: {duration}</span>
        </span>
        <span className="meta-sep">·</span>
        <span className="meta-item">
          <Icon name="cube" size={13} />
          <span>Tokens: {tokens}</span>
        </span>
      </div>

      {/* 2. Sub Tabs Row */}
      <div className="diff-tabs-bar">
        <div className="diff-tabs-left">
          <button
            type="button"
            className={`diff-tab-btn ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <Icon name="terminal" size={13} />
            <span>Terminal Logs</span>
            <span className="tab-pill-muted">0 err</span>
          </button>

          <button
            type="button"
            className={`diff-tab-btn ${activeTab === "diff" ? "active" : ""}`}
            onClick={() => setActiveTab("diff")}
          >
            <Icon name="diff" size={13} />
            <span>Diff de Cambios ({displayFiles.length})</span>
            <span className="tab-dot-green" />
          </button>

          <button
            type="button"
            className={`diff-tab-btn ${activeTab === "checkpoints" ? "active" : ""}`}
            onClick={() => setActiveTab("checkpoints")}
          >
            <Icon name="clock" size={13} />
            <span>Checkpoints (3)</span>
          </button>
        </div>

        <div className="diff-tabs-right">
          <span className="diff-stat-high">+{totalAdditions} altas</span>
          <span className="diff-stat-low">■ -{totalDeletions} bajas</span>
          <span className="diff-mode-badge">Vista Unificada</span>
        </div>
      </div>

      {/* 3. Content per Tab */}
      {activeTab === "logs" ? (
        <div className="diff-logs-panel">
          <pre className="terminal-logs-text">
            [00:00.12] Inicializando runner Cloudflare Worker Local #2...&#10; [00:01.04] Clonando
            repo PABLOCESAR2412/Cubo en rama main...&#10; [00:02.18] Analizando dependencias de
            autenticación (jose vs jsonwebtoken)...&#10; [00:03.45] Generando diff unificado y
            validando sintaxis de TypeScript...&#10; [00:04.20] Tests superados: 14 pass, 0 fail.
            Esperando confirmación de commit.
          </pre>
        </div>
      ) : activeTab === "checkpoints" ? (
        <div className="diff-checkpoints-panel">
          <div className="checkpoint-entry">
            <span className="checkpoint-dot" />
            <div className="checkpoint-info">
              <strong>Checkpoint #3: Post-validación de pruebas</strong>
              <span>Hash AST: 8c12fa4 · Guardado en Cloudflare D1</span>
            </div>
          </div>
          <div className="checkpoint-entry">
            <span className="checkpoint-dot" />
            <div className="checkpoint-info">
              <strong>Checkpoint #2: Sustitución de dependencias criptográficas</strong>
              <span>jose / createRemoteJWKSet configurado</span>
            </div>
          </div>
          <div className="checkpoint-entry">
            <span className="checkpoint-dot" />
            <div className="checkpoint-info">
              <strong>Checkpoint #1: Snapshot inicial de repositorio</strong>
              <span>Estado limpio en origin/main</span>
            </div>
          </div>
        </div>
      ) : (
        /* Diff de Cambios View */
        <div className="diff-files-accordion-list">
          {displayFiles.map((file) => {
            const isExpanded = expandedFiles[file.path] ?? false;
            return (
              <div key={file.path} className="diff-accordion-card">
                {/* Accordion File Header */}
                <div className="accordion-file-header">
                  <button
                    type="button"
                    className="file-header-left"
                    onClick={() => toggleFile(file.path)}
                    aria-expanded={isExpanded}
                  >
                    <span className="accordion-chevron">
                      <Icon
                        name="chevron"
                        size={12}
                        className={`chevron-icon ${isExpanded ? "rotated" : ""}`}
                      />
                    </span>
                    <span className="file-code-icon">&lt;&gt;</span>
                    <span className="file-path-title">{file.path}</span>
                    <span className="file-deltas-tag">
                      +{file.additions} / -{file.deletions}
                    </span>
                    <span className="file-lang-pill">{file.fileType ?? "TYPESCRIPT"}</span>
                    {!isExpanded && file.totalLinesModified && (
                      <span className="file-lines-muted">
                        {file.totalLinesModified} líneas modificadas
                      </span>
                    )}
                  </button>

                  <div className="file-header-right">
                    <button
                      type="button"
                      className="diff-mini-btn"
                      onClick={() => {
                        void navigator.clipboard?.writeText(file.path);
                        alert(`Ruta copiada: ${file.path}`);
                      }}
                    >
                      <Icon name="file" size={12} />
                      <span>Copiar ruta</span>
                    </button>
                    <button
                      type="button"
                      className="diff-mini-btn"
                      onClick={() => alert(`Visualizando ${file.path}`)}
                    >
                      <Icon name="arrow" size={12} className="rotate-up-right" />
                      <span>Ver archivo completo</span>
                    </button>
                  </div>
                </div>

                {/* Diff Viewer Body */}
                {isExpanded && (
                  <div className="accordion-file-body">
                    <div className="diff-code-table">
                      {file.diffText.split("\n").map((line, idx) => {
                        const isRem = line.includes(" -  -") || line.startsWith("-");
                        const isAdd = line.includes(" +  +") || line.startsWith("+");
                        return (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: diff lines are ordered static text
                            key={`diff-${idx}`}
                            className={`diff-code-row ${isRem ? "line-rem" : isAdd ? "line-add" : ""}`}
                          >
                            <span className="line-text">{line}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Test Suite Validation Card */}
          <div className="test-suite-validation-card">
            <div className="test-suite-left">
              <span className="test-check-circle">✔</span>
              <div>
                <h3 className="test-suite-title">
                  Validación de suites de pruebas automáticas superada
                </h3>
                <p className="test-suite-sub">
                  vitest src/auth.test.ts · 14 pass · 0 fail · Memoria pico: 42.1 MB
                </p>
              </div>
            </div>
            <span className="test-sha-badge">SHA 8c12fa4</span>
          </div>
        </div>
      )}

      {/* 4. Git Approval Action Bar */}
      <div className="diff-git-approval-bar">
        <div className="git-approval-left">
          <div className="git-branch-symbol" aria-hidden="true">
            <Icon name="git-branch" size={15} />
          </div>
          <div>
            <div className="git-commit-title-row">
              <span className="git-commit-msg">{commitMessage}</span>
              <span className="git-staged-pill">STAGED</span>
            </div>
            <span className="git-dest-hint">
              Destino: pushed to origin/{targetBranch} · Autor: Cubo Agent {executionId}
            </span>
          </div>
        </div>

        <div className="git-approval-actions">
          <button type="button" className="git-reject-btn" disabled={isPending} onClick={onReject}>
            <span>✕ Rechazar y Pedir Ajustes</span>
          </button>
          <button
            type="button"
            className="git-approve-btn"
            disabled={isPending}
            onClick={onApprove}
          >
            <span>✔ {isPending ? "Aprobando…" : "Aprobar y Ejecutar Commit"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
