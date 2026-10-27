export function getExpertOnboardingStepCompletion(
  currentValidity: readonly boolean[],
  emptyOptionalSteps: readonly boolean[],
  savedStepCompletion: readonly boolean[],
  liveStepCompletion: readonly boolean[],
): boolean[] {
  const optionalSteps = new Set([2, 3, 4, 5, 8]);

  return currentValidity.map((isValid, index) => {
    const stepNumber = index + 1;
    const wasPassed =
      savedStepCompletion[index] === true || liveStepCompletion[index] === true;
    return isValid || (
      optionalSteps.has(stepNumber) &&
      emptyOptionalSteps[index] === true &&
      wasPassed
    );
  });
}

export function canNavigateToOnboardingStep(
  targetStep: number,
  currentStep: number,
  stepCompletion: readonly boolean[],
): boolean {
  if (
    !Number.isInteger(targetStep) ||
    targetStep < 1 ||
    targetStep > stepCompletion.length ||
    targetStep === currentStep
  ) {
    return false;
  }

  const lastRequiredStep = targetStep === stepCompletion.length
    ? targetStep - 1
    : targetStep;

  for (let step = 1; step <= lastRequiredStep; step += 1) {
    if (stepCompletion[step - 1] !== true) return false;
  }

  return true;
}
