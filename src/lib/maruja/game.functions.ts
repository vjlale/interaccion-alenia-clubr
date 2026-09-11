import { createServerFn } from "@tanstack/react-start";

const MAX_SCORE = 100000;

export const submitScore = createServerFn({ method: "POST" })
  .inputValidator((input: { playerName: string; score: number; sessionId: string | null }) => {
    const playerName = String(input?.playerName ?? "").trim().slice(0, 24);
    const score = Math.floor(Number(input?.score));
    if (playerName.length < 1) throw new Error("Poné tu nombre");
    if (!Number.isFinite(score) || score < 0 || score > MAX_SCORE) {
      throw new Error("Puntaje inválido");
    }
    const sessionId =
      typeof input?.sessionId === "string" && input.sessionId.length > 0 ? input.sessionId : null;
    return { playerName, score, sessionId };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.sessionId) {
      const { data: session } = await supabaseAdmin
        .from("sessions")
        .select("id")
        .eq("id", data.sessionId)
        .maybeSingle();
      if (!session) throw new Error("Sesión inexistente");
    }

    const { error } = await supabaseAdmin.from("game_scores").insert({
      player_name: data.playerName,
      score: data.score,
      session_id: data.sessionId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
