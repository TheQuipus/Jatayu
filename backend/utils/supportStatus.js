import { Op } from 'sequelize';

export const VIEWER_STATUS_LABELS = Object.freeze({
  new: 'New',
  in_progress: 'In Progress',
  response_received: 'Response Received',
  closed: 'Closed',
});

const ADMIN_ALLOWED_FILTERS = new Set([
  'all',
  'new',
  'in_progress',
  'response_received',
  'closed',
  'open',
  'replied',
]);

const REQUESTER_ALLOWED_FILTERS = new Set([
  'all',
  'in_progress',
  'response_received',
  'closed',
  'open',
  'replied',
]);

function normalizeViewerRole(viewerRole) {
  return viewerRole === 'admin' ? 'admin' : 'requester';
}

export function deriveViewerStatus(ticket, viewerRole) {
  const role = normalizeViewerRole(viewerRole);
  const dbStatus = String(ticket?.status || 'open').toLowerCase();
  const lastReplyBy = ticket?.lastReplyBy ? String(ticket.lastReplyBy).toLowerCase() : null;

  if (dbStatus === 'closed') {
    return { key: 'closed', label: VIEWER_STATUS_LABELS.closed };
  }

  if (!lastReplyBy) {
    if (role === 'admin') {
      return { key: 'new', label: VIEWER_STATUS_LABELS.new };
    }
    return { key: 'in_progress', label: VIEWER_STATUS_LABELS.in_progress };
  }

  if (lastReplyBy === 'requester') {
    if (role === 'admin') {
      return { key: 'response_received', label: VIEWER_STATUS_LABELS.response_received };
    }
    return { key: 'in_progress', label: VIEWER_STATUS_LABELS.in_progress };
  }

  // lastReplyBy === 'admin' (or legacy 'replied')
  if (role === 'admin') {
    return { key: 'in_progress', label: VIEWER_STATUS_LABELS.in_progress };
  }
  return { key: 'response_received', label: VIEWER_STATUS_LABELS.response_received };
}

export function isValidStatusFilter(viewerRole, statusFilter) {
  const normalized = String(statusFilter || 'all').trim().toLowerCase();
  if (normalizeViewerRole(viewerRole) === 'admin') {
    return ADMIN_ALLOWED_FILTERS.has(normalized);
  }
  return REQUESTER_ALLOWED_FILTERS.has(normalized);
}

export function buildViewerStatusWhere(viewerRole, statusFilter) {
  const role = normalizeViewerRole(viewerRole);
  const normalized = String(statusFilter || 'all').trim().toLowerCase();

  if (normalized === 'all') {
    return {};
  }

  if (normalized === 'closed') {
    return { status: 'closed' };
  }

  if (normalized === 'open') {
    return { status: 'open' };
  }

  if (normalized === 'replied') {
    return { status: 'open', lastReplyBy: 'admin' };
  }

  if (role === 'admin') {
    if (normalized === 'new') {
      return { status: 'open', lastReplyBy: null };
    }
    if (normalized === 'in_progress') {
      return { status: 'open', lastReplyBy: 'admin' };
    }
    if (normalized === 'response_received') {
      return { status: 'open', lastReplyBy: 'requester' };
    }
  } else {
    if (normalized === 'in_progress') {
      return {
        status: 'open',
        [Op.or]: [{ lastReplyBy: null }, { lastReplyBy: 'requester' }],
      };
    }
    if (normalized === 'response_received') {
      return { status: 'open', lastReplyBy: 'admin' };
    }
  }

  return {};
}
