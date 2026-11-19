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
  assert.equal(areRequiredSessionPreferencesValid(["video"], { video: "abc" }), false);
  assert.equal(areRequiredSessionPreferencesValid(["video"], { video: "-5" }), false);
});

test("consultation price inputs accept at most seven digits and fit within seven characters", () => {
  assert.match(preferencesStep, /raw\.replace\(\/\\D\/g, ""\)\.slice\(0, 7\)/);
  assert.match(preferencesStep, /inputMode="numeric"/);
  assert.match(preferencesStep, /maxLength=\{7\}/);
  assert.match(preferencesStep, /max=\{9999999\}/);
  assert.match(preferencesStep, /width:\s*`\$\{Math\.min\(7,\s*Math\.max\(1,/);
  assert.match(preferencesStyles, /\.formatPriceInput\s*\{[^}]*min-width:\s*1ch;[^}]*max-width:\s*7ch;/s);
  assert.match(preferencesStyles, /\.formatPriceRow\s*\{[^}]*justify-content:\s*flex-end;[^}]*margin-left:\s*auto;[^}]*margin-right:\s*-4px;/s);
});

test("each selected format requires its own valid price", () => {
  assert.equal(
    areRequiredSessionPreferencesValid(["video", "written"], { video: "1200" }),
    false,
  );
  assert.equal(
    areRequiredSessionPreferencesValid(["video", "written"], { video: "1200", written: "25" }),
    true,
  );
  assert.equal(
    areRequiredSessionPreferencesValid(["written"], { video: "1200" }),
    false,
  );
  assert.equal(
    areRequiredSessionPreferencesValid(["written"], { video: "1200", written: "25" }),
    true,
  );
});

test("session length choices remain toggleable, saved, and restored", () => {
  assert.match(preferencesStep, /handleToggleLength/);
  assert.match(preferencesStep, /onSelectedLengthsChange\(\[\.\.\.selectedLengths, id\]\)/);
  assert.match(page, /if \(user\.selectedLengths\?\.length\) setSelectedLengths\(user\.selectedLengths\)/);
  assert.match(page, /selectedLengths,\s*formatPrices,/);
});

test("Step 6 uses a selected outline while Step 7 retains its filled selected indicator", () => {
  assert.match(preferencesStep, /className=\{`\$\{styles\.formatCheckbox\} \$\{isSelected \? styles\.formatCheckboxSelected : ""\}`\}/);
  assert.match(preferencesStep, /\{isSelected && hasValidPrice && <Check size=\{10\} strokeWidth=\{3\} \/>\}/);
  assert.match(preferencesStep, /disabled=\{!canContinue\}/);
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
    if (indicator === "formatCheckbox") {
      assert.ok(selectedIndicator?.includes("background: transparent;"));
      assert.ok(selectedIndicator?.includes("border: 2px solid #E53B17;"));
      assert.ok(selectedIndicator?.includes("box-shadow: 0 0 0 2px rgba(229, 59, 23, 0.2);"));
    } else {
      assert.ok(selectedIndicator?.includes("background: #E53B17;"));
      assert.ok(selectedIndicator?.includes("border-color: #E53B17;"));
    }
  }
});
