/**
 * Utility for analyzing Expert onboarding progress, section submission/skips,
 * dropout detection (with 15-minute idle threshold), and synthesizing
 * end-to-end onboarding milestone logs for the admin review timeline.
 */

export const REVIEW_SECTIONS_DEF = [
  { id: 'category', title: 'Category & Skills' },
  { id: 'experience', title: 'Experience & Portfolio' },
  { id: 'profile', title: 'Profile Details' },
  { id: 'credentials', title: 'Credentials & KYC' },
  { id: 'preferences', title: 'Consultation Preferences' },
  { id: 'audience', title: 'Audience & Languages' },
  { id: 'availability', title: 'Availability' },
];

/**
 * 15-minute idle threshold to classify an incomplete application as "dropped out".
 */
export const DROPOUT_IDLE_MINUTES = 15;

/**
 * Map onboarding wizard steps to the 7 admin review sections.
 */
export function mapWizardStepToReviewSection(wizardStep) {
  if (!wizardStep) return 'category';
  const step = String(wizardStep).toLowerCase();
  switch (step) {
    case 'category':
    case 'skills':
      return 'category';
    case 'experience':
      return 'experience';
    case 'identity':
    case 'profile':
      return 'profile';
    case 'credentials':
    case 'kyc':
      return 'credentials';
    case 'preferences':
    case 'pricing':
      return 'preferences';
    case 'audience':
    case 'languages':
      return 'audience';
    case 'availability':
    case 'schedule':
      return 'availability';
    case 'review':
    case 'success':
    case 'completed':
      return 'completed';
    default:
      return 'category';
  }
}

/**
 * Check if a specific review section has submitted data.
 */
export function hasExpertSectionData(data, sectionId) {
  if (!data || typeof data !== 'object') return false;

  const metadata = data.onboardingMetadata || {};

  switch (sectionId) {
    case 'category': {
      const category = data.category || data.primaryCategory || metadata.primaryCategory || data.categoryLabel;
      const skills = Array.isArray(data.skills)
        ? data.skills
        : (Array.isArray(metadata.skills) ? metadata.skills : []);
      return Boolean(category && String(category).trim()) || skills.length > 0;
    }

    case 'experience': {
      const jobs = Array.isArray(data.employmentPositions)
        ? data.employmentPositions
        : (Array.isArray(metadata.employmentPositions) ? metadata.employmentPositions : []);
      const degrees = Array.isArray(data.educationDegrees)
        ? data.educationDegrees
        : (Array.isArray(metadata.educationDegrees) ? metadata.educationDegrees : []);
      const portfolio = data.portfolio || data.portfolioUrl || metadata.portfolio || '';
      const hasValidJob = jobs.some((j) => (j.company && j.company.trim()) || (j.jobTitle && j.jobTitle.trim()));
      const hasValidDegree = degrees.some((d) => (d.degree && d.degree.trim()) || (d.institution && d.institution.trim()));
      return hasValidJob || hasValidDegree || Boolean(String(portfolio).trim());
    }

    case 'profile': {
      const title = data.professionalTitle || metadata.professionalTitle || '';
      const bio = data.bio || metadata.bio || '';
      const tagLine = data.tagLine || metadata.tagLine || '';
      const photo = data.profilePhotoSrc || data.avatar || metadata.profilePhotoSrc || '';
      return Boolean(title.trim() || bio.trim() || tagLine.trim() || photo);
    }

    case 'credentials': {
      const certs = Array.isArray(data.certificates)
        ? data.certificates
        : (Array.isArray(metadata.certificates) ? metadata.certificates : []);
      const govId = data.governmentId || metadata.governmentId;
      const digilocker = Array.isArray(data.digilockerDocuments)
        ? data.digilockerDocuments
        : (Array.isArray(metadata.digilockerDocuments) ? metadata.digilockerDocuments : []);
      return certs.length > 0 || Boolean(govId && (govId.front || govId.type)) || digilocker.length > 0;
    }

    case 'preferences': {
      const formats = Array.isArray(data.selectedFormats)
        ? data.selectedFormats
        : (Array.isArray(data.formats) ? data.formats : (Array.isArray(metadata.selectedFormats) ? metadata.selectedFormats : []));
      const prices = data.formatPrices || metadata.formatPrices;
      const hasPrice = prices && typeof prices === 'object' && Object.values(prices).some((p) => p && (Number(p) > 0 || (typeof p === 'object' && Object.values(p).some((v) => Number(v) > 0))));
      return formats.length > 0 || hasPrice;
    }

    case 'audience': {
      const audience = data.targetAudience || metadata.targetAudience || '';
      const focus = Array.isArray(data.focusAreas)
        ? data.focusAreas
        : (Array.isArray(metadata.focusAreas) ? metadata.focusAreas : []);
      const langs = Array.isArray(data.languages)
        ? data.languages
        : (Array.isArray(metadata.languages) ? metadata.languages : []);
      const audiences = Array.isArray(data.audiences)
        ? data.audiences
        : (Array.isArray(metadata.audiences) ? metadata.audiences : []);
      return Boolean(audience.trim()) || focus.length > 0 || langs.length > 0 || audiences.length > 0;
    }

    case 'availability': {
      const slots = Array.isArray(data.availabilitySlots)
        ? data.availabilitySlots
        : (Array.isArray(metadata.availabilitySlots) ? metadata.availabilitySlots : (Array.isArray(data.availability) ? data.availability : []));
      const timezone = data.timezone || metadata.timezone;
      const hasSlotWithDays = slots.some((s) => Array.isArray(s.days) && s.days.length > 0);
      return hasSlotWithDays || Boolean(timezone);
    }

    default:
      return false;
  }
}

