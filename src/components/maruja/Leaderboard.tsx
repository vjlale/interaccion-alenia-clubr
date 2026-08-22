import { useLeaderboard } from "@/lib/maruja/useLeaderboard";

const MEDALS = ["🥇", "🥈", "🥉"];
const HILITE = ["#E8C96A", "#ff8ad9", "#7a1fd6"];

export function Leaderboard({ sessionId }: { sessionId: string | null }) {
  const { scores, loading } = useLeaderboard(sessionId);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(42,13,74,0.85), rgba(13,5,32,0.9))",
        border: "2px solid #ff4ac455",
        boxShadow: "0 0 24px rgba(255,74,196,0.25)",
      }}
    >
      <div
        className="px-4 py-2 text-center"
        style={{
          fontFamily: "var(--font-display)",
          letterSpacing: "0.16em",
          fontSize: "0.85rem",
          color: "#fff",
          background: "rgba(255,74,196,0.22)",
          borderBottom: "1px solid #ff4ac455",
        }}
      >
        TABLA DE POSICIONES
      </div>

      <div className="px-3 py-2">
        {loading ? (
          <p className="py-4 text-center" style={{ color: "#ff8ad9aa", fontFamily: "var(--font-display)", fontSize: "0.75rem" }}>
            CARGANDO…
          </p>
        ) : scores.length === 0 ? (
          <p className="py-4 text-center" style={{ color: "#ff8ad9aa", fontFamily: "var(--font-display)", fontSize: "0.75rem", letterSpacing: "0.1em" }}>
            TODAVÍA NO HAY PUNTAJES · SÉ EL PRIMERO 💋
          </p>
        ) : (
          <ol className="flex flex-col" style={{ gap: 6 }}>
            {scores.map((s, i) => (
              <li
                key={s.id}
                className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{
                  background: i < 3 ? `${HILITE[i]}1f` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i < 3 ? `${HILITE[i]}88` : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    minWidth: 26,
                    textAlign: "center",
                    color: i < 3 ? HILITE[i] : "#ff8ad9",
                  }}
                >
                  {i < 3 ? MEDALS[i] : i + 1}
                </span>
                <span
                  className="flex-1 truncate text-left"
                  style={{ fontFamily: "var(--font-serif)", fontSize: "1rem", color: "#fff" }}
                >
                  {s.player_name}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1rem",
                    color: i < 3 ? HILITE[i] : "#ff8ad9",
                    textShadow: i < 3 ? `0 0 10px ${HILITE[i]}88` : "none",
                  }}
                >
                  {s.score}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
