import { Seeker } from '../models/index.js';

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

export const getProfile = async (req, res) => {
  const seekerId = req.user.id;

  try {
    const seeker = await Seeker.findByPk(seekerId);

    if (!seeker) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    return res.status(200).json(seeker);
  } catch (error) {
    console.error('Get Seeker Profile Error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  const seekerId = req.user.id;
  const body = req.body;
  const {
    step,
    category,
    needsText,
    selectedBudget,
    location,
    additionalContext,
  } = body;

  const topics = parseJsonField(body.topics);
  const selectedNeedChips = parseJsonField(body.selectedNeedChips);
  const selectedFormats = parseJsonField(body.selectedFormats);
  const selectedLanguages = parseJsonField(body.selectedLanguages);
  const onboardingMetadata = parseJsonField(body.onboardingMetadata);

  try {
    const seeker = await Seeker.findByPk(seekerId);
    if (!seeker) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    if (category !== undefined) seeker.category = category;
    if (topics !== undefined) seeker.topics = topics;
    if (needsText !== undefined) seeker.needsText = needsText;
    if (selectedNeedChips !== undefined) seeker.selectedNeedChips = selectedNeedChips;
    if (selectedFormats !== undefined) seeker.selectedFormats = selectedFormats;
    if (selectedBudget !== undefined) seeker.selectedBudget = selectedBudget;
    if (selectedLanguages !== undefined) seeker.selectedLanguages = selectedLanguages;
    if (location !== undefined) seeker.location = location;
    if (additionalContext !== undefined) seeker.additionalContext = additionalContext;

    if (onboardingMetadata !== undefined) {
      seeker.onboardingMetadata = {
        ...(seeker.onboardingMetadata || {}),
        ...onboardingMetadata,
      };
    }

    if (req.file) {
      seeker.profilePhotoSrc = `/uploads/${req.file.filename}`;
    } else if (body.profilePhotoSrc !== undefined) {
      seeker.profilePhotoSrc = body.profilePhotoSrc;
    }

    if (step) {
      seeker.onboardingStep = step;
    }

    await seeker.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      seeker,
    });
  } catch (error) {
    console.error('Update Seeker Profile Error:', error);
    return res.status(500).json({ message: 'Server error updating profile', error: error.message });
  }
};

export const submitOnboarding = async (req, res) => {
  const seekerId = req.user.id;

  try {
    const seeker = await Seeker.findByPk(seekerId);
    if (!seeker) {
      return res.status(404).json({ message: 'Seeker not found' });
    }

    seeker.status = 'active';
    seeker.onboardingStep = 'success';
    seeker.termsAcceptedAt = seeker.termsAcceptedAt || new Date();
    seeker.onboardingCompletedAt = new Date();
    await seeker.save();

    return res.status(200).json({
      message: 'Seeker onboarding completed successfully',
      seeker,
    });
  } catch (error) {
    console.error('Seeker Submit Onboarding Error:', error);
    return res.status(500).json({ message: 'Server error during submission', error: error.message });
  }
};
