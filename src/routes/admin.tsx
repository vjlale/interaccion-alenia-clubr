import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSession, useVotes, useCountdown, formatMSS } from "@/lib/maruja/useSession";
import { colorForIndex, optionLabel, type Song, type SessionStatus } from "@/lib/maruja/types";
import { Wordmark } from "@/components/maruja/Wordmark";
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
  voting: { bg: "#ff4ac4", label: "VOTANDO" },
  revealing: { bg: "#C9A84C", label: "REVELANDO" },
  winner: { bg: "#9B7B1A", label: "GANADORA" },
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

function AdminPage() {
  const { session, connected, refetch } = useActiveSession();
  const { counts, total } = useVotes(session?.id);
  const [songs, setSongs] = useState<Song[]>(normalizeSongs(undefined));
  const [duration, setDuration] = useState(60);
  const [voteUrl, setVoteUrl] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => { setVoteUrl(window.location.origin + "/vote"); }, []);

  useEffect(() => {
    if (!session) return;
    if (session.songs?.length) setSongs(normalizeSongs(session.songs));
    if (session.duration_sec) setDuration(session.duration_sec);
  }, [session?.id]);

  const status = session?.status ?? "idle";
  const isIdle = status === "idle";
  const isVoting = status === "voting";
  const hasValidTitles = songs.length > 0 && songs.every((s) => s.title.trim().length > 0);

  const { remaining } = useCountdown(session?.started_at ?? null, session?.duration_sec ?? 0);

  useEffect(() => {
    if (isVoting && remaining <= 0 && session) {
      supabase.from("sessions").update({ status: "revealing" }).eq("id", session.id);
      setTimeout(() => {
        const winnerId = computeWinner(songs, counts);
        supabase.from("sessions").update({ status: "winner", winner_id: winnerId }).eq("id", session.id);
      }, 2200);
    }
  }, [isVoting, remaining, session?.id, songs, counts]);

  const ensureSession = async () => {
    if (session) return session.id;
    const { data } = await supabase
      .from("sessions")
      .insert({ status: "idle", songs: normalizeSongs(songs), duration_sec: duration })
      .select()
      .single();
    refetch();
    return data?.id as string;
  };

  const applyConfig = async () => {
    const id = await ensureSession();
    if (!id) return;
    await supabase.from("sessions").update({ songs: normalizeSongs(songs), duration_sec: duration }).eq("id", id);
    setSavedMsg("¡Configuración aplicada!");
    setTimeout(() => setSavedMsg(""), 2200);
    refetch();
  };

  const startVoting = async () => {
    if (!hasValidTitles) return;
    const id = await ensureSession();
    if (!id) return;
    await supabase.from("sessions")
      .update({
        songs: normalizeSongs(songs),
        duration_sec: duration,
        status: "voting",
        started_at: new Date().toISOString(),
        winner_id: null,
      })
      .eq("id", id);
    refetch();
  };

  const revealWinner = async () => {
    if (!session) return;
    await supabase.from("sessions").update({ status: "revealing" }).eq("id", session.id);
    setTimeout(async () => {
      const winnerId = computeWinner(songs, counts);
      await supabase.from("sessions").update({ status: "winner", winner_id: winnerId }).eq("id", session.id);
    }, 1800);
  };

  const reset = async () => {
    await supabase.from("sessions").insert({
      status: "idle",
      songs: [makeSong(0), makeSong(1)],
      duration_sec: duration,
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

  const openDisplay = () => {
    window.open("/display", "glock-display", "width=1920,height=1080,menubar=no,toolbar=no,location=no,status=no");
  };

  return (
    <div className="min-h-screen w-full p-6 md:p-10">
      <div className="maruja-panel p-5 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Wordmark size="2.4rem" />
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
            Título obligatorio.
          </p>

          <div className="flex flex-col gap-4">
            {songs.map((song, idx) => {
              const color = colorForIndex(idx);
              return (
                <div key={`${song.id}-${idx}`} className="grid grid-cols-[60px_1fr_56px] gap-3 items-center">
                  <div style={{
                    width: 50, height: 50, borderRadius: 10,
                    background: color, color: "#000",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-display)", fontSize: 28,
                  }}>
                    {song.id}
                  </div>
                  <input
                    disabled={!isIdle}
                    placeholder="Título *"
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
                    style={{
                      border: "1px solid rgba(255,255,255,0.25)",
                      color: "#fff",
                      fontFamily: "var(--font-display)",
                    }}
                    title="Eliminar opción"
                  >
                    −
                  </button>
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

          <div className="mt-6">
            <label className="flex items-center justify-between" style={{ color: "#fff", fontFamily: "var(--font-sans)" }}>
              <span>Tiempo de votación</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.4rem", color: "#ff4ac4" }}>
                {formatMSS(duration)}
              </span>
            </label>
            <input
              type="range" min={15} max={300} step={15}
              disabled={!isIdle}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full mt-2"
              style={{ accentColor: "#ff4ac4" }}
            />
          </div>

          <button
            onClick={applyConfig}
            disabled={!isIdle || !hasValidTitles}
            className="w-full mt-6 py-3 rounded-xl font-bold disabled:opacity-40"
            style={{
              background: "linear-gradient(135deg, #b0187a, #ff4ac4)",
              color: "#fff",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.1em",
              fontSize: "1.1rem",
              boxShadow: "0 0 20px rgba(225,47,190,0.4)",
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
                style={{ background: "rgba(225,47,190,0.1)", border: "1px solid rgba(225,47,190,0.3)" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", color: "#ccc", fontSize: "0.85rem" }}>Tiempo restante</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", color: "#fff" }}>
                    {formatMSS(remaining)}
                  </div>
                </div>
                <div className="text-right">
                  <div style={{ fontFamily: "var(--font-sans)", color: "#ccc", fontSize: "0.85rem" }}>Votos</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "2.8rem", color: "#ff4ac4" }}>{total}</div>
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
              <div className="truncate" style={{ fontFamily: "var(--font-sans)", color: "#ff4ac4", fontSize: "0.9rem" }}>
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
