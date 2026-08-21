export function getVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("maruja_voter_id");
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("maruja_voter_id", id);
  }
  return id;
}
