import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeExpertSections,
  synthesizeOnboardingMilestoneLogs,
  mapWizardStepToReviewSection,
  hasExpertSectionData,
  calculateExpertCompletionPercent,
} from '../utils/expertDropoutAnalysis.js';
import { cleanAndDeduplicateAuditLogs } from '../utils/applicationAuditLog.js';

test('mapWizardStepToReviewSection maps wizard steps correctly', () => {
  assert.equal(mapWizardStepToReviewSection('category'), 'category');
  assert.equal(mapWizardStepToReviewSection('skills'), 'category');
  assert.equal(mapWizardStepToReviewSection('experience'), 'experience');
  assert.equal(mapWizardStepToReviewSection('identity'), 'profile');
  assert.equal(mapWizardStepToReviewSection('credentials'), 'credentials');
  assert.equal(mapWizardStepToReviewSection('preferences'), 'preferences');
  assert.equal(mapWizardStepToReviewSection('audience'), 'audience');
  assert.equal(mapWizardStepToReviewSection('availability'), 'availability');
  assert.equal(mapWizardStepToReviewSection('review'), 'completed');
  assert.equal(mapWizardStepToReviewSection('success'), 'completed');
});

test('analyzeExpertSections flags dropout when idle > 15 minutes for draft', () => {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const expert = {
    id: 'exp-1',
    fullName: 'Test Expert',
    status: 'draft',
    onboardingStep: 'credentials',
    category: 'Business Strategy',
    skills: ['Strategy', 'Leadership'],
    updatedAt: thirtyMinAgo,
    createdAt: thirtyMinAgo,
  };

  const analysis = analyzeExpertSections(expert);
  assert.equal(analysis.isComplete, false);
  assert.equal(analysis.isDropout, true);
  assert.equal(analysis.isActiveInProgress, false);
  assert.equal(analysis.dropoutStep, 'credentials');
  assert.equal(analysis.dropoutStepTitle, 'Credentials & KYC');
  assert.ok(analysis.idleMinutes >= 30);

  // Check section statuses
  const catStep = analysis.steps.find((s) => s.id === 'category');
  assert.equal(catStep.status, 'submitted');

  const expStep = analysis.steps.find((s) => s.id === 'experience');
  assert.equal(expStep.status, 'skipped'); // index < activeIndex and no data

  const credStep = analysis.steps.find((s) => s.id === 'credentials');
  assert.equal(credStep.status, 'dropout');

  const prefStep = analysis.steps.find((s) => s.id === 'preferences');
  assert.equal(prefStep.status, 'pending');
});

test('analyzeExpertSections flags in_progress when active within 15 minutes', () => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const expert = {
    id: 'exp-2',
    fullName: 'Active Expert',
    status: 'draft',
    onboardingStep: 'experience',
    updatedAt: fiveMinAgo,
    createdAt: fiveMinAgo,
  };

  const analysis = analyzeExpertSections(expert);
  assert.equal(analysis.isComplete, false);
  assert.equal(analysis.isDropout, false);
  assert.equal(analysis.isActiveInProgress, true);
  assert.equal(analysis.activeStep, 'experience');

  const expStep = analysis.steps.find((s) => s.id === 'experience');
  assert.equal(expStep.status, 'in_progress');
});

test('analyzeExpertSections evaluates completed application correctly', () => {
  const expert = {
    id: 'exp-3',
    fullName: 'Complete Expert',
    status: 'pending_review',
    submittedAt: new Date().toISOString(),
    category: 'Technology',
    skills: ['React', 'Node.js'],
    professionalTitle: 'Principal Architect',
    bio: 'Experienced engineer',
    selectedFormats: ['video', 'chat'],
    formatPrices: { video: 1000 },
    languages: ['English'],
    availabilitySlots: [{ days: ['monday'], time: '09:00-17:00' }],
    // No experience positions or credentials uploaded
  };

  const analysis = analyzeExpertSections(expert);
  assert.equal(analysis.isComplete, true);
  assert.equal(analysis.isDropout, false);

  const catStep = analysis.steps.find((s) => s.id === 'category');
  assert.equal(catStep.status, 'submitted');

  const expStep = analysis.steps.find((s) => s.id === 'experience');
  assert.equal(expStep.status, 'skipped');

  const prefStep = analysis.steps.find((s) => s.id === 'preferences');
  assert.equal(prefStep.status, 'submitted');
});

