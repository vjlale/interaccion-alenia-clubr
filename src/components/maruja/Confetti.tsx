export function Confetti({ count = 80 }: { count?: number }) {
  const colors = ["#E12FBE", "#5FE88E", "#C9A84C", "#F0654F", "#ffffff"];
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 4;
        const duration = 3 + Math.random() * 3;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-10vh",
              width: size,
              height: size * 1.6,
              background: color,
              animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
              transform: `rotate(${Math.random() * 360}deg)`,
              borderRadius: 2,
            }}
          />
        );
      })}
    </div>
  );
}
