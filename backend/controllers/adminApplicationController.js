import { Op } from 'sequelize';
import { Expert, Credential, Availability } from '../models/index.js';
import { generateApplicationNumber } from '../utils/applicationNumber.js';

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

function serializeExpert(expert) {
  const json = expert.toJSON();
  return {
    ...json,
    frontendStatus: BACKEND_TO_FRONTEND_STATUS[json.status] || 'pending',
  };
}

async function ensureReviewMetadata(expert) {
  let changed = false;

  if (!expert.applicationNumber && expert.status !== 'draft') {
    expert.applicationNumber = await generateApplicationNumber();
    changed = true;
  }

  if (!expert.submittedAt && expert.status !== 'draft') {
    expert.submittedAt = expert.updatedAt || new Date();
    changed = true;
  }

  if (changed) {
    await expert.save();
  }
}

/**
 * List all submitted expert applications (non-draft)
 */
export const listApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {
      status: {
        [Op.ne]: 'draft',
      },
    };

    if (status && status !== 'all') {
      const backendStatus = FRONTEND_TO_BACKEND_STATUS[status] || status;
      where.status = backendStatus;
    }

    const experts = await Expert.findAll({
      where,
      include: [
        { model: Credential, as: 'credentials' },
        { model: Availability, as: 'availabilities' },
      ],
      order: [['submittedAt', 'DESC'], ['updatedAt', 'DESC']],
    });

    for (const expert of experts) {
      await ensureReviewMetadata(expert);
    }

    return res.status(200).json(experts.map(serializeExpert));
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
    const expert = await Expert.findOne({
      where: {
        [Op.or]: [{ id }, { applicationNumber: id }],
        status: { [Op.ne]: 'draft' },
      },
      include: [
        { model: Credential, as: 'credentials' },
        { model: Availability, as: 'availabilities' },
      ],
    });

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
    const expert = await Expert.findOne({
      where: {
        [Op.or]: [{ id }, { applicationNumber: id }],
        status: { [Op.ne]: 'draft' },
      },
    });

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

    await expert.save();

    const updated = await Expert.findByPk(expert.id, {
      include: [
        { model: Credential, as: 'credentials' },
        { model: Availability, as: 'availabilities' },
      ],
    });

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
    const experts = await Expert.findAll({
      where: {
        status: { [Op.ne]: 'draft' },
      },
      attributes: ['status'],
    });

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
