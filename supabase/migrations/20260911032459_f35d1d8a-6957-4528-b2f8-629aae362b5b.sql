-- SESSIONS: remove public write access (writes go through server functions)
DROP POLICY IF EXISTS "sessions insert all" ON public.sessions;
DROP POLICY IF EXISTS "sessions update all" ON public.sessions;
DROP POLICY IF EXISTS "sessions delete all" ON public.sessions;
REVOKE INSERT, UPDATE, DELETE ON public.sessions FROM anon, authenticated;
GRANT SELECT ON public.sessions TO anon, authenticated;
GRANT ALL ON public.sessions TO service_role;

-- VOTES: one vote per device per session, and hide voter_id from public reads
DELETE FROM public.votes a USING public.votes b
  WHERE a.ctid > b.ctid AND a.session_id = b.session_id AND a.voter_id = b.voter_id;
CREATE UNIQUE INDEX IF NOT EXISTS votes_session_voter_unique
  ON public.votes (session_id, voter_id);

REVOKE SELECT ON public.votes FROM anon, authenticated;
GRANT SELECT (id, session_id, song_id, created_at) ON public.votes TO anon, authenticated;
GRANT INSERT ON public.votes TO anon, authenticated;
GRANT ALL ON public.votes TO service_role;

CREATE OR REPLACE FUNCTION public.my_vote(_session_id uuid, _voter_id text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT song_id FROM public.votes
  WHERE session_id = _session_id AND voter_id = _voter_id
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.my_vote(uuid, text) TO anon, authenticated;

-- GAME SCORES: no direct public inserts; scores are submitted through the server
DROP POLICY IF EXISTS "game_scores insert all" ON public.game_scores;
REVOKE INSERT, UPDATE, DELETE ON public.game_scores FROM anon, authenticated;
GRANT SELECT ON public.game_scores TO anon, authenticated;
GRANT ALL ON public.game_scores TO service_role;