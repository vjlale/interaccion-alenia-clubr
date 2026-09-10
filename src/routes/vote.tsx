import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useActiveSession, useVotes } from "@/lib/maruja/useSession";
import { colorForIndex, type Song } from "@/lib/maruja/types";
import { getVoterId } from "@/lib/maruja/voter";
import { Confetti } from "@/components/maruja/Confetti";
import versusVs from "@/assets/versus-vs.png";
import aleniaLogo from "@/assets/Alenia-logo.webp";

export const Route = createFileRoute("/vote")({
  head: () => ({
    meta: [
      { title: "Club Reggaeton XL — Votá ahora" },
      { name: "description", content: "Votá en vivo desde tu celular y participá del versus del año." },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" },
    ],
  }),
  component: VotePage,
});

const GOLD = "#E7B10C";

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
        background:
          "radial-gradient(120% 60% at 50% 0%, rgba(231,177,12,0.18), transparent 60%)," +
          "radial-gradient(120% 60% at 50% 100%, rgba(155,47,224,0.18), transparent 60%)," +
          "#0a0a0c",
        paddingLeft: "max(14px, env(safe-area-inset-left))",
        paddingRight: "max(14px, env(safe-area-inset-right))",
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="w-full max-w-[460px] py-4 relative">
        {!session || session.status === "idle" ? (
          <IdleMobile session={session} />
        ) : session.status === "voting" ? (
          <VotingMobile
            session={session}
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

function Header() {
  return (
    <div className="text-center" style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, letterSpacing: "0.32em", color: "#FBE07A", fontSize: "0.8rem", textTransform: "uppercase" }}>
        El versus del año
      </div>
      <div
        style={{
          fontFamily: "var(--font-cartel)",
          fontSize: "clamp(2rem, 11vw, 2.9rem)",
          lineHeight: 0.9,
          color: "#fff",
          textTransform: "uppercase",
          marginTop: 4,
          textShadow: "0 2px 0 #000",
        }}
      >
        VOTÁ TU <span style={{ color: GOLD }}>FAVORITO</span>
      </div>
    </div>
  );
}

function AleniaFooter() {
  return (
    <a
      href="https://aleniahub.com"
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center select-none"
      style={{ marginTop: 22, paddingTop: 14, paddingBottom: 6, opacity: 0.85, textDecoration: "none" }}
    >
      <img
        src={aleniaLogo}
        alt="Build by Alenia"
        draggable={false}
        style={{ height: "clamp(2rem, 10vw, 2.8rem)", width: "auto", filter: "drop-shadow(0 0 14px rgba(64,224,208,0.35))" }}
      />
    </a>
  );
}

function IdleMobile({ session }: { session: ReturnType<typeof useActiveSession>["session"] }) {
  const A = session?.songs?.[0];
  const B = session?.songs?.[1];
  return (
    <div className="flex flex-col items-center text-center" style={{ gap: 16, paddingTop: 12 }}>
      <Header />
      <div
        className="w-full rounded-2xl"
        style={{ border: `1px solid ${GOLD}44`, background: "rgba(255,255,255,0.03)", padding: "22px 16px" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <MiniArtist song={A} idx={0} />
          <img src={versusVs} alt="VS" style={{ height: 74, filter: "drop-shadow(0 6px 16px rgba(0,0,0,.6))" }} />
          <MiniArtist song={B} idx={1} />
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "var(--font-cartel)",
            fontSize: "1.5rem",
            color: "#fff",
            letterSpacing: "0.04em",
          }}
        >
          LA VOTACIÓN ARRANCA EN BREVE
        </div>
        <div style={{ marginTop: 6, fontFamily: "var(--font-sans)", color: "#FBE07A", letterSpacing: "0.18em", fontSize: "0.8rem" }}>
          NO TE MUEVAS
        </div>
      </div>
      <AleniaFooter />
    </div>
  );
}

function MiniArtist({ song, idx }: { song: Song | undefined; idx: number }) {
  const color = colorForIndex(idx);
  const name = song?.title || "—";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, maxWidth: 120 }}>
      <div
        style={{
          width: 76, height: 76, borderRadius: 12, overflow: "hidden",
          border: `2px solid ${color}`, background: "rgba(255,255,255,0.05)",
          display: "grid", placeItems: "center",
          boxShadow: `0 0 18px ${color}55`,
        }}
      >
        {song?.image ? (
          <img src={song.image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ fontFamily: "var(--font-cartel)", fontSize: 34, color }}>{name.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <div style={{ fontFamily: "var(--font-cartel)", fontSize: "0.95rem", color: "#fff", textTransform: "uppercase", lineHeight: 1 }}>
        {name}
      </div>
    </div>
  );
}

