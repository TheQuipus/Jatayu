import type { SeekerUser } from "./adminUserManagement";

export type StepStatus = "submitted" | "skipped" | "dropout" | "in_progress" | "pending";

export interface SeekerStepMetric {
  id: string;
  title: string;
  subtitle: string;
  status: StepStatus;
  valueSummary: string;
  details?: string;
}

export interface SeekerOnboardingAnalytics {
  isComplete: boolean;
  isDropout: boolean;
  isActiveInProgress: boolean;
  dropoutStep: string | null;
  dropoutStepTitle: string | null;
  idleMinutes: number;
  lastActiveAt: string;
  completionPercent: number;
  submittedCount: number;
  skippedCount: number;
  totalSteps: number;
  steps: SeekerStepMetric[];
}

export const ORDERED_SEEKER_STEPS = [
  { id: "category", title: "Category", subtitle: "Domain & Topics" },
  { id: "needs", title: "Needs & Goals", subtitle: "Agenda & Context" },
  { id: "format", title: "Format", subtitle: "Call, Chat, Review" },
  { id: "budget", title: "Budget Tier", subtitle: "Rate Preference" },
  { id: "personalisation", title: "Preferences", subtitle: "Languages & City" },
  { id: "review", title: "Review", subtitle: "Submission & Terms" },
] as const;

export const DROPOUT_IDLE_MINUTES = 15;

/**
 * Client-side fallback analyzer if backend analytics are not immediately present.
 */
export function analyzeSeekerDropoutClient(
  seeker: SeekerUser | Record<string, unknown>,
): SeekerOnboardingAnalytics {
  const isComplete = Boolean(seeker.onboardingComplete) || seeker.status === "active";
  const currentStep = (seeker.onboardingStep as string) || "category";

  const rawLastActive = (seeker.lastActive as string) || (seeker.joinedDate as string);
  const lastActiveTimestamp = rawLastActive ? new Date(rawLastActive).getTime() : Date.now();
  const elapsedMs = Math.max(0, Date.now() - (Number.isNaN(lastActiveTimestamp) ? Date.now() : lastActiveTimestamp));
  const idleMinutes = Math.floor(elapsedMs / (60 * 1000));
  const isIdleOverThreshold = idleMinutes >= DROPOUT_IDLE_MINUTES;

  const stepIndex = ORDERED_SEEKER_STEPS.findIndex((s) => s.id === currentStep);
  const activeIndex = stepIndex === -1 ? 0 : stepIndex;

  let submittedCount = 0;
  let skippedCount = 0;

  const steps: SeekerStepMetric[] = ORDERED_SEEKER_STEPS.map((stepDef, idx) => {
    let hasData = false;
    let valueSummary = "";
    let details = "";

    if (stepDef.id === "category") {
      const cat = (seeker.category as string) || (seeker.preferredCategory as string) || "";
      const topics = Array.isArray(seeker.topics) ? (seeker.topics as string[]) : [];
      hasData = Boolean(cat.trim());
      valueSummary = hasData ? cat.replace(/-/g, " ") : "Not selected";
      details = topics.length > 0 ? `Topics: ${topics.join(", ")}` : (hasData ? `Category: ${cat}` : "No category selected");
    } else if (stepDef.id === "needs") {
      const text = (seeker.needsText as string) || (seeker.profileBio as string) || "";
      const chips = Array.isArray(seeker.needChips) ? (seeker.needChips as string[]) : [];
      hasData = Boolean(text.trim()) || chips.length > 0;
      if (hasData) {
        valueSummary = text ? (text.length > 28 ? `${text.slice(0, 28)}...` : text) : `${chips.length} goals selected`;
        details = [text ? `Description: "${text}"` : "", chips.length ? `Chips: ${chips.join(", ")}` : ""].filter(Boolean).join(" | ");
      } else {
        valueSummary = "Skipped by user";
        details = "Section was skipped without specific goals";
      }
    } else if (stepDef.id === "format") {
      const formats = Array.isArray(seeker.formats) ? (seeker.formats as string[]) : [];
      hasData = formats.length > 0;
      valueSummary = hasData ? formats.join(", ") : "Skipped by user";
      details = hasData ? `Formats: ${formats.join(", ")}` : "No consultation formats specified";
    } else if (stepDef.id === "budget") {
      const budget = (seeker.budgetTier as string) || "";
      hasData = Boolean(budget.trim());
      valueSummary = hasData ? `${budget.charAt(0).toUpperCase() + budget.slice(1)} Tier` : "Skipped by user";
      details = hasData ? `Budget preference: ${budget}` : "No budget tier specified";
    } else if (stepDef.id === "personalisation") {
      const langs = Array.isArray(seeker.languages) ? (seeker.languages as string[]) : [];
      const loc = (seeker.location as string) || (seeker.city as string) || "";
      const extra = (seeker.additionalContext as string) || "";
      hasData = langs.length > 0 || Boolean(loc.trim()) || Boolean(extra.trim());
      if (hasData) {
        valueSummary = langs.length > 0 ? langs.join(", ") : (loc || "Preferences set");
        details = [langs.length ? `Languages: ${langs.join(", ")}` : "", loc ? `Location: ${loc}` : "", extra ? `Context: ${extra}` : ""].filter(Boolean).join(" | ");
      } else {
        valueSummary = "Skipped by user";
        details = "No personal preferences provided";
      }
    } else if (stepDef.id === "review") {
      hasData = isComplete;
      valueSummary = isComplete ? "Terms Accepted & Active" : "Pending final review";
      details = isComplete ? "Application finalized" : "Application not submitted yet";
    }

    let status: StepStatus = "pending";
    if (isComplete) {
      if (stepDef.id === "review" || hasData) {
        status = "submitted";
        submittedCount += 1;
      } else {
        status = "skipped";
        skippedCount += 1;
      }
    } else {
      if (idx < activeIndex) {
        if (hasData) {
          status = "submitted";
          submittedCount += 1;
        } else {
          status = "skipped";
          skippedCount += 1;
        }
      } else if (idx === activeIndex) {
        status = isIdleOverThreshold ? "dropout" : "in_progress";
      } else {
        status = "pending";
      }
    }

    return {
      id: stepDef.id,
      title: stepDef.title,
      subtitle: stepDef.subtitle,
      status,
      valueSummary,
      details,
    };
  });

  const completionPercent = isComplete
    ? 100
    : Math.round(((submittedCount + skippedCount) / ORDERED_SEEKER_STEPS.length) * 100);

  const isDropout = !isComplete && isIdleOverThreshold;
  const isActiveInProgress = !isComplete && !isIdleOverThreshold;
  const dropoutStep = !isComplete ? currentStep : null;
  const dropoutStepTitle = dropoutStep
    ? ORDERED_SEEKER_STEPS.find((s) => s.id === dropoutStep)?.title || dropoutStep
    : null;

  return {
    isComplete,
    isDropout,
    isActiveInProgress,
    dropoutStep,
    dropoutStepTitle,
    idleMinutes,
    lastActiveAt: new Date(lastActiveTimestamp).toISOString(),
    completionPercent,
    submittedCount,
    skippedCount,
    totalSteps: ORDERED_SEEKER_STEPS.length,
    steps,
  };
}

