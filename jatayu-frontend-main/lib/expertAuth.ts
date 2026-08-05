import {
  getToken,
  setToken,
  setExpertId,
  removeToken,
  removeExpertId,
  type AuthResponse,
  type AuthUser,
} from "@/lib/api";
import { EXPERT_DASHBOARD_HREF } from "@/lib/expertDashboard";

export type ExpertOnboardingStep =
  | "register"
  | "login"
  | "otp"
  | "category"
  | "skills"
  | "experience"
  | "identity"
  | "credentials"
  | "preferences"
  | "audience"
  | "availability"
  | "review"
  | "success";

const ONBOARDING_STEPS: ExpertOnboardingStep[] = [
  "register",
  "login",
  "otp",
  "category",
  "skills",
  "experience",
  "identity",
  "credentials",
  "preferences",
  "audience",
  "availability",
  "review",
  "success",
];

export function persistAuthSession(response: AuthResponse): AuthUser {
  setToken(response.token);
  setExpertId(response.user.id);
  return response.user;
}

export function clearExpertAuthOnly(): void {
  removeToken();
  removeExpertId();
}

export function clearAuthSession(): void {
  clearExpertAuthOnly();
  clearPendingOtpSession();
}

const PENDING_OTP_SESSION_KEY = "jatayu_pending_expert_otp";

export type PendingOtpSession = {
  expertId: string;
  email: string;
  phone: string;
  fullName?: string;
};

export function savePendingOtpSession(session: PendingOtpSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PENDING_OTP_SESSION_KEY, JSON.stringify(session));
}

export function readPendingOtpSession(): PendingOtpSession | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(PENDING_OTP_SESSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as PendingOtpSession;
    if (!parsed.expertId || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingOtpSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_OTP_SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

export function resolveOnboardingStep(user: AuthUser): ExpertOnboardingStep {
  if (user.onboardingStep === "otp") return "otp";
  if (user.status === "pending_review" || user.onboardingStep === "success") {
    return "success";
  }
  if (user.status === "approved" && user.onboardingStep === "success") {
    return "success";
  }

  const step = user.onboardingStep as ExpertOnboardingStep;
  if (ONBOARDING_STEPS.includes(step)) {
    return step;
  }

  return "category";
}

export function getPostAuthDestination(user: AuthUser): string | ExpertOnboardingStep {
  if (user.status === "approved" && user.onboardingStep === "success") {
    return EXPERT_DASHBOARD_HREF;
  }

  if (user.status === "pending_review") {
    return "success";
  }

  return resolveOnboardingStep(user);
}

export function isNavigationHref(
  destination: string | ExpertOnboardingStep,
): destination is string {
  return typeof destination === "string" && destination.startsWith("/");
}

export function buildCredentialsPayload(
  employmentPositions: Array<{
    jobTitle: string;
    company: string;
    startYear: string;
    endYear: string;
    currentlyWorking: boolean;
    responsibilities: string;
  }>,
  educationDegrees: Array<{
    degree: string;
    fieldOfStudy?: string;
    institution: string;
    graduationYear: string;
    honours?: string;
  }>,
) {
  const employment = employmentPositions
    .filter((position) => position.jobTitle.trim() || position.company.trim())
    .map((position) => ({
      type: "employment",
      title: position.jobTitle.trim() || "Role",
      institution: position.company.trim() || "Company",
      startYear: Number.parseInt(position.startYear, 10) || new Date().getFullYear(),
      endYear: position.currentlyWorking
        ? null
        : Number.parseInt(position.endYear, 10) || null,
      description: position.responsibilities.trim() || null,
    }));

  const education = educationDegrees
    .filter((degree) => degree.degree.trim() || degree.institution.trim())
    .map((degree) => {
      const graduationYear = Number.parseInt(degree.graduationYear, 10) || new Date().getFullYear();
      const descriptionParts = [degree.fieldOfStudy, degree.honours].filter(Boolean);
      return {
        type: "education",
        title: degree.degree.trim() || "Degree",
        institution: degree.institution.trim() || "Institution",
        startYear: graduationYear,
        endYear: graduationYear,
        description: descriptionParts.join(" · ") || null,
      };
    });

  return [...employment, ...education];
}
