
import {
  findExpertsForAdmin,
  findExpertForAdmin,
  findExpertByIdForAdmin,
  countExpertsForAdmin,
  saveExpertForAdmin,
  Op,
} from '../services/expertDataService.js';
import { Expert, ExpertSession } from '../models/index.js';
import { revokeAndExpelExpertSessions } from '../services/expertSessionService.js';
import { expertDb } from '../config/db/index.js';
import { generateApplicationNumber } from '../utils/applicationNumber.js';
import { triggerNotification } from '../utils/templateNotificationService.js';
import { getSetting } from '../utils/settingsHelper.js';
import { sendNotification } from '../services/notificationService.js';
import {
  appendSectionAuditEvent,
  synthesizeLegacyAuditLogs,
  cleanAndDeduplicateAuditLogs,
} from '../utils/applicationAuditLog.js';

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

/**
 * Safely parse onboardingMetadata whether stored as JSON string, object, or null
 */
export function safeParseOnboardingMetadata(raw) {
  if (!raw) return {};
  if (typeof raw === 'object' && !Array.isArray(raw)) return { ...raw };
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return { ...parsed };
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Format a Date object or ISO string into MySQL DATETIME ('YYYY-MM-DD HH:MM:SS')
 */
export function formatMySqlDateTime(date = new Date()) {
  if (!date) return null;
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Keep the queue response consistent and lightweight. Administrative flags
// like isBlacklisted and blacklistedAt are queried directly from Experts columns.
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
  'approvedAt',
  'reviewerNote',
  'isBlacklisted',
  'blacklistedAt',
  'isEmailVerified',
  'isPhoneVerified',
  'createdAt',
  'updatedAt',
];

const QUEUE_STATUSES = ['pending_review', 'in_review', 'on_hold', 'rejected'];

function isSignupComplete(expert) {
  return expert.status !== 'draft' || (expert.isEmailVerified && expert.isPhoneVerified);
}

function buildListWhere(statusFilter) {
  if (!statusFilter || statusFilter === 'all') {
    return {
      [Op.or]: [
        { status: { [Op.in]: QUEUE_STATUSES } },
        SIGNUP_COMPLETE_DRAFT_WHERE,
      ],
    };
  }

  const backendStatus = FRONTEND_TO_BACKEND_STATUS[statusFilter] || statusFilter;

  if (statusFilter === 'pending') {
    return {
      [Op.or]: [{ status: 'pending_review' }, SIGNUP_COMPLETE_DRAFT_WHERE],
    };
  }

  if (backendStatus === 'approved') {
    return { id: null };
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

  if (typeof metadata === 'string') {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      // ignore
    }
  }

  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    if (!Array.isArray(metadata.sectionAuditLogs) || metadata.sectionAuditLogs.length === 0) {
      const synthetic = synthesizeLegacyAuditLogs(metadata);
      if (synthetic.length > 0) {
        metadata = { ...metadata, sectionAuditLogs: synthetic };
      }
    } else {
      // Retroactively clean and deduplicate existing stored logs
      metadata = { ...metadata, sectionAuditLogs: cleanAndDeduplicateAuditLogs(metadata.sectionAuditLogs) };
    }
  }

  const isBlacklisted = Boolean(
    json.isBlacklisted ||
    expert.isBlacklisted ||
    (metadata && typeof metadata === 'object' && (metadata.isBlacklisted || metadata.isBlacklisted === 1))
  );

  return {
    ...json,
    isBlacklisted,
    blacklistedAt: json.blacklistedAt || (metadata && typeof metadata === 'object' && metadata.blacklistedAt) || null,
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

    await Promise.all(experts.map((expert) => ensureReviewMetadata(expert)));

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
  const { status, reviewerNote, isBlacklisted } = req.body;

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

    let metadata = safeParseOnboardingMetadata(expert.onboardingMetadata);
    const isAlreadyBlacklisted = Boolean(
      expert.isBlacklisted ||
      (metadata && (metadata.isBlacklisted || metadata.isBlacklisted === 1))
    );

    expert.status = backendStatus;
    if (reviewerNote !== undefined) {
      expert.reviewerNote = reviewerNote;
    }

    const shouldBlacklist = isBlacklisted === true;
    const shouldUnblacklist =
      isBlacklisted === false ||
      (backendStatus === 'approved' && isBlacklisted !== true);

    if (shouldBlacklist) {
      expert.isBlacklisted = true;
      expert.blacklistedAt = expert.blacklistedAt || new Date();

      metadata.isBlacklisted = true;
      metadata.blacklistedAt = expert.blacklistedAt instanceof Date
        ? expert.blacklistedAt.toISOString()
        : new Date().toISOString();
      expert.onboardingMetadata = { ...metadata };
      expert.changed('onboardingMetadata', true);
      expert.changed('isBlacklisted', true);
      expert.changed('blacklistedAt', true);

      // Immediately revoke all active sessions and forcibly disconnect all open sockets
      await revokeAndExpelExpertSessions(
        expert.id,
        'CREDENTIALS_BLACKLISTED',
        'Your profile is Marked as Blacklisted',
      );
    } else if (shouldUnblacklist) {
      expert.isBlacklisted = false;
      expert.blacklistedAt = null;

      metadata.isBlacklisted = false;
      metadata.blacklistedAt = null;
      expert.onboardingMetadata = { ...metadata };
      expert.changed('onboardingMetadata', true);
      expert.changed('isBlacklisted', true);
      expert.changed('blacklistedAt', true);
    } else if (isAlreadyBlacklisted) {
      // Preserve existing blacklist state across rejections and section updates
      expert.isBlacklisted = true;
      metadata.isBlacklisted = true;
      expert.onboardingMetadata = { ...metadata };
      expert.changed('onboardingMetadata', true);
      expert.changed('isBlacklisted', true);
    }

    if (backendStatus === 'approved') {
      expert.onboardingStep = 'success';
      if (!expert.approvedAt) {
        expert.approvedAt = new Date();
      }
    }

    let currentAuditLogs = metadata.sectionAuditLogs || [];
    if (!Array.isArray(currentAuditLogs) || currentAuditLogs.length === 0) {
      currentAuditLogs = synthesizeLegacyAuditLogs(metadata);
    }

    if (req.body.sectionDecisions && typeof req.body.sectionDecisions === 'object') {
      const currentSectionDecisions = metadata.sectionDecisions || {};
      const currentClarifications = metadata.sectionClarifications || {};

      Object.entries(req.body.sectionDecisions).forEach(([secKey, secVal]) => {
        if (!secVal) return;
        const previousDecision = currentSectionDecisions[secKey]?.decision || null;
        const previousNote = currentSectionDecisions[secKey]?.note ||
          (currentSectionDecisions[secKey]?.notes && currentSectionDecisions[secKey]?.notes[currentSectionDecisions[secKey]?.notes.length - 1]?.text) || '';
        const currentNote = secVal.note ||
          (secVal.notes && secVal.notes[secVal.notes.length - 1]?.text) || '';

        currentSectionDecisions[secKey] = {
          decision: secVal.decision || null,
          note: secVal.note || '',
          notes: secVal.notes || [],
          clarificationStatus: secVal.clarificationStatus || (secVal.decision === 'clarification' ? 'waiting' : undefined),
          clarificationRequestedAt: secVal.decision === 'clarification' ? (secVal.clarificationRequestedAt || new Date().toISOString()) : undefined,
          updatedAt: new Date().toISOString(),
        };

        const decisionChanged = Boolean(secVal.decision && secVal.decision !== previousDecision);
        const noteChanged = Boolean(currentNote && currentNote !== previousNote);

        if (decisionChanged || noteChanged) {
          currentAuditLogs = appendSectionAuditEvent(currentAuditLogs, {
            sectionId: secKey,
            action: secVal.decision,
            note: currentNote,
            previousDecision,
            newDecision: secVal.decision,
          }, req.admin);
        }

        if (secVal.decision === 'clarification') {
          currentClarifications[secKey] = {
            sectionId: secKey,
            status: secVal.clarificationStatus || 'waiting',
            requestedAt: secVal.clarificationRequestedAt || new Date().toISOString(),
            note: secVal.note || (secVal.notes && secVal.notes[secVal.notes.length - 1]?.text) || '',
            notes: secVal.notes || [],
            receivedAt: secVal.clarificationStatus === 'received' ? (secVal.clarificationReceivedAt || new Date().toISOString()) : null,
          };
        } else if (secVal.decision === 'approve' || secVal.decision === 'reject') {
          delete currentClarifications[secKey];
        }
      });

      metadata.sectionDecisions = currentSectionDecisions;
      metadata.sectionClarifications = currentClarifications;
    }

    // Record application status change in audit log
    const statusActionMap = {
      approved: 'approved',
      on_hold: 'on_hold',
      rejected: 'rejected',
      in_review: 'in_review',
    };
    if (statusActionMap[backendStatus]) {
      currentAuditLogs = appendSectionAuditEvent(currentAuditLogs, {
        sectionId: 'application',
        sectionTitle: 'Application Overall',
        action: statusActionMap[backendStatus],
        note: reviewerNote || (backendStatus === 'approved' ? 'Application officially approved' : ''),
        newDecision: backendStatus,
      }, req.admin);
    }

    metadata.sectionAuditLogs = cleanAndDeduplicateAuditLogs(currentAuditLogs);
    expert.onboardingMetadata = { ...metadata };
    expert.changed('onboardingMetadata', true);

    await saveExpertForAdmin(expert);

    if (shouldBlacklist || shouldUnblacklist || isAlreadyBlacklisted || isBlacklisted !== undefined) {
      const isBlkVal = expert.isBlacklisted ? 1 : 0;
      const blkAtVal = expert.isBlacklisted
        ? formatMySqlDateTime(expert.blacklistedAt || new Date())
        : null;
      const idVal = expert.id;
      const appNumVal = expert.applicationNumber || id;
      try {
        await expertDb.query(
          'UPDATE `Experts` SET `isBlacklisted` = ?, `blacklistedAt` = ? WHERE `id` = ? OR `applicationNumber` = ?',
          { replacements: [isBlkVal, blkAtVal, idVal, appNumVal] }
        );
      } catch (sqlErr) {
        try {
          await expertDb.query(
            'UPDATE `experts` SET `isBlacklisted` = ?, `blacklistedAt` = ? WHERE `id` = ? OR `applicationNumber` = ?',
            { replacements: [isBlkVal, blkAtVal, idVal, appNumVal] }
          );
        } catch (sqlErr2) {
          console.warn('[Direct SQL Sync Warning]:', sqlErr2.message);
        }
      }
    }

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
      { [Op.or]: [{ status: { [Op.in]: QUEUE_STATUSES } }, SIGNUP_COMPLETE_DRAFT_WHERE] },
      { attributes: ['status', 'submittedAt', 'createdAt'], include: [] },
    );

    const counts = {
      all: experts.length,
      pending: 0,
      in_review: 0,
      on_hold: 0,
      approved: 0,
      rejected: 0,
      overdue: 0,
    };

    const now = Date.now();
    const SLA_MS = 48 * 60 * 60 * 1000;

    for (const expert of experts) {
      const frontendStatus = BACKEND_TO_FRONTEND_STATUS[expert.status] || 'pending';
      if (frontendStatus in counts) {
        counts[frontendStatus] += 1;
      }
      const submitted = expert.submittedAt || expert.createdAt;
      if (submitted && now - new Date(submitted).getTime() >= SLA_MS) {
        counts.overdue += 1;
      }
    }

    return res.status(200).json(counts);
  } catch (error) {
    console.error('Get Application Stats Error:', error);
    return res.status(500).json({ message: 'Server error retrieving application stats', error: error.message });
  }
};

