import { createServerFn } from "@tanstack/react-start";
import type { Song, SessionStatus } from "./types";

const STATUSES: SessionStatus[] = ["idle", "voting", "revealing", "winner"];

type SessionPatch = {
  songs?: Song[];
  duration_sec?: number;
  status?: SessionStatus;
  started_at?: string | null;
  winner_id?: string | null;
};

function cleanSongs(input: unknown): Song[] {
  if (!Array.isArray(input)) return [];
  return input.slice(0, 8).map((s, i) => {
    const song = (s ?? {}) as Partial<Song>;
    return {
      id: String(song.id ?? String.fromCharCode(65 + i)).slice(0, 2),
      title: String(song.title ?? "").slice(0, 120),
      artist: String(song.artist ?? "").slice(0, 120),
      image: String(song.image ?? "").slice(0, 400000),
    };
  });
}

function cleanPatch(input: Record<string, unknown>): SessionPatch {
  const patch: SessionPatch = {};
  if ("songs" in input) patch.songs = cleanSongs(input["songs"]);
  if ("duration_sec" in input) {
    const n = Math.floor(Number(input["duration_sec"]));
    patch.duration_sec = Number.isFinite(n) && n > 0 && n <= 86400 ? n : 3600;
  }
  if ("status" in input) {
    const s = String(input["status"]) as SessionStatus;
    if (!STATUSES.includes(s)) throw new Error("Estado inválido");
    patch.status = s;
  }
  if ("started_at" in input) {
    const v = input["started_at"];
    patch.started_at = typeof v === "string" ? v.slice(0, 40) : null;
  }
  if ("winner_id" in input) {
    const v = input["winner_id"];
    patch.winner_id = typeof v === "string" ? v.slice(0, 2) : null;
  }
  return patch;
}

export const createSessionFn = createServerFn({ method: "POST" })
  .inputValidator((input: Record<string, unknown>) => cleanPatch(input ?? {}))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("sessions")
      .insert({ status: "idle", ...data })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const updateSessionFn = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; patch: Record<string, unknown> }) => {
    const id = String(input?.id ?? "");
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new Error("Sesión inválida");
    return { id, patch: cleanPatch(input?.patch ?? {}) };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("sessions").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
