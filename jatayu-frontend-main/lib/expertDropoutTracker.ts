import type { ExpertApplicationSubmission } from "./expertApplicationSubmission";

export type StepStatus = "submitted" | "skipped" | "dropout" | "in_progress" | "pending";

export interface ExpertStepMetric {
  id: string;
  title: string;
  status: StepStatus;
  valueSummary: string;
}

export interface ExpertOnboardingAnalytics {
  isComplete: boolean;
  isDropout: boolean;
  isActiveInProgress: boolean;
  dropoutStep: string | null;
  dropoutStepTitle: string | null;
  activeStep?: string | null;
  activeStepTitle?: string | null;
  idleMinutes: number;
  completionPercent: number;
  submittedCount: number;
  skippedCount: number;
  totalSteps: number;
  steps: ExpertStepMetric[];
}

export const ORDERED_EXPERT_REVIEW_STEPS = [
  { id: "category", title: "Category & Skills" },
  { id: "experience", title: "Experience & Portfolio" },
  { id: "profile", title: "Profile Details" },
  { id: "credentials", title: "Credentials & KYC" },
  { id: "preferences", title: "Consultation Preferences" },
  { id: "audience", title: "Audience & Languages" },
  { id: "availability", title: "Availability" },
] as const;

export const DROPOUT_IDLE_MINUTES = 15;

/**
 * Maps onboarding wizard step to review section id
 */
export function mapWizardStepToReviewSection(wizardStep?: string | null): string {
  if (!wizardStep) return "category";
  const step = String(wizardStep).toLowerCase();
  switch (step) {
    case "category":
    case "skills":
      return "category";
    case "experience":
      return "experience";
    case "identity":
    case "profile":
      return "profile";
    case "credentials":
    case "kyc":
      return "credentials";
    case "preferences":
    case "pricing":
      return "preferences";
    case "audience":
    case "languages":
      return "audience";
    case "availability":
    case "schedule":
      return "availability";
    case "review":
    case "success":
    case "completed":
      return "completed";
    default:
      return "category";
  }
}

/**
 * Checks if a specific review section has data in the ExpertApplicationSubmission
 */
export function hasExpertSectionData(
  app: ExpertApplicationSubmission,
  sectionId: string,
): boolean {
  if (!app) return false;
  const metadata = (app.onboardingMetadata as Record<string, unknown>) || {};

  switch (sectionId) {
    case "category": {
      const cat = app.categoryLabel || (metadata.primaryCategory as string) || "";
      const skills = Array.isArray(app.skills) ? app.skills : [];
      return Boolean(cat.trim()) || skills.length > 0;
    }
    case "experience": {
      const jobs = Array.isArray(app.employmentPositions) ? app.employmentPositions : [];
      const degrees = Array.isArray(app.educationDegrees) ? app.educationDegrees : [];
      const portfolio = app.portfolio || (metadata.portfolio as string) || "";
      const hasJob = jobs.some((j) => (j.company && j.company.trim()) || (j.jobTitle && j.jobTitle.trim()));
      const hasDegree = degrees.some((d) => (d.degree && d.degree.trim()) || (d.institution && d.institution.trim()));
      return hasJob || hasDegree || Boolean(String(portfolio).trim());
    }
    case "profile": {
      const title = app.professionalTitle || "";
      const bio = app.bio || "";
      const tagLine = app.tagLine || "";
      const photo = app.avatar || (metadata.profilePhotoSrc as string) || "";
      return Boolean(title.trim() || bio.trim() || tagLine.trim() || photo);
    }
    case "credentials": {
      const certs = Array.isArray(app.certificates) ? app.certificates : [];
      const govId = app.governmentId;
      return certs.length > 0 || Boolean(govId && (govId.front || govId.type));
    }
    case "preferences": {
      const formats = Array.isArray(app.formats) ? app.formats : [];
      const prices = app.formatPrices;
      const hasPrice = prices && typeof prices === "object" && Object.values(prices).some((p) => p && Number(p) > 0);
      return formats.length > 0 || Boolean(hasPrice);
    }
    case "audience": {
      const audience = (metadata.targetAudience as string) || "";
      const focus = Array.isArray(metadata.focusAreas) ? (metadata.focusAreas as string[]) : [];
      const langs = Array.isArray(app.languages) ? app.languages : [];
      const audiences = Array.isArray(app.audiences) ? app.audiences : [];
      return Boolean(audience.trim()) || focus.length > 0 || langs.length > 0 || audiences.length > 0;
    }
    case "availability": {
      const slots = Array.isArray(app.availabilitySlots) ? app.availabilitySlots : [];
      const tz = app.timezone || "";
      const hasSlotWithDays = slots.some((s) => Array.isArray(s.days) && s.days.length > 0);
      return hasSlotWithDays || Boolean(tz.trim());
    }
    default:
      return false;
  }
}

