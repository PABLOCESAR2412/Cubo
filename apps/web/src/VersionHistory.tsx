import { currentAppVersion, versionHistory } from "@cubo/shared";
import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

export function VersionHistoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="model-dialog version-history-dialog"
      aria-label="Historial de versiones"
      onCancel={onClose}
      onClose={onClose}
    >
      <div className="panel-heading">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Icon name="cube" size={20} />
          <div>
            <h2 style={{ fontSize: "16px", margin: 0, fontWeight: 600 }}>Historial de versiones</h2>
            <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
              Registro de novedades y cambios en Cubo
            </span>
          </div>
        </div>
        <button
          className="icon-button"
          type="button"
          onClick={onClose}
          aria-label="Cerrar historial"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      <div className="model-dialog-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
        <div
          style={{
            padding: "10px 14px",
            background: "var(--color-base)",
            borderRadius: "8px",
            border: "1px solid var(--color-line)",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "var(--color-muted)",
          }}
        >
          <strong style={{ color: "var(--color-ink)", display: "block", marginBottom: "4px" }}>
            Control Semántico de Versiones (SemVer):
          </strong>
          <div>
            • <strong>Grande (Major):</strong> Cambios mayores de arquitectura o ruptura de
            compatibilidad.
          </div>
          <div>
            • <strong>Mediano (Minor):</strong> Nuevas funcionalidades, agentes y módulos.
          </div>
          <div>
            • <strong>Mínimo (Patch):</strong> Optimizaciones, seguridad y correcciones.
          </div>
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          {versionHistory.map((release) => {
            const isCurrent = release.version === currentAppVersion;
            return (
              <div
                key={release.version}
                style={{
                  border: isCurrent
                    ? "1px solid var(--color-accent)"
                    : "1px solid var(--color-line)",
                  borderRadius: "10px",
                  padding: "16px",
                  background: isCurrent
                    ? "rgba(var(--color-accent-rgb, 120, 120, 255), 0.04)"
                    : "var(--color-base)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--color-ink)",
                      }}
                    >
                      v{release.version}
                    </span>
                    {isCurrent && (
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "var(--color-accent)",
                          color: "#fff",
                        }}
                      >
                        ACTUAL
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-line)",
                        color: "var(--color-muted)",
                      }}
                    >
                      {release.typeLabel}
                    </span>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--color-muted)" }}>
                    {release.date}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    margin: "0 0 6px 0",
                    color: "var(--color-ink)",
                  }}
                >
                  {release.title}
                </h3>
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--color-muted)",
                    margin: "0 0 12px 0",
                    lineHeight: 1.4,
                  }}
                >
                  {release.summary}
                </p>

                <div style={{ display: "grid", gap: "6px" }}>
                  {release.changes.map((item) => (
                    <div
                      key={`${release.version}-${item.category}-${item.label}`}
                      style={{
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          padding: "1px 5px",
                          borderRadius: "3px",
                          background: "var(--color-line)",
                          color: "var(--color-ink)",
                          marginTop: "2px",
                          flexShrink: 0,
                        }}
                      >
                        {item.category}
                      </span>
                      <div>
                        <strong style={{ color: "var(--color-ink)" }}>{item.label}: </strong>
                        <span style={{ color: "var(--color-muted)" }}>{item.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </dialog>
  );
}
