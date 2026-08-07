import {
  getToken,
  setToken,
  setSeekerId,
  removeToken,
  removeSeekerId,
  type AuthResponse,
  type AuthUser,
} from "@/lib/api";

const PENDING_OTP_SESSION_KEY = "jatayu_pending_seeker_otp";

export type PendingSeekerOtpSession = {
  seekerId: string;
  email: string;
  phone: string;
  fullName?: string;
};

export function persistSeekerAuthSession(response: AuthResponse): AuthUser {
  setToken(response.token);
  setSeekerId(response.user.id);
  return response.user;
}

export function clearSeekerAuthOnly(): void {
  removeToken();
  removeSeekerId();
}

export function clearSeekerAuthSession(): void {
  clearSeekerAuthOnly();
  clearPendingSeekerOtpSession();
}

export function savePendingSeekerOtpSession(session: PendingSeekerOtpSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_OTP_SESSION_KEY, JSON.stringify(session));
}

export function readPendingSeekerOtpSession(): PendingSeekerOtpSession | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(PENDING_OTP_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingSeekerOtpSession;
    if (!parsed.seekerId || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingSeekerOtpSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_OTP_SESSION_KEY);
}

export function isSeekerAuthenticated(): boolean {
  return Boolean(getToken());
}
