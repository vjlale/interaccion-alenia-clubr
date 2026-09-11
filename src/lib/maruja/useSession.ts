import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, Vote } from "./types";
import { optionLabel } from "./types";

export function useActiveSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const refetch = useCallback(async () => {
    const { data } = await supabase
      .from("sessions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSession((data as Session | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
    const channel = supabase
      .channel("sessions-active")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        () => refetch(),
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return { session, loading, connected, refetch };
}

export function useVotes(sessionId: string | undefined) {
  const [votes, setVotes] = useState<Vote[]>([]);

  const refetch = useCallback(async () => {
    if (!sessionId) {
      setVotes([]);
      return;
    }
    const { data } = await supabase
      .from("votes")
      .select("id, session_id, song_id, created_at")
      .eq("session_id", sessionId);
    setVotes((data as Vote[]) ?? []);

  }, [sessionId]);

  useEffect(() => {
    refetch();
    if (!sessionId) return;
    const channel = supabase
      .channel(`votes-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `session_id=eq.${sessionId}` },
        () => refetch(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, refetch]);

  const counts: Record<string, number> = {};
  for (let i = 0; i < 26; i += 1) counts[optionLabel(i)] = 0;
  for (const v of votes) counts[v.song_id] = (counts[v.song_id] ?? 0) + 1;
  const total = votes.length;

  return { votes, counts, total, refetch };
}

export function useCountdown(startedAt: string | null, durationSec: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);
  if (!startedAt) return { remaining: durationSec, elapsed: 0, fraction: 0 };
  const start = new Date(startedAt).getTime();
  const elapsedMs = now - start;
  const remainingMs = Math.max(0, durationSec * 1000 - elapsedMs);
  const remaining = Math.ceil(remainingMs / 1000);
  return {
    remaining,
    elapsed: Math.floor(elapsedMs / 1000),
    fraction: Math.min(1, Math.max(0, remainingMs / (durationSec * 1000))),
  };
}

export function formatMSS(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
