import { hasCompletedSeekerStep } from './seekerOnboardingProgress.js';

export const ORDERED_SEEKER_STEPS = [
  { id: 'category', title: 'Category', subtitle: 'Domain & Topics' },
  { id: 'needs', title: 'Needs & Goals', subtitle: 'Agenda & Context' },
  { id: 'format', title: 'Format', subtitle: 'Call, Chat, Review' },
  { id: 'budget', title: 'Budget Tier', subtitle: 'Rate Preference' },
  { id: 'personalisation', title: 'Preferences', subtitle: 'Languages & City' },
  { id: 'review', title: 'Review', subtitle: 'Submission & Terms' },
];

/**
 * 15-minute idle threshold to classify an incomplete onboarding as "dropped out".
 */
export const DROPOUT_IDLE_MINUTES = 15;

/**
 * Analyze a seeker record to determine step-by-step progress,
 * submitted sections, skipped sections, and exact dropout pointer.
 *
 * @param {object} seeker - Seeker Sequelize model or plain object
 * @returns {object} Analysis result
 */
export function analyzeSeekerDropout(seeker) {
  if (!seeker) {
    return {
      isComplete: false,
      isDropout: false,
      isActiveInProgress: false,
      dropoutStep: null,
      dropoutStepTitle: null,
      idleMinutes: 0,
      completionPercent: 0,
      submittedCount: 0,
      skippedCount: 0,
      steps: [],
    };
  }

  const data = typeof seeker.toJSON === 'function' ? seeker.toJSON() : seeker;
  const isComplete = Boolean(data.onboardingCompletedAt) || data.status === 'active';
  const currentStep = data.onboardingStep || 'category';

  // Calculate elapsed idle time since last activity
  const lastActiveTimestamp = new Date(data.updatedAt || data.lastActive || data.createdAt || Date.now()).getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - lastActiveTimestamp);
  const idleMinutes = Math.floor(elapsedMs / (60 * 1000));
  const isIdleOverThreshold = idleMinutes >= DROPOUT_IDLE_MINUTES;

  // Determine current step index in the funnel
  const stepIndex = ORDERED_SEEKER_STEPS.findIndex((s) => s.id === currentStep);
  const activeIndex = stepIndex === -1 ? 0 : stepIndex;

  let submittedCount = 0;
  let skippedCount = 0;

  const steps = ORDERED_SEEKER_STEPS.map((stepDef, idx) => {
    const hasData = hasCompletedSeekerStep(data, stepDef.id);
    let status = 'pending';
    let valueSummary = '';
    let details = '';

    // Value summarization per step
    if (stepDef.id === 'category') {
      const cat = data.category || data.preferredCategory || '';
      const topics = Array.isArray(data.topics) ? data.topics : [];
      if (cat) {
        valueSummary = cat.replace(/-/g, ' ');
        details = topics.length > 0 ? `Category: ${cat} | Topics: ${topics.join(', ')}` : `Category: ${cat}`;
      } else {
        valueSummary = 'Not selected';
        details = 'No category selected';
      }
    } else if (stepDef.id === 'needs') {
      const text = data.needsText ? data.needsText.trim() : (data.profileBio ? data.profileBio.trim() : '');
      const chips = Array.isArray(data.selectedNeedChips)
        ? data.selectedNeedChips
        : (Array.isArray(data.needChips) ? data.needChips : []);
      if (text || chips.length > 0) {
        valueSummary = text ? (text.length > 28 ? `${text.slice(0, 28)}...` : text) : `${chips.length} goals selected`;
        details = [text ? `Description: "${text}"` : '', chips.length ? `Chips: ${chips.join(', ')}` : ''].filter(Boolean).join(' | ');
      } else {
        valueSummary = 'Skipped by user';
        details = 'Section was skipped without specific goals';
      }
    } else if (stepDef.id === 'format') {
      const formats = Array.isArray(data.selectedFormats)
        ? data.selectedFormats
        : (Array.isArray(data.formats) ? data.formats : []);
      if (formats.length > 0) {
        valueSummary = formats.join(', ');
        details = `Selected formats: ${formats.join(', ')}`;
      } else {
        valueSummary = 'Skipped by user';
        details = 'No consultation formats specified';
      }
    } else if (stepDef.id === 'budget') {
      const budget = data.selectedBudget || data.budgetTier || '';
      if (budget) {
        valueSummary = `${budget.charAt(0).toUpperCase() + budget.slice(1)} Tier`;
        details = `Budget preference: ${budget}`;
      } else {
        valueSummary = 'Skipped by user';
        details = 'No budget tier specified';
      }
    } else if (stepDef.id === 'personalisation') {
      const langs = Array.isArray(data.selectedLanguages)
        ? data.selectedLanguages
        : (Array.isArray(data.languages) ? data.languages : []);
      const loc = data.location || data.city || '';
      const extra = data.additionalContext || '';
      if (langs.length > 0 || loc || extra) {
        valueSummary = langs.length > 0 ? langs.join(', ') : (loc || 'Custom context');
        details = [langs.length ? `Languages: ${langs.join(', ')}` : '', loc ? `Location: ${loc}` : '', extra ? `Context: ${extra}` : ''].filter(Boolean).join(' | ');
      } else {
        valueSummary = 'Skipped by user';
        details = 'No personal preferences provided';
      }
    } else if (stepDef.id === 'review') {
      if (isComplete) {
        valueSummary = 'Terms Accepted & Active';
        details = data.onboardingCompletedAt ? `Completed on ${new Date(data.onboardingCompletedAt).toLocaleDateString('en-IN')}` : 'Application finalized';
      } else {
        valueSummary = 'Pending final review';
        details = 'Application not submitted yet';
      }
    }

    // Step status assignment
    if (isComplete) {
      if (stepDef.id === 'review' || hasData) {
        status = 'submitted';
        submittedCount += 1;
      } else {
        status = 'skipped';
        skippedCount += 1;
      }
    } else {
      if (idx < activeIndex) {
        if (hasData) {
          status = 'submitted';
          submittedCount += 1;
        } else {
          status = 'skipped';
          skippedCount += 1;
        }
      } else if (idx === activeIndex) {
        if (isIdleOverThreshold) {
          status = 'dropout';
        } else {
          status = 'in_progress';
        }
      } else {
        status = 'pending';
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

