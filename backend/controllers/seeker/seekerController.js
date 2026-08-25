import { Seeker, SeekerCreditTransaction, seekerDb } from '../../models/index.js';
import {
  AiNotConfiguredError,
  improveSeekerNeedsCopy,
} from '../../utils/aiService.js';
import { triggerNotification } from '../../utils/templateNotificationService.js';
import { getSetting } from '../../utils/settingsHelper.js';


const ONBOARDING_STEPS = new Set([
  'category',
  'needs',
  'format',
  'budget',
  'personalisation',
  'review',
]);

const ARRAY_FIELDS = ['topics', 'selectedNeedChips', 'selectedFormats', 'selectedLanguages'];
const STRING_FIELDS = [
  'category',
  'needsText',
  'selectedBudget',
  'location',
  'additionalContext',
  'profilePhotoSrc',
];

const NEXT_STEP_TO_COMPLETED_STEP = {
  needs: 'category',
  format: 'needs',
  budget: 'format',
  personalisation: 'budget',
  review: 'personalisation',
};

function getStepCreditAmount() {
  const configuredAmount = Number.parseInt(process.env.SEEKER_ONBOARDING_STEP_CREDITS || '', 10);
  return Number.isSafeInteger(configuredAmount) && configuredAmount >= 0 ? configuredAmount : 5;
}

function parseJsonField(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeStringArray(value) {
  const parsed = parseJsonField(value);
  if (!Array.isArray(parsed)) return parsed;
  return [...new Set(parsed.map(normalizeString).filter(Boolean))];
}

function parseOnboardingPayload(body = {}) {
  const source = {
    ...body,
    category: body.category ?? body.selectedCategory,
    topics: body.topics ?? body.selectedTopics,
  };
  const payload = {};

  for (const field of STRING_FIELDS) {
    if (source[field] !== undefined) payload[field] = normalizeString(source[field]);
  }

  for (const field of ARRAY_FIELDS) {
    if (source[field] !== undefined) payload[field] = normalizeStringArray(source[field]);
  }

  if (source.onboardingMetadata !== undefined) {
    payload.onboardingMetadata = parseJsonField(source.onboardingMetadata);
  }

  if (source.step !== undefined) payload.step = normalizeString(source.step);
  return payload;
}

function validatePayloadTypes(payload) {
  const errors = [];

  for (const field of STRING_FIELDS) {
    if (payload[field] !== undefined && typeof payload[field] !== 'string') {
      errors.push(`${field} must be a string`);
    }
  }

  for (const field of ARRAY_FIELDS) {
    if (payload[field] !== undefined && !Array.isArray(payload[field])) {
      errors.push(`${field} must be an array of strings`);
    } else if (payload[field]?.some((value) => typeof value !== 'string')) {
      errors.push(`${field} must contain only strings`);
    }
  }

  if (
    payload.onboardingMetadata !== undefined
    && (payload.onboardingMetadata === null
      || Array.isArray(payload.onboardingMetadata)
      || typeof payload.onboardingMetadata !== 'object')
  ) {
    errors.push('onboardingMetadata must be an object');
  }

  if (payload.step !== undefined && !ONBOARDING_STEPS.has(payload.step)) {
    errors.push('step is invalid');
  }

  if (payload.needsText?.length > 1000) errors.push('needsText must not exceed 1000 characters');
  if (payload.additionalContext?.length > 5000) {
    errors.push('additionalContext must not exceed 5000 characters');
  }
  if (payload.topics?.length > 5) errors.push('topics must not contain more than 5 items');

  return errors;
}

function applyOnboardingPayload(seeker, payload, profilePhotoPath) {
  for (const field of [...STRING_FIELDS, ...ARRAY_FIELDS]) {
    if (payload[field] !== undefined) seeker[field] = payload[field];
  }

  if (payload.onboardingMetadata !== undefined) {
    seeker.onboardingMetadata = {
      ...(seeker.onboardingMetadata || {}),
      ...payload.onboardingMetadata,
    };
  }

  if (profilePhotoPath) seeker.profilePhotoSrc = profilePhotoPath;
  if (payload.step) seeker.onboardingStep = payload.step;
}

function hasCompletedStep(seeker, step) {
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
      return seeker.selectedLanguages?.length > 0;
    case 'review':
      return true;
    default:
      return false;
  }
}

async function rewardOnboardingStep(seeker, step, transaction) {
  if (!step || !hasCompletedStep(seeker, step)) return null;

  const amount = getStepCreditAmount();
  const balanceAfter = Number(seeker.credits || 0) + amount;
  const [creditTransaction, created] = await SeekerCreditTransaction.findOrCreate({
    where: {
      seekerId: seeker.id,
      source: 'onboarding',
      reference: step,
    },
    defaults: {
      amount,
      balanceAfter,
      type: 'credit',
      description: `Completed ${step} onboarding step`,
      metadata: { step },
    },
    transaction,
  });

  if (!created) return null;

  seeker.credits = balanceAfter;
  return {
    id: creditTransaction.id,
    step,
    amount,
    balanceAfter,
  };
}

