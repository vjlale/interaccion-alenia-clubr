import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useActiveSession, useVotes } from "@/lib/maruja/useSession";
import { type Song } from "@/lib/maruja/types";
import glockLeft from "@/assets/glock.png";
import glockRight from "@/assets/glock-right.png";
import glockLogo from "@/assets/glockfinal1.png";
import versusVs from "@/assets/versus-vs.png";
import versusBg from "@/assets/versus-bg.jpg";
import buildByAlenia from "@/assets/build-by-alenia.png";
import { Confetti } from "@/components/maruja/Confetti";
import { DisplayStage } from "@/components/maruja/DisplayStage";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "Club Reggaeton XL — Display" },
      { name: "description", content: "Pantalla en vivo para mostrar la votación del evento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DisplayPage,
});

// Paleta versus (dorado / violeta)
const GOLD = { base: "#E7B10C", lt: "#FBE07A", dp: "#9A7407" };
const VIOLET = { base: "#9B2FE0", lt: "#C56BF5", dp: "#6A1AA0" };

function DisplayPage() {
  const { session } = useActiveSession();
  const { counts, total } = useVotes(session?.id);
  const [voteUrl, setVoteUrl] = useState("");
  const [obsOpts, setObsOpts] = useState<{ bg: string; hideCursor: boolean }>({
    bg: "#0a0a0c",
    hideCursor: false,
  });

  useEffect(() => {
    setVoteUrl(window.location.origin + "/vote");
    const params = new URLSearchParams(window.location.search);
    const bgParam = params.get("bg");
    const hideCursor = params.get("nocursor") === "1" || bgParam === "transparent";
    setObsOpts({
      bg: bgParam === "transparent" ? "transparent" : (bgParam ? `#${bgParam.replace(/^#/, "")}` : "#0a0a0c"),
      hideCursor,
    });
  }, []);

  const isWaitingForVote = !session || session.status === "idle";

  if (!session) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#fff" }}>
        Cargando…
      </div>
    );
  }

  const screenKey = isWaitingForVote ? "idle" : session.status;

  return (
    <>
      {obsOpts.hideCursor && (
        <style>{`html, body, * { cursor: none !important; }`}</style>
      )}
      <DisplayStage background={obsOpts.bg}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={screenKey}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.04, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.97, filter: "blur(10px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {isWaitingForVote ? (
              <IdleScreen url={voteUrl} />
            ) : session.status === "voting" ? (
              <VotingScreen session={session} counts={counts} total={total} url={voteUrl} />
            ) : session.status === "revealing" ? (
              <RevealingScreen total={total} />
            ) : (
              <WinnerScreen session={session} counts={counts} total={total} />
            )}
          </motion.div>
        </AnimatePresence>
      </DisplayStage>
    </>
  );
}

/* ======================= FONDO VERSUS ======================= */

function VersusBackdrop() {
  return (
    <div className="absolute inset-0" style={{ zIndex: 0, overflow: "hidden", background: "#0a0a0c" }} aria-hidden>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${versusBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.2,
          mixBlendMode: "luminosity",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 90% at 50% -10%, rgba(231,177,12,0.18), transparent 55%)",
        }}
      />
    </div>
  );
}

function GoldFrame() {
  return (
    <div
      className="absolute"
      aria-hidden
      style={{
        inset: "1.6cqh 1cqw",
        border: "0.35cqh solid " + GOLD.base,
        borderRadius: "0.6cqh",
        boxShadow: `inset 0 0 0 0.18cqh rgba(0,0,0,.85), inset 0 0 0 0.5cqh ${GOLD.dp}, 0 0 3cqh rgba(231,177,12,.25)`,
        pointerEvents: "none",
        zIndex: 6,
      }}
    />
  );
}

/* ======================= VOTACIÓN (VERSUS) ======================= */

