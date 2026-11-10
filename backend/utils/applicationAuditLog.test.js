import assert from 'assert';
import {
  SECTION_TITLES,
  cleanAndDeduplicateAuditLogs,
  appendSectionAuditEvent,
  synthesizeLegacyAuditLogs,
} from './applicationAuditLog.js';

console.log('--- Testing applicationAuditLog.js ---');

// 0. Section Titles & Consistency
{
  assert.strictEqual(SECTION_TITLES.preferences, 'Consultation Preferences');
  console.log('✓ Section title for preferences is correctly "Consultation Preferences".');
}

// 1. Basic appending
{
  const logs = [];
  const admin = { id: 1, fullName: 'Rahul Sharma', role: 'Super Admin', email: 'rahul@jatayu.com' };
  const updated = appendSectionAuditEvent(logs, {
    sectionId: 'category',
    action: 'clarification',
    note: 'Please provide certified documents',
  }, admin);

  assert.strictEqual(updated.length, 1);
  assert.strictEqual(updated[0].sectionId, 'category');
  assert.strictEqual(updated[0].sectionTitle, SECTION_TITLES.category);
  assert.strictEqual(updated[0].action, 'clarification');
  assert.strictEqual(updated[0].badgeLabel, 'CLARIFICATION');
  assert.strictEqual(updated[0].note, 'Please provide certified documents');
  assert.strictEqual(updated[0].actor.name, 'Rahul Sharma');
  assert.strictEqual(updated[0].actor.role, 'Super Admin');
  console.log('✓ Basic appending verified.');
}

// 2. Deduplication within 5 seconds
{
  const admin = { id: 1, fullName: 'Rahul Sharma', role: 'Super Admin' };
  let logs = [];
  logs = appendSectionAuditEvent(logs, {
    sectionId: 'experience',
    action: 'approve',
    note: '',
  }, admin);

  assert.strictEqual(logs.length, 1);

  // Immediate duplicate call with same section, action, note
  logs = appendSectionAuditEvent(logs, {
    sectionId: 'experience',
    action: 'approve',
    note: '',
  }, admin);

  assert.strictEqual(logs.length, 1, 'Duplicate event should be ignored within 5 seconds');
  console.log('✓ Deduplication verified.');
}

// 3. Different actions or sections are preserved
{
  const admin = { id: 1, fullName: 'Rahul Sharma', role: 'Super Admin' };
  let logs = [];
  logs = appendSectionAuditEvent(logs, {
    sectionId: 'category',
    action: 'clarification',
    note: 'First note',
  }, admin);

  logs = appendSectionAuditEvent(logs, {
    sectionId: 'category',
    action: 'approve',
    note: 'Approved after review',
  }, admin);

  assert.strictEqual(logs.length, 2);
  assert.strictEqual(logs[0].action, 'approve'); // newest first
  assert.strictEqual(logs[1].action, 'clarification');
  console.log('✓ Newest-first ordering preserved.');
}

// 4. Legacy metadata synthesis
{
  const metadata = {
    sectionDecisions: {
      category: {
        decision: 'clarification',
        note: 'Legacy clarification note',
        updatedAt: '2026-11-02T10:00:00.000Z',
      },
      experience: {
        decision: 'approve',
        note: '',
        updatedAt: '2026-11-02T11:00:00.000Z',
      },
    },
  };

  const synthesized = synthesizeLegacyAuditLogs(metadata);
  assert.strictEqual(synthesized.length, 2);
  // Experience (11:00) should be before Category (10:00)
  assert.strictEqual(synthesized[0].sectionId, 'experience');
  assert.strictEqual(synthesized[0].badgeLabel, 'APPROVED');
  assert.strictEqual(synthesized[1].sectionId, 'category');
  assert.strictEqual(synthesized[1].badgeLabel, 'CLARIFICATION');
  assert.strictEqual(synthesized[1].note, 'Legacy clarification note');
  console.log('✓ Legacy metadata synthesis verified.');
}

// 5. cleanAndDeduplicateAuditLogs normalizes titles and removes duplicates
{
  const rawLogs = [
    {
      id: '1',
      sectionId: 'preferences',
      sectionTitle: 'Preferences & Pricing',
      action: 'clarification',
      note: 'make text 105',
    },
    {
      id: '2',
      sectionId: 'preferences',
      sectionTitle: 'Preferences & Pricing',
      action: 'clarification',
      note: 'make text 105',
    },
    {
      id: '3',
      sectionId: 'category',
      sectionTitle: 'Category & Skills',
      action: 'approve',
      note: '',
    },
    {
      id: '4',
      sectionId: 'preferences',
      sectionTitle: 'Consultation Preferences',
      action: 'clarification',
      note: 'make text 105',
    },
  ];

  const cleaned = cleanAndDeduplicateAuditLogs(rawLogs);
  // The two duplicate entries for preferences should be collapsed to 1
  assert.strictEqual(cleaned.length, 2);
  assert.strictEqual(cleaned[0].sectionTitle, 'Consultation Preferences');
  assert.strictEqual(cleaned[0].note, 'make text 105');
  assert.strictEqual(cleaned[1].sectionId, 'category');
  console.log('✓ cleanAndDeduplicateAuditLogs verified.');
}

// 6. Deep deduplication when other sections intervene
{
  const admin = { id: 1, fullName: 'Rahul Sharma', role: 'Super Admin' };
  let logs = [];
  logs = appendSectionAuditEvent(logs, {
    sectionId: 'preferences',
    action: 'clarification',
    note: 'make text 105',
  }, admin);

  // Another section updated in between
  logs = appendSectionAuditEvent(logs, {
    sectionId: 'experience',
    action: 'approve',
    note: 'looks good',
  }, admin);

  assert.strictEqual(logs.length, 2);

  // Attempt to re-log preferences with exact same action and note
  logs = appendSectionAuditEvent(logs, {
    sectionId: 'preferences',
    action: 'clarification',
    note: 'make text 105',
  }, admin);

  assert.strictEqual(logs.length, 2, 'Should not duplicate even when other section events intervened');

  // But updating note on preferences should be recorded
  logs = appendSectionAuditEvent(logs, {
    sectionId: 'preferences',
    action: 'clarification',
    note: 'make text 200',
  }, admin);

  assert.strictEqual(logs.length, 3);
  assert.strictEqual(logs[0].note, 'make text 200');
  console.log('✓ Deep deduplication and note change allowance verified.');
}

console.log('All applicationAuditLog tests passed successfully!');

