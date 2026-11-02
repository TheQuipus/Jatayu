import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const page = fs.readFileSync(
  new URL('../app/expert/expert-onboarding/page.tsx', import.meta.url),
  'utf8',
);
const audienceStep = fs.readFileSync(
  new URL('../components/expert/onboarding/AudienceStep.tsx', import.meta.url),
  'utf8',
);
const profileView = fs.readFileSync(
  new URL('../components/expert/profile/ExpertProfileView.tsx', import.meta.url),
  'utf8',
);
const profileApi = fs.readFileSync(
  new URL('../lib/expertProfileApi.ts', import.meta.url),
  'utf8',
);
const audienceLibrary = fs.readFileSync(
  new URL('../lib/expertAudience.ts', import.meta.url),
  'utf8',
);
const { outputText } = ts.transpileModule(audienceLibrary, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const {
  buildAudiencePersistencePayload,
  getExpertProfileAudienceValues,
  getPreferredExpertSelectionValues,
  reconcileHydratedSelections,
  normalizeExpertSelectionValues,
} = loaded.exports;

test('parent passes saved languages and audiences back to Step 7 on remount', () => {
  assert.match(page, /initialLanguages=\{languages\}/);
  assert.match(page, /initialAudiences=\{selectedAudiences\}/);
  assert.match(page, /buildAudiencePersistencePayload\(nextLanguages, audiences\)/);
});

test('Step 7 restores saved selections after asynchronous profile hydration', () => {
  assert.match(audienceStep, /useState<string\[\]>\(\(\) => initialLanguages\)/);
  assert.match(audienceStep, /useState<string\[\]>\(\(\) => initialAudiences\)/);
  assert.match(audienceStep, /reconcileHydratedSelections\(current, initialLanguages, hasUserEditedSelections\.current\)/);
  assert.match(audienceStep, /reconcileHydratedSelections\(current, initialAudiences, hasUserEditedSelections\.current\)/);
  assert.match(audienceStep, /onContinue\(\{ languages, audiences: selectedAudiences \}\)/);
});

test('audience saves use the latest selections in both API fields and metadata', () => {
  const payload = buildAudiencePersistencePayload(
    ['English', 'Hindi', 'Hindi'],
    ['startup', 'enterprise', 'startup'],
  );
  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    step: 'availability',
    focusAreas: ['English', 'Hindi'],
    targetAudience: ['startup', 'enterprise'],
    onboardingMetadata: {
      languages: ['English', 'Hindi'],
      audiences: ['startup', 'enterprise'],
    },
  });
});

test('delayed hydration updates untouched values without overwriting user edits', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(reconcileHydratedSelections([], ['English', 'Hindi'], false))),
    ['English', 'Hindi'],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(
      reconcileHydratedSelections(['English', 'Tamil'], ['English', 'Hindi'], true),
    )),
    ['English', 'Tamil'],
  );
});

test('normalization safely handles empty, missing, and duplicate values', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(normalizeExpertSelectionValues(null, '[" Hindi ", "Hindi", "English"]'))),
    ['Hindi', 'English'],
  );
  assert.deepEqual(Array.from(normalizeExpertSelectionValues(undefined, [])), []);
});

test('Profile View displays metadata-only audiences and deduplicates both sources', () => {
  assert.match(profileView, /getExpertProfileAudienceValues\(\s*record\.targetAudience,\s*metadata\.audiences/);
  assert.match(profileApi, /getPreferredExpertSelectionValues\(\s*metadata\.languages,\s*normalizedExpert\.focusAreas/);
  assert.deepEqual(
    JSON.parse(JSON.stringify(getExpertProfileAudienceValues(
      null,
      ['startup', 'enterprise', 'startup'],
    ))),
    ['startup', 'enterprise'],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(getExpertProfileAudienceValues(
      '["startup","enterprise"]',
      ['Enterprise', 'career'],
    ))),
    ['startup', 'enterprise'],
  );
});

test('profile values use saved metadata only when canonical fields are empty', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(getPreferredExpertSelectionValues([], ['Hindi', 'English']))),
    ['Hindi', 'English'],
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(getPreferredExpertSelectionValues(['English'], ['Hindi']))),
    ['English'],
  );
});
