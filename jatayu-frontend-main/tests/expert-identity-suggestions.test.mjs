import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const source = fs.readFileSync(
  new URL("../components/expert/onboarding/IdentityStep.tsx", import.meta.url),
  "utf8",
);

test("both identity fields offer all tones and separate tone selection from generation", () => {
  for (const tone of ["professional", "casual", "concise"]) {
    assert.match(source, new RegExp(`id: "${tone}"`));
  }
  assert.match(source, /handleSelectTone\("tagLine", pill\.id\)/);
  assert.match(source, /handleSelectTone\("bio", pill\.id\)/);
  assert.match(source, /onClick=\{\(\) => handleSuggestField\("tagLine"\)\}/);
  assert.match(source, /onClick=\{\(\) => handleSuggestField\("bio"\)\}/);

  const handler = source.slice(
    source.indexOf("const handleSuggestField"),
    source.indexOf("const handleTitleChange"),
  );
  assert.match(handler, /suggestOnboardingIdentityCopy\(\{/);
  assert.match(handler, /tone = selectedTones\[field\] \|\| "professional"/);
  assert.match(handler, /tone,\s*intent:/);
  assert.match(handler, /variantIndex,/);
  assert.match(handler, /field,/);
  assert.match(handler, /languages,/);
  assert.match(handler, /employment: employmentPositions/);
  assert.match(handler, /education: educationDegrees/);
});

test("each field shows Suggest by JATAYU AI, then Regenerate after generation", () => {
  assert.equal((source.match(/"Suggest by JATAYU AI"/g) || []).length, 2);
  assert.equal((source.match(/"Regenerate"/g) || []).length, 2);
  assert.match(source, /setHasGenerated\(\(previous\) => \(\{ \.\.\.previous, \[field\]: true \}\)\)/);
  assert.doesNotMatch(source, /text="Apply"|handleApplyTone|handleApplyTaglineTone/);
});

test("suggestions automatically update only their editable controlled textarea", () => {
  assert.match(source, /if \(field === "tagLine"\) onTagLineChange\(generated\.slice\(0, maxChars\)\);\s*else onBioChange\(generated\.slice\(0, maxChars\)\);/);
  assert.match(source, /id="tagline-input"[\s\S]*?value=\{tagLine \?\? ""\}[\s\S]*?onChange=/);
  assert.match(source, /id="intro-input"[\s\S]*?value=\{bio \?\? ""\}[\s\S]*?onChange=/);
  assert.doesNotMatch(source, /readOnly|disabled=\{aiLoading/);
  assert.doesNotMatch(source, /text="Apply"|handleApplyTone|handleApplyTaglineTone/);
});

test("field edits and newer requests protect user text from stale responses", () => {
  assert.match(source, /requestIdRef\.current\[field\]/);
  assert.match(source, /editVersionRef\.current\[field\]/);
  assert.match(source, /requestId !== requestIdRef\.current\[field\] \|\| editVersion !== editVersionRef\.current\[field\]/);
  assert.match(source, /editVersionRef\.current\.tagLine \+= 1/);
  assert.match(source, /editVersionRef\.current\.bio \+= 1/);
  assert.match(source, /setAiLoading\(\(previous\) => \(\{ \.\.\.previous, \[field\]: false \}\)\)/);
});

test("errors and fallback notices are tracked separately for each field", () => {
  assert.match(source, /const \[aiErrors, setAiErrors\] = useState\(\{ tagLine: "", bio: "" \}\)/);
  assert.match(source, /const \[aiNotices, setAiNotices\] = useState\(\{ tagLine: "", bio: "" \}\)/);
  assert.match(source, /response\.source === "fallback"/);
  assert.match(source, /aiErrors\.tagLine/);
  assert.match(source, /aiErrors\.bio/);
  assert.match(source, /aiNotices\.tagLine/);
  assert.match(source, /aiNotices\.bio/);
});
