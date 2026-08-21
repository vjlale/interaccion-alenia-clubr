export type SessionStatus = "idle" | "voting" | "revealing" | "winner";

export type Song = {
  id: string;
  title: string;
  artist: string;
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

export const OPTION_COLORS = ["#E12FBE", "#5FE88E", "#E8B84A", "#F0654F"] as const;

export const optionLabel = (idx: number) => String.fromCharCode(65 + idx);

export const colorForIndex = (idx: number) => OPTION_COLORS[idx % OPTION_COLORS.length] ?? OPTION_COLORS[0];
