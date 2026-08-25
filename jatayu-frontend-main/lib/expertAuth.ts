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
import { generateUUID } from "@/lib/uuid";

export type ExpertOnboardingStep =
  | "register"
  | "login"
  | "otp"
  | "signup-complete"
  | "account-status"
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

const EXPERT_USER_KEY = "jatayu_expert_user";

export function persistAuthSession(response: AuthResponse): AuthUser {
  setToken(response.token);
  setExpertId(response.user.id);
  if (typeof window !== "undefined" && response.user) {
    try {
      localStorage.setItem(EXPERT_USER_KEY, JSON.stringify(response.user));
    } catch {
      // Ignore quota error
    }
  }
  return response.user;
}

export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(EXPERT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

import { clearExpertApplicationDraft } from "@/lib/expertApplicationsStore";

export function clearExpertAuthOnly(): void {
  removeToken();
  removeExpertId();
  if (typeof window !== "undefined") {
    localStorage.removeItem(EXPERT_USER_KEY);
  }
}

export function clearAuthSession(): void {
  clearExpertAuthOnly();
  clearPendingOtpSession();
  clearExpertApplicationDraft();
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

  const step = user.onboardingStep as ExpertOnboardingStep;
  if (step && step !== "success" && ONBOARDING_STEPS.includes(step)) {
    return step;
  }

  if (
    user.onboardingComplete === true ||
    user.onboardingStep === "success" ||
    user.status === "approved"
  ) {
    return "success";
  }

  return "category";
}

export function getPostAuthDestination(user: AuthUser): string | ExpertOnboardingStep {
  if (
    user.onboardingComplete === true ||
    user.onboardingStep === "success" ||
    user.status === "approved"
  ) {
    return EXPERT_DASHBOARD_HREF;
  }

  const step = user.onboardingStep as ExpertOnboardingStep;
  if (step && step !== "success" && ONBOARDING_STEPS.includes(step)) {
    return step;
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

import { type EducationDegree, type EmploymentPosition } from "@/lib/expertEmployment";

export type BackendCredentialRecord = {
  id?: string;
  type?: string;
  title?: string;
  institution?: string;
  startYear?: number | string | null;
  endYear?: number | string | null;
  description?: string | null;
};

export function parseCredentialsFromProfile(credentials?: unknown): {
  employmentPositions: EmploymentPosition[];
  educationDegrees: EducationDegree[];
} {
  if (!Array.isArray(credentials)) {
    return { employmentPositions: [], educationDegrees: [] };
  }

  const employmentPositions: EmploymentPosition[] = [];
  const educationDegrees: EducationDegree[] = [];

  for (const item of credentials as BackendCredentialRecord[]) {
    if (!item || typeof item !== "object") continue;
    const type = (item.type || "").toLowerCase();
    if (type === "employment" || type === "work" || type === "job") {
      employmentPositions.push({
        id: item.id || `emp-${generateUUID()}`,
        jobTitle: item.title || "",
        company: item.institution || "",
        startMonth: "",
        startYear: item.startYear ? String(item.startYear) : "",
        endMonth: "",
        endYear: item.endYear ? String(item.endYear) : "",
        currentlyWorking: !item.endYear,
        responsibilities: item.description || "",
      });
    } else if (type === "education" || type === "degree" || type === "academic") {
      const desc = item.description || "";
      const parts = desc.split(" · ");
      educationDegrees.push({
        id: item.id || `edu-${generateUUID()}`,
        degree: item.title || "",
        fieldOfStudy: parts[0] || "",
        institution: item.institution || "",
        graduationYear: item.endYear ? String(item.endYear) : item.startYear ? String(item.startYear) : "",
        honours: parts[1] || "",
      });
    }
  }

  return { employmentPositions, educationDegrees };
}
