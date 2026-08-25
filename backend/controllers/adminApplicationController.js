import {
  findExpertsForAdmin,
  findExpertForAdmin,
  findExpertByIdForAdmin,
  countExpertsForAdmin,
  saveExpertForAdmin,
  Op,
} from '../services/expertDataService.js';
import { generateApplicationNumber } from '../utils/applicationNumber.js';
import { triggerNotification } from '../utils/templateNotificationService.js';
import { getSetting } from '../utils/settingsHelper.js';

const FRONTEND_TO_BACKEND_STATUS = {
  pending: 'pending_review',
  in_review: 'in_review',
  on_hold: 'on_hold',
  approved: 'approved',
  rejected: 'rejected',
};

const BACKEND_TO_FRONTEND_STATUS = {
  draft: 'pending',
  pending_review: 'pending',
  in_review: 'in_review',
  on_hold: 'on_hold',
  approved: 'approved',
  rejected: 'rejected',
};

const SIGNUP_COMPLETE_DRAFT_WHERE = {
  status: 'draft',
  isEmailVerified: true,
  isPhoneVerified: true,
};

// Keep the queue response lightweight. Full onboarding metadata (including
// uploaded document data) is returned only by the application detail API.
const APPLICATION_LIST_ATTRIBUTES = [
  'id',
  'applicationNumber',
  'fullName',
  'email',
  'phone',
  'category',
  'skills',
  'experienceLevel',
  'professionalTitle',
  'tagLine',
  'bio',
  'profilePhotoSrc',
  'targetAudience',
  'focusAreas',
  'timezone',
  'selectedFormats',
  'selectedLengths',
  'formatPrices',
  'onboardingStep',
  'status',
  'submittedAt',
  'reviewerNote',
  'isEmailVerified',
  'isPhoneVerified',
  'createdAt',
  'updatedAt',
];

function isSignupComplete(expert) {
  return expert.status !== 'draft' || (expert.isEmailVerified && expert.isPhoneVerified);
}

function buildListWhere(statusFilter) {
  if (!statusFilter || statusFilter === 'all') {
    return {
      [Op.or]: [{ status: { [Op.ne]: 'draft' } }, SIGNUP_COMPLETE_DRAFT_WHERE],
    };
  }

  const backendStatus = FRONTEND_TO_BACKEND_STATUS[statusFilter] || statusFilter;

  if (statusFilter === 'pending') {
    return {
      [Op.or]: [{ status: 'pending_review' }, SIGNUP_COMPLETE_DRAFT_WHERE],
    };
  }

  return { status: backendStatus };
}

function buildDetailWhere(id) {
  return {
    [Op.and]: [
      { [Op.or]: [{ id }, { applicationNumber: id }] },
      {
        [Op.or]: [{ status: { [Op.ne]: 'draft' } }, SIGNUP_COMPLETE_DRAFT_WHERE],
      },
    ],
  };
}

function serializeExpert(expert) {
  const json = expert.toJSON();
  let metadata = json.onboardingMetadata;

  // Older profile updates could store a JSON string as an object whose keys
  // were "0", "1", "2", etc. Decode that legacy shape before sending it;
  // otherwise a relatively small metadata document becomes a huge response.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) break;
    const keys = Object.keys(metadata);
    if (keys.length === 0 || !keys.every((key, index) => key === String(index))) break;
    if (!keys.every((key) => typeof metadata[key] === 'string')) break;

    const decoded = keys.map((key) => metadata[key]).join('');
    try {
      metadata = JSON.parse(decoded);
    } catch {
      break;
    }
  }

  return {
    ...json,
    ...(json.onboardingMetadata !== undefined ? { onboardingMetadata: metadata } : {}),
    frontendStatus: BACKEND_TO_FRONTEND_STATUS[json.status] || 'pending',
  };
}

async function ensureReviewMetadata(expert) {
  let changed = false;

  if (!expert.applicationNumber && isSignupComplete(expert)) {
    expert.applicationNumber = await generateApplicationNumber();
    changed = true;
  }

  if (!expert.submittedAt && isSignupComplete(expert)) {
    expert.submittedAt = expert.createdAt || expert.updatedAt || new Date();
    changed = true;
  }

  if (changed) {
    await saveExpertForAdmin(expert);
  }
}

/**
 * List all submitted expert applications (non-draft)
 */
