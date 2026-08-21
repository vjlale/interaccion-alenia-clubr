import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { useActiveSession, useVotes, useCountdown } from "@/lib/maruja/useSession";
import { colorForIndex } from "@/lib/maruja/types";
import { OrbBlur, TramaBackdrop } from "@/components/maruja/Decor";
import glockLeft from "@/assets/glock.png";
import glockRight from "@/assets/glock-right.png";
import armitaFiestaGlock from "@/assets/armitafiestaglockcolornew.png";
import glockLogo from "@/assets/glockfinal1.png";
import { CircularTimer } from "@/components/maruja/CircularTimer";
import { Confetti } from "@/components/maruja/Confetti";
import { DisplayStage } from "@/components/maruja/DisplayStage";

export const Route = createFileRoute("/display")({
  head: () => ({
    meta: [
      { title: "GLOCK — Display" },
      { name: "description", content: "Pantalla en vivo para mostrar la votación del evento." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DisplayPage,
});

function DisplayPage() {
  const { session } = useActiveSession();
  const { counts, total } = useVotes(session?.id);
  const [voteUrl, setVoteUrl] = useState("");
  const [obsOpts, setObsOpts] = useState<{ bg: string; hideCursor: boolean }>({
    bg: "#0a0118",
    hideCursor: false,
  });

  useEffect(() => {
    setVoteUrl(window.location.origin + "/vote");
    const params = new URLSearchParams(window.location.search);
    const bgParam = params.get("bg");
    const hideCursor = params.get("nocursor") === "1" || bgParam === "transparent";
    setObsOpts({
      bg: bgParam === "transparent" ? "transparent" : (bgParam ? `#${bgParam.replace(/^#/, "")}` : "#0a0118"),
      hideCursor,
    });
  }, []);

  const isWaitingForVote = !session || session.status === "idle";
  const isVotingActive = session?.status === "voting";

  if (!session) {
    return (
      <div className="absolute inset-0 flex items-center justify-center" style={{ color: "#fff" }}>
        Cargando…
      </div>
    );
  }

  return (
    <>
      {obsOpts.hideCursor && (
        <style>{`html, body, * { cursor: none !important; }`}</style>
      )}
      <DisplayStage background={obsOpts.bg}>
        {obsOpts.bg !== "transparent" && <TramaBackdrop opacity={0.05} />}
        {obsOpts.bg !== "transparent" && (
          <>
            <OrbBlur color="#ff4ac4" size={900} style={{ top: -300, left: -250 }} />
            <OrbBlur color="#7a1fd6" size={900} style={{ bottom: -300, right: -250 }} />
          </>
        )}

        {isWaitingForVote ? (
          <IdleScreen url={voteUrl} />
        ) : session.status === "voting" ? (
          <VotingScreen session={session} counts={counts} total={total} url={voteUrl} />
        ) : session.status === "revealing" ? (
          <RevealingScreen total={total} />
        ) : (
          <WinnerScreen session={session} counts={counts} total={total} />
        )}
      </DisplayStage>
    </>
  );
}


function IdleScreen({ url }: { url: string }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        zIndex: 3,
        display: "grid",
        placeItems: "center",
        padding: "7cqh 7cqw",
        overflow: "hidden",
      }}
    >
      <StageSideGlocks />
      <div
        className="rounded-[3cqh]"
        style={{
          position: "relative",
          zIndex: 2,
          width: "min(50cqw, 55cqh)",
          maxWidth: "100%",
          border: "1.5px solid rgba(255,255,255,0.18)",
          background: "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(10,1,24,0.94))",
          boxShadow: "0 0 5cqh rgba(255,74,196,0.24), inset 0 0 8cqh rgba(255,74,196,0.08)",
          backdropFilter: "blur(3px)",
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
            fontFamily: "var(--font-display)",
            fontSize: "5.7cqh",
            lineHeight: 0.95,
            color: "#ff8ad9",
            letterSpacing: "0.14em",
            textShadow: "0 0 3cqh rgba(255,74,196,0.55)",
            margin: 0,
          }}
        >
          QUE ESCUCHAMOS ??
        </p>
        <p
          className="text-center"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "3.9cqh",
            lineHeight: 1,
            color: "#ffffff",
            letterSpacing: "0.1em",
            margin: 0,
          }}
        >
          ESCANEÁ Y ELEGÍ
        </p>

        <div
          className="bg-white"
          style={{
            width: "min(100%, 39cqh)",
            aspectRatio: "1 / 1",
            padding: "1.35cqh",
            borderRadius: "1.9cqh",
            boxShadow: "0 0 3.3cqh rgba(255,74,196,0.7)",
            display: "grid",
            placeItems: "center",
            boxSizing: "border-box",
          }}
        >
          <QRCodeSVG
            value={url || "https://example.com/vote"}
            size={512}
            fgColor="#0a0118"
            bgColor="#ffffff"
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>
      </div>
    </div>
  );
}

