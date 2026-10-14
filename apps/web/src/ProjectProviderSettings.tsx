import type { ProjectProviderStatus } from "@cubo/shared";
import { useCallback, useEffect, useState } from "react";
import { SectionCard, StatusBadge } from "./ui";
import { requestApi } from "./workspace";

export function ProjectProviderSettings({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectProviderStatus | null>(null),
    [key, setKey] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [clock, setClock] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const quality =
    data?.quota && clock - Date.parse(data.quota.checkedAt) > 300000 ? "stale" : "exact";
  const refresh = useCallback(
    async () =>
      setData(
        await requestApi<ProjectProviderStatus>(`projects/${projectId}/providers/openrouter`),
      ),
    [projectId],
  );
  useEffect(() => {
    void refresh().catch(() => setError("No se pudo consultar OpenRouter."));
  }, [refresh]);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestApi(`projects/${projectId}/providers/openrouter`, {
        method: "PUT",
        body: JSON.stringify({ key: key.trim() }),
      });
      setNotice("Conexión guardada y cifrada para este proyecto.");
      window.dispatchEvent(new Event("cubo-provider-changed"));
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la conexión.");
    } finally {
      setKey("");
      setBusy(false);
    }
  }
  return (
    <div id="project-provider-settings">
      <SectionCard
        title="Proveedor del proyecto"
        actions={
          <StatusBadge
            status={data?.blockedReason ? "failed" : data?.configured ? "succeeded" : "pending"}
          >
            {data?.blockedReason ? "Bloqueado" : data?.configured ? "Configurado" : "Sin conectar"}
          </StatusBadge>
        }
      >
        <div className="panel-heading">
          <h3>OpenRouter</h3>
          <span className="tag">Solo modelos gratuitos</span>
        </div>
        <p className="hint">
          API de texto. Clave aislada y cifrada por proyecto. Los mensajes y el contexto autorizado
          se envían a OpenRouter al ejecutar un turno; agentes y herramientas siguen pendientes.
        </p>
        {error && (
          <p className="inline-notice error" role="alert">
            {error}
          </p>
        )}
        {data?.blockedReason && (
          <p className="inline-notice error" role="alert">
            Integración detenida: el proveedor informó un coste inesperado. Requiere revisión; no se
            habilitan modelos de pago.
          </p>
        )}
        {notice && (
          <p className="inline-notice" role="status">
            {notice}
          </p>
        )}
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <label>
            {data?.configured ? "Reemplazar clave de API" : "Clave de API OpenRouter"}
            <input
              type="password"
              autoComplete="new-password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              maxLength={220}
              disabled={busy || !data?.encryptionConfigured}
            />
          </label>
          <div className="toolbar-actions">
            <button
              className="secondary compact"
              type="submit"
              disabled={busy || !key.trim() || !data?.encryptionConfigured}
            >
              {busy ? "Validando…" : "Guardar clave"}
            </button>
            <a
              className="back-link"
              href="https://openrouter.ai/settings/keys"
              target="_blank"
              rel="noreferrer"
            >
              Obtener clave en OpenRouter
            </a>
            <button
              className="secondary compact"
              type="button"
              disabled={busy}
              onClick={() =>
                void refresh().catch(() => setError("No se pudo actualizar el proveedor."))
              }
            >
              Actualizar uso
            </button>
          </div>
        </form>
        {!data?.encryptionConfigured && <p className="hint">Cifrado pendiente de configurar.</p>}
        <dl className="provider-usage">
          <div>
            <dt>Modelos gratuitos verificados</dt>
            <dd>{data?.catalogAvailable ? data.models.length : "No disponible"}</dd>
          </div>
          <div>
            <dt>Solicitudes gratuitas restantes hoy</dt>
            <dd>
              {data?.quota?.requestsRemaining ?? "No disponible"}
              {data?.quota?.requestsRemaining !== null &&
              data?.quota?.requestsRemaining !== undefined
                ? ` · ${quality}`
                : " · unavailable"}
            </dd>
          </div>
          <div>
            <dt>Límite monetario restante de la clave</dt>
            <dd>
              {data?.quota?.creditsRemaining !== null && data?.quota?.creditsRemaining !== undefined
                ? `USD ${data.quota.creditsRemaining} · ${quality}`
                : "No disponible · unavailable"}
            </dd>
          </div>
        </dl>
        {data?.quota && (
          <p className="hint">
            Consultado: {new Date(data.quota.checkedAt).toLocaleString()}. Los valores pueden
            cambiar fuera de Cubo; no equivalen al saldo total de la cuenta.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
