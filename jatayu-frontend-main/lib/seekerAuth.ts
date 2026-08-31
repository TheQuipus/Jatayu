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

const SEEKER_USER_KEY = "jatayu_seeker_user";

export function persistSeekerAuthSession(response: AuthResponse): AuthUser {
  setToken(response.token);
  setSeekerId(response.user.id);
  if (typeof window !== "undefined" && response.user) {
    try {
      localStorage.setItem(SEEKER_USER_KEY, JSON.stringify(response.user));
    } catch {
      // Ignore quota error
    }
  }
  return response.user;
}

export function getStoredSeekerUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(SEEKER_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearSeekerAuthOnly(): void {
  removeToken();
  removeSeekerId();
  if (typeof window !== "undefined") {
    localStorage.removeItem(SEEKER_USER_KEY);
    localStorage.removeItem("jatayu_token");
    localStorage.removeItem("jatayu_seeker_id");
    localStorage.removeItem("jatayu_seeker_profile");
    sessionStorage.removeItem("jatayu_token");
    sessionStorage.removeItem("jatayu_seeker_id");
    sessionStorage.removeItem("jatayu_seeker_profile");
    sessionStorage.removeItem("jatayu_seeker_category");
  }
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

export type SeekerOnboardingStep =
  | "category"
  | "needs"
  | "format"
  | "budget"
  | "personalisation"
  | "review";

const SEEKER_ONBOARDING_STEPS: SeekerOnboardingStep[] = [
  "category",
  "needs",
  "format",
  "budget",
  "personalisation",
  "review",
];

export function resolveSeekerOnboardingStep(user: AuthUser): SeekerOnboardingStep {
  const step = user.onboardingStep as SeekerOnboardingStep;
  if (step && SEEKER_ONBOARDING_STEPS.includes(step)) {
    return step;
  }
  return "category";
}

export function getSeekerPostAuthDestination(user: AuthUser): string | SeekerOnboardingStep {
  if (
    user.status === "active" ||
    user.onboardingComplete === true ||
    user.onboardingStep === "success" ||
    user.onboardingStep === "completed"
  ) {
    return "/seeker/dashboard/";
  }

  const step = user.onboardingStep as SeekerOnboardingStep;
  if (step && SEEKER_ONBOARDING_STEPS.includes(step)) {
    return step;
  }

  return "category";
}

export function isSeekerAuthenticated(): boolean {
  return Boolean(getToken());
}