function VotingScreen({
  session,
  counts,
  total,
  url,
}: {
  session: NonNullable<ReturnType<typeof useActiveSession>["session"]>;
  counts: Record<string, number>;
  total: number;
  url: string;
}) {
  const A = session.songs[0];
  const B = session.songs[1];
  const aCount = A ? counts[A.id] ?? 0 : 0;
  const bCount = B ? counts[B.id] ?? 0 : 0;
  const aPct = total > 0 ? Math.round((aCount / total) * 100) : 0;
  const bPct = total > 0 ? 100 - aPct : 0;

  return (
    <div className="absolute inset-0">
      <VersusBackdrop />
      <GoldFrame />

      <div
        className="absolute"
        style={{
          inset: "1.6cqh 1cqw",
          zIndex: 4,
          display: "grid",
          gridTemplateRows: "auto 1fr",
          rowGap: "2.4cqh",
          padding: "1.6cqh 2cqw 1.4cqh",
        }}
      >
        {/* Título */}
        <div className="flex flex-col items-center" style={{ textAlign: "center", gap: "1.4cqh" }}>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              letterSpacing: "0.38em",
              color: GOLD.lt,
              fontSize: "2cqh",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            El versus del año
          </div>
          <div
            style={{
              fontFamily: "var(--font-cartel)",
              fontSize: "7.8cqh",
              lineHeight: 0.9,
              color: "#fff",
              letterSpacing: "0.01em",
              textTransform: "uppercase",
              textShadow: "0 0.3cqh 0 #000",
            }}
          >
            VOTÁ TU <span style={{ color: GOLD.base, WebkitTextStroke: `0.05cqh ${GOLD.dp}` }}>FAVORITO</span>
          </div>
        </div>

        {/* Arena */}
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 0 }}>
          <VersusSide side="left" song={A} pal={GOLD} pct={aPct} count={aCount} />
          <VersusSide side="right" song={B} pal={VIOLET} pct={bPct} count={bCount} />

          {/* Centro: QR + VS */}
          <div
            className="absolute"
            style={{
              left: "50%",
              top: 0,
              bottom: 0,
              transform: "translateX(-50%)",
              zIndex: 5,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              gap: "1cqh",
              paddingTop: "1.4cqh",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.9cqh",
                background: "linear-gradient(160deg, rgba(231,177,12,.18), rgba(10,10,12,.94))",
                border: `0.3cqh solid ${GOLD.base}`,
                borderRadius: "1.6cqh",
                padding: "1.4cqh 1.4cqh 1.2cqh",
                boxShadow: "0 0 3cqh rgba(231,177,12,.4), 0 1cqh 3cqh rgba(0,0,0,.6)",
              }}
            >
              <div
                className="bg-white"
                style={{
                  width: "23cqh",
                  height: "23cqh",
                  borderRadius: "1.1cqh",
                  padding: "1cqh",
                  boxShadow: "0 0 2.4cqh rgba(231,177,12,.55)",
                  display: "grid",
                  placeItems: "center",
                  boxSizing: "border-box",
                }}
              >
                <QRCodeSVG
                  value={url || "https://example.com/vote"}
                  size={512}
                  fgColor="#0a0a0c"
                  bgColor="#ffffff"
                  style={{ width: "100%", height: "100%", display: "block" }}
                />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-cartel)",
                  fontSize: "3cqh",
                  letterSpacing: "0.06em",
                  color: "#fff",
                  textTransform: "uppercase",
                  textShadow: "0 0 1.6cqh rgba(231,177,12,.5)",
                }}
              >
                Escaneá y votá
              </div>
            </div>
            <img
              src={versusVs}
              alt="VS"
              style={{
                height: "26cqh",
                marginTop: "0.4cqh",
                filter: "drop-shadow(0 1.2cqh 2.2cqh rgba(0,0,0,.7)) drop-shadow(0 0 2.6cqh rgba(231,177,12,.5))",
              }}
            />
          </div>
        </div>
      </div>

      {/* Pie */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: "4.2cqh",
          textAlign: "center",
          zIndex: 6,
          fontFamily: "var(--font-sans)",
          fontWeight: 700,
          letterSpacing: "0.2em",
          fontSize: "2.2cqh",
          color: "#fff",
          textTransform: "uppercase",
          textShadow: "0 0.2cqh 0.8cqh #000",
        }}
      >
        <span style={{ color: GOLD.lt }}>{total}</span> {total === 1 ? "voto registrado" : "votos registrados"}
      </div>

      <img
        src={buildByAlenia}
        alt="Build by Alenia"
        className="absolute"
        style={{ right: "2.4cqw", bottom: "2cqh", height: "5cqh", opacity: 0.9, zIndex: 6, filter: "drop-shadow(0 0.2cqh 0.6cqh rgba(0,0,0,.6))" }}
      />
    </div>
  );
}

