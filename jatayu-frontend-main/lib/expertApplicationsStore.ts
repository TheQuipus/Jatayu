import { getDemoExpertApplications } from "./demoExpertApplications";
import {
  getFormatTitle,
  getLowestFormatPrice,
} from "@/components/expert/onboarding/preferencesData";
import type {
  ApplicationStatus,
  ExpertApplicationDraft,
  ExpertApplicationSubmission,
  SlaStatus,
} from "./expertApplicationSubmission";
import { EXPERIENCE_LABELS } from "./expertProfile";

const STORAGE_KEY = "jatayu_expert_applications";
const DRAFT_KEY = "jatayu_expert_application_draft";
export const APPLICATIONS_UPDATED_EVENT = "expert-applications-updated";

function dispatchUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APPLICATIONS_UPDATED_EVENT));
}

function readApplications(): ExpertApplicationSubmission[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ExpertApplicationSubmission[];
    return parsed.map(normalizeApplication);
  } catch {
    return [];
  }
}

function normalizeApplication(app: ExpertApplicationSubmission): ExpertApplicationSubmission {
  return {
    ...app,
    portfolioLinks: app.portfolioLinks ?? [],
    employmentPositions: app.employmentPositions ?? [],
    educationDegrees: app.educationDegrees ?? [],
    acceptCustomRequests: app.acceptCustomRequests ?? false,
    termsAcceptedAt: app.termsAcceptedAt ?? app.submittedAt,
  };
}

function writeApplications(applications: ExpertApplicationSubmission[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
  dispatchUpdated();
}

export function getExpertApplications(): ExpertApplicationSubmission[] {
  return readApplications();
}

export function getExpertApplicationByAppId(
  appId: string,
): ExpertApplicationSubmission | null {
  return readApplications().find((application) => application.appId === appId) ?? null;
}

export function getExpertApplicationAppIds(): string[] {
  return readApplications().map((application) => application.appId);
}

export function saveExpertApplicationDraft(draft: ExpertApplicationDraft): void {
  if (typeof window === "undefined") return;
  const current = getExpertApplicationDraft();
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...current, ...draft }));
}

export function getExpertApplicationDraft(): ExpertApplicationDraft {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ExpertApplicationDraft;
  } catch {
    return {};
  }
}

export function clearExpertApplicationDraft(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}

function createAppId(existing: ExpertApplicationSubmission[]): string {
  const numbers = existing
    .map((application) => {
      const match = application.appId.match(/^APP-(\d+)$/);
      return match ? Number(match[1]) : 0;
    })
    .filter((value) => value > 0);

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1000;
  return `APP-${next}`;
}

export function submitExpertApplication(
  draft: ExpertApplicationDraft,
): ExpertApplicationSubmission {
  const existing = readApplications();
  const submission: ExpertApplicationSubmission = {
    appId: createAppId(existing),
    submittedAt: new Date().toISOString(),
    status: "pending",
    name: draft.name?.trim() || "Expert",
    email: draft.email?.trim() || "",
    phone: draft.phone?.trim() || "",
    categoryId: draft.categoryId || "",
    categoryLabel: draft.categoryLabel || "General",
    skills: draft.skills ?? [],
    experienceLevel: draft.experienceLevel ?? "established",
    professionalTitle: draft.professionalTitle?.trim() || draft.categoryLabel || "Expert",
    tagLine: draft.tagLine?.trim() || "",
    bio: draft.bio?.trim() || "",
    avatar: draft.avatar || "/assets/img/manportrait.png",
    location: draft.location?.trim() || "India",
    linkedin: draft.linkedin?.trim() || "",
    portfolio: draft.portfolio?.trim() || "",
    portfolioSamples: draft.portfolioSamples ?? [],
    portfolioLinks: draft.portfolioLinks ?? [],
    governmentId: draft.governmentId,
    kycVideoUrl: draft.kycVideoUrl,
    certificates: draft.certificates ?? [],
    formats: draft.formats ?? [],
    lengths: draft.lengths ?? [],
    formatPrices: draft.formatPrices ?? {},
    languages: draft.languages ?? [],
    audiences: draft.audiences ?? [],
    timezone: draft.timezone || "",
    availabilitySlots: draft.availabilitySlots ?? [],
    employmentPositions: draft.employmentPositions ?? [],
    educationDegrees: draft.educationDegrees ?? [],
    acceptCustomRequests: draft.acceptCustomRequests ?? false,
    termsAcceptedAt: draft.termsAcceptedAt ?? new Date().toISOString(),
  };

  writeApplications([submission, ...existing]);
  clearExpertApplicationDraft();
  return submission;
}

