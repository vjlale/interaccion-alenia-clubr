/**
 * Decorativos para GLOCK — usan los PNGs oficiales de la fiesta.
 * Conservan la API previa (BolaBoliche, LabiosFlotando, ManoCopa,
 * NoPosersTag, OrbBlur, HashtagBar, TramaBackdrop, SillaRayas) para
 * no romper los imports existentes en display/vote/admin.
 */
import { motion } from "framer-motion";
import handButterfly from "@/assets/glock-hand-butterfly.png";
import handStars from "@/assets/glock-hand-stars.png";
import glockAim from "@/assets/glock-aim.png";
import glockGun from "@/assets/glock-gun.png";
import bannerPink from "@/assets/banner-pink.png";
import bannerViolet from "@/assets/banner-violet.png";
import glockBg from "@/assets/glock-bg.png";

const baseShadow =
  "drop-shadow(0 12px 30px rgba(0,0,0,0.55)) drop-shadow(0 0 24px rgba(255,74,196,0.35))";

/** "Bola de boliche" → pistola rosa cromada girando (disco-glock). */
export function BolaBoliche({
  size = 160,
  className = "",
  spin = true,
  style,
}: {
  size?: number;
  className?: string;
  spin?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`${spin ? "maruja-spin-slow" : ""} pointer-events-none ${className}`}
      style={{ width: size, height: size, filter: baseShadow, ...style }}
      aria-hidden
    >
      <img
        src={glockGun}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </div>
  );
}

/** "Labios flotando" → mano con pistola + mariposa (icono glam de la fiesta). */
export function LabiosFlotando({
  size = 120,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      style={{ width: size, filter: baseShadow, ...style }}
      animate={{ y: [0, -14, 0], rotate: [-4, 4, -4] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <img
        src={handButterfly}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "auto", objectFit: "contain" }}
      />
    </motion.div>
  );
}

/** "Mano copa" → mano con pistola apuntando (winner shot). */
export function ManoCopa({
  size = 140,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      style={{ width: size, filter: baseShadow, ...style }}
      animate={{ y: [0, -10, 0], rotate: [2, -2, 2] }}
      transition={{ duration: 5.4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
      aria-hidden
    >
      <img
        src={glockAim}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "auto", objectFit: "contain" }}
      />
    </motion.div>
  );
}

/** Alias compat: mano con estrellas. */
export function SillaRayas({
  size = 120,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size, filter: baseShadow, ...style }}
      animate={{ y: [0, -12, 0], rotate: [-3, 5, -3] }}
      transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
      aria-hidden
    >
      <img
        src={handStars}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    </motion.div>
  );
}

/** Tag rotado tipo sticker cromado — antes "NOPOSERS". */
export function NoPosersTag({
  width = 220,
  className = "",
  rotate = -6,
  style,
  label = "LIVE NOW",
}: {
  width?: number;
  className?: string;
  rotate?: number;
  style?: React.CSSProperties;
  label?: string;
}) {
  return (
    <motion.div
      className={`pointer-events-none ${className}`}
      style={{
        width,
        transform: `rotate(${rotate}deg)`,
        filter: baseShadow,
        ...style,
      }}
      initial={{ scale: 0.9 }}
      animate={{ scale: [0.95, 1.04, 0.95] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      <div
        style={{
          padding: "10px 22px",
          background:
            "linear-gradient(135deg, #ff4ac4 0%, #ff8ad9 40%, #b026ff 100%)",
          color: "#fff",
          fontFamily: "var(--font-display)",
          letterSpacing: "0.18em",
          textAlign: "center",
          fontSize: Math.round(width / 9),
          border: "3px solid #ffffff",
          borderRadius: 999,
          boxShadow:
            "0 0 24px rgba(255,74,196,0.7), inset 0 0 12px rgba(255,255,255,0.35)",
          textTransform: "uppercase",
        }}
      >
        ● {label}
      </div>
    </motion.div>
  );
}

export function OrbBlur({
  color,
  size = 600,
  className = "",
  style,
}: {
  color: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{
        width: size,
        height: size,
        background: color,
        borderRadius: "50%",
        filter: "blur(140px)",
        opacity: 0.5,
        ...style,
      }}
      aria-hidden
    />
  );
}

/** Franja "PERREO * HITS * POP" en marquee horizontal. */
export function HashtagBar({
  height = 60,
  variant = "pink",
}: {
  height?: number;
  variant?: "pink" | "violet";
}) {
  const src = variant === "violet" ? bannerViolet : bannerPink;
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        height,
        borderTop: "2px solid #000",
        borderBottom: "2px solid #000",
        background: variant === "violet" ? "#1a0530" : "#2a0524",
      }}
      aria-hidden
    >
      <div
        className="maruja-marquee flex"
        style={{ height: "100%", width: "max-content" }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            style={{ height: "100%", width: "auto", display: "block" }}
          />
        ))}
      </div>
    </div>
  );
}

/** Fondo decorativo: banner violeta tileado sutil como textura de fondo. */
export function TramaBackdrop({
  opacity = 0.08,
  className = "",
  style,
}: {
  opacity?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 ${className}`}
      aria-hidden
      style={{
        backgroundImage: `url(${glockBg})`,
        backgroundRepeat: "repeat",
        backgroundSize: "cover",
        opacity,
        mixBlendMode: "screen",
        ...style,
      }}
    />
  );
}
