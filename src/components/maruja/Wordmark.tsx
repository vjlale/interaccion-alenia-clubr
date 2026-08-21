/**
 * Wordmark GLOCK — logo cromado tipo bubble (imagen PNG oficial).
 * `size` controla la ALTURA renderizada del logo (e.g. "96px", "3rem").
 * Mantiene la API previa (variant ignorado) para no romper imports.
 */
import glockWordmark from "@/assets/glock-wordmark.png";

export function Wordmark({
  size = "5rem",
  className = "",
  alt = "GLOCK",
}: {
  size?: string;
  variant?: "magenta" | "gold";
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={glockWordmark}
      alt={alt}
      className={`select-none ${className}`}
      draggable={false}
      style={{
        height: size,
        width: "auto",
        display: "inline-block",
        filter:
          "drop-shadow(0 0 24px rgba(255,74,196,0.55)) drop-shadow(0 8px 30px rgba(0,0,0,0.6))",
      }}
    />
  );
}
