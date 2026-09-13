import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useActiveSession, useVotes } from "@/lib/maruja/useSession";
import { type Song } from "@/lib/maruja/types";
import versusVs from "@/assets/versus-vs.png";
import versusBg from "@/assets/versus-bg.jpg";
import buildByAlenia from "@/assets/build-by-alenia.png";
import { Confetti } from "@/components/maruja/Confetti";

/**
 * PANTALLA DE CABINA (4 caras) — VERSUS horizontal.
 * La cabina del DJ está envuelta por LED en sus 4 caras. En Resolume esas
 * caras van desplegadas una al lado de la otra formando una franja horizontal.
 * Esta ruta dibuja N paneles idénticos (por defecto 4), lado a lado, ocupando
 * el 100% de la ventana. Cada cara usa container-queries (cqw/cqh) para escalar.
 * Params URL: ?faces=4  ?qr=0  ?gap=6  ?bg=0a0a0c (o transparent)  ?nocursor=1
 */

export const Route = createFileRoute("/cabina")({
  head: () => ({
    meta: [
      { title: "Club Reggaeton XL — Cabina" },
      { name: "description", content: "Pantalla de cabina (4 caras) con la votación en vivo." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CabinaPage,
});

const GOLD = { base: "#E7B10C", lt: "#FBE07A", dp: "#9A7407" };
const VIOLET = { base: "#9B2FE0", lt: "#C56BF5", dp: "#6A1AA0" };

function CabinaPage() {
  const { session } = useActiveSession();
  const { counts, total } = useVotes(session?.id);
  const [voteUrl, setVoteUrl] = useState("");
  const [opts, setOpts] = useState({
    faces: 4,
    showQr: true,
    gap: 0,
    bg: "#0a0a0c",
    hideCursor: false,
  });

  useEffect(() => {
    setVoteUrl(window.location.origin + "/vote");
    const p = new URLSearchParams(window.location.search);
    const facesRaw = parseInt(p.get("faces") ?? "4", 10);
    const faces = Number.isFinite(facesRaw) ? Math.min(8, Math.max(1, facesRaw)) : 4;
    const gapRaw = parseInt(p.get("gap") ?? "0", 10);
    const gap = Number.isFinite(gapRaw) ? Math.min(80, Math.max(0, gapRaw)) : 0;
    const bgParam = p.get("bg");
    const hideCursor = p.get("nocursor") === "1" || bgParam === "transparent";
    setOpts({
      faces,
      showQr: p.get("qr") !== "0",
      gap,
      bg:
        bgParam === "transparent"
          ? "transparent"
          : bgParam
            ? `#${bgParam.replace(/^#/, "")}`
            : "#0a0a0c",
      hideCursor,
    });
  }, []);

  if (!session) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#fff" }}>
        Cargando…
      </div>
    );
  }

  const status = session.status === "idle" ? "idle" : session.status;

  return (
    <>
      {opts.hideCursor && <style>{`html, body, * { cursor: none !important; }`}</style>}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: opts.bg,
          display: "flex",
          flexDirection: "row",
          gap: `${opts.gap}px`,
          overflow: "hidden",
        }}
      >
        {Array.from({ length: opts.faces }).map((_, i) => (
          <CabinaFace
            key={i}
            session={session}
            counts={counts}
            total={total}
            url={voteUrl}
            status={status}
            showQr={opts.showQr}
            bg={opts.bg}
          />
        ))}
      </div>
    </>
  );
}