/**
 * Generate a brief value summary for a review section.
 */
export function getSectionValueSummary(data, sectionId) {
  if (!data || typeof data !== 'object') return '';
  const metadata = data.onboardingMetadata || {};

  switch (sectionId) {
    case 'category': {
      const cat = data.category || data.primaryCategory || metadata.primaryCategory || data.categoryLabel || '';
      const skills = Array.isArray(data.skills) ? data.skills : (Array.isArray(metadata.skills) ? metadata.skills : []);
      if (cat || skills.length > 0) {
        return [cat, skills.length > 0 ? `${skills.length} skills` : ''].filter(Boolean).join(' · ');
      }
      return 'Not provided';
    }

    case 'experience': {
      const jobs = Array.isArray(data.employmentPositions) ? data.employmentPositions : (Array.isArray(metadata.employmentPositions) ? metadata.employmentPositions : []);
      const degrees = Array.isArray(data.educationDegrees) ? data.educationDegrees : (Array.isArray(metadata.educationDegrees) ? metadata.educationDegrees : []);
      const portfolio = data.portfolio || data.portfolioUrl || metadata.portfolio || '';
      const parts = [];
      if (jobs.length > 0) parts.push(`${jobs.length} role${jobs.length > 1 ? 's' : ''}`);
      if (degrees.length > 0) parts.push(`${degrees.length} degree${degrees.length > 1 ? 's' : ''}`);
      if (portfolio) parts.push('Portfolio linked');
      return parts.length > 0 ? parts.join(' · ') : 'Skipped by applicant';
    }

    case 'profile': {
      const title = data.professionalTitle || metadata.professionalTitle || '';
      const tagLine = data.tagLine || metadata.tagLine || '';
      return title || tagLine || (data.bio ? 'Bio provided' : 'Profile configured');
    }

    case 'credentials': {
      const certs = Array.isArray(data.certificates) ? data.certificates : (Array.isArray(metadata.certificates) ? metadata.certificates : []);
      const govId = data.governmentId || metadata.governmentId;
      const digilocker = Array.isArray(data.digilockerDocuments) ? data.digilockerDocuments : (Array.isArray(metadata.digilockerDocuments) ? metadata.digilockerDocuments : []);
      const parts = [];
      if (govId) parts.push('ID Verified');
      if (certs.length > 0) parts.push(`${certs.length} cert${certs.length > 1 ? 's' : ''}`);
      if (digilocker.length > 0) parts.push(`${digilocker.length} DigiLocker doc${digilocker.length > 1 ? 's' : ''}`);
      return parts.length > 0 ? parts.join(' · ') : 'Skipped by applicant';
    }

    case 'preferences': {
      const formats = Array.isArray(data.selectedFormats) ? data.selectedFormats : (Array.isArray(data.formats) ? data.formats : (Array.isArray(metadata.selectedFormats) ? metadata.selectedFormats : []));
      return formats.length > 0 ? `${formats.length} formats enabled` : 'Preferences configured';
    }

    case 'audience': {
      const langs = Array.isArray(data.languages) ? data.languages : (Array.isArray(metadata.languages) ? metadata.languages : []);
      const audiences = Array.isArray(data.audiences) ? data.audiences : (Array.isArray(metadata.audiences) ? metadata.audiences : []);
      const parts = [];
      if (audiences.length > 0) parts.push(`${audiences.length} audience groups`);
      if (langs.length > 0) parts.push(langs.join(', '));
      return parts.length > 0 ? parts.join(' · ') : (data.targetAudience || 'Audience defined');
    }

    case 'availability': {
      const slots = Array.isArray(data.availabilitySlots) ? data.availabilitySlots : (Array.isArray(metadata.availabilitySlots) ? metadata.availabilitySlots : (Array.isArray(data.availability) ? data.availability : []));
      const activeDays = new Set();
      slots.forEach((s) => {
        if (Array.isArray(s.days)) s.days.forEach((d) => activeDays.add(d));
      });
      return activeDays.size > 0 ? `${activeDays.size} days/week available` : (data.timezone || 'Schedule set');
    }

    default:
      return '';
  }
}

