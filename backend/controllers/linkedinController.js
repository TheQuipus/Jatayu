import { Expert } from '../models/index.js';
import { verifyLinkedinLogin } from '../utils/linkedinAuth.js';

export const connectLinkedin = async (req, res) => {
  try {
    const expert = await Expert.findByPk(req.user.id);
    if (!expert) return res.status(404).json({ message: 'Expert not found' });

    const profile = await verifyLinkedinLogin(req.body);
    const linkedExpert = await Expert.findOne({ where: { linkedinId: profile.linkedinId } });
    if (linkedExpert && linkedExpert.id !== expert.id) {
      return res.status(409).json({
        message: 'This LinkedIn account is already connected to another expert account',
        code: 'LINKEDIN_ALREADY_CONNECTED',
      });
    }

    expert.linkedinId = profile.linkedinId;
    if (profile.fullName) expert.fullName = profile.fullName;
    if (profile.picture) expert.profilePhotoSrc = profile.picture;
    if (profile.emailVerified && profile.email === String(expert.email || '').trim().toLowerCase()) {
      expert.isEmailVerified = true;
    }
    expert.onboardingMetadata = {
      ...(expert.onboardingMetadata && typeof expert.onboardingMetadata === 'object'
        ? expert.onboardingMetadata
        : {}),
      linkedinConnectedAt: new Date().toISOString(),
    };
    await expert.save();

    return res.status(200).json({
      message: 'LinkedIn profile connected successfully',
      linkedinProfile: {
        fullName: profile.fullName,
        email: profile.email,
        picture: profile.picture,
      },
      expert: expert.toJSON(),
    });
  } catch (error) {
    console.error('Connect LinkedIn Error:', error);
    return res.status(error.status || 401).json({
      message: error.message || 'Failed to connect LinkedIn profile',
    });
  }
};
