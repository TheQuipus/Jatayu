import { disconnectSocket } from "@/lib/socket";

const ADMIN_TOKEN_KEY = "jatayu_admin_token";

export const ADMIN_LAST_ACTIVITY_KEY = "jatayu_admin_last_activity_at";
export const ADMIN_IDLE_CONFIG_KEY = "jatayu_admin_idle_config";
export const ADMIN_IDLE_CONFIG_UPDATED_EVENT = "jatayu:admin-idle-config-updated";
export const ADMIN_SESSION_CHANNEL = "jatayu_admin_session";

export type AdminIdleConfig = {
  idleTimeoutMinutes: number;
  idleWarningSeconds: number;
};

export type AdminLogoutReason = "idle_timeout" | "manual" | "session_revoked" | "session_expired";

const DEFAULT_CONFIG: AdminIdleConfig = {
  idleTimeoutMinutes: 5,
  idleWarningSeconds: 60,
};

let isLoggingOut = false;
let lastActivityWriteAt = 0;

export function getEffectiveAdminWarningSeconds(
  timeoutMinutes: number,
  warningSeconds: number,
): number {
  if (timeoutMinutes <= 0) return 0;
  return Math.min(warningSeconds, Math.max(10, Math.floor((timeoutMinutes * 60) / 3)));
}

export function getCachedAdminIdleConfig(): AdminIdleConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(ADMIN_IDLE_CONFIG_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw) as Partial<AdminIdleConfig>;
    const idleTimeoutMinutes =
      typeof parsed.idleTimeoutMinutes === "number" &&
      Number.isInteger(parsed.idleTimeoutMinutes) &&
      parsed.idleTimeoutMinutes >= 0 &&
      parsed.idleTimeoutMinutes <= 1440
        ? parsed.idleTimeoutMinutes
        : DEFAULT_CONFIG.idleTimeoutMinutes;
    const idleWarningSeconds =
      typeof parsed.idleWarningSeconds === "number" &&
      Number.isInteger(parsed.idleWarningSeconds) &&
      parsed.idleWarningSeconds >= 10 &&
      parsed.idleWarningSeconds <= 300
        ? parsed.idleWarningSeconds
        : DEFAULT_CONFIG.idleWarningSeconds;
    return { idleTimeoutMinutes, idleWarningSeconds };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function setCachedAdminIdleConfig(config: AdminIdleConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_IDLE_CONFIG_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage quota errors
  }
  window.dispatchEvent(new CustomEvent(ADMIN_IDLE_CONFIG_UPDATED_EVENT, { detail: config }));
  broadcastAdminSessionMessage({ type: "CONFIG_UPDATED", config });
}

export function getLastAdminActivityAt(): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
    const parsed = raw ? Number(raw) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  } catch {
    // Ignore storage read errors
  }
  const now = Date.now();
  try {
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(now));
  } catch {
    // Ignore
  }
  return now;
}

export function recordAdminActivity(forceBroadcast = false): number {
  const now = Date.now();
  if (typeof window === "undefined") return now;
  if (!forceBroadcast && now - lastActivityWriteAt < 2000) {
    return now;
  }
  lastActivityWriteAt = now;
  try {
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(now));
  } catch {
    // Ignore storage quota errors
  }
  broadcastAdminSessionMessage({ type: "ACTIVITY", at: now });
  return now;
}

export type AdminSessionBroadcastMessage =
  | { type: "ACTIVITY"; at: number }
  | { type: "EXTENDED"; at: number }
  | { type: "CONFIG_UPDATED"; config: AdminIdleConfig }
  | { type: "LOGOUT"; reason: AdminLogoutReason };

export function broadcastAdminSessionMessage(message: AdminSessionBroadcastMessage): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
  try {
    const channel = new BroadcastChannel(ADMIN_SESSION_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch {
    // Fallback to localStorage storage events
  }
}

export function sanitizeAdminNextPath(rawPath: string | null | undefined): string | null {
  if (!rawPath) return null;
  const trimmed = rawPath.trim();
  if (!trimmed.startsWith("/admin/")) return null;
  if (trimmed.startsWith("//")) return null;
  if (trimmed === "/admin" || trimmed === "/admin/") return null;
  return trimmed;
}

export function resetAdminLogoutGuardForTests(): void {
  isLoggingOut = false;
  lastActivityWriteAt = 0;
}

export function triggerAdminSessionLogout(reason: AdminLogoutReason): void {
  if (typeof window === "undefined" || isLoggingOut) return;
  isLoggingOut = true;

  const currentPath = `${window.location.pathname}${window.location.search}`;
  const safeNext = sanitizeAdminNextPath(currentPath);

  broadcastAdminSessionMessage({ type: "LOGOUT", reason });

  try {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
  } catch {
    // Ignore
  }
  disconnectSocket();

  if (window.location.pathname === "/admin" || window.location.pathname === "/admin/") {
    return;
  }

  if (reason === "manual") {
    window.location.replace("/admin");
    return;
  }

  const params = new URLSearchParams({ reason });
  if (safeNext) {
    params.set("next", safeNext);
  }
  window.location.replace(`/admin?${params.toString()}`);
}

export function handleAdminApiUnauthorized(status: number, code?: string): void {
  if (typeof window === "undefined" || status !== 401) return;
  if (!window.location.pathname.startsWith("/admin/")) return;
  if (code === "ADMIN_SESSION_IDLE_TIMEOUT") {
    triggerAdminSessionLogout("idle_timeout");
    return;
  }
  if (code === "ADMIN_SESSION_REVOKED") {
    triggerAdminSessionLogout("session_revoked");
    return;
  }
  triggerAdminSessionLogout("session_expired");
}
