import type { AuthUser } from "@/lib/api";
import { EXPERT_ONBOARDING_STEPS } from "@/components/expert/onboarding/OnboardingProgressBar";

export type OnboardingPhase = "signup" | "onboarding" | "submitted" | "approved" | "rejected";

export type OnboardingStepLabel = {
  id: string;
  label: string;
  complete: boolean;
  current: boolean;
};

export type ExpertAccountStatus = {
  phase: OnboardingPhase;
  headline: string;
  description: string;
  progressPercent: number;
  currentStepLabel: string | null;
  pendingSteps: OnboardingStepLabel[];
  applicationStatus: string;
  canContinueOnboarding: boolean;
  continueLabel: string;
};

const ONBOARDING_STEP_LABELS: Record<(typeof EXPERT_ONBOARDING_STEPS)[number], string> = {
  category: "Expert category",
  skills: "Skills & expertise",
  experience: "Work experience",
  identity: "Profile identity",
  credentials: "Credentials & KYC",
  preferences: "Consultation preferences",
  audience: "Target audience",
  availability: "Availability schedule",
  review: "Review & submit",
};

const ONBOARDING_STEP_ORDER = [...EXPERT_ONBOARDING_STEPS];

function stepIndex(step: string): number {
  const idx = ONBOARDING_STEP_ORDER.indexOf(step as (typeof ONBOARDING_STEP_ORDER)[number]);
  return idx >= 0 ? idx : 0;
}

export function buildExpertAccountStatus(user: AuthUser): ExpertAccountStatus {
  const onboardingStep = user.onboardingStep || "category";
  const status = user.status || "draft";

  if (status === "approved" && onboardingStep === "success") {
    return {
      phase: "approved",
      headline: "Your expert profile is live",
      description: "Your application was approved. You can manage sessions from your dashboard.",
      progressPercent: 100,
      currentStepLabel: null,
      pendingSteps: [],
      applicationStatus: "Approved",
      canContinueOnboarding: false,
      continueLabel: "Go to dashboard",
    };
  }

  if (status === "rejected") {
    return {
      phase: "rejected",
      headline: "Application not approved",
      description: "Your expert application was reviewed and not approved at this time.",
      progressPercent: 100,
      currentStepLabel: null,
      pendingSteps: [],
      applicationStatus: "Rejected",
      canContinueOnboarding: false,
      continueLabel: "Contact support",
    };
  }

  if (onboardingStep === "success" || user.onboardingComplete === true) {
    return {
      phase: "submitted",
      headline: "Application under review",
      description: "You completed onboarding. Our team is reviewing your profile and documents.",
      progressPercent: 100,
      currentStepLabel: null,
      pendingSteps: [
        { id: "account", label: "Account created", complete: true, current: false },
        { id: "profile", label: "Profile & credentials submitted", complete: true, current: false },
        { id: "review", label: "Under review by team", complete: false, current: true },
      ],
      applicationStatus: "Pending review",
      canContinueOnboarding: false,
      continueLabel: "Go to dashboard",
    };
  }

  const currentIdx = stepIndex(onboardingStep);
  const pendingSteps: OnboardingStepLabel[] = ONBOARDING_STEP_ORDER.map((step, index) => ({
    id: step,
    label: ONBOARDING_STEP_LABELS[step],
    complete: index < currentIdx,
    current: step === onboardingStep,
  }));

  const completedCount = pendingSteps.filter((s) => s.complete).length;
  const progressPercent = Math.round((completedCount / ONBOARDING_STEP_ORDER.length) * 100);
  const currentLabel =
    ONBOARDING_STEP_LABELS[onboardingStep as keyof typeof ONBOARDING_STEP_LABELS] ?? "Profile setup";

  return {
    phase: "onboarding",
    headline: completedCount === 0 ? "Complete your expert profile" : "Continue your expert profile",
    description:
      completedCount === 0
        ? "Your account is verified. Finish the steps below to submit your application for review."
        : `You left off at "${currentLabel}". Pick up where you stopped or review completed sections.`,
    progressPercent,
    currentStepLabel: currentLabel,
    pendingSteps,
    applicationStatus: "Draft — onboarding in progress",
    canContinueOnboarding: true,
    continueLabel: completedCount === 0 ? "Start onboarding" : "Continue onboarding",
  };
}

export { isDuplicateRegistrationMessage } from "@/lib/authUtils";