function StageSideGlocks() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <motion.img
        src={glockLeft}
        alt=""
        draggable={false}
        className="absolute h-auto"
        style={{
          width: "26cqw",
          left: "-2cqw",
          top: "50%",
          objectFit: "contain",
          objectPosition: "left center",
          filter:
            "drop-shadow(0 1.6cqh 3.8cqh rgba(0,0,0,0.62)) drop-shadow(0 0 3cqh rgba(255,74,196,0.32))",
          transformOrigin: "left center",
        }}
        initial={{ x: "-45%", y: "-50%", opacity: 0, rotate: -2 }}
        animate={{ x: 0, y: "-50%", opacity: 1, rotate: [-0.6, 0.4, -0.6] }}
        transition={{
          duration: 0.72,
          ease: [0.22, 1, 0.36, 1],
          rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      <motion.img
        src={glockRight}
        alt=""
        draggable={false}
        className="absolute h-auto"
        style={{
          width: "26cqw",
          right: "-2cqw",
          top: "50%",
          objectFit: "contain",
          objectPosition: "right center",
          filter:
            "drop-shadow(0 1.6cqh 3.8cqh rgba(0,0,0,0.62)) drop-shadow(0 0 3cqh rgba(122,31,214,0.32))",
          transformOrigin: "right center",
        }}
        initial={{ x: "45%", y: "-50%", opacity: 0, rotate: 2 }}
        animate={{ x: 0, y: "-50%", opacity: 1, rotate: [0.6, -0.4, 0.6] }}
        transition={{
          duration: 0.72,
          ease: [0.22, 1, 0.36, 1],
          rotate: { duration: 9.4, repeat: Infinity, ease: "easeInOut" },
        }}
      />
    </div>
  );
}

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
  const { remaining, fraction } = useCountdown(session.started_at, session.duration_sec);
  const danger = fraction <= 0.2;
  const timerColor = danger ? "#ff2d55" : "#ff4ac4";
  const mm = Math.floor(remaining / 60);
  const ss = (remaining % 60).toString().padStart(2, "0");

  // Todas las unidades son cqh / cqw sobre el contenedor 16:9 del DisplayStage,
  // por lo que TODO escala proporcionalmente sin depender del viewport real.
  // En LED 1920x1080: 1cqh = 10.8px, 1cqw = 19.2px.
  return (
    <div
      className="absolute inset-0"
      style={{
        display: "grid",
        gridTemplateRows: "16cqh minmax(0, 1fr) 4.8cqh",
        rowGap: "1.7cqh",
        padding: "4.2cqh 3.8cqw 3.8cqh",
      }}
    >
      {/* HEADER: logo + barra de tiempo */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: "2.2cqw",
          alignItems: "center",
          minHeight: 0,
        }}
      >
        <img
          src={glockLogo}
          alt="GLOCK"
          className="select-none"
          style={{
            height: "15.8cqh",
            width: "auto",
            maxWidth: "24cqw",
            objectFit: "contain",
            display: "block",
            filter: "drop-shadow(0 0 2.5cqh rgba(255,74,196,0.4))",
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            className="overflow-hidden relative"
            style={{
              height: "6.4cqh",
              borderRadius: "1.6cqh",
              background: "rgba(10,1,24,0.7)",
              border: `2px solid ${timerColor}88`,
              boxShadow: `0 0 3.5cqh ${timerColor}66, inset 0 0 1.6cqh rgba(0,0,0,0.6)`,
            }}
          >
            <motion.div
              animate={{ width: `${fraction * 100}%` }}
              transition={{ duration: 0.45, ease: "linear" }}
              className={danger ? "maruja-pulse" : ""}
              style={{
                height: "100%",
                background: `linear-gradient(90deg, ${timerColor}, #fff, ${timerColor})`,
                boxShadow: `0 0 3.5cqh ${timerColor}, 0 0 7cqh ${timerColor}80`,
              }}
            />
            <div
              className="absolute inset-0 flex items-center justify-end"
              style={{
                paddingRight: "1.5cqw",
                fontFamily: "var(--font-display)",
                fontSize: "4cqh",
                lineHeight: 1,
                color: "#fff",
                letterSpacing: "0.08em",
                textShadow: "0 0 1.3cqh rgba(0,0,0,0.95), 0 0 2.2cqh rgba(0,0,0,0.7)",
                pointerEvents: "none",
              }}
            >
              {mm}:{ss}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT: QR + opciones */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 0.96fr) minmax(0, 1.04fr)",
          columnGap: "2.1cqw",
          minHeight: 0,
          alignItems: "stretch",
        }}
      >
        {/* Panel QR */}
        <div
          className="rounded-[3cqh]"
          style={{
            border: "1.5px solid rgba(255,255,255,0.16)",
            background: "linear-gradient(155deg, rgba(255,255,255,0.06), rgba(10,1,24,0.94))",
            boxShadow: "0 0 5.4cqh rgba(255,74,196,0.22), inset 0 0 9cqh rgba(255,74,196,0.09)",
            padding: "2cqh 1.45cqw",
            display: "grid",
            gridTemplateRows: "auto auto minmax(0, 1fr)",
            rowGap: "1.1cqh",
            placeItems: "center",
            minHeight: 0,
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <div
            className="text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "5.6cqh",
              lineHeight: 0.95,
              color: "#ff8ad9",
              letterSpacing: "0.15em",
              textShadow: "0 0 3.3cqh rgba(255,74,196,0.6)",
            }}
          >
            QUE ESCUCHAMOS??
          </div>
          <div
            className="text-center"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "4.2cqh",
              lineHeight: 1,
              color: "#22d3ee",
              letterSpacing: "0.12em",
              textShadow: "0 0 3.1cqh rgba(34,211,238,0.6)",
            }}
          >
            ESCANEÁ Y ELEGÍ
          </div>
          <div
            style={{
              display: "grid",
              placeItems: "center",
              width: "100%",
              height: "100%",
              minHeight: 0,
              overflow: "hidden",
            }}
          >
            <div
              className="bg-white"
              style={{
                padding: "1.35cqh",
                borderRadius: "1.9cqh",
                boxShadow: "0 0 3.3cqh rgba(255,74,196,0.7)",
                width: "min(100%, 39cqh)",
                maxHeight: "100%",
                aspectRatio: "1 / 1",
                display: "grid",
                placeItems: "center",
                boxSizing: "border-box",
              }}
            >
              <QRCodeSVG
                value={url || "https://example.com/vote"}
                size={512}
                fgColor="#0a0118"
                bgColor="#ffffff"
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
          </div>
        </div>

        {/* Panel opciones */}
        <div
          className="rounded-[3cqh]"
          style={{
            border: "1.5px solid rgba(255,255,255,0.15)",
            background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(7,3,18,0.95))",
            boxShadow: "0 0 4cqh rgba(122,31,214,0.20)",
            padding: "1.45cqh 1.1cqw",
            minHeight: 0,
            display: "grid",
            gridTemplateRows: "repeat(4, 1fr)",
            rowGap: "1.1cqh",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          {session.songs.map((song, idx) => {
            const color = colorForIndex(idx);
            const count = counts[song.id] ?? 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            return (
              <motion.div
                key={song.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.28 }}
                className="rounded-[2cqh]"
                style={{
                  padding: "1.1cqh 1.1cqw",
                  border: `2px solid ${color}CC`,
                  background: `linear-gradient(135deg, ${color}26, rgba(8,4,20,0.92))`,
                  boxShadow: `0 0 2.4cqh ${color}44`,
                  minHeight: 0,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  columnGap: "1cqw",
                  alignItems: "center",
                  overflow: "hidden",
                  boxSizing: "border-box",
                }}
              >
                {/* Badge id */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "5.4cqh",
                    height: "5.4cqh",
                    borderRadius: "1.2cqh",
                    background: color,
                    color: "#000",
                    fontFamily: "var(--font-display)",
                    fontSize: "3.4cqh",
                    lineHeight: 1,
                    boxShadow: `0 0 2.2cqh ${color}AA`,
                    flexShrink: 0,
                  }}
                >
                  {song.id}
                </div>

                {/* Título + artista + barra */}
                <div
                  style={{
                    minWidth: 0,
                    display: "grid",
                    gridTemplateRows: "1fr auto",
                    rowGap: "0.55cqh",
                    height: "100%",
                    alignContent: "center",
                  }}
                >
                  <div
                    className="flex flex-col items-center justify-center text-center"
                    style={{ minHeight: 0 }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        color: "#fff",
                        fontSize: "min(6.4cqh, 5.8cqw)",
                        lineHeight: 0.95,
                        letterSpacing: "0.02em",
                        textShadow: `0 0 2.2cqh ${color}AA`,
                        wordBreak: "break-word",
                      }}
                    >
                      {song.title || "—"}
                    </div>
                    {!!song.artist && (
                      <div
                        style={{
                          fontFamily: "var(--font-serif)",
                          color,
                          fontStyle: "italic",
                          fontSize: "2.25cqh",
                          lineHeight: 1.1,
                          marginTop: "0.4cqh",
                        }}
                      >
                        {song.artist}
                      </div>
                    )}
                  </div>

                  {/* Barra progreso más visible */}
                  <div
                    className="rounded-full overflow-hidden"
                    style={{
                      height: "1.65cqh",
                      background: "rgba(255,255,255,0.18)",
                      border: `1px solid ${color}88`,
                      boxShadow: `inset 0 0 0.8cqh rgba(0,0,0,0.55)`,
                    }}
                  >
                    <motion.div
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                      style={{
                        height: "100%",
                        background: `linear-gradient(90deg, ${color}, #fff)`,
                        boxShadow: `0 0 2.4cqh ${color}, inset 0 0 1cqh rgba(255,255,255,0.6)`,
                      }}
                    />
                  </div>
                </div>

                {/* Métricas */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    minWidth: "5.2cqw",
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      color,
                      fontSize: "4.35cqh",
                      lineHeight: 1,
                      textShadow: `0 0 1.6cqh ${color}`,
                    }}
                  >
                    {pct.toFixed(0)}%
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      color: "#fff",
                      opacity: 0.9,
                      fontSize: "1.85cqh",
                      fontWeight: 600,
                      marginTop: "0.4cqh",
                    }}
                  >
                    {count} {count === 1 ? "voto" : "votos"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* FOOTER: contador global */}
      <div
        className="flex items-center justify-center"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "2.9cqh",
          color: "#fff",
          letterSpacing: "0.09em",
        }}
      >
        <span
          style={{
            color: "#ff4ac4",
            marginRight: "0.8cqw",
            textShadow: "0 0 1.8cqh #ff4ac4",
          }}
        >
          {total}
        </span>
        {total === 1 ? "VOTO REGISTRADO" : "VOTOS REGISTRADOS"}
      </div>
    </div>
  );
}

