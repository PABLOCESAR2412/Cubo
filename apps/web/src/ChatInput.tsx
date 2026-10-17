import type { ChatAttachment, FreeModel, ProjectProviderStatus } from "@cubo/shared";
import { useEffect, useRef, useState } from "react";
import { attachmentAccept, extractAttachment } from "./attachments";
import { Icon } from "./Icon";
export const effortNames: Record<string, string> = {
  none: "Sin razonamiento",
  minimal: "Mínimo",
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
  xhigh: "Muy alto",
  max: "Máximo",
};
interface Recognition {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type VoiceWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function ChatComposer({
  value,
  onChange,
  onSend,
  disabled,
  busy,
  canSend,
  models,
  model,
  setModel,
  effort,
  setEffort,
  provider,
  attachments,
  setAttachments,
  onError,
  onUsageRefresh,
}: {
  value: string;
  onChange: (s: string) => void;
  onSend: () => void;
  disabled: boolean;
  busy: boolean;
  canSend: boolean;
  models: FreeModel[];
  model: string;
  setModel: (s: string) => void;
  effort: string;
  setEffort: (s: string) => void;
  provider: ProjectProviderStatus | null;
  attachments: ChatAttachment[];
  setAttachments: (a: ChatAttachment[]) => void;
  onError: (s: string) => void;
  onUsageRefresh: () => Promise<void>;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    files = useRef<HTMLInputElement>(null),
    voice = useRef<Recognition | null>(null),
    voiceConsent = useRef(false),
    current = useRef(value);
  current.current = value;
  const [query, setQuery] = useState(""),
    [reading, setReading] = useState(false),
    [drag, setDrag] = useState(false),
    [listening, setListening] = useState(false);
  const selected = models.find((m) => m.id === model),
    Constructor =
      (window as VoiceWindow).SpeechRecognition ?? (window as VoiceWindow).webkitSpeechRecognition;
  useEffect(
    () => () => {
      voice.current?.abort();
    },
    [],
  );
  async function add(list: FileList | File[]) {
    if (disabled || busy || reading) return;
    setReading(true);
    onError("");
    try {
      const picked = Array.from(list);
      if (picked.length + attachments.length > 4) throw Error("Máximo 4 adjuntos por turno.");
      const parsed = [];
      for (const file of picked) parsed.push(await extractAttachment(file));
      const next = [...attachments, ...parsed];
      if (new Set(next.map((a) => a.name)).size !== next.length)
        throw Error("Ya existe un adjunto con ese nombre. Retíralo antes de reemplazarlo.");
      if (next.reduce((sum, a) => sum + a.text.length, 0) > 24000)
        throw Error("Los extractos superan 24000 caracteres. Retira un archivo.");
      setAttachments(next);
    } catch (e) {
      onError(e instanceof Error ? e.message : "No se pudo leer el archivo.");
    } finally {
      setReading(false);
      if (files.current) files.current.value = "";
    }
  }
  function dictate() {
    if (listening) {
      voice.current?.stop();
      return;
    }
    if (!Constructor) return;
    if (
      !voiceConsent.current &&
      !confirm(
        "El dictado lo procesa tu navegador y puede enviar audio a su servicio de voz. El texto se añade al borrador, sin enviarse automáticamente. ¿Continuar?",
      )
    )
      return;
    voiceConsent.current = true;
    const recognition = new Constructor();
    voice.current = recognition;
    recognition.lang = "es-EC";
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0]?.transcript ?? "")
        .join(" ");
      onChange(`${current.current}${current.current ? " " : ""}${text}`.slice(0, 2000));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      onError(
        "No se pudo dictar. Revisa el permiso del micrófono y la compatibilidad del navegador.",
      );
    };
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
      onError("No se pudo iniciar el micrófono.");
    }
  }
  return (
    <>
      <form
        className={`chat-composer refined-composer ${drag ? "drop-active" : ""}`}
        onSubmit={(e) => {
          e.preventDefault();
          voice.current?.stop();
          onSend();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDrag(true);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDrag(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void add(e.dataTransfer.files);
        }}
      >
        {attachments.length > 0 && (
          <div className="attachment-list">
            {attachments.map((a, i) => (
              <div className="attachment-chip" key={a.name}>
                <details>
                  <summary>
                    <Icon name="file" size={14} />
                    {a.name}
                    {a.truncated ? " · extracto" : ""}
                  </summary>
                  <pre>{a.text}</pre>
                </details>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Retirar ${a.name}`}
                  disabled={busy}
                  onClick={() => setAttachments(attachments.filter((_, j) => i !== j))}
                >
                  <Icon name="close" size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="quick-commands-bar" role="toolbar" aria-label="Comandos rápidos">
          {["/plan", "/diff", "/test", "/run", "/status"].map((cmd) => (
            <button
              key={cmd}
              type="button"
              className="quick-command-pill"
              onClick={() => {
                const prefix = `${cmd} `;
                if (!value.startsWith(prefix)) onChange(`${prefix}${value}`);
              }}
            >
              {cmd}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="chat-message">
          Mensaje · máximo 2000 caracteres
        </label>
        <textarea
          id="chat-message"
          placeholder={
            drag ? "Suelta tus archivos aquí…" : "Escribe un mensaje… (/plan, /diff, /test)"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={2000}
          disabled={disabled || busy}
        />
        <input
          ref={files}
          className="sr-only"
          type="file"
          multiple
          accept={attachmentAccept}
          aria-label="Elegir archivos para el chat"
          onChange={(e) => {
            if (e.target.files) void add(e.target.files);
          }}
        />
        <div className="composer-controls">
          <div>
            <button
              className="icon-button"
              type="button"
              title="Adjuntar archivos · hasta 5 MB por archivo"
              aria-label="Adjuntar archivos"
              disabled={disabled || busy || reading}
              onClick={() => files.current?.click()}
            >
              <Icon name="plus" size={18} />
            </button>
            <button
              className={`icon-button ${listening ? "active" : ""}`}
              type="button"
              title={Constructor ? "Dictar mensaje" : "Dictado no compatible con este navegador"}
              aria-label={listening ? "Detener dictado" : "Dictar mensaje"}
              disabled={!Constructor || disabled || busy}
              onClick={dictate}
            >
              <Icon name="mic" size={17} />
            </button>
            <button
              className="model-trigger"
              type="button"
              aria-label="Elegir modelo y esfuerzo"
              disabled={busy || disabled}
              onClick={() => {
                dialog.current?.showModal();
                void onUsageRefresh().catch(() => {});
              }}
            >
              <div className="cost-meter-bars" title="Nivel de costo: Optimizado (Gratuito)">
                <span className="cost-bar active" />
                <span className="cost-bar" />
                <span className="cost-bar" />
                <span className="cost-bar" />
                <span className="cost-bar" />
              </div>
              <span>
                {selected?.name ?? "Elegir modelo"}
                {effort ? ` · ${effortNames[effort] ?? effort}` : ""}
              </span>
              <Icon name="chevron" size={13} />
            </button>
            <button
              className="usage-trigger"
              type="button"
              onClick={() => {
                dialog.current?.showModal();
                void onUsageRefresh().catch(() => {});
              }}
            >
              Uso
            </button>
          </div>
          <button
            className="send-message"
            type="submit"
            aria-label="Enviar mensaje"
            disabled={
              disabled || busy || reading || !canSend || (!value.trim() && !attachments.length)
            }
          >
            <Icon name="arrow" size={18} />
          </button>
        </div>
        {reading && (
          <p className="hint" role="status">
            Leyendo archivo…
          </p>
        )}
        {listening && (
          <p className="hint" role="status">
            Escuchando…
          </p>
        )}
      </form>
      <dialog ref={dialog} className="model-dialog" aria-labelledby="models-title">
        <div className="panel-heading">
          <h2 id="models-title">Modelo y uso</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="Cerrar modelos"
            onClick={() => dialog.current?.close()}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="model-dialog-body">
          <label>
            Buscar modelo
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre o familia"
            />
          </label>
          <div className="model-source">
            <strong>OpenRouter</strong>
            <span>API · solo gratuitos</span>
          </div>
          <fieldset className="model-options" aria-label="Modelos de OpenRouter">
            {models
              .filter((m) => `${m.id} ${m.name}`.toLowerCase().includes(query.toLowerCase()))
              .map((m) => (
                <button
                  type="button"
                  className={model === m.id ? "selected" : ""}
                  key={m.id}
                  onClick={() => {
                    setModel(m.id);
                    setEffort("");
                  }}
                >
                  <span>
                    <strong>{m.name}</strong>
                    <small>
                      {m.id.split("/")[0]}
                      {m.contextLength
                        ? ` · contexto ${m.contextLength.toLocaleString()} tokens`
                        : ""}
                    </small>
                  </span>
                  <span>USD 0{model === m.id && <Icon name="check" size={14} />}</span>
                </button>
              ))}
            {!models.length && <p className="hint">Conecta OpenRouter desde Ajustes.</p>}
          </fieldset>
          {selected?.efforts?.length ? (
            <label>
              Esfuerzo
              <select value={effort} onChange={(e) => setEffort(e.target.value)}>
                <option value="">Predeterminado del modelo</option>
                {selected.efforts.map((e) => (
                  <option key={e} value={e}>
                    {effortNames[e] ?? e}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <dl className="model-usage">
            <div>
              <dt>Solicitudes restantes</dt>
              <dd>
                {provider?.quota?.requestsRemaining ?? "No disponible"}
                {provider?.quota?.requestsRemaining !== null &&
                provider?.quota?.requestsRemaining !== undefined
                  ? ` · ${Date.now() - Date.parse(provider.quota.checkedAt) > 300000 ? "stale" : "exact"}`
                  : ""}
              </dd>
            </div>
            <div>
              <dt>Ventana / reinicio</dt>
              <dd>No expuesto por la API</dd>
            </div>
            <div>
              <dt>Consumo por mensaje</dt>
              <dd>Se conoce al terminar el turno</dd>
            </div>
          </dl>
          {provider?.quota && (
            <p className="hint">
              Consultado {new Date(provider.quota.checkedAt).toLocaleString()}. No equivale al saldo
              total de la cuenta.
            </p>
          )}
          <p className="hint">
            El contexto máximo del modelo no es tu saldo de tokens. Los extractos adjuntos se
            enviarán al proveedor. Sin OCR ni almacenamiento del archivo original.
          </p>
          <button type="button" className="primary compact" onClick={() => dialog.current?.close()}>
            Listo
          </button>
        </div>
      </dialog>
    </>
  );
}
