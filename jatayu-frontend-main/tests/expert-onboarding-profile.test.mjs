import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

let preferencesDataModule;
let expertEmploymentModule;

function load(file) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loaded, exports: loaded.exports,
    URL,
    require: (name) => {
      if (['@/lib/api', '@/lib/expertStore'].includes(name)) return {};
      if (name === '@/components/expert/onboarding/preferencesData') {
        return preferencesDataModule;
      }
      if (name === '@/lib/expertEmployment') return expertEmploymentModule;
      if (name === '@/lib/uuid') return { generateUUID: () => 'test-id' };
      if (name === '@/lib/expertDashboard') return { EXPERT_DASHBOARD_HREF: '/expert/dashboard/' };
      if (name === '@/lib/expertApplicationsStore') return { clearExpertApplicationDraft: () => {} };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  });
  return loaded.exports;
}

preferencesDataModule = load('components/expert/onboarding/preferencesData.ts');
expertEmploymentModule = load('lib/expertEmployment.ts');
const expertAuthModule = load('lib/expertAuth.ts');
const {
  normalizeBackendProfile,
  mapBackendProfileToExpertData,
  buildExpertProfileCompletion,
  getBackendExpertEmail,
  getExpertProfileLocation,
} = load('lib/expertProfileApi.ts');
const { formatPreferencesPricingSummary } = preferencesDataModule;
const { isValidPortfolioUrl } = load('lib/portfolioUrl.ts');
const { getSecondarySkills } = load('lib/expertProfile.ts');
const { hasValidSavedEmploymentPosition } = expertEmploymentModule;
const { buildCredentialsPayload, parseCredentialsFromProfile } = expertAuthModule;
const {
  addExpertSecondarySkill,
  cleanExpertCategorySkills,
  EXPERT_SKILL_CATEGORIES,
  MAX_EXPERT_SECONDARY_SKILLS,
  selectExpertPrimarySkill,
  toggleExpertSecondarySkill,
} = load('lib/expertSkillCatalog.ts');

test('primary skill remains separate from secondary skills without losing other skills', () => {
  assert.deepEqual(
    getSecondarySkills(' Product Management ', [
      'Product Management', 'Roadmapping', 'SQL', ' roadmapping ',
    ]),
    ['Roadmapping', 'SQL'],
  );
  assert.deepEqual(
    getSecondarySkills('', ['Product Management', 'Roadmapping']),
    ['Product Management', 'Roadmapping'],
  );
});

test('primary skill selection clears secondary skills only when the category changes', () => {
  const changed = selectExpertPrimarySkill('software', 'design', ['System Design']);
  assert.equal(changed.category, 'design');
  assert.equal(changed.skills.length, 0);
  const unchanged = selectExpertPrimarySkill('software', 'software', ['System Design']);
  assert.equal(unchanged.category, 'software');
  assert.deepEqual(unchanged.skills, ['System Design']);
});

test('secondary skill selection matches onboarding toggle and five-skill limit', () => {
  let selected = [];
  for (let index = 0; index < MAX_EXPERT_SECONDARY_SKILLS; index += 1) {
    selected = toggleExpertSecondarySkill(selected, `Skill ${index + 1}`);
  }
  assert.equal(selected.length, 5);
  assert.equal(toggleExpertSecondarySkill(selected, 'Extra Skill').length, 5);
  assert.deepEqual(toggleExpertSecondarySkill(selected, 'skill 1'), selected.slice(1));
  assert.equal(addExpertSecondarySkill(selected, ' skill 1 '), selected);
  assert.equal(addExpertSecondarySkill([], '  New Skill  ')[0], 'New Skill');
});

test('shared primary skill catalog matches onboarding options and cleans custom suggestions', () => {
  assert.equal(EXPERT_SKILL_CATEGORIES.length, 9);
  assert.deepEqual(
    cleanExpertCategorySkills('Custom Field', ['Custom Field: advisory', 'Advisory', 'planning']),
    ['Advisory', 'Planning'],
  );
});

test('profile mapping preserves the saved primary skill separately from core skills', () => {
  const profile = mapBackendProfileToExpertData({
    category: 'Product Management',
    skills: ['Roadmapping'],
  });
  assert.equal(profile.category, 'Product Management');
  assert.deepEqual(profile.skills, ['Roadmapping']);
});

test('dashboard completion accepts valid saved employment and required preferences without optional lengths', () => {
  const expert = {
    credentials: [{
      type: 'employment',
      title: 'Product Director',
      institution: 'Example Inc',
      startYear: '2018',
      endYear: '2022',
    }],
    selectedFormats: ['video'],
    selectedLengths: [],
    formatPrices: { video: '1200' },
  };
  const profile = mapBackendProfileToExpertData({});
  const completion = buildExpertProfileCompletion(expert, profile, false);
  assert.equal(completion.checklist.find((item) => item.id === 'experience').status, 'done');
  assert.equal(completion.checklist.find((item) => item.id === 'preferences').status, 'done');

  const incomplete = buildExpertProfileCompletion({
    ...expert,
    credentials: [{ type: 'employment', title: 'Role', institution: 'Company', startYear: '' }],
    selectedFormats: ['video'],
    formatPrices: { video: '0' },
  }, profile, false);
  assert.equal(incomplete.checklist.find((item) => item.id === 'experience').status, 'pending');
  assert.equal(incomplete.checklist.find((item) => item.id === 'preferences').status, 'pending');
  assert.equal(completion.percentage, incomplete.percentage + 22);
});

test('employment save payload preserves incomplete required fields for completion validation', () => {
  const [incomplete] = buildCredentialsPayload([{
    jobTitle: 'Product Director',
    company: 'Example Inc',
    startYear: '',
    endYear: '',
    currentlyWorking: false,
    responsibilities: '',
  }], []);
  assert.equal(incomplete.type, 'employment');
  assert.equal(incomplete.startYear, '');
  assert.equal(incomplete.endYear, '');
  assert.equal(hasValidSavedEmploymentPosition([incomplete]), false);
  assert.equal(
    parseCredentialsFromProfile([incomplete]).employmentPositions[0].currentlyWorking,
    false,
  );
});

test('portfolio URL validation accepts absolute web URLs and rejects malformed values', () => {
  for (const value of ['https://example.com', 'https://github.com/username']) {
    assert.equal(isValidPortfolioUrl(value), true);
  }
  for (const value of ['hello', 'abc.com', 'https://']) {
    assert.equal(isValidPortfolioUrl(value), false);
  }
  assert.equal(isValidPortfolioUrl(''), false);
});

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

test('profile preview receives a saved location but omits values created by old location fallbacks', () => {
  assert.equal(getExpertProfileLocation({ location: 'Pune, India' }), 'Pune, India');
  assert.equal(getExpertProfileLocation({ location: 'Kolkata' }), '');
  assert.equal(getExpertProfileLocation({ location: 'India' }), '');
  assert.equal(getExpertProfileLocation(undefined), '');
});

test('profile email is mapped safely from the authenticated backend profile', () => {
  assert.equal(getBackendExpertEmail({ email: ' expert@example.com ' }), 'expert@example.com');
  assert.equal(getBackendExpertEmail({}), '');
  assert.equal(getBackendExpertEmail({ email: null }), '');
});
