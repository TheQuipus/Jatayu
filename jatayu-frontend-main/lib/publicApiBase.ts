/**
 * Browser API/WebSocket origin.
 * - unset in local `next dev` → http://127.0.0.1:5000
 * - Docker/AWS build sets NEXT_PUBLIC_API_URL=same-origin → "" so nginx can proxy /api and /socket.io
 */
export function publicApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (raw === undefined) return "https://jatayuconnect.in";
  if (raw === "" || raw === "same-origin") return "";
  return raw.replace(/\/$/, "");
}

export function publicWsBase(): string {
  const raw = process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (raw === undefined) return "wss://jatayuconnect.in";
  if (raw === "" || raw === "same-origin") return "";
  return raw.replace(/\/$/, "");
}