function serializeSeeker(seeker) {
  const data = seeker.toJSON();
  delete data.password;
  return data;
}

export const getProfile = async (req, res) => {
  const seekerId = req.user.id;

  try {
    const seeker = await Seeker.findByPk(seekerId);

    if (!seeker) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    return res.status(200).json(serializeSeeker(seeker));
  } catch (error) {
    console.error('Get Seeker Profile Error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const seekerId = req.user.id;
  const payload = parseOnboardingPayload(req.body);
  const validationErrors = validatePayloadTypes(payload);

  if (validationErrors.length > 0) {
    return res.status(422).json({ message: 'Invalid onboarding data', errors: validationErrors });
  }

  try {
    const result = await seekerDb.transaction(async (transaction) => {
      const seeker = await Seeker.findByPk(seekerId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!seeker) return null;

      applyOnboardingPayload(
        seeker,
        payload,
        req.file ? `/uploads/${req.file.filename}` : undefined,
      );

      const completedStep = NEXT_STEP_TO_COMPLETED_STEP[payload.step];
      const creditAward = await rewardOnboardingStep(seeker, completedStep, transaction);
      await seeker.save({ transaction });
      return { seeker, creditAward };
    });

    if (!result) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully',
      seeker: serializeSeeker(result.seeker),
      creditAward: result.creditAward,
    });
  } catch (error) {
    console.error('Update Seeker Profile Error:', error);
    return res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

export const submitOnboarding = async (req, res) => {
  const seekerId = req.user.id;
  const payload = parseOnboardingPayload(req.body);
  const validationErrors = validatePayloadTypes(payload);

  if (validationErrors.length > 0) {
    return res.status(422).json({ message: 'Invalid onboarding data', errors: validationErrors });
  }

  try {
    const result = await seekerDb.transaction(async (transaction) => {
      const seeker = await Seeker.findByPk(seekerId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!seeker) return null;

      applyOnboardingPayload(
        seeker,
        payload,
        req.file ? `/uploads/${req.file.filename}` : undefined,
      );

      const creditAward = await rewardOnboardingStep(seeker, 'review', transaction);

      seeker.status = 'active';
      seeker.onboardingStep = null;
      seeker.termsAcceptedAt = seeker.termsAcceptedAt || new Date();
      seeker.onboardingCompletedAt = new Date();
      await seeker.save({ transaction });
      return { seeker, creditAward };
    });

    if (!result) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    const frontendUrl = (await getSetting('FRONTEND_URL', 'http://localhost:3000')).replace(/\/$/, '');

    triggerNotification('SEEKER_ONBOARDING_COMPLETE', {
      email: result.seeker.email,
      phone: result.seeker.phone,
      name: result.seeker.fullName || 'Seeker',
      data: {
        credits: result.seeker.creditsBalance || 25,
        explore_link: `${frontendUrl}/experts`,
      },
    }).catch((err) => console.error('[Notification Trigger Warning] Seeker welcome email failed:', err.message));

    return res.status(200).json({
      message: 'Seeker onboarding completed successfully',
      seeker: serializeSeeker(result.seeker),
      creditAward: result.creditAward,
    });
  } catch (error) {
    console.error('Seeker Submit Onboarding Error:', error);
    return res.status(500).json({ message: 'Server error during submission', error: error.message });
  }
};

/**
 * Improve seeker consultation request copy with AI across 3 tones based on subject & selected/auto-selected goals.
 */
export const improveSeekerNeeds = async (req, res) => {
  const body = req.body || {};

  try {
    let subject = body.subject || body.category || body.topic;
    let userText = body.userText || body.needsText || body.text || body.additionalContext;
    let selectedGoals = body.selectedGoals || body.selectedNeedChips || body.goals;

    if (req.user?.id) {
      const seeker = await Seeker.findByPk(req.user.id);
      if (seeker) {
        if (!subject) subject = seeker.category;
        if (!userText) userText = seeker.needsText || seeker.additionalContext;
        if (!selectedGoals || (Array.isArray(selectedGoals) && selectedGoals.length === 0)) {
          selectedGoals = seeker.selectedNeedChips;
        }
      }
    }

    const result = await improveSeekerNeedsCopy({
      subject,
      userText,
      needsText: userText,
      selectedGoals,
    });

    const responsePayload = {
      subject: result.subject,
      selectedGoals: result.selectedGoals,
      autoSelected: result.autoSelected,
      options: result.options,
      suggestions: result.suggestions,
      source: result.source,
      notice: result.notice || undefined,
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (error instanceof AiNotConfiguredError || error?.code === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({
        message: error.message,
        code: 'AI_NOT_CONFIGURED',
      });
    }

    console.error('Seeker AI Improve Needs Error:', error.message || error);
    return res.status(502).json({
      message: error.message || 'Could not improve needs copy with AI.',
      code: error.code || 'AI_PROVIDER_ERROR',
    });
  }
};


