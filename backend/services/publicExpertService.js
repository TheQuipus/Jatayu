import { Availability, Credential, Expert } from '../models/index.js';

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function asStringArray(value) {
  const parsed = parseJson(value, []);
  return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
}

function serializeCredential(credential) {
  return {
    id: credential.id,
    type: credential.type,
    title: credential.title,
    institution: credential.institution,
    startYear: credential.startYear,
    endYear: credential.endYear,
    description: credential.description,
  };
}

function serializeAvailability(availability) {
  return {
    id: availability.id,
    days: asStringArray(availability.days),
    fromTime: availability.fromTime,
    toTime: availability.toTime,
  };
}

export function serializePublicExpert(expert) {
  return {
    id: expert.id,
    fullName: expert.fullName,
    professionalTitle: expert.professionalTitle,
    tagLine: expert.tagLine,
    bio: expert.bio,
    profilePhotoSrc: expert.profilePhotoSrc,
    category: expert.category,
    skills: asStringArray(expert.skills),
    focusAreas: asStringArray(expert.focusAreas),
    experienceLevel: expert.experienceLevel,
    targetAudience: parseJson(expert.targetAudience, expert.targetAudience),
    timezone: expert.timezone,
    selectedFormats: asStringArray(expert.selectedFormats),
    selectedLengths: asStringArray(expert.selectedLengths),
    formatPrices: parseJson(expert.formatPrices, {}),
    credentials: (expert.credentials || []).map(serializeCredential),
    availabilities: (expert.availabilities || []).map(serializeAvailability),
  };
}

export async function findPublicExpertById(expertId) {
  return Expert.findOne({
    where: {
      id: expertId,
      status: 'approved',
    },
    include: [
      { model: Credential, as: 'credentials', required: false },
      { model: Availability, as: 'availabilities', required: false },
    ],
  });
}
