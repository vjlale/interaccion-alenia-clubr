import { formatMSS } from "@/lib/maruja/useSession";

export function CircularTimer({
  remaining,
  fraction,
  size = 280,
  strokeWidth = 16,
}: {
  remaining: number;
  fraction: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - fraction);
  const danger = fraction <= 0.3;
  const stroke = danger ? "#ff2d55" : "#E12FBE";

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease",
            filter: `drop-shadow(0 0 12px ${stroke})`,
          }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontSize: size * 0.32,
          color: danger ? "#ff2d55" : "#ffffff",
          letterSpacing: "0.04em",
          textShadow: `0 0 24px ${stroke}`,
        }}
      >
        {formatMSS(remaining)}
      </div>
    </div>
  );
}