test('synthesizeOnboardingMilestoneLogs creates clean chronologic timeline', () => {
  const expert = {
    id: 'exp-4',
    fullName: 'Timeline Expert',
    email: 'timeline@expert.com',
    phone: '9876543210',
    status: 'pending_review',
    category: 'Finance',
    skills: ['Tax', 'Auditing'],
    submittedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  };

  const milestones = synthesizeOnboardingMilestoneLogs(expert);
  assert.ok(milestones.length >= 3);

  // First milestone should be account verified
  const accountVerified = milestones.find((m) => m.action === 'account_verified');
  assert.ok(accountVerified);
  assert.equal(accountVerified.sectionId, 'account');
  assert.equal(accountVerified.badgeLabel, 'VERIFIED');
  assert.match(accountVerified.note, /timeline@expert\.com/);

  // Application submitted milestone should exist
  const appSubmitted = milestones.find((m) => m.action === 'application_submitted');
  assert.ok(appSubmitted);
  assert.equal(appSubmitted.badgeLabel, 'SUBMITTED FOR REVIEW');

  // Clean deduplication check
  const deduped = cleanAndDeduplicateAuditLogs([...milestones, ...milestones]);
  assert.equal(deduped.length, milestones.length);
});

test('calculateExpertCompletionPercent divides 100% into 8 parts (12.5% each)', () => {
  // Scenario matching user screenshot (Image 1):
  // 1. Category & Skills: Primary Category filled, Skills empty -> 1 part
  // 2. Experience & Portfolio: Skipped -> 0 parts
  // 3. Profile Details: Filled & Submitted -> 1 part
  // 4. Credentials & KYC: Skipped -> 0 parts
  // 5. Consultation Preferences: Filled & Submitted -> 1 part
  // 6. Audience & Languages: Dropout -> 0 parts
  // 7. Availability: Pending -> 0 parts
  // Total earned: 3 parts / 8 = 37.5% -> 38%
  const mockExpert = {
    id: 'exp-5',
    category: 'Data Science',
    skills: [], // empty skills
    employmentPositions: [],
    educationDegrees: [],
    professionalTitle: 'Lead Data Scientist',
    bio: '10+ years in ML',
    certificates: [],
    selectedFormats: ['video'],
    languages: ['English'],
    availabilitySlots: [],
  };

  const steps = [
    { id: 'category', title: 'Category & Skills', status: 'submitted' },
    { id: 'experience', title: 'Experience & Portfolio', status: 'skipped' },
    { id: 'profile', title: 'Profile Details', status: 'submitted' },
    { id: 'credentials', title: 'Credentials & KYC', status: 'skipped' },
    { id: 'preferences', title: 'Consultation Preferences', status: 'submitted' },
    { id: 'audience', title: 'Audience & Languages', status: 'dropout' },
    { id: 'availability', title: 'Availability', status: 'pending' },
  ];

  const pct = calculateExpertCompletionPercent(mockExpert, steps);
  assert.equal(pct, 38, '3 of 8 parts must equal 38%');
});

test('calculateExpertCompletionPercent gives 100% when all 8 parts are submitted', () => {
  const fullExpert = {
    id: 'exp-6',
    category: 'Technology',
    skills: ['Architecture', 'Cloud'], // Parts 1 & 2
    employmentPositions: [{ company: 'Google', jobTitle: 'Engineer' }], // Part 3
    professionalTitle: 'Tech Lead', // Part 4
    certificates: [{ name: 'Cloud Architect' }], // Part 5
    selectedFormats: ['video'], // Part 6
    languages: ['English'], // Part 7
    availabilitySlots: [{ days: ['Mon'], time: '10:00' }], // Part 8
  };

  const steps = [
    { id: 'category', title: 'Category & Skills', status: 'submitted' },
    { id: 'experience', title: 'Experience & Portfolio', status: 'submitted' },
    { id: 'profile', title: 'Profile Details', status: 'submitted' },
    { id: 'credentials', title: 'Credentials & KYC', status: 'submitted' },
    { id: 'preferences', title: 'Consultation Preferences', status: 'submitted' },
    { id: 'audience', title: 'Audience & Languages', status: 'submitted' },
    { id: 'availability', title: 'Availability', status: 'submitted' },
  ];

  const pct = calculateExpertCompletionPercent(fullExpert, steps);
  assert.equal(pct, 100);
});