/**
 * Update section review decision and clarifications on an expert application
 */
export const updateApplicationSectionDecision = async (req, res) => {
  const { id } = req.params;
  const { sectionId, decision, note, notes, clarificationStatus, sectionDecisions } = req.body;

  try {
    const expert = await findExpertForAdmin(buildDetailWhere(id));
    if (!expert) {
      return res.status(404).json({ message: 'Application not found' });
    }

    let metadata = safeParseOnboardingMetadata(expert.onboardingMetadata);

    const currentSectionDecisions = metadata.sectionDecisions || {};
    const currentClarifications = metadata.sectionClarifications || {};
    let currentAuditLogs = metadata.sectionAuditLogs || [];
    if (!Array.isArray(currentAuditLogs) || currentAuditLogs.length === 0) {
      currentAuditLogs = synthesizeLegacyAuditLogs(metadata);
    }

    if (sectionDecisions && typeof sectionDecisions === 'object') {
      // Bulk update
      Object.entries(sectionDecisions).forEach(([secKey, secVal]) => {
        if (!secVal) return;
        const previousDecision = currentSectionDecisions[secKey]?.decision || null;
        const previousNote = currentSectionDecisions[secKey]?.note ||
          (currentSectionDecisions[secKey]?.notes && currentSectionDecisions[secKey]?.notes[currentSectionDecisions[secKey]?.notes.length - 1]?.text) || '';
        const currentNote = secVal.note ||
          (secVal.notes && secVal.notes[secVal.notes.length - 1]?.text) || '';

        currentSectionDecisions[secKey] = {
          decision: secVal.decision || null,
          note: secVal.note || '',
          notes: secVal.notes || [],
          clarificationStatus: secVal.clarificationStatus || (secVal.decision === 'clarification' ? 'waiting' : undefined),
          clarificationRequestedAt: secVal.decision === 'clarification' ? (secVal.clarificationRequestedAt || new Date().toISOString()) : undefined,
          updatedAt: new Date().toISOString(),
        };

        const decisionChanged = Boolean(secVal.decision && secVal.decision !== previousDecision);
        const noteChanged = Boolean(currentNote && currentNote !== previousNote);

        if (decisionChanged || noteChanged) {
          currentAuditLogs = appendSectionAuditEvent(currentAuditLogs, {
            sectionId: secKey,
            action: secVal.decision,
            note: currentNote,
            previousDecision,
            newDecision: secVal.decision,
          }, req.admin);
        }

        if (secVal.decision === 'clarification') {
          currentClarifications[secKey] = {
            sectionId: secKey,
            status: secVal.clarificationStatus || 'waiting',
            requestedAt: secVal.clarificationRequestedAt || new Date().toISOString(),
            note: secVal.note || (secVal.notes && secVal.notes[secVal.notes.length - 1]?.text) || '',
            notes: secVal.notes || [],
            receivedAt: secVal.clarificationStatus === 'received' ? (secVal.clarificationReceivedAt || new Date().toISOString()) : null,
          };
        } else if (secVal.decision === 'approve' || secVal.decision === 'reject') {
          delete currentClarifications[secKey];
        }
      });
    } else if (sectionId) {
      // Single section update
      const previousDecision = currentSectionDecisions[sectionId]?.decision || null;
      const previousNote = currentSectionDecisions[sectionId]?.note ||
        (currentSectionDecisions[sectionId]?.notes && currentSectionDecisions[sectionId]?.notes[currentSectionDecisions[sectionId]?.notes.length - 1]?.text) || '';

      currentSectionDecisions[sectionId] = {
        decision: decision || null,
        note: note || '',
        notes: notes || [],
        clarificationStatus: decision === 'clarification' ? (clarificationStatus || 'waiting') : undefined,
        clarificationRequestedAt: decision === 'clarification' ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };

      const effectiveNote = note || (notes && notes[notes.length - 1]?.text) || '';
      const decisionChanged = (decision || null) !== previousDecision;
      const noteChanged = Boolean(effectiveNote && effectiveNote !== previousNote);

      if (decisionChanged || noteChanged || (previousDecision && !decision && !effectiveNote)) {
        currentAuditLogs = appendSectionAuditEvent(currentAuditLogs, {
          sectionId,
          action: decision || (effectiveNote ? 'note_added' : 'cleared'),
          note: effectiveNote,
          previousDecision,
          newDecision: decision || null,
        }, req.admin);
      }

      if (decision === 'clarification') {
        currentClarifications[sectionId] = {
          sectionId,
          status: clarificationStatus || 'waiting',
          requestedAt: new Date().toISOString(),
          note: note || (notes && notes[notes.length - 1]?.text) || '',
          notes: notes || [],
          receivedAt: clarificationStatus === 'received' ? new Date().toISOString() : null,
        };
      } else if (decision === 'approve' || decision === 'reject') {
        delete currentClarifications[sectionId];
      }
    }

    metadata.sectionDecisions = currentSectionDecisions;
    metadata.sectionClarifications = currentClarifications;
    metadata.sectionAuditLogs = cleanAndDeduplicateAuditLogs(currentAuditLogs);

    expert.onboardingMetadata = { ...metadata };
    expert.changed('onboardingMetadata', true);
    await saveExpertForAdmin(expert);

    const updated = await findExpertByIdForAdmin(expert.id);
    return res.status(200).json({
      message: 'Section decision updated successfully',
      expert: serializeExpert(updated),
    });
  } catch (error) {
    console.error('Update Section Decision Error:', error);
    return res.status(500).json({ message: 'Server error updating section decision', error: error.message });
  }
};