function VotingMobile({
  session, total, myVote, voting, onVote,
}: {
  session: NonNullable<ReturnType<typeof useActiveSession>["session"]>;
  total: number;
  myVote: string | null;
  voting: boolean;
  onVote: (id: string) => void;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 14, paddingTop: 8 }}>
      <Header />
      <h2
        className="text-center"
        style={{ fontFamily: "var(--font-cartel)", fontSize: "clamp(1.3rem, 6vw, 1.7rem)", color: myVote ? "#FBE07A" : "#fff", letterSpacing: "0.03em", margin: "0 0 4px" }}
      >
        {myVote ? "¡VOTO REGISTRADO!" : "¿A QUIÉN VOTÁS?"}
      </h2>

      <div className="flex flex-col" style={{ gap: 12 }}>
        {session.songs.slice(0, 2).map((song, idx) => {
          const color = colorForIndex(idx);
          const isMine = myVote === song.id;
          const dimmed = Boolean(myVote) && !isMine;
          return (
            <motion.button
              key={song.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: dimmed ? 0.4 : 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              disabled={Boolean(myVote) || voting}
              onClick={() => onVote(song.id)}
              className="text-left rounded-2xl flex items-center transition-shadow w-full"
              style={{
                padding: 12,
                gap: 14,
                background: `linear-gradient(135deg, ${color}22, rgba(13,10,20,0.9))`,
                border: `2px solid ${isMine ? color : `${color}66`}`,
                boxShadow: isMine ? `0 0 28px ${color}aa, inset 0 0 24px ${color}22` : "none",
                cursor: myVote ? "default" : "pointer",
                minHeight: 100,
                touchAction: "manipulation",
              }}
            >
              <div
                style={{
                  width: 76, height: 76, borderRadius: 12, flexShrink: 0, overflow: "hidden",
                  border: `2px solid ${color}`, background: "rgba(255,255,255,0.05)",
                  display: "grid", placeItems: "center",
                }}
              >
                {song.image ? (
                  <img src={song.image} alt={song.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <span style={{ fontFamily: "var(--font-cartel)", fontSize: 34, color }}>
                    {(song.title || "—").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  style={{
                    fontFamily: "var(--font-cartel)",
                    fontSize: "clamp(1.4rem, 7vw, 2rem)",
                    color: "#fff", letterSpacing: "0.01em", lineHeight: 1,
                    textTransform: "uppercase", wordBreak: "break-word",
                  }}
                >
                  {song.title || "—"}
                </div>
                <div style={{ fontFamily: "var(--font-sans)", color, fontSize: "0.8rem", letterSpacing: "0.12em", marginTop: 4, textTransform: "uppercase" }}>
                  {isMine ? "✓ Tu voto" : "Tocá para votar"}
                </div>
              </div>
              {isMine && (
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                  style={{ fontSize: 30, color, flexShrink: 0, paddingRight: 6 }}
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
          <p style={{ fontFamily: "var(--font-sans)", color: "#FBE07A", fontSize: "0.85rem" }}>
            Solo podés votar una vez
          </p>
        )}
        <p style={{ fontFamily: "var(--font-sans)", color: "#ffffff66", fontSize: "0.78rem", marginTop: 4 }}>
          {total} {total === 1 ? "voto" : "votos"} en total
        </p>
      </div>
      <AleniaFooter />
    </div>
  );
}

function RevealingMobile({ total }: { total: number }) {
  return (
    <div className="flex flex-col items-center text-center pt-12" style={{ gap: 24 }}>
      <Header />
      <img src={versusVs} alt="VS" className="maruja-pulse" style={{ height: 120, filter: "drop-shadow(0 8px 24px rgba(0,0,0,.6))" }} />
      <div style={{ fontFamily: "var(--font-cartel)", fontSize: "clamp(1.6rem, 8vw, 2.2rem)", color: "#fff", letterSpacing: "0.04em" }}>
        CONTANDO VOTOS…
      </div>
      <div style={{ fontFamily: "var(--font-sans)", color: "#FBE07A" }}>
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
    <div className="flex flex-col items-center text-center pt-8 relative" style={{ paddingBottom: 32 }}>
      <Confetti count={50} />
      <div
        className="rounded-full"
        style={{ background: `linear-gradient(135deg, #9A7407, #FBE07A, #9A7407)`, color: "#0a0a0c", fontFamily: "var(--font-cartel)", fontSize: "1rem", letterSpacing: "0.16em", padding: "6px 26px" }}
      >
        ★ GANADOR ★
      </div>
      {winner?.image ? (
        <img
          src={winner.image}
          alt={winner.title}
          className="mt-5"
          style={{ width: 180, height: 180, objectFit: "cover", borderRadius: 16, border: `3px solid ${GOLD}`, boxShadow: `0 0 40px ${color}66` }}
        />
      ) : (
        <div className="mt-5" style={{ width: 180, height: 180, borderRadius: 16, border: `3px solid ${GOLD}`, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.05)", fontFamily: "var(--font-cartel)", fontSize: 90, color }}>
          {(winner?.title || "—").charAt(0).toUpperCase()}
        </div>
      )}
      <div
        className="mt-5 px-2"
        style={{ fontFamily: "var(--font-cartel)", fontSize: "clamp(2.2rem, 12vw, 3.4rem)", color: "#fff", textShadow: `0 0 24px ${color}`, lineHeight: 0.95, textTransform: "uppercase", wordBreak: "break-word", maxWidth: "100%" }}
      >
        {winner?.title ?? "—"}
      </div>
      <div className="mt-5" style={{ fontFamily: "var(--font-sans)", color: "#FBE07A", letterSpacing: "0.1em", fontSize: "clamp(0.95rem, 4vw, 1.1rem)", textTransform: "uppercase" }}>
        {total} {total === 1 ? "VOTO" : "VOTOS"} EN TOTAL
      </div>
      <AleniaFooter />
    </div>
  );
}