function CabinaFace({
  session,
  counts,
  total,
  url,
  status,
  showQr,
  bg,
}: {
  session: NonNullable<ReturnType<typeof useActiveSession>["session"]>;
  counts: Record<string, number>;
  total: number;
  url: string;
  status: string;
  showQr: boolean;
  bg: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 0",
        position: "relative",
        height: "100%",
        minWidth: 0,
        containerType: "size",
        overflow: "hidden",
        background: bg === "transparent" ? "transparent" : "#0a0a0c",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={status}
          className="absolute inset-0"
          initial={{ opacity: 0, filter: "blur(8px)" }}
          animate={{ opacity: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, filter: "blur(8px)" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {status === "idle" ? (
            <FaceIdle url={url} />
          ) : status === "voting" ? (
            <FaceVoting session={session} counts={counts} total={total} url={url} showQr={showQr} />
          ) : status === "revealing" ? (
            <FaceRevealing total={total} />
          ) : (
            <FaceWinner session={session} counts={counts} total={total} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FaceBackdrop({ aPct }: { aPct?: number }) {
  const split = typeof aPct === "number" ? Math.min(100, Math.max(0, aPct)) : 50;
  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 0, overflow: "hidden", background: "#0a0a0c" }}
      aria-hidden
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${versusBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.18,
          mixBlendMode: "luminosity",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, ${GOLD.base}22 0%, ${GOLD.base}10 ${split * 0.7}%, transparent ${split}%, ${VIOLET.base}10 ${100 - (100 - split) * 0.7}%, ${VIOLET.base}22 100%)`,
          transition: "background 420ms cubic-bezier(.22,1,.36,1)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 130% at 50% -20%, rgba(231,177,12,0.16), transparent 55%)",
        }}
      />
    </div>
  );
}

function FaceFrame() {
  return (
    <div
      className="absolute"
      aria-hidden
      style={{
        inset: "3cqh 1.6cqw",
        border: "0.6cqh solid " + GOLD.base,
        borderRadius: "1cqh",
        boxShadow: `inset 0 0 0 0.3cqh rgba(0,0,0,.85), inset 0 0 0 0.85cqh ${GOLD.dp}, 0 0 4cqh rgba(231,177,12,.25)`,
        pointerEvents: "none",
        zIndex: 6,
      }}
    />
  );
}

function FaceVoting({
  session,
  counts,
  total,
  url,
  showQr,
}: {
  session: NonNullable<ReturnType<typeof useActiveSession>["session"]>;
  counts: Record<string, number>;
  total: number;
  url: string;
  showQr: boolean;
}) {
  const A = session.songs[0];
  const B = session.songs[1];
  const aCount = A ? (counts[A.id] ?? 0) : 0;
  const bCount = B ? (counts[B.id] ?? 0) : 0;
  const aPct = total > 0 ? Math.round((aCount / total) * 100) : 50;
  const bPct = total > 0 ? 100 - aPct : 50;

  return (
    <div className="absolute inset-0">
      <FaceBackdrop aPct={aPct} />
      <FaceFrame />

      <div
        className="absolute"
        style={{
          inset: "3cqh 1.6cqw",
          zIndex: 4,
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          rowGap: "1.4cqh",
          padding: "3cqh 2.4cqw 2.6cqh",
          minHeight: 0,
        }}
      >
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--font-cartel)",
            fontSize: "min(9cqh, 4.2cqw)",
            lineHeight: 0.9,
            color: "#fff",
            textTransform: "uppercase",
            letterSpacing: "0.01em",
            textShadow: "0 0.3cqh 0 #000",
          }}
        >
          VOTÁ TU{" "}
          <span style={{ color: GOLD.base, WebkitTextStroke: `0.08cqh ${GOLD.dp}` }}>FAVORITO</span>
        </div>

        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            columnGap: "1.5cqw",
            minHeight: 0,
          }}
        >
          <FaceSide song={A} pal={GOLD} pct={aPct} count={aCount} align="left" />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1cqh",
              zIndex: 5,
            }}
          >
            <img
              src={versusVs}
              alt="VS"
              style={{
                height: showQr ? "24cqh" : "40cqh",
                filter:
                  "drop-shadow(0 1cqh 2cqh rgba(0,0,0,.7)) drop-shadow(0 0 2.4cqh rgba(231,177,12,.5))",
              }}
            />
            {showQr && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.7cqh",
                }}
              >
                <div
                  className="bg-white"
                  style={{
                    width: "32cqh",
                    height: "32cqh",
                    borderRadius: "1.4cqh",
                    padding: "1.1cqh",
                    boxShadow: "0 0 2.6cqh rgba(231,177,12,.6)",
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
                    fontSize: "min(3.4cqh, 1.7cqw)",
                    letterSpacing: "0.05em",
                    color: "#fff",
                    textTransform: "uppercase",
                    textShadow: "0 0 1.4cqh rgba(231,177,12,.5)",
                    whiteSpace: "nowrap",
                  }}
                >
                  Escaneá y votá
                </div>
              </div>
            )}
          </div>

          <FaceSide song={B} pal={VIOLET} pct={bPct} count={bCount} align="right" />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.2cqh" }}>
          <div
            style={{
              position: "relative",
              height: "3.2cqh",
              borderRadius: "1.6cqh",
              overflow: "hidden",
              background: "rgba(0,0,0,.55)",
              border: "0.25cqh solid rgba(231,177,12,.5)",
            }}
          >
            <div
              className="absolute"
              style={{
                left: 0,
                top: 0,
                bottom: 0,
                width: `${aPct}%`,
                background: `linear-gradient(90deg, ${GOLD.dp}, ${GOLD.base}, ${GOLD.lt})`,
                boxShadow: `0 0 2cqh ${GOLD.base}`,
                transition: "width 420ms cubic-bezier(.22,1,.36,1)",
              }}
            />
            <div
              className="absolute"
              style={{
                right: 0,
                top: 0,
                bottom: 0,
                width: `${bPct}%`,
                background: `linear-gradient(90deg, ${VIOLET.lt}, ${VIOLET.base}, ${VIOLET.dp})`,
                boxShadow: `0 0 2cqh ${VIOLET.base}`,
                transition: "width 420ms cubic-bezier(.22,1,.36,1)",
              }}
            />
          </div>
          <div
            style={{
              textAlign: "center",
              fontFamily: "var(--font-sans)",
              fontWeight: 700,
              letterSpacing: "0.16em",
              fontSize: "min(3cqh, 1.5cqw)",
              color: "#fff",
              textTransform: "uppercase",
              textShadow: "0 0.2cqh 0.8cqh #000",
            }}
          >
            <span style={{ color: GOLD.lt }}>{total}</span>{" "}
            {total === 1 ? "voto registrado" : "votos registrados"}
          </div>
        </div>
      </div>

      <img
        src={buildByAlenia}
        alt="Build by Alenia"
        className="absolute"
        style={{
          right: "2.4cqw",
          bottom: "1.4cqh",
          height: "4cqh",
          opacity: 0.85,
          zIndex: 6,
          filter: "drop-shadow(0 0.2cqh 0.6cqh rgba(0,0,0,.6))",
        }}
      />
    </div>
  );
}

function FaceSide({
  song,
  pal,
  pct,
  count,
  align,
}: {
  song: Song | undefined;
  pal: { base: string; lt: string; dp: string };
  pct: number;
  count: number;
  align: "left" | "right";
}) {
  const name = song?.title || "—";
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: align === "left" ? "row" : "row-reverse",
        alignItems: "center",
        justifyContent: align === "left" ? "flex-start" : "flex-end",
        gap: "1.6cqw",
        minWidth: 0,
        height: "100%",
      }}
    >
      {song?.image ? (
        <img
          src={song.image}
          alt={name}
          style={{
            height: "min(60cqh, 22cqw)",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            border: `0.5cqh solid ${GOLD.base}`,
            borderRadius: "1.2cqh",
            boxShadow: `0 1cqh 3cqh rgba(0,0,0,.6), 0 0 2.6cqh ${pal.base}55`,
            flex: "0 0 auto",
          }}
        />
      ) : (
        <div
          style={{
            height: "min(60cqh, 22cqw)",
            aspectRatio: "1 / 1",
            border: `0.5cqh solid ${GOLD.base}`,
            borderRadius: "1.2cqh",
            display: "grid",
            placeItems: "center",
            background: "rgba(255,255,255,0.04)",
            boxShadow: `0 1cqh 3cqh rgba(0,0,0,.6), 0 0 2.6cqh ${pal.base}55`,
            fontFamily: "var(--font-cartel)",
            fontSize: "30cqh",
            color: pal.lt,
            flex: "0 0 auto",
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: align === "left" ? "flex-start" : "flex-end",
          justifyContent: "center",
          minWidth: 0,
          textAlign: align === "left" ? "left" : "right",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-cartel)",
            fontSize: "min(9cqh, 4cqw)",
            lineHeight: 0.9,
            color: "#fff",
            textTransform: "uppercase",
            textShadow: "0 0.3cqh 0 #000",
            wordBreak: "break-word",
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: "var(--font-cartel)",
            fontSize: "min(18cqh, 8cqw)",
            lineHeight: 0.85,
            color: pal.lt,
            textShadow: `0 0 2.6cqh ${pal.base}99, 0 0.4cqh 0 #000`,
            marginTop: "0.4cqh",
          }}
        >
          {pct}%
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: "min(3cqh, 1.5cqw)",
            letterSpacing: "0.12em",
            color: "#fff",
            textTransform: "uppercase",
          }}
        >
          {count} {count === 1 ? "voto" : "votos"}
        </div>
      </div>
    </div>
  );
}