/**
 * Calculates onboarding completion percentage divided into 8 parts:
 * - 2 parts for Category & Skills (1 part for primary category, 1 part for expertise skills)
 * - 6 parts each for the remaining sections (experience, profile, credentials, preferences, audience, availability)
 * The percentage increases ONLY if a section is filled and submitted (not in case of skipped, dropout, or in progress).
 *
 * @param {object} data - Expert data object
 * @param {Array<object>} steps - Analyzed steps array
 * @returns {number} Integer percentage from 0 to 100
 */
export function calculateExpertCompletionPercent(data, steps) {
  if (!data || !Array.isArray(steps)) return 0;
  let earnedParts = 0;
  const metadata = data.onboardingMetadata || {};

  // Part 1 & 2: Category & Skills (2 parts: 1 for primary category, 1 for expertise skills)
  const categoryStep = steps.find((s) => s.id === 'category');
  if (categoryStep && categoryStep.status === 'submitted') {
    const primaryCategory = data.category || data.primaryCategory || metadata.primaryCategory || data.categoryLabel;
    if (primaryCategory && String(primaryCategory).trim()) {
      earnedParts += 1;
    }
    const skills = Array.isArray(data.skills)
      ? data.skills
      : (Array.isArray(metadata.skills) ? metadata.skills : []);
    if (skills.length > 0) {
      earnedParts += 1;
    }
  }

  // Parts 3 to 8: Remaining 6 sections (1 part each)
  const remainingSectionIds = ['experience', 'profile', 'credentials', 'preferences', 'audience', 'availability'];
  for (const secId of remainingSectionIds) {
    const step = steps.find((s) => s.id === secId);
    if (step && step.status === 'submitted' && hasExpertSectionData(data, secId)) {
      earnedParts += 1;
    }
  }

  return Math.round((earnedParts / 8) * 100);
}

/**
 * Analyzes an expert record and produces step-by-step progress,
 * submitted/skipped status, and dropout detection.
 *
 * @param {object} expert - Sequelize model or plain object
 * @returns {object} Analysis result
 */