function VersusSide({
  side,
  song,
  pal,
  pct,
  count,
}: {
  side: "left" | "right";
  song: Song | undefined;
  pal: { base: string; lt: string; dp: string };
  pct: number;
  count: number;
}) {
  const name = song?.title || "—";
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2cqh 3cqw 0",
        borderRight: side === "left" ? "0.15cqh solid rgba(231,177,12,.18)" : "none",
      }}
    >
      {/* Relleno que sube de abajo hacia arriba */}
      <div
        className="absolute"
        style={{
          left: 0,
          right: 0,
          bottom: 0,
          height: `${pct}%`,
          zIndex: 0,
          background: `linear-gradient(0deg, ${pal.base}8c 0%, ${pal.base}24 78%, ${pal.base}00 100%)`,
          transition: "height 420ms cubic-bezier(.22,1,.36,1)",
        }}
      >
        <div
          className="absolute"
          style={{ left: 0, right: 0, top: 0, height: "0.5cqh", background: pal.lt, boxShadow: `0 0 2cqh ${pal.base}` }}
        />
      </div>

      {/* Gauge vertical en el borde exterior */}
      <div
        className="absolute"
        style={{
          top: "6cqh",
          bottom: "10cqh",
          left: side === "left" ? "2cqw" : undefined,
          right: side === "right" ? "2cqw" : undefined,
          width: "2cqh",
          borderRadius: "1cqh",
          zIndex: 3,
          background: "rgba(0,0,0,.55)",
          border: "0.2cqh solid rgba(231,177,12,.5)",
          overflow: "hidden",
        }}
      >
        <div
          className="absolute"
          style={{
            left: 0,
            right: 0,
            bottom: 0,
            height: `${pct}%`,
            borderRadius: "1cqh",
            background: `linear-gradient(0deg, ${pal.dp}, ${pal.base}, ${pal.lt})`,
            boxShadow: `0 0 2cqh ${pal.base}`,
            transition: "height 420ms cubic-bezier(.22,1,.36,1)",
          }}
        />
      </div>

      {/* Contenido */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
        }}
      >
        {song?.image ? (
          <img
            src={song.image}
            alt={name}
            style={{
              width: "min(27cqw, 30cqh)",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              border: `0.35cqh solid ${GOLD.base}`,
              borderRadius: "1cqh",
              boxShadow: "0 1cqh 3cqh rgba(0,0,0,.6), 0 0 2.6cqh rgba(231,177,12,.3)",
            }}
          />
        ) : (
          <div
            style={{
              width: "min(27cqw, 30cqh)",
              aspectRatio: "1 / 1",
              border: `0.35cqh solid ${GOLD.base}`,
              borderRadius: "1cqh",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.04)",
              boxShadow: "0 1cqh 3cqh rgba(0,0,0,.6), 0 0 2.6cqh rgba(231,177,12,.3)",
              fontFamily: "var(--font-cartel)",
              fontSize: "14cqh",
              color: pal.lt,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
        )}

        <div
          style={{
            fontFamily: "var(--font-cartel)",
            fontSize: "min(6.6cqh, 12cqw)",
            lineHeight: 0.9,
            color: "#fff",
            textTransform: "uppercase",
            textAlign: "center",
            marginTop: "1.4cqh",
            textShadow: "0 0.3cqh 0 #000",
            wordBreak: "break-word",
          }}
        >
          {name}
        </div>

        <div style={{ marginTop: "auto", paddingBottom: "5.2cqh", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontFamily: "var(--font-cartel)",
              fontSize: "10cqh",
              lineHeight: 0.8,
              color: pal.lt,
              textShadow: `0 0 2.6cqh ${pal.base}99, 0 0.4cqh 0 #000`,
            }}
          >
            {pct}%
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 600,
              fontSize: "2.3cqh",
              letterSpacing: "0.14em",
              color: "#fff",
              textTransform: "uppercase",
              marginTop: "0.3cqh",
            }}
          >
            {count} {count === 1 ? "voto" : "votos"}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ======================= ESPERA / CONTEO / GANADOR ======================= */

function IdleScreen({ url }: { url: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 3, display: "grid", placeItems: "center", padding: "7cqh 7cqw", overflow: "hidden" }}
    >
      <VersusBackdrop />
      <GoldFrame />
      <div
        className="rounded-[3cqh]"
        style={{
          position: "relative",
          zIndex: 2,
          width: "min(50cqw, 55cqh)",
          maxWidth: "100%",
          border: `1.5px solid ${GOLD.base}`,
          background: "linear-gradient(155deg, rgba(231,177,12,0.12), rgba(10,10,12,0.94))",
          boxShadow: "0 0 5cqh rgba(231,177,12,0.24), inset 0 0 8cqh rgba(231,177,12,0.08)",
          padding: "2.4cqh 2cqw 2.6cqh",
          display: "grid",
          gridTemplateRows: "auto auto minmax(0, 1fr)",
          rowGap: "1.2cqh",
          placeItems: "center",
          minHeight: 0,
        }}
      >
        <p
          className="text-center"
          style={{
            fontFamily: "var(--font-cartel)",
            fontSize: "5.7cqh",
            lineHeight: 0.95,
            color: GOLD.lt,
            letterSpacing: "0.06em",
            textShadow: "0 0 3cqh rgba(231,177,12,0.55)",
            margin: 0,
          }}
        >
          EL VERSUS DEL AÑO
        </p>
        <p
          className="text-center"
          style={{ fontFamily: "var(--font-cartel)", fontSize: "3.9cqh", lineHeight: 1, color: "#ffffff", letterSpacing: "0.06em", margin: 0 }}
        >
          ESCANEÁ Y VOTÁ
        </p>
        <div
          className="bg-white"
          style={{
            width: "min(100%, 39cqh)",
            aspectRatio: "1 / 1",
            padding: "1.35cqh",
            borderRadius: "1.9cqh",
            boxShadow: "0 0 3.3cqh rgba(231,177,12,0.7)",
            display: "grid",
            placeItems: "center",
            boxSizing: "border-box",
          }}
        >
          <QRCodeSVG
            value={url || "https://example.com/vote"}
            size={512}
            fgColor="#0a0a0c"
            bgColor="#ffffff"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