function QRWaitingSideGlocks({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
          <motion.img
            key="idle-glock-left"
            src={glockLeft}
            alt=""
            draggable={false}
            className="absolute h-auto w-[min(24vw,420px)]"
            style={{
              left: 0,
              top: "54%",
              objectFit: "contain",
              objectPosition: "left center",
              filter:
                "drop-shadow(0 18px 42px rgba(0,0,0,0.62)) drop-shadow(0 0 34px rgba(255,74,196,0.32))",
              transformOrigin: "left center",
            }}
            initial={{ x: "-100%", y: "-50%", opacity: 0, rotate: -2 }}
            animate={{ x: 0, y: "-50%", opacity: 1, rotate: [-0.6, 0.4, -0.6] }}
            exit={{ x: "-100%", y: "-50%", opacity: 0, rotate: -4 }}
            transition={{
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          <motion.img
            key="idle-glock-right"
            src={glockRight}
            alt=""
            draggable={false}
            className="absolute h-auto w-[min(24vw,420px)]"
            style={{
              right: 0,
              top: "52%",
              objectFit: "contain",
              objectPosition: "right center",
              filter:
                "drop-shadow(0 18px 42px rgba(0,0,0,0.62)) drop-shadow(0 0 34px rgba(122,31,214,0.32))",
              transformOrigin: "right center",
            }}
            initial={{ x: "100%", y: "-50%", opacity: 0, rotate: 2 }}
            animate={{ x: 0, y: "-50%", opacity: 1, rotate: [0.6, -0.4, 0.6] }}
            exit={{ x: "100%", y: "-50%", opacity: 0, rotate: 4 }}
            transition={{
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 9.4, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

function ActiveVoteCornerGlock({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.img
          key="active-vote-corner-glock"
          src={armitaFiestaGlock}
          alt=""
          draggable={false}
          className="pointer-events-none absolute z-[2]"
          style={{
            width: "min(16vw, 250px)",
            left: 34,
            bottom: 28,
            filter:
              "drop-shadow(0 18px 42px rgba(0,0,0,0.6)) drop-shadow(0 0 30px rgba(255,74,196,0.26))",
            transformOrigin: "left bottom",
          }}
          initial={{ opacity: 0, x: -34, y: 24, scale: 0.9, rotate: -3 }}
          animate={{ opacity: 0.96, x: 0, y: [0, -5, 0], scale: 1, rotate: [-1.2, 0.8, -1.2] }}
          exit={{ opacity: 0, x: -28, y: 22, scale: 0.92 }}
          transition={{
            duration: 0.7,
            ease: [0.22, 1, 0.36, 1],
            y: { duration: 7.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 8.2, repeat: Infinity, ease: "easeInOut" },
          }}
        />
      )}
    </AnimatePresence>
  );
}

function RevealingScreen({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 40 }}>
      <RevealSideGlocks visible={true} />

      <div className="maruja-pulse text-center" style={{ position: "relative", zIndex: 2 }}>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 140,
            color: "#fff",
            letterSpacing: "0.1em",
            lineHeight: 1,
          }}
        >
          CONTANDO VOTOS…
        </div>
        <div
          style={{ fontFamily: "var(--font-sans)", fontSize: 42, color: "#ff4ac4", marginTop: 24 }}
        >
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

  const winnerIdx = Math.max(
    0,
    session.songs.findIndex((s) => s.id === winnerId),
  );
  const winner = session.songs.find((s) => s.id === winnerId);
  const winnerColor = colorForIndex(winnerIdx);

  const titleLen = (winner?.title ?? "").length;
  const titleSize = titleLen > 28 ? 140 : titleLen > 18 ? 180 : 220;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ padding: "96px 140px" }}
    >
      <Confetti count={64} />
      <StageSideGlocks />
      <div
        className="absolute inset-0 maruja-pulse"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${winnerColor}33, transparent 60%)`,
        }}
        aria-hidden
      />

      <AnimatePresence>
        <motion.div
          key="badge"
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", bounce: 0.55, duration: 0.9 }}
          className="maruja-glow-dorado rounded-full"
          style={{
            padding: "14px 56px",
            background: "linear-gradient(135deg, #C9A84C, #E8C96A, #C9A84C)",
            fontFamily: "var(--font-display)",
            fontSize: 48,
            color: "#0a0118",
            letterSpacing: "0.18em",
            marginBottom: 36,
          }}
        >
          ★ GANADOR ★
        </motion.div>

        <motion.div
          key="title"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4, duration: 1.0, delay: 0.2 }}
          className="text-center"
          style={{ maxWidth: 1600 }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: titleSize,
              lineHeight: 0.95,
              background: "linear-gradient(135deg, #ffffff, #E8C96A 40%, #ff4ac4 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: `0 0 60px ${winnerColor}88`,
              letterSpacing: "0.02em",
              wordBreak: "break-word",
            }}
          >
            {winner?.title ?? "—"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: 64,
              color: "#ff4ac4",
              marginTop: 24,
              fontStyle: "italic",
            }}
          >
            {winner?.artist ?? ""}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 44,
              color: "#E8C96A",
              marginTop: 40,
              letterSpacing: "0.12em",
            }}
          >
            {total} {total === 1 ? "VOTO" : "VOTOS"} EN TOTAL
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function RevealSideGlocks({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
          <motion.img
            key="reveal-glock-left"
            src={glockLeft}
            alt=""
            draggable={false}
            className="absolute h-auto w-[min(24vw,420px)]"
            style={{
              left: 0,
              top: "54%",
              objectFit: "contain",
              objectPosition: "left center",
              filter:
                "drop-shadow(0 18px 42px rgba(0,0,0,0.62)) drop-shadow(0 0 34px rgba(255,74,196,0.32))",
              transformOrigin: "left center",
            }}
            initial={{ x: "-100%", y: "-50%", opacity: 0, rotate: -2 }}
            animate={{ x: 0, y: "-50%", opacity: 1, rotate: [-0.6, 0.4, -0.6] }}
            exit={{ x: "-100%", y: "-50%", opacity: 0, rotate: -4 }}
            transition={{
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          <motion.img
            key="reveal-glock-right"
            src={glockRight}
            alt=""
            draggable={false}
            className="absolute h-auto w-[min(24vw,420px)]"
            style={{
              right: 0,
              top: "52%",
              objectFit: "contain",
              objectPosition: "right center",
              filter:
                "drop-shadow(0 18px 42px rgba(0,0,0,0.62)) drop-shadow(0 0 34px rgba(122,31,214,0.32))",
              transformOrigin: "right center",
            }}
            initial={{ x: "100%", y: "-50%", opacity: 0, rotate: 2 }}
            animate={{ x: 0, y: "-50%", opacity: 1, rotate: [0.6, -0.4, 0.6] }}
            exit={{ x: "100%", y: "-50%", opacity: 0, rotate: 4 }}
            transition={{
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 9.4, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}

function WinnerSideGlocks({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <div className="pointer-events-none fixed inset-0 z-[1]" aria-hidden>
          <motion.img
            key="winner-glock-left"
            src={glockLeft}
            alt=""
            draggable={false}
            className="absolute h-auto w-[min(24vw,420px)]"
            style={{
              left: 0,
              top: "54%",
              objectFit: "contain",
              objectPosition: "left center",
              filter:
                "drop-shadow(0 18px 42px rgba(0,0,0,0.62)) drop-shadow(0 0 34px rgba(255,74,196,0.32))",
              transformOrigin: "left center",
            }}
            initial={{ x: "-100%", y: "-50%", opacity: 0, rotate: -2 }}
            animate={{ x: 0, y: "-50%", opacity: 1, rotate: [-0.6, 0.4, -0.6] }}
            exit={{ x: "-100%", y: "-50%", opacity: 0, rotate: -4 }}
            transition={{
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            }}
          />

          <motion.img
            key="winner-glock-right"
            src={glockRight}
            alt=""
            draggable={false}
            className="absolute h-auto w-[min(24vw,420px)]"
            style={{
              right: 0,
              top: "52%",
              objectFit: "contain",
              objectPosition: "right center",
              filter:
                "drop-shadow(0 18px 42px rgba(0,0,0,0.62)) drop-shadow(0 0 34px rgba(122,31,214,0.32))",
              transformOrigin: "right center",
            }}
            initial={{ x: "100%", y: "-50%", opacity: 0, rotate: 2 }}
            animate={{ x: 0, y: "-50%", opacity: 1, rotate: [0.6, -0.4, 0.6] }}
            exit={{ x: "100%", y: "-50%", opacity: 0, rotate: 4 }}
            transition={{
              duration: 0.72,
              ease: [0.22, 1, 0.36, 1],
              rotate: { duration: 9.4, repeat: Infinity, ease: "easeInOut" },
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
