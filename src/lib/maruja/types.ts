export type SessionStatus = "idle" | "voting" | "revealing" | "winner";

export type Song = {
  id: string;
  title: string;
  artist: string;
  image?: string;
};

export type Session = {
  id: string;
  status: SessionStatus;
  songs: Song[];
  duration_sec: number;
  started_at: string | null;
  winner_id: string | null;
  created_at: string;
};

export type Vote = {
  id: string;
  session_id: string;
  song_id: string;
  voter_id: string;
  created_at: string;
};

// Versus Club Reggaeton XL: opción A dorado, opción B violeta.
export const OPTION_COLORS = ["#E7B10C", "#9B2FE0", "#5FE88E", "#F0654F"] as const;

export const optionLabel = (idx: number) => String.fromCharCode(65 + idx);

export const colorForIndex = (idx: number) => OPTION_COLORS[idx % OPTION_COLORS.length] ?? OPTION_COLORS[0];
