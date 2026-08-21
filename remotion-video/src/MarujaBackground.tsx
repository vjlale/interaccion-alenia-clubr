import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, Img } from "remotion";

/**
 * Loop video con el mismo fondo del display de MarujAP:
 * - Base oscura #06030f → #150826 (idéntico al body)
 * - Trama rosa "M" tileada en baja opacidad (igual a TramaBackdrop)
 * - Orbes magenta/violeta con blur que se trasladan suavemente
 *   en trayectoria sinusoidal cerrada para loop perfecto.
 */
export const MarujaBackground = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Loop perfecto: usar ángulos basados en 2π * (frame / duración)
  const t = (frame / durationInFrames) * Math.PI * 2;

  // Orb 1 — magenta principal, recorre amplio óvalo
  const orb1X = width * 0.5 + Math.cos(t) * width * 0.35;
  const orb1Y = height * 0.5 + Math.sin(t) * height * 0.3;

  // Orb 2 — violeta, dirección opuesta
  const orb2X = width * 0.5 + Math.cos(t + Math.PI) * width * 0.4;
  const orb2Y = height * 0.5 + Math.sin(t * 1) * height * 0.35;

  // Orb 3 — magenta deep, más pequeño y rápido (2 vueltas para que loopee)
  const orb3X = width * 0.5 + Math.cos(t * 2 + 1.2) * width * 0.28;
  const orb3Y = height * 0.5 + Math.sin(t * 2 + 1.2) * height * 0.22;

  // Pulso de opacidad muy sutil que loopea
  const pulse = 0.42 + Math.sin(t * 2) * 0.06;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, #06030f 0%, #150826 50%, #06030f 100%)",
        overflow: "hidden",
      }}
    >
      {/* Orbes blur de iluminación */}
      <div
        style={{
          position: "absolute",
          left: orb1X - 700,
          top: orb1Y - 700,
          width: 1400,
          height: 1400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(225,47,190,1) 0%, rgba(225,47,190,0) 65%)",
          filter: "blur(120px)",
          opacity: pulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: orb2X - 800,
          top: orb2Y - 800,
          width: 1600,
          height: 1600,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(107,30,166,1) 0%, rgba(107,30,166,0) 65%)",
          filter: "blur(140px)",
          opacity: 0.55,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: orb3X - 450,
          top: orb3Y - 450,
          width: 900,
          height: 900,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,90,210,1) 0%, rgba(255,90,210,0) 60%)",
          filter: "blur(90px)",
          opacity: 0.45,
        }}
      />

      {/* Trama M tileada — igual al display (mix-blend screen, baja opacidad) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${staticFile("images/trama-rosa.png")})`,
          backgroundRepeat: "repeat",
          backgroundSize: "420px auto",
          opacity: 0.08,
          mixBlendMode: "screen",
        }}
      />

      {/* Viñeta sutil para profundidad */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 50%, rgba(6,3,15,0.55) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
