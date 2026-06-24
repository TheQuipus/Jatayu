import { Expert, Credential, Availability, sequelize } from '../models/index.js';

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

    return res.status(200).json(expert);
  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};

/**
 * Update expert profile data for onboarding steps
 */
export const updateProfile = async (req, res) => {
  const expertId = req.user.id;
  const {
    step, // 'category', 'skills', 'experience', 'identity', 'credentials', 'preferences', 'audience', 'availability'
    category,
    skills,
    experienceLevel,
    professionalTitle,
    tagLine,
    bio,
    credentials, // Array of credential objects: [{ type, title, institution, startYear, endYear, description }]
    selectedFormats,
    selectedLengths,
    formatPrices,
    targetAudience,
    focusAreas,
    timezone,
    availabilitySlots // Array of availability slots: [{ days: [], from: "", to: "" }]
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    const expert = await Expert.findByPk(expertId, { transaction });
    if (!expert) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Expert not found' });
    }

    // Update fields based on which onboarding step/data is sent
    if (category !== undefined) expert.category = category;
    if (skills !== undefined) expert.skills = skills;
    if (experienceLevel !== undefined) expert.experienceLevel = experienceLevel;
    if (professionalTitle !== undefined) expert.professionalTitle = professionalTitle;
    if (tagLine !== undefined) expert.tagLine = tagLine;
    if (bio !== undefined) expert.bio = bio;
    if (targetAudience !== undefined) expert.targetAudience = targetAudience;
    if (focusAreas !== undefined) expert.focusAreas = focusAreas;
    if (timezone !== undefined) expert.timezone = timezone;

    // Preferences step fields
    if (selectedFormats !== undefined) expert.selectedFormats = selectedFormats;
    if (selectedLengths !== undefined) expert.selectedLengths = selectedLengths;
    if (formatPrices !== undefined) expert.formatPrices = formatPrices;

    // Handle photo upload if present
    if (req.file) {
      // In a real environment, we'd save a relative web URL
      expert.profilePhotoSrc = `/uploads/${req.file.filename}`;
    } else if (req.body.profilePhotoSrc !== undefined) {
      expert.profilePhotoSrc = req.body.profilePhotoSrc;
    }

    // Save current step tracking
    if (step) {
      expert.onboardingStep = step;
    }

    await expert.save({ transaction });

    // Handle credentials step (complex relation)
    if (credentials !== undefined && Array.isArray(credentials)) {
      // Clear previous credentials
      await Credential.destroy({ where: { expertId }, transaction });

      // Insert new credentials
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

    // Handle availability calendar step (complex relation)
    if (availabilitySlots !== undefined && Array.isArray(availabilitySlots)) {
      // Clear previous availabilities
      await Availability.destroy({ where: { expertId }, transaction });

      // Insert new slots
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

    await transaction.commit();

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
    await transaction.rollback();
    console.error('Update Profile Error:', error);
    return res.status(500).json({ message: 'Server error updating profile', error: error.message });
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
    expert.status = 'pending_review';
    expert.onboardingStep = 'success';
    await expert.save();

    return res.status(200).json({
      message: 'Onboarding completed and submitted for review successfully',
      expert
    });
  } catch (error) {
    console.error('Submit Onboarding Error:', error);
    return res.status(500).json({ message: 'Server error during submission', error: error.message });
  }
};
