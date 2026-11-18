export type DigilockerKycState =
  | "not_started"
  | "authorization_pending"
  | "verified"
  | "cancelled"
  | "failed"
  | "expired"
  | "unknown";

const KNOWN_STATES = new Set<DigilockerKycState>([
  "not_started",
  "authorization_pending",
  "verified",
  "cancelled",
  "failed",
  "expired",
]);

function isKnownState(value: string): value is DigilockerKycState {
  return KNOWN_STATES.has(value as DigilockerKycState);
}

export function resolveDigilockerKycState(
  value: unknown,
  now = Date.now(),
): DigilockerKycState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "not_started";
  const record = value as Record<string, unknown>;
  const status = record.status;
  if (status === "denied") return "cancelled";
  if (typeof status !== "string" || !isKnownState(status)) {
    return "unknown";
  }
  if (status === "authorization_pending" && typeof record.authorizationExpiresAt === "string") {
    const expiresAt = Date.parse(record.authorizationExpiresAt);
    if (Number.isFinite(expiresAt) && expiresAt <= now) return "expired";
  }
  return status;
}