export function analyzeExpertSections(expert) {
  if (!expert) {
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
      totalSteps: REVIEW_SECTIONS_DEF.length,
      steps: [],
    };
  }

  const data = typeof expert.toJSON === 'function' ? expert.toJSON() : expert;
  const status = data.status || 'draft';
  const hasSubmitted = Boolean(data.submittedAt) || status === 'approved' || status === 'pending' || status === 'in_review' || status === 'on_hold' || status === 'rejected';
  const rawWizardStep = data.onboardingStep || 'category';
  const currentSectionId = mapWizardStepToReviewSection(rawWizardStep);

  const lastActiveTimestamp = new Date(data.updatedAt || data.lastActive || data.createdAt || Date.now()).getTime();
  const now = Date.now();
  const elapsedMs = Math.max(0, now - lastActiveTimestamp);
  const idleMinutes = Math.floor(elapsedMs / (60 * 1000));
  const isIdleOverThreshold = idleMinutes >= DROPOUT_IDLE_MINUTES;

  const currentSectionIndex = currentSectionId === 'completed'
    ? REVIEW_SECTIONS_DEF.length
    : REVIEW_SECTIONS_DEF.findIndex((s) => s.id === currentSectionId);
  const activeIndex = currentSectionIndex === -1 ? 0 : currentSectionIndex;

  const isComplete = hasSubmitted || currentSectionId === 'completed';
  const isDropout = !isComplete && isIdleOverThreshold;
  const isActiveInProgress = !isComplete && !isIdleOverThreshold;

  let submittedCount = 0;
  let skippedCount = 0;

  const steps = REVIEW_SECTIONS_DEF.map((secDef, idx) => {
    const hasData = hasExpertSectionData(data, secDef.id);
    const valueSummary = getSectionValueSummary(data, secDef.id);
    let stepStatus = 'pending';

    if (isComplete) {
      if (hasData) {
        stepStatus = 'submitted';
        submittedCount += 1;
      } else {
        stepStatus = 'skipped';
        skippedCount += 1;
      }
    } else {
      if (idx < activeIndex) {
        if (hasData) {
          stepStatus = 'submitted';
          submittedCount += 1;
        } else {
          stepStatus = 'skipped';
          skippedCount += 1;
        }
      } else if (idx === activeIndex) {
        if (isDropout) {
          stepStatus = 'dropout';
        } else {
          stepStatus = 'in_progress';
        }
      } else {
        stepStatus = 'pending';
      }
    }

    return {
      id: secDef.id,
      title: secDef.title,
      status: stepStatus,
      valueSummary,
    };
  });

  const totalSteps = REVIEW_SECTIONS_DEF.length;
  const completionPercent = calculateExpertCompletionPercent(data, steps);

  const dropoutStepObj = steps.find((s) => s.status === 'dropout');
  const inProgressStepObj = steps.find((s) => s.status === 'in_progress');

  return {
    isComplete,
    isDropout,
    isActiveInProgress,
    dropoutStep: dropoutStepObj?.id || (isDropout ? (REVIEW_SECTIONS_DEF[activeIndex]?.id || null) : null),
    dropoutStepTitle: dropoutStepObj?.title || (isDropout ? (REVIEW_SECTIONS_DEF[activeIndex]?.title || null) : null),
    activeStep: inProgressStepObj?.id || (isActiveInProgress ? (REVIEW_SECTIONS_DEF[activeIndex]?.id || null) : null),
    activeStepTitle: inProgressStepObj?.title || (isActiveInProgress ? (REVIEW_SECTIONS_DEF[activeIndex]?.title || null) : null),
    idleMinutes,
    completionPercent,
    submittedCount,
    skippedCount,
    totalSteps,
    steps,
  };
}

/**
 * Synthesizes chronological timeline milestone logs from account verification
 * through section submissions, skips, dropouts, and application submission.
 *
 * @param {object} expert - Plain expert object or Sequelize model
 * @param {object} analytics - Precomputed analytics from analyzeExpertSections
 * @returns {Array<object>} Synthesized milestone logs
 */