/**
 * Summarizes the content of a review section into a compact string
 */
export function getSectionValueSummary(
  app: ExpertApplicationSubmission,
  sectionId: string,
): string {
  if (!app) return "";
  const metadata = (app.onboardingMetadata as Record<string, unknown>) || {};

  switch (sectionId) {
    case "category": {
      const cat = app.categoryLabel || (metadata.primaryCategory as string) || "";
      const skills = Array.isArray(app.skills) ? app.skills : [];
      if (cat || skills.length > 0) {
        return [cat, skills.length > 0 ? `${skills.length} skills` : ""].filter(Boolean).join(" · ");
      }
      return "Not provided";
    }
    case "experience": {
      const jobs = Array.isArray(app.employmentPositions) ? app.employmentPositions : [];
      const degrees = Array.isArray(app.educationDegrees) ? app.educationDegrees : [];
      const portfolio = app.portfolio || (metadata.portfolio as string) || "";
      const parts: string[] = [];
      if (jobs.length > 0) parts.push(`${jobs.length} role${jobs.length > 1 ? "s" : ""}`);
      if (degrees.length > 0) parts.push(`${degrees.length} degree${degrees.length > 1 ? "s" : ""}`);
      if (portfolio) parts.push("Portfolio linked");
      return parts.length > 0 ? parts.join(" · ") : "Skipped by applicant";
    }
    case "profile": {
      const title = app.professionalTitle || "";
      const tagLine = app.tagLine || "";
      return title || tagLine || (app.bio ? "Bio provided" : "Profile configured");
    }
    case "credentials": {
      const certs = Array.isArray(app.certificates) ? app.certificates : [];
      const govId = app.governmentId;
      const parts: string[] = [];
      if (govId) parts.push("ID Uploaded");
      if (certs.length > 0) parts.push(`${certs.length} cert${certs.length > 1 ? "s" : ""}`);
      return parts.length > 0 ? parts.join(" · ") : "Skipped by applicant";
    }
    case "preferences": {
      const formats = Array.isArray(app.formats) ? app.formats : [];
      return formats.length > 0 ? `${formats.length} formats enabled` : "Preferences configured";
    }
    case "audience": {
      const langs = Array.isArray(app.languages) ? app.languages : [];
      const audiences = Array.isArray(app.audiences) ? app.audiences : [];
      const parts: string[] = [];
      if (audiences.length > 0) parts.push(`${audiences.length} audience groups`);
      if (langs.length > 0) parts.push(langs.join(", "));
      return parts.length > 0 ? parts.join(" · ") : ((metadata.targetAudience as string) || "Audience defined");
    }
    case "availability": {
      const slots = Array.isArray(app.availabilitySlots) ? app.availabilitySlots : [];
      const activeDays = new Set<string>();
      slots.forEach((s) => {
        if (Array.isArray(s.days)) s.days.forEach((d) => activeDays.add(d));
      });
      return activeDays.size > 0 ? `${activeDays.size} days/week available` : (app.timezone || "Schedule set");
    }
    default:
      return "";
  }
}

/**
 * Calculates onboarding completion percentage divided into 8 parts:
 * - 2 parts for Category & Skills (1 part for primary category, 1 part for expertise skills)
 * - 6 parts each for the remaining sections (experience, profile, credentials, preferences, audience, availability)
 * The percentage increases ONLY if a section is filled and submitted (not in case of skipped, dropout, or in progress).
 */
