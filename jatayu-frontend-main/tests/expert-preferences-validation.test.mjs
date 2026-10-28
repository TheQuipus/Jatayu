import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const preferencesDataPath = new URL(
  "../components/expert/onboarding/preferencesData.ts",
  import.meta.url,
);
const preferencesDataSource = fs.readFileSync(preferencesDataPath, "utf8");
const { outputText } = ts.transpileModule(preferencesDataSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const preferencesModule = { exports: {} };
vm.runInNewContext(outputText, {
  module: preferencesModule,
  exports: preferencesModule.exports,
});
const { areRequiredSessionPreferencesValid } = preferencesModule.exports;

const page = fs.readFileSync(
  new URL("../app/expert/expert-onboarding/page.tsx", import.meta.url),
  "utf8",
);
const preferencesStep = fs.readFileSync(
  new URL("../components/expert/onboarding/PreferencesStep.tsx", import.meta.url),
  "utf8",
);
const preferencesStyles = fs.readFileSync(
  new URL("../components/expert/onboarding/PreferencesStep.module.css", import.meta.url),
  "utf8",
);
const audienceStep = fs.readFileSync(
  new URL("../components/expert/onboarding/AudienceStep.tsx", import.meta.url),
  "utf8",
);
const audienceStyles = fs.readFileSync(
  new URL("../components/expert/onboarding/AudienceStep.module.css", import.meta.url),
  "utf8",
);

test("valid required preferences do not require a selected session length", () => {
  assert.equal(areRequiredSessionPreferencesValid(["video"], { video: "1200" }), true);
});

test("missing formats or invalid prices still block continuation", () => {
  assert.equal(areRequiredSessionPreferencesValid([], {}), false);
  assert.equal(areRequiredSessionPreferencesValid(["video"], { video: "" }), false);
  assert.equal(areRequiredSessionPreferencesValid(["video"], { video: "0" }), false);
});

test("session length choices remain toggleable, saved, and restored", () => {
  assert.match(preferencesStep, /handleToggleLength/);
  assert.match(preferencesStep, /onSelectedLengthsChange\(\[\.\.\.selectedLengths, id\]\)/);
  assert.match(page, /if \(user\.selectedLengths\?\.length\) setSelectedLengths\(user\.selectedLengths\)/);
  assert.match(page, /selectedLengths,\s*formatPrices,/);
});

test("Step 6 and Step 7 cards share orange selected and outlined unselected indicators", () => {
  assert.match(preferencesStep, /className=\{`\$\{styles\.formatCheckbox\} \$\{isSelected \? styles\.formatCheckboxSelected : ""\}`\}/);
  assert.match(preferencesStep, /\{isSelected && <Check size=\{10\} strokeWidth=\{3\} \/>\}/);
  assert.match(audienceStep, /\{isSelected && <Check size=\{10\} strokeWidth=\{3\} \/>\}/);

  for (const [styles, indicator] of [
    [preferencesStyles, "formatCheckbox"],
    [audienceStyles, "audienceCheckbox"],
  ]) {
    const baseIndicator = styles.match(new RegExp(`\\.${indicator}\\s*\\{([^}]*)\\}`))?.[1];
    const selectedIndicator = styles.match(new RegExp(`\\.${indicator}Selected\\s*\\{([^}]*)\\}`))?.[1];
    assert.ok(baseIndicator?.includes("border-radius: 50%;"));
    assert.ok(baseIndicator?.includes("border: 1.5px solid rgba(255, 255, 255, 0.15);"));
    assert.ok(baseIndicator?.includes("background: transparent;"));
    assert.ok(selectedIndicator?.includes("background: #E53B17;"));
    assert.ok(selectedIndicator?.includes("border-color: #E53B17;"));
  }
});
