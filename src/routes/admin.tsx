import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSession, useVotes } from "@/lib/maruja/useSession";
import { createSessionFn, updateSessionFn } from "@/lib/maruja/session.functions";

import { colorForIndex, optionLabel, type Song, type SessionStatus } from "@/lib/maruja/types";
import { ObsOutputPanel } from "@/components/maruja/ObsOutputPanel";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "GLOCK — Panel de control" },
      { name: "description", content: "Control de votación en vivo para tu evento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const STATUS_STYLE: Record<SessionStatus, { bg: string; label: string }> = {
  idle: { bg: "#555", label: "INACTIVO" },
  voting: { bg: "#E7B10C", label: "VOTANDO" },
  revealing: { bg: "#C9A84C", label: "REVELANDO" },
  winner: { bg: "#9B7B1A", label: "GANADOR" },
};

const MIN_OPTIONS = 1;
const MAX_OPTIONS = 8;

function makeSong(index: number, prev?: Partial<Song>): Song {
  return {
    id: optionLabel(index),
    title: prev?.title ?? "",
    artist: prev?.artist ?? "",
    image: prev?.image ?? "",
  };
}

function normalizeSongs(input: Song[] | null | undefined): Song[] {
  if (!input?.length) return [makeSong(0), makeSong(1)];
  return input.map((s, i) => makeSong(i, s));
}

// Redimensiona la foto elegida en el navegador y la devuelve como data URL liviana.
async function fileToResizedDataUrl(file: File, max = 640): Promise<string> {
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = src;
    });
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.82);
  } finally {
    URL.revokeObjectURL(src);
  }
}

