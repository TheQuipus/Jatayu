import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = fs.readFileSync(
  new URL('../lib/expertAuth.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, {
  module: loaded,
  exports: loaded.exports,
  require: (name) => {
    if (name === '@/lib/api') {
      return {
        getToken: () => null,
        setToken: () => {},
        setExpertId: () => {},
        removeToken: () => {},
        removeExpertId: () => {},
      };
    }
    if (name === '@/lib/expertDashboard') return { EXPERT_DASHBOARD_HREF: '/expert/dashboard' };
    if (name === '@/lib/uuid') return { generateUUID: () => 'test-id' };
    if (name === '@/lib/expertApplicationsStore') return { clearExpertApplicationDraft: () => {} };
    throw new Error(`Unexpected dependency: ${name}`);
  },
});
const { getCompletedOnboardingStepFlags, resolveOnboardingStep } = loaded.exports;
const page = fs.readFileSync(
  new URL('../app/expert/expert-onboarding/page.tsx', import.meta.url),
  'utf8',
);

test('restores completed progress from the backend persisted next onboarding step', () => {
  assert.deepEqual(
    { ...getCompletedOnboardingStepFlags('audience') },
    { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true },
  );
  assert.deepEqual(
    { ...getCompletedOnboardingStepFlags('review') },
    { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
  );
  assert.deepEqual({ ...getCompletedOnboardingStepFlags('category') }, {});
  assert.deepEqual({ ...getCompletedOnboardingStepFlags(undefined) }, {});
});

test('login fetches and hydrates the full saved profile before routing to its saved step', () => {
  const loginHandler = page.match(/const handleLoginComplete = async[\s\S]*?\n  };/)?.[0];
  assert.ok(loginHandler, 'login completion handler should be present');
  assert.match(loginHandler, /await getProfile\(\)/);
  assert.match(loginHandler, /hydrateFromProfile\(snapshot\)/);
  assert.match(loginHandler, /routeAfterAuth\(snapshot\)/);
  assert.match(page, /setSavedStepCompletion\(getCompletedOnboardingStepFlags\(user\.onboardingStep\)\)/);
  const hydration = page.match(/function hydrateFromProfile\([\s\S]*?\n  \}/)?.[0];
  assert.ok(hydration, 'profile hydration function should be present');
  assert.match(hydration, /setSelectedCategory\(known\.id\)/);
  assert.match(hydration, /setSelectedSkills\(user\.skills\)/);
  assert.match(hydration, /setSelectedAudiences\(audiences\)/);
  assert.match(hydration, /setLanguages\(languages\)/);
  assert.equal(resolveOnboardingStep({ onboardingStep: 'audience' }), 'audience');
});