export function calculateExpertCompletionPercent(
  app: ExpertApplicationSubmission,
  steps: ExpertStepMetric[],
): number {
  if (!app || !Array.isArray(steps)) return 0;
  let earnedParts = 0;
  const metadata = (app.onboardingMetadata as Record<string, unknown>) || {};

  // Part 1 & 2: Category & Skills (2 parts: 1 for primary category, 1 for expertise skills)
  const categoryStep = steps.find((s) => s.id === "category");
  if (categoryStep && categoryStep.status === "submitted") {
    const primaryCategory = app.categoryLabel || (metadata.primaryCategory as string) || "";
    if (primaryCategory && primaryCategory.trim()) {
      earnedParts += 1;
    }
    const skills = Array.isArray(app.skills) ? app.skills : [];
    if (skills.length > 0) {
      earnedParts += 1;
    }
  }

  // Parts 3 to 8: Remaining 6 sections (1 part each)
  const remainingSectionIds = ["experience", "profile", "credentials", "preferences", "audience", "availability"];
  for (const secId of remainingSectionIds) {
    const step = steps.find((s) => s.id === secId);
    if (step && step.status === "submitted" && hasExpertSectionData(app, secId)) {
      earnedParts += 1;
    }
  }

  return Math.round((earnedParts / 8) * 100);
}

/**
 * Client-side fallback analyzer if backend analytics are not immediately present.
 */
export function analyzeExpertDropoutClient(
  app: ExpertApplicationSubmission,
): ExpertOnboardingAnalytics {
  const status = app.status || "not_submitted";
  const hasSubmitted =
    Boolean(app.submittedAt) ||
    status === "approved" ||
    status === "pending" ||
    status === "in_review" ||
    status === "on_hold" ||
    status === "rejected";

  const rawWizardStep = app.onboardingStep || "category";
  const currentSectionId = mapWizardStepToReviewSection(rawWizardStep);

  const lastActiveTimestamp = new Date(app.updatedAt || app.submittedAt || Date.now()).getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - (Number.isNaN(lastActiveTimestamp) ? now : lastActiveTimestamp));
  const idleMinutes = Math.floor(elapsedMs / (60 * 1000));
  const isIdleOverThreshold = idleMinutes >= DROPOUT_IDLE_MINUTES;

  const currentSectionIndex =
    currentSectionId === "completed"
      ? ORDERED_EXPERT_REVIEW_STEPS.length
      : ORDERED_EXPERT_REVIEW_STEPS.findIndex((s) => s.id === currentSectionId);
  const activeIndex = currentSectionIndex === -1 ? 0 : currentSectionIndex;

  const isComplete = hasSubmitted || currentSectionId === "completed";
  const isDropout = !isComplete && isIdleOverThreshold;
  const isActiveInProgress = !isComplete && !isIdleOverThreshold;

  let submittedCount = 0;
  let skippedCount = 0;

  const steps: ExpertStepMetric[] = ORDERED_EXPERT_REVIEW_STEPS.map((secDef, idx) => {
    const hasData = hasExpertSectionData(app, secDef.id);
    const valueSummary = getSectionValueSummary(app, secDef.id);
    let stepStatus: StepStatus = "pending";

    if (isComplete) {
      if (hasData) {
        stepStatus = "submitted";
        submittedCount += 1;
      } else {
        stepStatus = "skipped";
        skippedCount += 1;
      }
    } else {
      if (idx < activeIndex) {
        if (hasData) {
          stepStatus = "submitted";
          submittedCount += 1;
        } else {
          stepStatus = "skipped";
          skippedCount += 1;
        }
      } else if (idx === activeIndex) {
        if (isDropout) {
          stepStatus = "dropout";
        } else {
          stepStatus = "in_progress";
        }
      } else {
        stepStatus = "pending";
      }
    }

    return {
      id: secDef.id,
      title: secDef.title,
      status: stepStatus,
      valueSummary,
    };
  });

  const totalSteps = ORDERED_EXPERT_REVIEW_STEPS.length;
  const completionPercent = calculateExpertCompletionPercent(app, steps);

  const dropoutStepObj = steps.find((s) => s.status === "dropout");
  const inProgressStepObj = steps.find((s) => s.status === "in_progress");

  return {
    isComplete,
    isDropout,
    isActiveInProgress,
    dropoutStep: dropoutStepObj?.id || (isDropout ? ORDERED_EXPERT_REVIEW_STEPS[activeIndex]?.id || null : null),
    dropoutStepTitle: dropoutStepObj?.title || (isDropout ? ORDERED_EXPERT_REVIEW_STEPS[activeIndex]?.title || null : null),
    activeStep: inProgressStepObj?.id || (isActiveInProgress ? ORDERED_EXPERT_REVIEW_STEPS[activeIndex]?.id || null : null),
    activeStepTitle: inProgressStepObj?.title || (isActiveInProgress ? ORDERED_EXPERT_REVIEW_STEPS[activeIndex]?.title || null : null),
    idleMinutes,
    completionPercent,
    submittedCount,
    skippedCount,
    totalSteps,
    steps,
  };
}
