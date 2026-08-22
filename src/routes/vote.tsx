import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSession, useVotes, useCountdown } from "@/lib/maruja/useSession";
import { colorForIndex } from "@/lib/maruja/types";
import { getVoterId } from "@/lib/maruja/voter";
import { Wordmark } from "@/components/maruja/Wordmark";
import { CircularTimer } from "@/components/maruja/CircularTimer";
import { OrbBlur, SillaRayas, BolaBoliche, ManoCopa, LabiosFlotando, NoPosersTag, TramaBackdrop } from "@/components/maruja/Decor";
import { Confetti } from "@/components/maruja/Confetti";
import { GlockMiniGame } from "@/components/maruja/GlockMiniGame";
import { Leaderboard } from "@/components/maruja/Leaderboard";

export const Route = createFileRoute("/vote")({
  head: () => ({
    meta: [
      { title: "GLOCK — Votá ahora" },
      { name: "description", content: "Votá en vivo desde tu celular y participá del evento en tiempo real." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
    ],
  }),
  component: VotePage,
});

function VotePage() {
  const { session } = useActiveSession();
  const { counts, total, refetch } = useVotes(session?.id);
  const [voterId, setVoterId] = useState("");
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => { setVoterId(getVoterId()); }, []);

  useEffect(() => {
    if (!session?.id || !voterId) return;
    let cancel = false;
    (async () => {
      const { data } = await supabase
        .from("votes")
        .select("song_id")
        .eq("session_id", session.id)
        .eq("voter_id", voterId)
        .maybeSingle();
      if (!cancel) setMyVote((data?.song_id as string | undefined) ?? null);
    })();
    return () => { cancel = true; };
  }, [session?.id, voterId]);

  useEffect(() => {
    if (session?.status === "idle") setMyVote(null);
  }, [session?.status]);

  const submitVote = async (songId: string) => {
    if (!session || session.status !== "voting" || myVote || voting) return;
    setVoting(true);
    const { error } = await supabase
      .from("votes")
      .insert({ session_id: session.id, song_id: songId, voter_id: voterId });
    if (!error) {
      setMyVote(songId);
      refetch();
    }
    setVoting(false);
  };

  return (
    <div
      className="min-h-[100dvh] w-full flex justify-center relative overflow-x-hidden"
      style={{
        paddingLeft: "max(14px, env(safe-area-inset-left))",
        paddingRight: "max(14px, env(safe-area-inset-right))",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <OrbBlur color="#ff4ac4" size={420} style={{ top: "-18%", left: "-30%" }} />
      <OrbBlur color="#7a1fd6" size={420} style={{ bottom: "-18%", right: "-30%" }} />
      <div className="w-full max-w-[460px] py-4 relative">
        {!session || session.status === "idle" ? (
          <IdleMobile sessionId={session?.id ?? null} />
        ) : session.status === "voting" ? (
          <VotingMobile
            session={session}
            counts={counts}
            total={total}
            myVote={myVote}
            voting={voting}
            onVote={submitVote}
          />
        ) : session.status === "revealing" ? (
          <RevealingMobile total={total} />
        ) : (
          <WinnerMobile session={session} counts={counts} total={total} />
        )}
      </div>
    </div>
  );
}

function IdleMobile({ sessionId }: { sessionId: string | null }) {
  return (
    <div className="flex flex-col items-center text-center relative" style={{ gap: 14, paddingTop: 8 }}>
      <TramaBackdrop opacity={0.05} />
      <div className="relative w-full" style={{ zIndex: 2 }}>
        <Wordmark size="clamp(2rem, 11vw, 3rem)" />
        <h2
          className="mt-2 maruja-wordmark"
          style={{ fontSize: "clamp(1.1rem, 5vw, 1.5rem)", fontFamily: "var(--font-display)", lineHeight: 1.05, color: "#fff" }}
        >
          GLOCK ARRANCA EN BREVE
        </h2>
        <p
          className="mt-1"
          style={{
            fontFamily: "var(--font-display)", color: "#ff8ad9", letterSpacing: "0.22em",
            fontSize: "clamp(0.75rem, 3.2vw, 0.9rem)", lineHeight: 1.35,
          }}
        >
          MIENTRAS ESPERÁS · JUGÁ
        </p>
      </div>

      <div className="w-full" style={{ zIndex: 3 }}>
        <GlockMiniGame sessionId={sessionId} />
      </div>

      <div className="w-full" style={{ zIndex: 3 }}>
        <Leaderboard sessionId={sessionId} />
      </div>

      <NoPosersTag width={200} className="mt-2" label="GLOCK LIVE" />
    </div>
  );
}

function VotingMobile({
  session, counts, total, myVote, voting, onVote,
}: {
  session: NonNullable<ReturnType<typeof useActiveSession>["session"]>;
  counts: Record<string, number>;
  total: number;
  myVote: string | null;
  voting: boolean;
  onVote: (id: string) => void;
}) {
  const { remaining, fraction } = useCountdown(session.started_at, session.duration_sec);
  return (
    <div className="flex flex-col" style={{ gap: 14 }}>
      {/* Header sticky */}
      <div
        className="flex items-center justify-between"
        style={{
          position: "sticky", top: 0, zIndex: 10,
          backdropFilter: "blur(8px)",
          background: "linear-gradient(180deg, rgba(6,3,15,0.92) 60%, rgba(6,3,15,0) 100%)",
          padding: "10px 4px 14px",
          margin: "0 -4px",
        }}
      >
        <div className="min-w-0">
          <Wordmark size="clamp(1.6rem, 8vw, 2.2rem)" />
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(0.75rem, 3.2vw, 0.95rem)",
              color: "#ff4ac4", letterSpacing: "0.14em", marginTop: 2,
            }}
          >
            GLOCK EN VIVO
          </div>
        </div>
        <CircularTimer remaining={remaining} fraction={fraction} size={78} strokeWidth={7} />
      </div>

      <h2
        className="text-center"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.2rem, 5.6vw, 1.6rem)",
          color: "#fff", letterSpacing: "0.05em",
          margin: "2px 0 6px",
        }}
      >
        {myVote ? "¡VOTO REGISTRADO!" : "¿CUÁL ELEGÍS?"}
      </h2>

      <div className="flex flex-col" style={{ gap: 12 }}>
        {session.songs.map((song, idx) => {
          const color = colorForIndex(idx);
          const isMine = myVote === song.id;
          const dimmed = Boolean(myVote) && !isMine;
          return (
            <motion.button
              key={song.id}
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: dimmed ? 0.35 : 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
              disabled={Boolean(myVote) || voting}
              onClick={() => onVote(song.id)}
              className="text-left rounded-2xl flex items-center transition-shadow w-full"
              style={{
                padding: "14px 14px",
                gap: 14,
                background: `linear-gradient(135deg, ${color}22, rgba(13,5,32,0.9))`,
                border: `2px solid ${isMine ? color : `${color}66`}`,
                boxShadow: isMine ? `0 0 30px ${color}aa, inset 0 0 30px ${color}22` : "none",
                cursor: myVote ? "default" : "pointer",
                minHeight: 78,
                touchAction: "manipulation",
              }}
            >
              <div
                style={{
                  width: 54, height: 54, borderRadius: 12,
                  background: color, color: "#000",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "var(--font-display)", fontSize: 30, flexShrink: 0,
                  boxShadow: `0 6px 18px ${color}55`,
                }}
              >
                {isMine ? "✓" : song.id}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(1.05rem, 4.6vw, 1.35rem)",
                    color: "#fff", letterSpacing: "0.02em", lineHeight: 1.1,
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}
                >
                  {song.title || "—"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-serif)", color, fontStyle: "italic",
                    fontSize: "clamp(0.82rem, 3.6vw, 0.95rem)",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    marginTop: 2,
                  }}
                >
                  {song.artist || "—"}
                </div>
              </div>
              {isMine && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  style={{ fontSize: 26, color, flexShrink: 0 }}
                >
                  ★
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="text-center" style={{ marginTop: 6 }}>
        {!myVote && (
          <p style={{ fontFamily: "var(--font-sans)", color: "#ff4ac4", fontSize: "0.85rem" }}>
            Solo podés votar una vez
          </p>
        )}
        <p style={{ fontFamily: "var(--font-sans)", color: "#ffffff66", fontSize: "0.78rem", marginTop: 4 }}>
          {total} {total === 1 ? "voto" : "votos"} en total
        </p>
      </div>
    </div>
  );
}