export function synthesizeOnboardingMilestoneLogs(expert, analytics = null) {
  if (!expert) return [];
  const data = typeof expert.toJSON === 'function' ? expert.toJSON() : expert;
  const analysis = analytics || analyzeExpertSections(data);

  const milestones = [];
  const actor = {
    id: data.id || null,
    name: data.fullName || data.name || 'Applicant',
    role: 'Applicant',
  };

  const baseCreatedTime = data.createdAt ? new Date(data.createdAt).getTime() : Date.now() - 3600000;
  const submittedTime = data.submittedAt ? new Date(data.submittedAt).getTime() : null;
  const updatedTime = data.updatedAt ? new Date(data.updatedAt).getTime() : baseCreatedTime;

  // 1. Account Created & Verified
  milestones.push({
    id: `milestone-account-verified-${data.id || 'new'}`,
    sectionId: 'account',
    sectionTitle: 'Account Verification',
    action: 'account_verified',
    badgeLabel: 'VERIFIED',
    note: `Email (${data.email || 'linked'}) and phone (${data.phone || 'verified'}) verified via OTP.`,
    actor,
    timestamp: new Date(baseCreatedTime).toISOString(),
    previousDecision: null,
    newDecision: null,
  });

  // 2. Section submissions and skips
  const totalSteps = analysis.steps.length;
  const timeSpan = (submittedTime || updatedTime) - baseCreatedTime;
  const stepTimeDelta = totalSteps > 0 && timeSpan > 0 ? Math.floor(timeSpan / (totalSteps + 1)) : 60000;

  analysis.steps.forEach((step, idx) => {
    const stepTimestamp = new Date(baseCreatedTime + stepTimeDelta * (idx + 1)).toISOString();

    if (step.status === 'submitted') {
      milestones.push({
        id: `milestone-sec-${step.id}-submitted`,
        sectionId: step.id,
        sectionTitle: step.title,
        action: 'section_submitted',
        badgeLabel: 'SUBMITTED',
        note: `Completed ${step.title}: ${step.valueSummary}.`,
        actor,
        timestamp: stepTimestamp,
        previousDecision: null,
        newDecision: null,
      });
    } else if (step.status === 'skipped') {
      milestones.push({
        id: `milestone-sec-${step.id}-skipped`,
        sectionId: step.id,
        sectionTitle: step.title,
        action: 'section_skipped',
        badgeLabel: 'SKIPPED',
        note: `Skipped ${step.title} during onboarding wizard.`,
        actor,
        timestamp: stepTimestamp,
        previousDecision: null,
        newDecision: null,
      });
    }
  });

  // 3. Dropout event (if incomplete and idle >= 15 min)
  if (analysis.isDropout && analysis.dropoutStep) {
    milestones.push({
      id: `milestone-dropout-${analysis.dropoutStep}`,
      sectionId: analysis.dropoutStep,
      sectionTitle: analysis.dropoutStepTitle || analysis.dropoutStep,
      action: 'dropout',
      badgeLabel: 'DROPPED OUT',
      note: `Applicant dropped out at ${analysis.dropoutStepTitle || analysis.dropoutStep} step (${analysis.idleMinutes}m of inactivity).`,
      actor,
      timestamp: new Date(updatedTime).toISOString(),
      previousDecision: null,
      newDecision: null,
    });
  }

  // 4. Application submitted for review
  if (data.submittedAt) {
    milestones.push({
      id: `milestone-app-submitted-${data.id || 'app'}`,
      sectionId: 'application',
      sectionTitle: 'Application Overall',
      action: 'application_submitted',
      badgeLabel: 'SUBMITTED FOR REVIEW',
      note: 'Expert onboarding completed. Application submitted for admin review.',
      actor,
      timestamp: new Date(data.submittedAt).toISOString(),
      previousDecision: null,
      newDecision: null,
    });
  }

  return milestones;
}

