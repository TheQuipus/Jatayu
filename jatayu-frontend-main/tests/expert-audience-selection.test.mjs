import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const source = fs.readFileSync(
  new URL("../lib/expertAudience.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const audienceModule = { exports: {} };
vm.runInNewContext(outputText, {
  module: audienceModule,
  exports: audienceModule.exports,
});
const { toggleAudienceSelection } = audienceModule.exports;

const audienceStep = fs.readFileSync(
  new URL("../components/expert/onboarding/AudienceStep.tsx", import.meta.url),
  "utf8",
);
const page = fs.readFileSync(
  new URL("../app/expert/expert-onboarding/page.tsx", import.meta.url),
  "utf8",
);

test("can select a fourth audience and all available audience types", () => {
  const availableAudiences = ["startup", "enterprise", "career", "smb"];
  const fourthSelection = toggleAudienceSelection(availableAudiences.slice(0, 3), "smb");

  assert.deepEqual(Array.from(fourthSelection), availableAudiences);
  assert.deepEqual(
    Array.from(availableAudiences.reduce(
      (selected, id) => toggleAudienceSelection(selected, id),
      [],
    )),
    availableAudiences,
  );
});

test("can deselect a previously selected audience", () => {
  assert.deepEqual(Array.from(
    toggleAudienceSelection(["startup", "enterprise", "career", "smb"], "enterprise"),
  ), ["startup", "career", "smb"]);
});

test("Step 7 selection, validation, and save/restore support multiple audiences", () => {
  assert.match(audienceStep, /setSelectedAudiences\(\(current\) => toggleAudienceSelection\(current, id\)\)/);
  assert.match(audienceStep, /languages\.length > 0 && selectedAudiences\.length > 0/);
  assert.match(audienceStep, /onContinueWithAudience\?\.\(\{ languages, audiences: selectedAudiences \}\)/);
  assert.match(page, /const audiences = asStringArray\(user\.targetAudience\)/);
  assert.match(page, /if \(audiences\.length > 0\) setSelectedAudiences\(audiences\)/);
  assert.match(page, /targetAudience: selectedAudiences/);
  assert.match(audienceStep, /customLanguages/);
});
