export const SEEKER_ONBOARDING_STEPS = [
  "category",
  "needs",
  "format",
  "budget",
  "personalisation",
  "review",
] as const;

export type SeekerOnboardingStepKey = (typeof SEEKER_ONBOARDING_STEPS)[number];

export const SEEKER_ONBOARDING_TOTAL = SEEKER_ONBOARDING_STEPS.length;

export function formatSeekerStepLabel(stepNumber: number): string {
  return `${stepNumber}/${SEEKER_ONBOARDING_TOTAL}`;
}

export function getSeekerStepNumber(step: SeekerOnboardingStepKey): number {
  return SEEKER_ONBOARDING_STEPS.indexOf(step) + 1;
}

export type SeekerProgressData = Record<
  Exclude<SeekerOnboardingStepKey, "review">,
  boolean
>;

export function buildSeekerProgressCompletion(
  activeStep: SeekerOnboardingStepKey | "success",
  dataCompletion: SeekerProgressData,
): Record<SeekerOnboardingStepKey, boolean> {
  const isSuccess = activeStep === "success";

  return SEEKER_ONBOARDING_STEPS.reduce(
    (acc, stepKey) => {
      if (stepKey === "review") {
        acc[stepKey] = isSuccess || activeStep === "review";
        return acc;
      }

      acc[stepKey] = dataCompletion[stepKey];
      return acc;
    },
    {} as Record<SeekerOnboardingStepKey, boolean>,
  );
}

export function isSeekerOnboardingStep(
  step: string,
): step is SeekerOnboardingStepKey {
  return (SEEKER_ONBOARDING_STEPS as readonly string[]).includes(step);
}
