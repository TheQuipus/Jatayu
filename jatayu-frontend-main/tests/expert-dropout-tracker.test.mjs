import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapWizardStepToReviewSection,
  ORDERED_EXPERT_REVIEW_STEPS,
  analyzeExpertDropoutClient,
  calculateExpertCompletionPercent,
} from '../lib/expertDropoutTracker.ts';

test('expertDropoutTracker - mapWizardStepToReviewSection maps all onboarding steps', () => {
  assert.equal(mapWizardStepToReviewSection('category'), 'category');
  assert.equal(mapWizardStepToReviewSection('skills'), 'category');
  assert.equal(mapWizardStepToReviewSection('experience'), 'experience');
  assert.equal(mapWizardStepToReviewSection('identity'), 'profile');
  assert.equal(mapWizardStepToReviewSection('credentials'), 'credentials');
  assert.equal(mapWizardStepToReviewSection('preferences'), 'preferences');
  assert.equal(mapWizardStepToReviewSection('audience'), 'audience');
  assert.equal(mapWizardStepToReviewSection('availability'), 'availability');
  assert.equal(mapWizardStepToReviewSection('review'), 'completed');
});

test('expertDropoutTracker - calculateExpertCompletionPercent divides 100% into 8 parts (12.5% each)', () => {
  // Scenario matching user screenshot (Image 1):
  // 1. Category & Skills: Primary Category filled, Skills empty -> 1 part
  // 2. Experience & Portfolio: Skipped -> 0 parts
  // 3. Profile Details: Filled & Submitted -> 1 part
  // 4. Credentials & KYC: Skipped -> 0 parts
  // 5. Consultation Preferences: Filled & Submitted -> 1 part
  // 6. Audience & Languages: Dropout -> 0 parts
  // 7. Availability: Pending -> 0 parts
  // Total earned: 3 parts / 8 = 37.5% -> 38%
  const mockApp = {
    appId: 'APP-1011',
    name: 'N V H Nikhil',
    status: 'not_submitted',
    onboardingStep: 'audience',
    categoryLabel: 'Data Science',
    skills: [], // empty skills
    employmentPositions: [],
    educationDegrees: [],
    professionalTitle: 'Lead Data Scientist',
    bio: '10+ years in ML',
    certificates: [],
    formats: ['video'],
    formatPrices: { video: '1500' },
    languages: ['English'],
    audiences: ['Engineers'],
    availabilitySlots: [],
    updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
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

  const pct = calculateExpertCompletionPercent(mockApp, steps);
  assert.equal(pct, 38, '3 of 8 parts must equal 38% (was formerly 71%)');
});

test('expertDropoutTracker - calculateExpertCompletionPercent gives 100% when all 8 parts are submitted', () => {
  const fullApp = {
    appId: 'APP-FULL',
    categoryLabel: 'Business Strategy',
    skills: ['Strategy', 'Finance'], // Part 1 + Part 2
    employmentPositions: [{ company: 'Corp A', jobTitle: 'CEO' }], // Part 3 (experience)
    professionalTitle: 'Executive Director', // Part 4 (profile)
    certificates: [{ name: 'PMP Cert' }], // Part 5 (credentials)
    formats: ['video', 'audio'], // Part 6 (preferences)
    onboardingMetadata: {
      targetAudience: 'Founders & Leaders', // Part 7 (audience)
    },
    languages: ['English'],
    availabilitySlots: [{ days: ['Monday'], time: '10:00-11:00' }], // Part 8 (availability)
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

  const pct = calculateExpertCompletionPercent(fullApp, steps);
  assert.equal(pct, 100);
});

test('expertDropoutTracker - calculateExpertCompletionPercent ignores skipped, dropout, and in_progress sections', () => {
  const partialApp = {
    appId: 'APP-PARTIAL',
    categoryLabel: 'Design',
    skills: ['Figma'], // 2 parts earned for Category & Skills
    employmentPositions: [{ company: 'Studio', jobTitle: 'Designer' }], // Filled but status is in_progress
    professionalTitle: 'Lead Designer', // Filled but status is skipped
  };

  const steps = [
    { id: 'category', title: 'Category & Skills', status: 'submitted' }, // +2 parts
    { id: 'experience', title: 'Experience & Portfolio', status: 'in_progress' }, // 0 parts
    { id: 'profile', title: 'Profile Details', status: 'skipped' }, // 0 parts
    { id: 'credentials', title: 'Credentials & KYC', status: 'pending' }, // 0 parts
    { id: 'preferences', title: 'Consultation Preferences', status: 'pending' },
    { id: 'audience', title: 'Audience & Languages', status: 'pending' },
    { id: 'availability', title: 'Availability', status: 'pending' },
  ];

  const pct = calculateExpertCompletionPercent(partialApp, steps);
  // 2 / 8 = 25%
  assert.equal(pct, 25);
});

test('expertDropoutTracker - analyzeExpertDropoutClient flags dropout after 15m idle', () => {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const mockApp = {
    appId: 'APP-1011',
    name: 'N V H Nikhil',
    status: 'not_submitted',
    onboardingStep: 'experience',
    updatedAt: thirtyMinAgo,
    categoryLabel: 'Business Strategy',
    skills: ['Strategy', 'Operations'],
    employmentPositions: [],
    educationDegrees: [],
    certificates: [],
    formats: [],
    formatPrices: {},
    languages: [],
    audiences: [],
    availabilitySlots: [],
    location: 'Bangalore',
    email: 'test@example.com',
    phone: '9876543210',
    termsAcceptedAt: thirtyMinAgo,
  };

  const analytics = analyzeExpertDropoutClient(mockApp);
  assert.equal(analytics.isComplete, false);
  assert.equal(analytics.isDropout, true);
  assert.equal(analytics.isActiveInProgress, false);
  assert.equal(analytics.dropoutStep, 'experience');
  assert.equal(analytics.dropoutStepTitle, 'Experience & Portfolio');
  assert.ok(analytics.idleMinutes >= 30);

  const catStep = analytics.steps.find((s) => s.id === 'category');
  assert.equal(catStep.status, 'submitted');

  const expStep = analytics.steps.find((s) => s.id === 'experience');
  assert.equal(expStep.status, 'dropout');

  const profStep = analytics.steps.find((s) => s.id === 'profile');
  assert.equal(profStep.status, 'pending');

  // Category and skills are submitted (2 parts = 25%)
  assert.equal(analytics.completionPercent, 25);
});

test('expertDropoutTracker - analyzeExpertDropoutClient flags in_progress when active < 15m', () => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const mockApp = {
    appId: 'APP-1012',
    name: 'Active Applicant',
    status: 'not_submitted',
    onboardingStep: 'profile',
    updatedAt: fiveMinAgo,
    categoryLabel: 'Engineering',
    skills: ['Architecture'],
    employmentPositions: [],
    educationDegrees: [],
    certificates: [],
    formats: [],
    formatPrices: {},
    languages: [],
    audiences: [],
    availabilitySlots: [],
    location: 'Delhi',
    email: 'eng@example.com',
    phone: '9876543211',
    termsAcceptedAt: fiveMinAgo,
  };

  const analytics = analyzeExpertDropoutClient(mockApp);
  assert.equal(analytics.isComplete, false);
  assert.equal(analytics.isDropout, false);
  assert.equal(analytics.isActiveInProgress, true);
  assert.equal(analytics.activeStep, 'profile');
  assert.equal(analytics.activeStepTitle, 'Profile Details');

  const profStep = analytics.steps.find((s) => s.id === 'profile');
  assert.equal(profStep.status, 'in_progress');
});