export const listApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const requestedPage = Number.parseInt(req.query.page, 10);
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(requestedLimit, 100)
      : 20;
    const where = buildListWhere(status);
    const offset = (page - 1) * limit;

    const [experts, total] = await Promise.all([
      findExpertsForAdmin(where, {
        limit,
        offset,
        attributes: APPLICATION_LIST_ATTRIBUTES,
      }),
      countExpertsForAdmin(where),
    ]);

    for (const expert of experts) {
      await ensureReviewMetadata(expert);
    }

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return res.status(200).json({
      items: experts.map(serializeExpert),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasPreviousPage: page > 1,
        hasNextPage: page < totalPages,
      },
    });
  } catch (error) {
    console.error('List Applications Error:', error);
    return res.status(500).json({ message: 'Server error listing applications', error: error.message });
  }
};

/**
 * Get a single expert application by UUID or APP-xxxx number
 */
export const getApplication = async (req, res) => {
  const { id } = req.params;

  try {
    const expert = await findExpertForAdmin(buildDetailWhere(id));

    if (!expert) {
      return res.status(404).json({ message: 'Application not found' });
    }

    await ensureReviewMetadata(expert);

    return res.status(200).json(serializeExpert(expert));
  } catch (error) {
    console.error('Get Application Error:', error);
    return res.status(500).json({ message: 'Server error retrieving application', error: error.message });
  }
};

/**
 * Update application review status
 */
export const updateApplicationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reviewerNote } = req.body;

  if (!status) {
    return res.status(400).json({ message: 'status is required' });
  }

  const backendStatus = FRONTEND_TO_BACKEND_STATUS[status] || status;
  const allowedStatuses = ['pending_review', 'in_review', 'on_hold', 'approved', 'rejected'];

  if (!allowedStatuses.includes(backendStatus)) {
    return res.status(400).json({ message: `Invalid status: ${status}` });
  }

  try {
    const expert = await findExpertForAdmin(buildDetailWhere(id));

    if (!expert) {
      return res.status(404).json({ message: 'Application not found' });
    }

    expert.status = backendStatus;
    if (reviewerNote !== undefined) {
      expert.reviewerNote = reviewerNote;
    }

    if (backendStatus === 'approved') {
      expert.onboardingStep = 'success';
    }

    await saveExpertForAdmin(expert);

    const updated = await findExpertByIdForAdmin(expert.id);
    const frontendUrl = (await getSetting('FRONTEND_URL', 'http://localhost:3000')).replace(/\/$/, '');

    if (backendStatus === 'approved') {
      triggerNotification('EXPERT_ONBOARDING_APPROVED', {
        email: updated.email,
        phone: updated.phone,
        name: updated.fullName,
        data: {
          application_number: updated.applicationNumber || id,
          dashboard_link: `${frontendUrl}/expert/dashboard`,
        },
      }).catch((err) => console.error('[Notification Trigger Warning] Expert approval email failed:', err.message));
    } else if (backendStatus === 'rejected' || backendStatus === 'on_hold') {
      triggerNotification('EXPERT_ONBOARDING_REJECTED', {
        email: updated.email,
        phone: updated.phone,
        name: updated.fullName,
        data: {
          application_number: updated.applicationNumber || id,
          reason: reviewerNote || 'Please log in to review and update your profile information.',
          dashboard_link: `${frontendUrl}/onboarding`,
        },
      }).catch((err) => console.error('[Notification Trigger Warning] Expert rejection email failed:', err.message));
    }

    return res.status(200).json({
      message: 'Application status updated successfully',
      expert: serializeExpert(updated),
    });
  } catch (error) {
    console.error('Update Application Status Error:', error);
    return res.status(500).json({ message: 'Server error updating application status', error: error.message });
  }
};

/**
 * Get application counts for admin dashboard KPIs
 */
export const getApplicationStats = async (req, res) => {
  try {
    const experts = await findExpertsForAdmin(
      { [Op.or]: [{ status: { [Op.ne]: 'draft' } }, SIGNUP_COMPLETE_DRAFT_WHERE] },
      { attributes: ['status'] },
    );

    const counts = {
      all: experts.length,
      pending: 0,
      in_review: 0,
      on_hold: 0,
      approved: 0,
      rejected: 0,
    };

    for (const expert of experts) {
      const frontendStatus = BACKEND_TO_FRONTEND_STATUS[expert.status] || 'pending';
      if (frontendStatus in counts) {
        counts[frontendStatus] += 1;
      }
    }

    return res.status(200).json(counts);
  } catch (error) {
    console.error('Get Application Stats Error:', error);
    return res.status(500).json({ message: 'Server error retrieving application stats', error: error.message });
  }
};
