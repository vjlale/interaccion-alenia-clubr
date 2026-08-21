import { useEffect, useMemo, useState } from "react";

/**
 * Panel para enviar el /display a OBS Studio como Browser Source.
 * Desde OBS, la señal puede rutearse a Resolume vía Spout (Windows) o NDI (multiplataforma).
 *
 * Muestra:
 * - IP local sugerida (para acceder desde otra PC en la misma red)
 * - URL del display con parámetros configurables (fondo transparente, sin cursor)
 * - Botones para copiar URL y abrir instrucciones OBS → Resolume
 */
export function ObsOutputPanel() {
  const [origin, setOrigin] = useState("");
  const [transparent, setTransparent] = useState(false);
  const [hideCursor, setHideCursor] = useState(true);
  const [width, setWidth] = useState(1920);
  const [height, setHeight] = useState(1080);
  const [copied, setCopied] = useState<string>("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const isLocalhost = useMemo(
    () => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/i.test(origin),
    [origin],
  );

  const obsUrl = useMemo(() => {
    if (!origin) return "";
    const params = new URLSearchParams();
    if (transparent) params.set("bg", "transparent");
    if (hideCursor) params.set("nocursor", "1");
    const qs = params.toString();
    return `${origin}/display${qs ? `?${qs}` : ""}`;
  }, [origin, transparent, hideCursor]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(""), 1800);
  };

  return (
    <div className="maruja-panel p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <h2
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "1.6rem",
            color: "#fff",
            letterSpacing: "0.08em",
          }}
        >
          SALIDA A OBS / RESOLUME
        </h2>
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "rgba(225,47,190,0.15)",
            color: "#ff4ac4",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            border: "1px solid rgba(225,47,190,0.35)",
          }}
        >
          Browser Source
        </span>
      </div>

      <p
        style={{
          fontFamily: "var(--font-sans)",
          color: "#aaa",
          marginBottom: 14,
          fontSize: "0.9rem",
          lineHeight: 1.5,
        }}
      >
        OBS abre el <strong style={{ color: "#fff" }}>/display</strong> como Browser Source y lo
        envía a Resolume vía Spout (Windows) o NDI. Sin cámaras, sin capturas de ventana: el
        display se renderiza directamente en {width}×{height}.
      </p>

      {/* URL principal */}
      <div
        className="rounded-xl p-3 mb-4"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-sans)",
            color: "#ccc",
            fontSize: "0.8rem",
            marginBottom: 6,
          }}
        >
          URL para OBS Browser Source
        </div>
        <code
          className="block break-all"
          style={{
            fontFamily: "var(--font-mono, monospace)",
            color: "#ff4ac4",
            fontSize: "0.88rem",
            padding: "8px 10px",
            background: "rgba(0,0,0,0.35)",
            borderRadius: 8,
          }}
        >
          {obsUrl || "—"}
        </code>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => copy(obsUrl, "url")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{
              background: "linear-gradient(135deg, #b0187a, #ff4ac4)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.08em",
            }}
          >
            {copied === "url" ? "¡COPIADO!" : "COPIAR URL"}
          </button>
          <button
            onClick={() => window.open(obsUrl, "_blank", "noopener,noreferrer")}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.06em",
            }}
          >
            PROBAR EN NAVEGADOR
          </button>
        </div>
      </div>

      {/* Opciones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <label
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <input
            type="checkbox"
            checked={transparent}
            onChange={(e) => setTransparent(e.target.checked)}
            style={{ accentColor: "#ff4ac4" }}
          />
          <div>
            <div style={{ color: "#fff", fontFamily: "var(--font-sans)", fontSize: "0.9rem" }}>
              Fondo transparente
            </div>
            <div style={{ color: "#888", fontSize: "0.75rem" }}>
              Ideal para superponer en Resolume
            </div>
          </div>
        </label>

        <label
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <input
            type="checkbox"
            checked={hideCursor}
            onChange={(e) => setHideCursor(e.target.checked)}
            style={{ accentColor: "#ff4ac4" }}
          />
          <div>
            <div style={{ color: "#fff", fontFamily: "var(--font-sans)", fontSize: "0.9rem" }}>
              Ocultar cursor
            </div>
            <div style={{ color: "#888", fontSize: "0.75rem" }}>Sin puntero visible en la captura</div>
          </div>
        </label>

        <div
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <span style={{ color: "#ccc", fontSize: "0.85rem", fontFamily: "var(--font-sans)" }}>
            Ancho
          </span>
          <input
            type="number"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value) || 1920)}
            className="flex-1 min-w-0 px-2 py-1 rounded"
            style={{
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          />
        </div>
        <div
          className="flex items-center gap-2 p-3 rounded-lg"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <span style={{ color: "#ccc", fontSize: "0.85rem", fontFamily: "var(--font-sans)" }}>
            Alto
          </span>
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value) || 1080)}
            className="flex-1 min-w-0 px-2 py-1 rounded"
            style={{
              background: "rgba(0,0,0,0.35)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.15)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          />
        </div>
      </div>

      {isLocalhost && (
        <div
          className="rounded-lg p-3 mb-4 text-xs"
          style={{
            background: "rgba(255,193,7,0.08)",
            border: "1px solid rgba(255,193,7,0.35)",
            color: "#ffd76a",
            fontFamily: "var(--font-sans)",
            lineHeight: 1.5,
          }}
        >
          Estás en <strong>localhost</strong>. Para acceder desde otra PC (por ejemplo la del OBS),
          reemplazá <code>localhost</code> por la <strong>IP local</strong> de esta máquina
          (ej: <code>http://192.168.1.42:8080/display</code>). Ambos equipos deben estar en la misma red Wi-Fi/LAN.
        </div>
      )}

      {/* Instrucciones OBS */}
      <details
        className="rounded-lg"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <summary
          className="cursor-pointer px-4 py-3"
          style={{
            fontFamily: "var(--font-display)",
            letterSpacing: "0.08em",
            color: "#fff",
            fontSize: "0.95rem",
          }}
        >
          CÓMO CONECTAR OBS → RESOLUME
        </summary>
        <div
          className="px-4 pb-4 pt-1"
          style={{ color: "#ccc", fontFamily: "var(--font-sans)", fontSize: "0.88rem", lineHeight: 1.6 }}
        >
          <ol className="list-decimal list-inside space-y-2">
            <li>
              En OBS: <strong>Sources → + → Browser</strong>.
            </li>
            <li>
              Pegá la URL de arriba. Width: <strong>{width}</strong> · Height: <strong>{height}</strong>.
            </li>
            <li>
              Desmarcá <em>"Shutdown source when not visible"</em>.
            </li>
            <li>
              Marcá <em>"Refresh browser when scene becomes active"</em> (auto-reconnect).
            </li>
            <li>
              Para enviar a Resolume: instalá el plugin{" "}
              <a
                href="https://github.com/Off-World-Live/obs-spout2-plugin/releases"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ff4ac4", textDecoration: "underline" }}
              >
                OBS-Spout2
              </a>{" "}
              (Windows) o{" "}
              <a
                href="https://github.com/obs-ndi/obs-ndi/releases"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#ff4ac4", textDecoration: "underline" }}
              >
                OBS-NDI
              </a>{" "}
              (Mac/Linux) y activá la salida en <strong>Tools → Spout / NDI Output Settings</strong>.
            </li>
            <li>
              En Resolume Arena/Avenue: <strong>Sources → Spout</strong> (o NDI) → arrastrá la fuente a una capa.
            </li>
          </ol>
          <div
            className="mt-3 pt-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.1)", color: "#999", fontSize: "0.8rem" }}
          >
            Consejo: configurá la composición de Resolume a {width}×{height} y no escales la capa (mapeo 1:1) para
            evitar borrosidad.
          </div>
        </div>
      </details>
    </div>
  );
}