function FaceIdle({ url }: { url: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{ display: "grid", placeItems: "center", overflow: "hidden" }}
    >
      <FaceBackdrop />
      <FaceFrame />
      <div
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "3cqw",
          padding: "0 5cqw",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "2cqh",
            maxWidth: "40cqw",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-cartel)",
              fontSize: "min(13cqh, 6cqw)",
              lineHeight: 0.95,
              color: GOLD.lt,
              letterSpacing: "0.04em",
              textShadow: "0 0 3cqh rgba(231,177,12,0.55)",
            }}
          >
            EL VERSUS DEL AÑO
          </div>
          <div
            style={{
              fontFamily: "var(--font-cartel)",
              fontSize: "min(8cqh, 3.6cqw)",
              lineHeight: 1,
              color: "#fff",
              letterSpacing: "0.04em",
            }}
          >
            ESCANEÁ Y VOTÁ
          </div>
        </div>
        <div
          className="bg-white"
          style={{
            height: "min(64cqh, 26cqw)",
            aspectRatio: "1 / 1",
            padding: "1.6cqh",
            borderRadius: "2cqh",
            boxShadow: "0 0 3.4cqh rgba(231,177,12,0.7)",
            display: "grid",
            placeItems: "center",
            boxSizing: "border-box",
            flex: "0 0 auto",
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

function FaceRevealing({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <FaceBackdrop />
      <FaceFrame />
      <div className="maruja-pulse text-center" style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            fontFamily: "var(--font-cartel)",
            fontSize: "min(20cqh, 9cqw)",
            color: "#fff",
            letterSpacing: "0.04em",
            lineHeight: 1,
          }}
        >
          CONTANDO VOTOS…
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "min(5cqh, 2.4cqw)",
            color: GOLD.lt,
            marginTop: "2cqh",
          }}
        >
          {total} {total === 1 ? "voto" : "votos"}
        </div>
      </div>
    </div>
  );
}

