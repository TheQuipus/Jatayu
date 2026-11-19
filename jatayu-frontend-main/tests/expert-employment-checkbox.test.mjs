import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';

const experienceStep = fs.readFileSync(
  new URL('../components/expert/onboarding/ExperienceStep.tsx', import.meta.url),
  'utf8',
);
const experienceStyles = fs.readFileSync(
  new URL('../components/expert/onboarding/ExperienceStep.module.css', import.meta.url),
  'utf8',
);

test('only the employment checkbox control changes currently-working state', () => {
  const checkboxBlock = experienceStep.match(
    /<div className=\{styles\.checkboxRow\}>[\s\S]*?<\/div>\s*\)\}/,
  )?.[0];
  assert.ok(checkboxBlock, 'currently-working checkbox row should be present');
  assert.match(checkboxBlock, /<input[\s\S]*?type="checkbox"/);
  assert.match(checkboxBlock, /aria-label="Currently working here"/);
  assert.match(checkboxBlock, /onChange=\{\(event\) =>/);
  assert.match(checkboxBlock, /updatePosition\(index, \{ currentlyWorking: false \}\)/);
  assert.doesNotMatch(checkboxBlock, /<label|<\/label>|onClick=/);
  assert.doesNotMatch(
    experienceStyles.match(/\.checkboxRow\s*\{([^}]*)\}/)?.[1] ?? '',
    /cursor\s*:/,
  );
});

test('end date controls remain disabled only while currently working', () => {
  const endDateBlock = experienceStep.match(
    /<span className=\{styles\.fieldLabel\}>End Date \*<\/span>[\s\S]*?<\/div>\s*<\/div>/,
  )?.[0];
  assert.ok(endDateBlock, 'end date fields should be present');
  assert.equal((endDateBlock.match(/disabled=\{Boolean\(position\.currentlyWorking\)\}/g) || []).length, 2);
});