export function updateExpertApplicationStatus(
  appId: string,
  status: ApplicationStatus,
): void {
  const applications = readApplications().map((application) =>
    application.appId === appId ? { ...application, status } : application,
  );
  writeApplications(applications);
}

export function computeCompleteness(application: ExpertApplicationSubmission): number {
  const checks = [
    Boolean(application.name),
    Boolean(application.email),
    Boolean(application.phone),
    Boolean(application.categoryLabel),
    application.skills.length >= 3,
    Boolean(application.professionalTitle),
    Boolean(application.bio),
    Boolean(application.avatar),
    application.certificates.length > 0,
    application.formats.length > 0,
    Object.values(application.formatPrices).some((price) => Number(price) > 0),
    application.languages.length > 0,
    application.availabilitySlots.some((slot) => slot.days.length > 0),
    application.employmentPositions.some(
      (position) => position.jobTitle.trim() || position.company.trim(),
    ),
    application.educationDegrees.some(
      (degree) =>
        degree.degree ||
        degree.fieldOfStudy.trim() ||
        degree.institution.trim() ||
        degree.graduationYear.trim(),
    ),
    Boolean(application.termsAcceptedAt),
  ];

  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export function getSubmittedAgo(submittedAt: string): string {
  const hours = Math.max(
    1,
    Math.floor((Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60)),
  );
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function getSlaStatus(submittedAt: string): {
  slaStatus: SlaStatus;
  slaLabel: string;
  slaLimit: string;
  hoursElapsed: number;
} {
  const elapsedMs = Date.now() - new Date(submittedAt).getTime();
  const totalMinutes = Math.max(0, Math.floor(elapsedMs / (1000 * 60)));
  const hoursElapsed = Math.floor(totalMinutes / 60);
  const minutesPart = totalMinutes % 60;

  const hh = String(hoursElapsed).padStart(2, "0");
  const mm = String(minutesPart).padStart(2, "0");
  const slaLabel = `${hh}:${mm} hrs`;

  const hoursRemaining = 48 - hoursElapsed;

  if (hoursElapsed >= 48) {
    return {
      slaStatus: "breached",
      slaLabel,
      slaLimit: "",
      hoursElapsed,
    };
  }

  if (hoursRemaining <= 8) {
    return {
      slaStatus: "at_risk",
      slaLabel,
      slaLimit: "",
      hoursElapsed,
    };
  }

  return {
    slaStatus: "on_track",
    slaLabel,
    slaLimit: "",
    hoursElapsed,
  };
}

export function formatSubmittedDate(submittedAt: string): string {
  return new Date(submittedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getExperienceYearsLabel(
  level: ExpertApplicationSubmission["experienceLevel"],
): string {
  return EXPERIENCE_LABELS[level];
}

export function getAskedRate(application: ExpertApplicationSubmission): string {
  const lowest = getLowestFormatPrice(application.formatPrices);
  if (!lowest) return "Not set";
  return `₹${lowest}`;
}

export function getCategoryColor(categoryLabel: string): string {
  const normalized = categoryLabel.toLowerCase();
  if (normalized.includes("legal")) return "var(--pomegranate)";
  if (normalized.includes("finance")) return "#8B5CF6";
  if (normalized.includes("health")) return "var(--green)";
  if (normalized.includes("marketing")) return "#EC4899";
  if (normalized.includes("startup") || normalized.includes("business")) return "var(--tango)";
  if (normalized.includes("career")) return "#3B82F6";
  return "var(--tango)";
}

export function buildPricingMenu(application: ExpertApplicationSubmission) {
  return application.formats.map((formatId) => ({
    id: formatId,
    label: getFormatTitle(formatId),
    price: application.formatPrices[formatId]
      ? `₹${application.formatPrices[formatId]}`
      : "—",
    unit: formatId === "written" ? "per query" : "per session",
  }));
}

export function seedDemoApplicationIfEmpty(): void {
  if (typeof window === "undefined") return;

  const existing = readApplications();
  const demos = getDemoExpertApplications();

  if (existing.length === 0) {
    writeApplications(demos);
    return;
  }

  const existingIds = new Set(existing.map((application) => application.appId));
  const missingDemos = demos.filter((demo) => !existingIds.has(demo.appId));

  if (missingDemos.length > 0) {
    writeApplications([...existing, ...missingDemos]);
  }
}
