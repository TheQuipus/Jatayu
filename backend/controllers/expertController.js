import { Expert, Credential, Availability, sequelize } from '../models/index.js';
import { generateApplicationNumber } from '../utils/applicationNumber.js';
import {
  AiNotConfiguredError,
  suggestExpertIdentityCopy,
  recommendExpertSkills,
} from '../utils/aiService.js';
import { triggerNotification } from '../utils/templateNotificationService.js';

/**
 * Get current expert's full profile
 */
export const getProfile = async (req, res) => {
  const expertId = req.user.id;

  try {
    const expert = await Expert.findByPk(expertId, {
      include: [
        { model: Credential, as: 'credentials' },
        { model: Availability, as: 'availabilities' }
      ]
    });

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    return res.status(200).json({
      ...expert.toJSON(),
      onboardingComplete: expert.status === 'approved' || expert.onboardingStep === 'success',
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

/**
 * Update expert profile data for onboarding steps
 */
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

const MAX_ONBOARDING_METADATA_BYTES = 64 * 1024;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function decodeCharacterMap(value) {
  if (!isPlainObject(value)) return value;
  const keys = Object.keys(value);
  if (keys.length === 0 || !keys.every((key, index) => key === String(index))) return value;
  if (!keys.every((key) => typeof value[key] === 'string')) return value;
  return keys.map((key) => value[key]).join('');
}

function normalizeOnboardingMetadata(value) {
  if (value === undefined || value === null || value === '') return undefined;

  let normalized = value;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    normalized = decodeCharacterMap(normalized);
    if (typeof normalized !== 'string') break;
    try {
      normalized = JSON.parse(normalized);
    } catch {
      throw new TypeError('onboardingMetadata must contain valid JSON');
    }
  }

  if (!isPlainObject(normalized)) {
    throw new TypeError('onboardingMetadata must be a JSON object');
  }
  if (Buffer.byteLength(JSON.stringify(normalized), 'utf8') > MAX_ONBOARDING_METADATA_BYTES) {
    throw new RangeError('onboardingMetadata must not exceed 64 KB');
  }
  return normalized;
}

export const updateProfile = async (req, res) => {
  const expertId = req.user.id;
  const body = req.body;
  const {
    step, // 'category', 'skills', 'experience', 'identity', 'credentials', 'preferences', 'audience', 'availability'
    category,
    experienceLevel,
    professionalTitle,
    tagLine,
    bio,
    timezone,
  } = body;

  const skills = parseJsonField(body.skills);
  const credentials = parseJsonField(body.credentials);
  const selectedFormats = parseJsonField(body.selectedFormats);
  const selectedLengths = parseJsonField(body.selectedLengths);
  const formatPrices = parseJsonField(body.formatPrices);
  const targetAudience = parseJsonField(body.targetAudience);
  const focusAreas = parseJsonField(body.focusAreas);
  const availabilitySlots = parseJsonField(body.availabilitySlots);
  let onboardingMetadata;
  try {
    onboardingMetadata = normalizeOnboardingMetadata(body.onboardingMetadata);
  } catch (error) {
    return res.status(422).json({ message: error.message });
  }

  try {
    const expertExists = await sequelize.transaction(async (transaction) => {
      const expert = await Expert.findByPk(expertId, { transaction });
      if (!expert) return false;

      // Update fields based on which onboarding step/data is sent
      if (category !== undefined) expert.category = category;
      if (skills !== undefined) expert.skills = skills;
      if (experienceLevel !== undefined) expert.experienceLevel = experienceLevel;
      if (professionalTitle !== undefined) expert.professionalTitle = professionalTitle;
      if (tagLine !== undefined) expert.tagLine = tagLine;
      if (bio !== undefined) expert.bio = bio;
      if (targetAudience !== undefined) {
        expert.targetAudience = Array.isArray(targetAudience)
          ? JSON.stringify(targetAudience)
          : targetAudience;
      }
      if (focusAreas !== undefined) expert.focusAreas = focusAreas;
      if (timezone !== undefined) expert.timezone = timezone;

      if (selectedFormats !== undefined) expert.selectedFormats = selectedFormats;
      if (selectedLengths !== undefined) expert.selectedLengths = selectedLengths;
      if (formatPrices !== undefined) expert.formatPrices = formatPrices;
      if (onboardingMetadata !== undefined) {
        let storedMetadata = {};
        try {
          storedMetadata = normalizeOnboardingMetadata(expert.onboardingMetadata) || {};
        } catch (error) {
          console.warn(`Resetting invalid onboardingMetadata for expert ${expertId}: ${error.message}`);
        }
        expert.onboardingMetadata = {
          ...storedMetadata,
          ...onboardingMetadata,
        };
      }

      if (req.file) {
        expert.profilePhotoSrc = `/uploads/${req.file.filename}`;
      } else if (req.body.profilePhotoSrc !== undefined) {
        expert.profilePhotoSrc = req.body.profilePhotoSrc;
      }

      if (step) expert.onboardingStep = step;
      await expert.save({ transaction });

      if (credentials !== undefined && Array.isArray(credentials)) {
        await Credential.destroy({ where: { expertId }, transaction });
        const credentialsToCreate = credentials.map(cred => ({
          expertId,
          type: cred.type,
          title: cred.title,
          institution: cred.institution,
          startYear: cred.startYear,
          endYear: cred.endYear || null,
          description: cred.description || null
        }));
        if (credentialsToCreate.length > 0) {
          await Credential.bulkCreate(credentialsToCreate, { transaction });
        }
      }

      if (availabilitySlots !== undefined && Array.isArray(availabilitySlots)) {
        await Availability.destroy({ where: { expertId }, transaction });
        const slotsToCreate = availabilitySlots.map(slot => ({
          expertId,
          days: slot.days,
          fromTime: slot.from,
          toTime: slot.to
        }));
        if (slotsToCreate.length > 0) {
          await Availability.bulkCreate(slotsToCreate, { transaction });
        }
      }

      return true;
    });

    if (!expertExists) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    // Fetch refreshed profile to return
    const updatedProfile = await Expert.findByPk(expertId, {
      include: [
        { model: Credential, as: 'credentials' },
        { model: Availability, as: 'availabilities' }
      ]
    });

    return res.status(200).json({
      message: 'Profile updated successfully',
      expert: updatedProfile
    });
  } catch (error) {
    // Do not log the complete Sequelize error: it may contain the full SQL payload.
    console.error('Update Profile Error:', {
      name: error.name,
      message: error.message,
      code: error.parent?.code || error.code,
    });
    const databaseUnavailable = error.name === 'SequelizeConnectionError'
      || error.name === 'SequelizeConnectionAcquireTimeoutError'
      || error.parent?.fatal === true
      || ['PROTOCOL_CONNECTION_LOST', 'ECONNRESET', 'ECONNREFUSED'].includes(error.parent?.code || error.code);
    return res.status(databaseUnavailable ? 503 : 500).json({
      message: databaseUnavailable
        ? 'Database connection was interrupted. Please retry.'
        : 'Server error updating profile',
      error: error.message,
    });
  }
};

/**
 * Submit onboarding details for final review
 */
export const submitOnboarding = async (req, res) => {
  const expertId = req.user.id;

  try {
    const expert = await Expert.findByPk(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    // Set status to pending review and mark onboarding as complete
    if (!expert.applicationNumber) {
      expert.applicationNumber = await generateApplicationNumber();
    }
    expert.submittedAt = new Date();
    expert.status = 'pending_review';
    expert.onboardingStep = 'success';
    await expert.save();

    triggerNotification('EXPERT_ONBOARDING_UNDER_REVIEW', {
      email: expert.email,
      phone: expert.phone,
      name: expert.fullName,
      data: {
        application_number: expert.applicationNumber,
      },
    }).catch((err) => console.error('[Notification Trigger Warning] Expert under review email failed:', err.message));

    return res.status(200).json({
      message: 'Onboarding completed and submitted for review successfully',
      expert
    });
  } catch (error) {
    console.error('Submit Onboarding Error:', error);
    return res.status(500).json({ message: 'Server error during submission', error: error.message });
  }
};

function asList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function credentialsToContext(credentials = []) {
  const employment = [];
  const education = [];

  for (const cred of credentials) {
    if (!cred) continue;
    if (cred.type === 'education') {
      education.push({
        degree: cred.title,
        institution: cred.institution,
        fieldOfStudy: cred.description,
      });
    } else {
      employment.push({
        jobTitle: cred.title,
        company: cred.institution,
        responsibilities: cred.description,
      });
    }
  }

  return { employment, education };
}

/**
 * Suggest tag line + brief introduction from prior onboarding selections.
 */
export const suggestOnboardingIdentity = async (req, res) => {
  const expertId = req.user.id;
  const body = req.body || {};

  try {
    const expert = await Expert.findByPk(expertId, {
      include: [{ model: Credential, as: 'credentials' }],
    });

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    const fromDb = credentialsToContext(expert.credentials || []);
    const metadata = expert.onboardingMetadata || {};
    const skills = body.skills ?? expert.skills;
    const languages = body.languages ?? metadata.languages ?? expert.focusAreas;

    const suggestion = await suggestExpertIdentityCopy({
      fullName: body.fullName || expert.fullName,
      category: body.category || expert.category,
      skills: asList(skills),
      experienceLevel: body.experienceLevel || expert.experienceLevel,
      professionalTitle: body.professionalTitle || expert.professionalTitle,
      languages: asList(languages),
      employment: Array.isArray(body.employment) && body.employment.length > 0
        ? body.employment
        : fromDb.employment,
      education: Array.isArray(body.education) && body.education.length > 0
        ? body.education
        : fromDb.education,
      currentTagLine: body.currentTagLine || body.tagLine,
      currentBio: body.currentBio || body.bio || body.briefIntroduction,
      tone: body.tone,
      intent: body.intent,
      variantIndex: body.variantIndex,
      field: body.field === 'bio' || body.field === 'tagLine' ? body.field : undefined,
    });

    const responsePayload = {
      tagLine: suggestion.tagLine,
      bio: suggestion.bio,
      briefIntroduction: suggestion.bio,
      options: suggestion.options || suggestion.suggestions,
      suggestions: suggestion.suggestions || suggestion.options,
      source: suggestion.source || 'ai',
      notice: suggestion.notice || undefined,
    };

    return res.status(200).json(responsePayload);
  } catch (error) {
    if (error instanceof AiNotConfiguredError || error?.code === 'AI_NOT_CONFIGURED') {
      return res.status(503).json({
        message: error.message,
        code: 'AI_NOT_CONFIGURED',
      });
    }

    console.error('Onboarding AI suggest error:', error.message);
    return res.status(502).json({
      message: error.message || 'Could not generate suggestions. You can write these yourself.',
      code: error.code || 'AI_PROVIDER_ERROR',
    });
  }
};

/**
 * Recommend skills for expert onboarding based on category/title/existing selections.
 */
export const recommendOnboardingSkills = async (req, res) => {
  const expertId = req.user?.id;
  const body = req.body || {};

  try {
    let expert = null;
    if (expertId) {
      expert = await Expert.findByPk(expertId);
    }

    const skillsResult = await recommendExpertSkills({
      category: body.category || expert?.category,
      professionalTitle: body.professionalTitle || expert?.professionalTitle,
      experienceLevel: body.experienceLevel || expert?.experienceLevel,
      skills: body.skills || body.existingSkills || expert?.skills,
    });

    return res.status(200).json({
      skills: skillsResult.skills,
      source: skillsResult.source,
    });
  } catch (error) {
    console.error('Recommend skills error:', error.message);
    return res.status(200).json({
      skills: [],
      source: 'ai',
    });
  }
};

