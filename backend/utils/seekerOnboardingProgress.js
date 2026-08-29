export const SEEKER_ONBOARDING_STEPS = [
  'category',
  'needs',
  'format',
  'budget',
  'personalisation',
  'review',
];

export function hasCompletedSeekerStep(seeker, step) {
  switch (step) {
    case 'category':
      return Boolean(seeker.category?.trim());
    case 'needs':
      return Boolean(seeker.needsText?.trim()) || seeker.selectedNeedChips?.length > 0;
    case 'format':
      return seeker.selectedFormats?.length > 0;
    case 'budget':
      return Boolean(seeker.selectedBudget?.trim());
    case 'personalisation':
      return seeker.selectedLanguages?.length > 0
        || Boolean(seeker.location?.trim())
        || Boolean(seeker.additionalContext?.trim())
        || (Boolean(seeker.profilePhotoSrc?.trim())
          && !String(seeker.profilePhotoSrc).includes('manportrait'));
    case 'review':
      return Boolean(seeker.onboardingCompletedAt) || seeker.status === 'active';
    default:
      return false;
  }
}

export function getSeekerOnboardingProgress(seeker) {
  const completedSteps = SEEKER_ONBOARDING_STEPS.filter((step) =>
    hasCompletedSeekerStep(seeker, step));
  const onboardingComplete = completedSteps.includes('review');
  const currentStep = onboardingComplete ? null : seeker.onboardingStep || 'category';
  return { completedSteps, currentStep, resumeStep: currentStep, onboardingComplete };
}
