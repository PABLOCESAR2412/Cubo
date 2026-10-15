import type { ProjectProviderStatus } from "@cubo/shared";
import { useCallback, useEffect, useState } from "react";
import { SectionCard, StatusBadge } from "./ui";
import { requestApi } from "./workspace";

export function ProviderSettings() {
  const [data, setData] = useState<ProjectProviderStatus | null>(null),
    [key, setKey] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [clock, setClock] = useState(Date.now);
  const [fallbackModel, setFallbackModel] = useState("");
  const [noticeSeconds, setNoticeSeconds] = useState(30);
  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const quality =
    data?.quota && clock - Date.parse(data.quota.checkedAt) > 300000 ? "stale" : "exact";
  const refresh = useCallback(
    async () => setData(await requestApi<ProjectProviderStatus>("providers/openrouter")),
    [],
  );
  useEffect(() => {
    void refresh().catch(() => setError("No se pudo consultar OpenRouter."));
  }, [refresh]);
  useEffect(() => {
    if (data?.preferences) {
      setFallbackModel(data.preferences.fallbackModel);
      setNoticeSeconds(data.preferences.noticeSeconds);
    }
  }, [data]);
  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await requestApi("providers/openrouter", {
        method: "PUT",
        body: JSON.stringify({ key: key.trim() }),
      });
      setNotice("Conexión general guardada y cifrada.");
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
    <div id="provider-settings">
      <SectionCard
        title="OpenRouter"
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
          Conexión general cifrada. Cada turno utiliza solo los mensajes y el contexto autorizado se
          envían a OpenRouter al ejecutar un turno; agentes y herramientas siguen pendientes.
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
        <form
          className="form-stack provider-preferences"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await requestApi("providers/openrouter/preferences", {
                method: "PUT",
                body: JSON.stringify({ fallbackModel, noticeSeconds }),
              });
              setNotice("Preferencias guardadas.");
              window.dispatchEvent(new Event("cubo-provider-changed"));
            } catch (error) {
              setError(error instanceof Error ? error.message : "No se pudo guardar.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Modelo de respaldo
            <select
              value={fallbackModel}
              onChange={(e) => setFallbackModel(e.target.value)}
              disabled={busy}
            >
              <option value="">Sin respaldo automático</option>
              {data?.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} · gratuito
                </option>
              ))}
            </select>
          </label>
          <label>
            Avisar después de (segundos)
            <input
              type="number"
              min={10}
              max={180}
              value={noticeSeconds}
              onChange={(e) => setNoticeSeconds(Number(e.target.value))}
            />
          </label>
          <p className="hint">
            El respaldo se intenta una vez ante rechazo explícito por cuota o modelo no disponible.
            Nunca tras una respuesta incierta o con un modelo de pago.
          </p>
          <button className="secondary compact" disabled={busy} type="submit">
            Guardar preferencias
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
