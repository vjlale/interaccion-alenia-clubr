import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { submitScore } from "./game.functions";


export type GameScore = {
  id: string;
  session_id: string | null;
  player_name: string;
  score: number;
  created_at: string;
};

export function useLeaderboard(sessionId: string | null | undefined) {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    let query = supabase
      .from("game_scores")
      .select("*")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(10);
    query = sessionId ? query.eq("session_id", sessionId) : query.is("session_id", null);
    const { data } = await query;
    setScores((data as GameScore[]) ?? []);
    setLoading(false);
  }, [sessionId]);

  useEffect(() => {
    refetch();
    const channel = supabase
      .channel(`game-scores-${sessionId ?? "free"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "game_scores" },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refetch]);

  return { scores, loading, refetch };
}

export async function saveScore(
  playerName: string,
  score: number,
  sessionId: string | null,
) {
  const name = playerName.trim().slice(0, 24);
  if (name.length < 1) return { error: "Poné tu nombre" };
  try {
    await submitScore({ data: { playerName: name, score, sessionId } });
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar el puntaje" };
  }
}

