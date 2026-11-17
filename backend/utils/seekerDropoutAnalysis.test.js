import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeSeekerDropout, DROPOUT_IDLE_MINUTES } from './seekerDropoutAnalysis.js';

test('analyzeSeekerDropout - should handle empty/null seeker gracefully', () => {
  const result = analyzeSeekerDropout(null);
  assert.equal(result.isComplete, false);
  assert.equal(result.isDropout, false);
  assert.equal(result.steps.length, 0);
});

test('analyzeSeekerDropout - fresh signup stalled at category with idle > 15m should be dropout', () => {
  const twentyMinsAgo = new Date(Date.now() - 20 * 60 * 1000);
  const seeker = {
    id: 'seeker-1',
    category: null,
    onboardingStep: 'category',
    onboardingCompletedAt: null,
    status: 'draft',
    updatedAt: twentyMinsAgo,
  };

  const result = analyzeSeekerDropout(seeker);
  assert.equal(result.isComplete, false);
  assert.equal(result.isDropout, true);
  assert.equal(result.dropoutStep, 'category');
  assert.equal(result.dropoutStepTitle, 'Category');
  assert.equal(result.steps[0].status, 'dropout');
  assert.equal(result.steps[1].status, 'pending');
});

test('analyzeSeekerDropout - active user stalled at category < 15m should be in_progress', () => {
  const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
  const seeker = {
    id: 'seeker-2',
    category: null,
    onboardingStep: 'category',
    onboardingCompletedAt: null,
    status: 'draft',
    updatedAt: fiveMinsAgo,
  };

  const result = analyzeSeekerDropout(seeker);
  assert.equal(result.isComplete, false);
  assert.equal(result.isDropout, false);
  assert.equal(result.isActiveInProgress, true);
  assert.equal(result.steps[0].status, 'in_progress');
});

test('analyzeSeekerDropout - partial progress with skipped steps and dropout at budget', () => {
  const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
  const seeker = {
    id: 'seeker-3',
    category: 'business-entrepreneurship',
    topics: ['Startup strategy'],
    needsText: '', // skipped needs
    selectedNeedChips: [],
    selectedFormats: ['video', 'chat'], // submitted format
    selectedBudget: null, // stalled at budget
    onboardingStep: 'budget',
    onboardingCompletedAt: null,
    status: 'draft',
    updatedAt: thirtyMinsAgo,
  };

  const result = analyzeSeekerDropout(seeker);
  assert.equal(result.isComplete, false);
  assert.equal(result.isDropout, true);
  assert.equal(result.dropoutStep, 'budget');
  assert.equal(result.dropoutStepTitle, 'Budget Tier');
  assert.equal(result.submittedCount, 2); // category, format
  assert.equal(result.skippedCount, 1); // needs
  assert.equal(result.steps[0].status, 'submitted'); // category
  assert.equal(result.steps[1].status, 'skipped'); // needs
  assert.equal(result.steps[2].status, 'submitted'); // format
  assert.equal(result.steps[3].status, 'dropout'); // budget
  assert.equal(result.steps[4].status, 'pending'); // personalisation
  assert.equal(result.steps[5].status, 'pending'); // review
});

test('analyzeSeekerDropout - fully completed onboarding should have 100% and no dropout', () => {
  const seeker = {
    id: 'seeker-4',
    category: 'career-work',
    topics: ['Interview Prep'],
    needsText: 'Need help with salary negotiation',
    selectedNeedChips: ['Negotiation'],
    selectedFormats: ['video'],
    selectedBudget: 'standard',
    selectedLanguages: ['English'],
    location: 'Bangalore',
    onboardingStep: 'success',
    onboardingCompletedAt: new Date(Date.now() - 2 * 86400000),
    status: 'active',
  };

  const result = analyzeSeekerDropout(seeker);
  assert.equal(result.isComplete, true);
  assert.equal(result.isDropout, false);
  assert.equal(result.dropoutStep, null);
  assert.equal(result.completionPercent, 100);
  assert.equal(result.steps.every((s) => s.status === 'submitted'), true);
});

