/**
 * Utility for managing Section and Application Decision Audit Logs.
 */

export const SECTION_TITLES = {
  category: 'Category & Skills',
  experience: 'Work Experience & Portfolio',
  profile: 'Profile Details',
  credentials: 'Credentials & KYC',
  preferences: 'Consultation Preferences',
  audience: 'Audience & Languages',
  availability: 'Availability & Schedule',
  application: 'Application Overall',
};

const ACTION_BADGES = {
  approve: 'APPROVED',
  clarification: 'CLARIFICATION',
  reject: 'REJECTED',
  note_added: 'NOTE ADDED',
  cleared: 'CLEARED',
  clarification_response: 'RESPONSE RECEIVED',
  on_hold: 'ON HOLD',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  blacklisted: 'BLACKLISTED',
};

/**
 * Normalizes legacy section titles and eliminates duplicate entries
 * for the same section with identical action and note.
 */
export function cleanAndDeduplicateAuditLogs(rawLogs = []) {
  if (!Array.isArray(rawLogs)) return [];

  const seenPerSection = new Map();
  const cleaned = [];

  for (const item of rawLogs) {
    if (!item || typeof item !== 'object') continue;

    const entry = { ...item };
    const secKey = entry.sectionId || 'application';

    // Normalize legacy section title
    if (secKey === 'preferences' || entry.sectionTitle === 'Preferences & Pricing') {
      entry.sectionTitle = 'Consultation Preferences';
    } else if (!entry.sectionTitle && SECTION_TITLES[secKey]) {
      entry.sectionTitle = SECTION_TITLES[secKey];
    }

    const trimmedNote = entry.note ? String(entry.note).trim() : '';
    entry.note = trimmedNote;

    const previousForSection = seenPerSection.get(secKey);
    const isDuplicate =
      previousForSection &&
      previousForSection.action === entry.action &&
      (previousForSection.note || '') === trimmedNote;

    if (!isDuplicate) {
      cleaned.push(entry);
      seenPerSection.set(secKey, entry);
    }
  }

  return cleaned.slice(0, 200);
}

/**
 * Appends an audit event to the existing log list.
 * Sort order is newest first.
 */
export function appendSectionAuditEvent(currentLogs = [], eventData = {}, admin = null) {
  const logs = cleanAndDeduplicateAuditLogs(currentLogs);

  const actor = {
    id: admin?.id || null,
    name: admin?.fullName || 'Super Admin',
    role: admin?.role || 'Admin',
    email: admin?.email || null,
  };

  const action = eventData.action || 'update';
  const badgeLabel = eventData.badgeLabel || ACTION_BADGES[action] || action.toUpperCase();
  const sectionId = eventData.sectionId || 'application';
  const sectionTitle =
    (sectionId === 'preferences'
      ? 'Consultation Preferences'
      : (SECTION_TITLES[sectionId] || eventData.sectionTitle || (sectionId === 'application' ? 'Application Overall' : sectionId)));

  const trimmedNote = eventData.note ? String(eventData.note).trim() : '';

  // Prevent duplicate: check if the most recent event for THIS section already has the exact same action and note
  const latestForThisSection = logs.find((l) => (l.sectionId || 'application') === sectionId);
  if (
    latestForThisSection &&
    latestForThisSection.action === action &&
    (latestForThisSection.note || '') === trimmedNote
  ) {
    return logs;
  }

  const newEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    sectionId,
    sectionTitle,
    action,
    badgeLabel,
    note: trimmedNote,
    actor,
    timestamp: eventData.timestamp || new Date().toISOString(),
    previousDecision: eventData.previousDecision || null,
    newDecision: eventData.newDecision || null,
  };

  return [newEntry, ...logs].slice(0, 200);
}

/**
 * Synthesizes initial audit logs from existing sectionDecisions and sectionClarifications
 * for applications created before audit logging was enabled.
 */
export function synthesizeLegacyAuditLogs(metadata = {}) {
  const syntheticLogs = [];
  const sectionDecisions = (metadata && typeof metadata === 'object' && metadata.sectionDecisions) || {};
  const clarifications = (metadata && typeof metadata === 'object' && metadata.sectionClarifications) || {};

  Object.entries(sectionDecisions).forEach(([secKey, dec]) => {
    if (!dec || !dec.decision) return;
    const action = dec.decision;
    const clar = clarifications[secKey];
    syntheticLogs.push({
      id: `legacy-${secKey}`,
      sectionId: secKey,
      sectionTitle: SECTION_TITLES[secKey] || secKey,
      action,
      badgeLabel: ACTION_BADGES[action] || action.toUpperCase(),
      note: dec.note || (dec.notes && dec.notes[dec.notes.length - 1]?.text) || (clar && clar.note) || '',
      actor: {
        name: 'Super Admin',
        role: 'Admin',
      },
      timestamp: dec.updatedAt || dec.clarificationRequestedAt || (clar && clar.requestedAt) || new Date().toISOString(),
      previousDecision: null,
      newDecision: dec.decision,
    });
  });

  const sorted = syntheticLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return cleanAndDeduplicateAuditLogs(sorted);
}