function FaceWinner({
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

  const winnerIdx = Math.max(
    0,
    session.songs.findIndex((s) => s.id === winnerId),
  );
  const winner = session.songs.find((s) => s.id === winnerId);
  const pal = winnerIdx === 1 ? VIOLET : GOLD;

  return (
    <div
      className="absolute inset-0 flex flex-row items-center justify-center"
      style={{ gap: "3cqw", padding: "0 5cqw" }}
    >
      <FaceBackdrop />
      <FaceFrame />
      <Confetti count={40} />
      <div
        className="absolute inset-0 maruja-pulse"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${pal.base}33, transparent 60%)`,
          zIndex: 1,
        }}
        aria-hidden
      />

      {winner?.image && (
        <motion.img
          src={winner.image}
          alt={winner.title}
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 1, delay: 0.1 }}
          style={{
            position: "relative",
            zIndex: 2,
            height: "min(64cqh, 26cqw)",
            aspectRatio: "1 / 1",
            objectFit: "cover",
            border: `0.6cqh solid ${GOLD.base}`,
            borderRadius: "1.6cqh",
            boxShadow: `0 1.4cqh 4cqh rgba(0,0,0,.65), 0 0 4cqh ${pal.base}66`,
            flex: "0 0 auto",
          }}
        />
      )}

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.4, duration: 1.0, delay: 0.2 }}
        style={{
          position: "relative",
          zIndex: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          minWidth: 0,
        }}
      >
        <div
          className="rounded-full"
          style={{
            padding: "0.9cqh 2.4cqw",
            background: `linear-gradient(135deg, ${GOLD.dp}, ${GOLD.lt}, ${GOLD.dp})`,
            fontFamily: "var(--font-cartel)",
            fontSize: "min(5cqh, 2.4cqw)",
            color: "#0a0a0c",
            letterSpacing: "0.18em",
            marginBottom: "1.6cqh",
          }}
        >
          ★ GANADOR ★
        </div>
        <div
          style={{
            fontFamily: "var(--font-cartel)",
            fontSize: "min(20cqh, 9cqw)",
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
            fontSize: "min(3.4cqh, 1.7cqw)",
            color: GOLD.lt,
            marginTop: "1.4cqh",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {total} {total === 1 ? "VOTO" : "VOTOS"} EN TOTAL
        </div>
      </motion.div>
    </div>
  );
}