function AdminPage() {
  const { session, connected, refetch } = useActiveSession();
  const { counts, total } = useVotes(session?.id);
  const [songs, setSongs] = useState<Song[]>(normalizeSongs(undefined));
  const [duration] = useState(3600); // sin temporizador; valor alto e inocuo
  const [voteUrl, setVoteUrl] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => { setVoteUrl(window.location.origin + "/vote"); }, []);

  useEffect(() => {
    if (!session) return;
    if (session.songs?.length) setSongs(normalizeSongs(session.songs));
  }, [session?.id]);

  const status = session?.status ?? "idle";
  const isIdle = status === "idle";
  const isVoting = status === "voting";
  const hasValidTitles = songs.length > 0 && songs.every((s) => s.title.trim().length > 0);

  // Sin temporizador: el ganador se revela manualmente con el botón "REVELAR GANADOR".

  const ensureSession = async () => {
    if (session) return session.id;
    const res = await createSessionFn({
      data: { status: "idle", songs: normalizeSongs(songs), duration_sec: duration },
    });
    refetch();
    return res?.id as string;
  };

  const applyConfig = async () => {
    const id = await ensureSession();
    if (!id) return;
    await updateSessionFn({
      data: { id, patch: { songs: normalizeSongs(songs), duration_sec: duration } },
    });
    setSavedMsg("¡Configuración aplicada!");
    setTimeout(() => setSavedMsg(""), 2200);
    refetch();
  };

  const startVoting = async () => {
    if (!hasValidTitles) return;
    const id = await ensureSession();
    if (!id) return;
    await updateSessionFn({
      data: {
        id,
        patch: {
          songs: normalizeSongs(songs),
          duration_sec: duration,
          status: "voting",
          started_at: new Date().toISOString(),
          winner_id: null,
        },
      },
    });
    refetch();
  };

  const revealWinner = async () => {
    if (!session) return;
    await updateSessionFn({ data: { id: session.id, patch: { status: "revealing" } } });
    setTimeout(async () => {
      const winnerId = computeWinner(songs, counts);
      await updateSessionFn({
        data: { id: session.id, patch: { status: "winner", winner_id: winnerId } },
      });
    }, 1800);
  };

  const reset = async () => {
    await createSessionFn({
      data: {
        status: "idle",
        songs: [makeSong(0), makeSong(1)],
        duration_sec: duration,
      },
    });
    setSongs([makeSong(0), makeSong(1)]);
    refetch();
  };


  const addOption = () => {
    if (!isIdle || songs.length >= MAX_OPTIONS) return;
    setSongs((prev) => [...prev, makeSong(prev.length)]);
  };

  const removeOption = (idx: number) => {
    if (!isIdle || songs.length <= MIN_OPTIONS) return;
    setSongs((prev) => prev.filter((_, i) => i !== idx).map((s, i) => makeSong(i, s)));
  };

  const onPickImage = async (idx: number, file: File | null | undefined) => {
    if (!file) return;
    const dataUrl = await fileToResizedDataUrl(file, 640);
    if (!dataUrl) return;
    setSongs((arr) => arr.map((s, i) => (i === idx ? { ...s, image: dataUrl } : s)));
  };

  const openDisplay = () => {
    window.open("/display", "glock-display", "width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no");
  };

  return (
    <div className="min-h-screen w-full p-6 md:p-10">
      <div className="maruja-panel p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span style={{ fontFamily: "var(--font-cartel)", fontSize: "2rem", color: "#fff", letterSpacing: "0.02em", textTransform: "uppercase", lineHeight: 1 }}>
            CLUB REGGAETON <span style={{ color: "#E7B10C" }}>XL</span>
          </span>
          <span style={{ fontFamily: "var(--font-serif)", color: "#ccc", fontStyle: "italic" }}>
            Panel de control
          </span>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2" title={connected ? "Conectado" : "Desconectado"}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: connected ? "#5FE88E" : "#ff2d55",
              boxShadow: `0 0 10px ${connected ? "#5FE88E" : "#ff2d55"}`,
            }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "0.85rem", color: "#fff" }}>
              {connected ? "Conectado" : "Desconectado"}
            </span>
          </div>
          <span style={{
            padding: "6px 14px", borderRadius: 999,
            background: STATUS_STYLE[status].bg, color: "#000",
            fontFamily: "var(--font-display)", letterSpacing: "0.1em", fontSize: "0.9rem",
          }}>
            {STATUS_STYLE[status].label}
          </span>
          <button
            onClick={openDisplay}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{ background: "#fff", color: "#0a0118", fontFamily: "var(--font-display)", letterSpacing: "0.08em" }}
          >
            ABRIR DISPLAY
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="maruja-panel p-6">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#fff", letterSpacing: "0.08em", marginBottom: 8 }}>
            CONFIGURAR OPCIONES
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", color: "#aaa", marginBottom: 16, fontSize: "0.9rem" }}>
            Nombre del artista obligatorio. Subí una foto (o pegá el link de una imagen) para cada uno.
          </p>

          <div className="flex flex-col gap-4">
            {songs.map((song, idx) => {
              const color = colorForIndex(idx);
              return (
                <div
                  key={`${song.id}-${idx}`}
                  className="rounded-xl p-3"
                  style={{ border: `1px solid ${color}44`, background: "rgba(255,255,255,0.03)" }}
                >
                  <div className="grid grid-cols-[52px_1fr_44px] gap-3 items-center">
                    <div style={{
                      width: 48, height: 48, borderRadius: 10,
                      background: color, color: "#000",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-display)", fontSize: 26,
                    }}>
                      {song.id}
                    </div>
                    <input
                      disabled={!isIdle}
                      placeholder="Nombre del artista *"
                      value={song.title}
                      onChange={(e) => setSongs((arr) => arr.map((s, i) => i === idx ? { ...s, title: e.target.value } : s))}
                      className="px-3 py-2 rounded-lg outline-none"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        color: "#fff",
                        border: `1px solid ${color}66`,
                        fontFamily: "var(--font-sans)",
                      }}
                    />
                    <button
                      disabled={!isIdle || songs.length <= MIN_OPTIONS}
                      onClick={() => removeOption(idx)}
                      className="h-10 rounded-lg disabled:opacity-35"
                      style={{ border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontFamily: "var(--font-display)" }}
                      title="Eliminar opción"
                    >
                      −
                    </button>
                  </div>

                  <div className="grid grid-cols-[52px_1fr] gap-3 items-center mt-3">
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: 10, overflow: "hidden",
                        border: `1px solid ${color}66`, background: "rgba(255,255,255,0.05)",
                        display: "grid", placeItems: "center",
                      }}
                    >
                      {song.image ? (
                        <img src={song.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <span style={{ color: "#888", fontSize: 20 }}>📷</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <label
                        className="px-3 py-2 rounded-lg cursor-pointer"
                        style={{
                          border: `1px solid ${color}66`, color: "#fff",
                          fontFamily: "var(--font-sans)", fontSize: "0.85rem",
                          opacity: isIdle ? 1 : 0.4, pointerEvents: isIdle ? "auto" : "none",
                        }}
                      >
                        {song.image ? "Cambiar foto" : "Subir foto"}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={!isIdle}
                          onChange={(e) => onPickImage(idx, e.target.files?.[0])}
                          style={{ display: "none" }}
                        />
                      </label>
                      <input
                        disabled={!isIdle}
                        placeholder="…o pegá un link de imagen"
                        value={song.image ?? ""}
                        onChange={(e) => setSongs((arr) => arr.map((s, i) => i === idx ? { ...s, image: e.target.value } : s))}
                        className="px-3 py-2 rounded-lg outline-none flex-1 min-w-[140px]"
                        style={{
                          background: "rgba(255,255,255,0.05)", color: "#fff",
                          border: "1px solid rgba(255,255,255,0.15)",
                          fontFamily: "var(--font-sans)", fontSize: "0.8rem",
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={addOption}
            disabled={!isIdle || songs.length >= MAX_OPTIONS}
            className="mt-4 px-4 py-2 rounded-lg disabled:opacity-40"
            style={{
              border: "1px solid rgba(255,255,255,0.24)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.06em",
            }}
          >
            + AGREGAR OPCIÓN
          </button>

          <button
            onClick={applyConfig}
            disabled={!isIdle || !hasValidTitles}
            className="w-full mt-6 py-3 rounded-xl font-bold disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #9A7407, #E7B10C)",
              color: "#0a0a0c",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.1em",
              fontSize: "1.1rem",
              boxShadow: "0 0 20px rgba(231,177,12,0.4)",
            }}
          >
            APLICAR CONFIGURACIÓN
          </button>
          {savedMsg && (
            <p className="mt-3 text-center" style={{ color: "#5FE88E", fontFamily: "var(--font-sans)" }}>{savedMsg}</p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="maruja-panel p-6">
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.6rem", color: "#fff", letterSpacing: "0.08em", marginBottom: 16 }}>
              CONTROLES
            </h2>

            {isVoting && session && (
              <div className="mb-6 flex items-center justify-between p-4 rounded-xl"
                style={{ background: "rgba(231,177,12,0.1)", border: "1px solid rgba(231,177,12,0.3)" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", color: "#ccc", fontSize: "0.85rem" }}>Estado</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "1.8rem", color: "#fff" }}>
                    VOTACIÓN ABIERTA
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: "var(--font-sans)", color: "#ccc", fontSize: "0.85rem" }}>Votos</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", color: "#E7B10C" }}>{total}</div>
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <ActionButton
                onClick={startVoting}
                disabled={!isIdle || !hasValidTitles}
                bg="linear-gradient(135deg, #2BA85E, #5FE88E)"
                color="#0a0118"
              >
                INICIAR VOTACIÓN
              </ActionButton>
              <ActionButton
                onClick={revealWinner}
                disabled={!isVoting}
                bg="linear-gradient(135deg, #9B7B1A, #E8C96A)"
                color="#0a0118"
              >
                REVELAR GANADORA
              </ActionButton>
              <ActionButton
                onClick={reset}
                disabled={false}
                bg="rgba(255,255,255,0.08)"
                color="#fff"
                border="1px solid rgba(255,255,255,0.2)"
              >
                REINICIAR
              </ActionButton>
            </div>
          </div>

          {session && session.status !== "idle" && (
            <div className="maruja-panel p-6">
              <h3 style={{ fontFamily: "var(--font-display)", color: "#fff", letterSpacing: "0.08em", marginBottom: 14 }}>
                RESULTADOS EN VIVO
              </h3>
              <div className="flex flex-col gap-3">
                {session.songs.map((song, idx) => {
                  const count = counts[song.id] ?? 0;
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const color = colorForIndex(idx);
                  const isWinner = session.status === "winner" && session.winner_id === song.id;
                  return (
                    <div key={song.id}>
                      <div className="flex items-center justify-between mb-1" style={{ color: "#fff", fontFamily: "var(--font-sans)" }}>
                      <span>
                        <strong style={{ color, fontFamily: "var(--font-display)", marginRight: 8 }}>{song.id}</strong>
                        {song.title}
                        {isWinner && <span className="ml-2">🏆</span>}
                      </span>
                        <span style={{ color, fontFamily: "var(--font-display)" }}>
                          {pct.toFixed(0)}% · {count}
                        </span>
                      </div>
                      <div style={{ height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          width: `${pct}%`, height: "100%", background: color,
                          boxShadow: `0 0 12px ${color}`, transition: "width 0.3s ease",
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="maruja-panel p-6 flex items-center gap-4">
            <div className="p-2 bg-white rounded-lg">
              <QRCodeSVG value={voteUrl || "https://example.com/vote"} size={96} />
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontFamily: "var(--font-display)", color: "#fff", letterSpacing: "0.08em" }}>QR DE VOTACIÓN</div>
              <div className="truncate" style={{ fontFamily: "var(--font-sans)", color: "#E7B10C", fontSize: "0.9rem" }}>
                {voteUrl}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <button
                  onClick={() => navigator.clipboard.writeText(voteUrl)}
                  className="text-xs px-3 py-1 rounded"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  Copiar URL
                </button>
                <button
                  onClick={() => {
                    const text = encodeURIComponent(`¡Votá ahora en vivo! ${voteUrl}`);
                    window.open(`https://wa.me/?text=${text}`, "_blank", "noopener,noreferrer");
                  }}
                  className="text-xs px-3 py-1 rounded"
                  style={{ background: "#25D366", color: "#fff", fontWeight: 700 }}
                >
                  Compartir por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <ObsOutputPanel />
      </div>
    </div>
  );
}

function ActionButton({
  children, onClick, disabled, bg, color, border,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  bg: string;
  color: string;
  border?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition-transform hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background: bg,
        color,
        border: border ?? "none",
        fontFamily: "var(--font-display)",
        letterSpacing: "0.1em",
        fontSize: "1.1rem",
      }}
    >
      {children}
    </button>
  );
}

function computeWinner(songs: Song[], counts: Record<string, number>): string {
  if (!songs.length) return "A";
  let best = songs[0]?.id ?? "A";
  let max = -1;
  for (const song of songs) {
    const c = counts[song.id] ?? 0;
    if (c > max) { max = c; best = song.id; }
  }
  return best;
}