function RevealingMobile({ total }: { total: number }) {
  return (
    <div className="flex flex-col items-center text-center pt-10" style={{ gap: 28 }}>
      <Wordmark size="clamp(1.8rem, 9vw, 2.4rem)" />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      >
        <BolaBoliche size={150} spin={false} />
      </motion.div>
      <div
        className="maruja-pulse"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.4rem, 7vw, 2rem)",
          color: "#fff", letterSpacing: "0.06em", lineHeight: 1.05,
        }}
      >
        CONTANDO VOTOS…
      </div>
      <div style={{ fontFamily: "var(--font-sans)", color: "#ff4ac4" }}>
        {total} {total === 1 ? "voto" : "votos"}
      </div>
    </div>
  );
}

function WinnerMobile({
  session, counts, total,
}: { session: NonNullable<ReturnType<typeof useActiveSession>["session"]>; counts: Record<string, number>; total: number }) {
  const winnerId = useMemo(() => {
    if (session.winner_id) return session.winner_id;
    if (!session.songs.length) return "A";
    let best = session.songs[0].id;
    let max = -1;
    for (const song of session.songs) {
      const c = counts[song.id] ?? 0;
      if (c > max) { max = c; best = song.id; }
    }
    return best;
  }, [session.winner_id, session.songs, counts]);
  const winner = session.songs.find((s) => s.id === winnerId);
  const winnerIdx = Math.max(0, session.songs.findIndex((s) => s.id === winnerId));
  const color = colorForIndex(winnerIdx);

  return (
    <div className="flex flex-col items-center text-center pt-6 relative" style={{ paddingBottom: 32 }}>
      <Confetti count={50} />
      <Wordmark size="clamp(1.6rem, 8vw, 2.2rem)" />
      <ManoCopa size={140} className="mt-3" />
      <div
        className="mt-3 maruja-tag"
        style={{ background: "#E8C96A", fontSize: "1rem" }}
      >
        ¡GANADORA!{/* genérica: aplica también a "ganadora" del voto */}
      </div>
      <div
        className="mt-4 px-2"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(1.8rem, 9vw, 2.8rem)",
          color: "#fff", textShadow: `0 0 24px ${color}`,
          lineHeight: 1.05, wordBreak: "break-word", maxWidth: "100%",
        }}
      >
        {winner?.title ?? "—"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)", color, fontStyle: "italic",
          fontSize: "clamp(1.05rem, 4.8vw, 1.35rem)", marginTop: 8,
        }}
      >
        {winner?.artist ?? ""}
      </div>
      <div
        className="mt-6"
        style={{
          fontFamily: "var(--font-display)", color: "#E8C96A",
          letterSpacing: "0.1em", fontSize: "clamp(0.95rem, 4vw, 1.1rem)",
        }}
      >
        {total} {total === 1 ? "VOTO" : "VOTOS"} EN TOTAL
      </div>
    </div>
  );
}