function RevealingScreen({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 40 }}>
      <VersusBackdrop />
      <GoldFrame />
      <div className="maruja-pulse text-center" style={{ position: "relative", zIndex: 2 }}>
        <div style={{ fontFamily: "var(--font-cartel)", fontSize: "13cqh", color: "#fff", letterSpacing: "0.04em", lineHeight: 1 }}>
          CONTANDO VOTOS…
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "4cqh", color: GOLD.lt, marginTop: "2cqh" }}>
          {total} {total === 1 ? "voto" : "votos"}
        </div>
      </div>
    </div>
  );
}

function WinnerScreen({
  session,
  counts,
  total,
}: {
  session: NonNullable<ReturnType<typeof useActiveSession>["session"]>;
  counts: Record<string, number>;
  total: number;
}) {
  const winnerId = useMemo(() => {
    if (session.winner_id) return session.winner_id;
    if (!session.songs.length) return "A";
    let best = session.songs[0].id;
    let max = -1;
    for (const song of session.songs) {
      const c = counts[song.id] ?? 0;
      if (c > max) {
        max = c;
        best = song.id;
      }
    }
    return best;
  }, [session.winner_id, session.songs, counts]);

  const winnerIdx = Math.max(0, session.songs.findIndex((s) => s.id === winnerId));
  const winner = session.songs.find((s) => s.id === winnerId);
  const pal = winnerIdx === 1 ? VIOLET : GOLD;

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ padding: "6cqh 8cqw" }}>
      <VersusBackdrop />
      <GoldFrame />
      <Confetti count={64} />
      <div
        className="absolute inset-0 maruja-pulse"
        style={{ background: `radial-gradient(circle at 50% 45%, ${pal.base}33, transparent 60%)`, zIndex: 1 }}
        aria-hidden
      />

      <AnimatePresence>
        <motion.div
          key="badge"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.55, duration: 0.9 }}
          className="rounded-full"
          style={{
            position: "relative",
            zIndex: 2,
            padding: "1.2cqh 4cqw",
            background: `linear-gradient(135deg, ${GOLD.dp}, ${GOLD.lt}, ${GOLD.dp})`,
            fontFamily: "var(--font-cartel)",
            fontSize: "4.4cqh",
            color: "#0a0a0c",
            letterSpacing: "0.18em",
            marginBottom: "3cqh",
          }}
        >
          ★ GANADOR ★
        </motion.div>

        {winner?.image && (
          <motion.img
            key="winner-photo"
            src={winner.image}
            alt={winner.title}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4, duration: 1, delay: 0.15 }}
            style={{
              position: "relative",
              zIndex: 2,
              width: "min(34cqh, 32cqw)",
              aspectRatio: "1 / 1",
              objectFit: "cover",
              border: `0.4cqh solid ${GOLD.base}`,
              borderRadius: "1.4cqh",
              boxShadow: `0 1.4cqh 4cqh rgba(0,0,0,.65), 0 0 4cqh ${pal.base}66`,
              marginBottom: "3cqh",
            }}
          />
        )}

        <motion.div
          key="title"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 1.0, delay: 0.25 }}
          className="text-center"
          style={{ position: "relative", zIndex: 2, maxWidth: "84cqw" }}
        >
          <div
            style={{
              fontFamily: "var(--font-cartel)",
              fontSize: "14cqh",
              lineHeight: 0.9,
              background: `linear-gradient(135deg, #ffffff, ${GOLD.lt} 45%, ${pal.base} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: `0 0 6cqh ${pal.base}55`,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              wordBreak: "break-word",
            }}
          >
            {winner?.title ?? "—"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              fontSize: "3.4cqh",
              color: GOLD.lt,
              marginTop: "3cqh",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            {total} {total === 1 ? "VOTO" : "VOTOS"} EN TOTAL
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Glocks laterales legacy (no usados en versus, se conservan por compatibilidad)
export function LegacySideGlocks({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
          <motion.img src={glockLeft} alt="" className="absolute h-auto w-[min(24vw,420px)]" style={{ left: 0, top: "54%" }} />
          <motion.img src={glockRight} alt="" className="absolute h-auto w-[min(24vw,420px)]" style={{ right: 0, top: "52%" }} />
        </div>
      )}
    </AnimatePresence>
  );
}

// Marca de agua legacy (evita import sin uso de glockLogo)
export const LEGACY_LOGO = glockLogo;
