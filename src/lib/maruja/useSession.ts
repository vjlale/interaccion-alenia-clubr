import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, Vote } from "./types";
import { optionLabel } from "./types";

/** Coalesces rapid calls into one execution per frame-ish window. */
function useCoalesced(fn: () => void, wait = 80) {
  const ref = useRef(fn);
  ref.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(() => {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      ref.current();
    }, wait);
  }, [wait]);
}

/** Re-runs a callback when the tab regains focus / connection returns. */
function useWakeRefresh(fn: () => void) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    const onWake = () => {
      if (document.visibilityState === "visible") ref.current();
    };
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("online", onWake);
    return () => {
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("online", onWake);
    };
  }, []);
}

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

  const softRefetch = useCoalesced(refetch, 60);
  useWakeRefresh(refetch);

  useEffect(() => {
    refetch();

    const channel = supabase
      .channel("sessions-active")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sessions" },
        (payload) => {
          const row = payload.new as Session | undefined;
          // Apply the incoming row immediately (no server round-trip),
          // then reconcile in the background.
          setSession((prev) => {
            if (!row || !row.id) return prev;
            if (!prev || prev.id === row.id) return { ...(prev ?? {}), ...row } as Session;
            return prev;
          });
          softRefetch();
        },
      )
      .subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        setConnected(ok);
        if (ok) refetch();
      });

    // Safety net if the realtime socket silently drops.
    const poll = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 4000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [refetch, softRefetch]);

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

  const softRefetch = useCoalesced(refetch, 120);
  useWakeRefresh(refetch);

  useEffect(() => {
    refetch();
    if (!sessionId) return;

    const channel = supabase
      .channel(`votes-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const row = payload.new as Vote | undefined;
          const old = payload.old as { id?: string } | undefined;
          // Optimistically apply the event so the bars move instantly.
          if (payload.eventType === "INSERT" && row?.id && row.song_id) {
            setVotes((prev) => (prev.some((v) => v.id === row.id) ? prev : [...prev, row]));
          } else if (payload.eventType === "DELETE" && old?.id) {
            setVotes((prev) => prev.filter((v) => v.id !== old.id));
          } else if (payload.eventType === "UPDATE" && row?.id) {
            setVotes((prev) => prev.map((v) => (v.id === row.id ? { ...v, ...row } : v)));
          }
          softRefetch();
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refetch();
      });

    const poll = setInterval(() => {
      if (document.visibilityState === "visible") refetch();
    }, 4000);

    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [sessionId, refetch, softRefetch]);

  const { counts, total } = useMemo(() => {
    const c: Record<string, number> = {};
    for (let i = 0; i < 26; i += 1) c[optionLabel(i)] = 0;
    for (const v of votes) c[v.song_id] = (c[v.song_id] ?? 0) + 1;
    return { counts: c, total: votes.length };
  }, [votes]);

  return { votes, counts, total, refetch };
}

export function useCountdown(startedAt: string | null, durationSec: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last > 100) {
        last = t;
        setNow(Date.now());
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
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
