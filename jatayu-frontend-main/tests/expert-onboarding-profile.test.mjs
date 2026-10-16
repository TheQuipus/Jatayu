import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(file) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loaded, exports: loaded.exports,
    require: (name) => {
      if (['@/lib/api', '@/lib/expertStore'].includes(name)) return {};
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return loaded.exports;
}

const { normalizeBackendProfile } = load('lib/expertProfileApi.ts');
const { formatPreferencesPricingSummary } = load('components/expert/onboarding/preferencesData.ts');

for (const serialized of [false, true]) {
  test(`resumed review renders saved preferences (serialized=${serialized})`, () => {
    const encode = (value) => serialized ? JSON.stringify(value) : value;
    const profile = normalizeBackendProfile({
      onboardingStep: 'review', fullName: 'Returning Expert',
      skills: encode(['React']), selectedFormats: encode(['video']),
      selectedLengths: encode(['30']), formatPrices: encode({ video: '25' }),
      onboardingMetadata: encode({ languages: ['English'] }),
      availabilities: [{ id: 'slot', days: encode(['Mon']), fromTime: '09:00', toTime: '10:00' }],
    });
    assert.equal(profile.onboardingStep, 'review');
    assert.equal(profile.skills.join(', '), 'React');
    assert.equal(profile.selectedLengths.map(String).join(', '), '30');
    assert.equal(profile.availabilities[0].days.join(', '), 'Mon');
    assert.equal(profile.onboardingMetadata.languages[0], 'English');
    assert.match(formatPreferencesPricingSummary(profile.selectedFormats, profile.formatPrices), /25/);
  });
}

test('missing or invalid saved preferences render without crashing', () => {
  const profile = normalizeBackendProfile({
    selectedFormats: null, selectedLengths: '{invalid', skills: null,
    formatPrices: 'null', onboardingMetadata: '[]',
  });
  assert.equal(formatPreferencesPricingSummary(profile.selectedFormats, profile.formatPrices), 'Not selected');
  assert.doesNotThrow(() => profile.selectedLengths.map(String));
  assert.equal(profile.skills.length, 0);
});
