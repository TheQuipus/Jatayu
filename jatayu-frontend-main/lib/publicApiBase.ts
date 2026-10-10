/**
 * Browser API/WebSocket origin.
 * - unset in local `next dev` → http://127.0.0.1:5000
 * - Docker/AWS build sets NEXT_PUBLIC_API_URL=same-origin → "" so nginx can proxy /api and /socket.io
 */
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i;

function configuredPublicOrigin(raw: string | undefined, fallback: string): string {
  if (raw === undefined) return fallback;
  if (raw === "" || raw === "same-origin") return "";
  const normalized = raw.replace(/\/$/, "");
  // NEXT_PUBLIC_* values are embedded at build time. Never send production
  // visitors to their own localhost when a development .env was used to build.
  if (process.env.NODE_ENV === "production" && LOCAL_ORIGIN.test(normalized)) return fallback;
  return normalized;
}

export function publicApiBase(): string {
  return configuredPublicOrigin(process.env.NEXT_PUBLIC_API_URL, "https://jatayuconnect.in");
}

export function publicWsBase(): string {
  return configuredPublicOrigin(
    process.env.NEXT_PUBLIC_WS_URL ?? process.env.NEXT_PUBLIC_API_URL,
    "wss://jatayuconnect.in",
  );
}
