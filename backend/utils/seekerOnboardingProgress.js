export const SEEKER_ONBOARDING_STEPS = [
  'category',
  'needs',
  'format',
  'budget',
  'personalisation',
  'review',
];

export function hasCompletedSeekerStep(seeker, step) {
  if (!seeker) return false;
  switch (step) {
    case 'category':
      return Boolean(seeker.category?.trim() || seeker.preferredCategory?.trim());
    case 'needs':
      return Boolean(seeker.needsText?.trim() || seeker.profileBio?.trim())
        || (Array.isArray(seeker.selectedNeedChips) && seeker.selectedNeedChips.length > 0)
        || (Array.isArray(seeker.needChips) && seeker.needChips.length > 0);
    case 'format':
      return (Array.isArray(seeker.selectedFormats) && seeker.selectedFormats.length > 0)
        || (Array.isArray(seeker.formats) && seeker.formats.length > 0);
    case 'budget':
      return Boolean(seeker.selectedBudget?.trim() || seeker.budgetTier?.trim());
    case 'personalisation':
      return (Array.isArray(seeker.selectedLanguages) && seeker.selectedLanguages.length > 0)
        || (Array.isArray(seeker.languages) && seeker.languages.length > 0)
        || Boolean(seeker.location?.trim() || seeker.city?.trim())
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
