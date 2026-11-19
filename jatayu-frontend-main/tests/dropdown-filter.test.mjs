import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import ts from "typescript";

const helpersSource = fs.readFileSync(
  new URL("../lib/dropdownFilterHelpers.ts", import.meta.url),
  "utf8",
);
const componentSource = fs.readFileSync(
  new URL("../components/ui/DropdownFilter.tsx", import.meta.url),
  "utf8",
);
const stylesSource = fs.readFileSync(
  new URL("../components/ui/DropdownFilter.module.css", import.meta.url),
  "utf8",
);

const { outputText } = ts.transpileModule(helpersSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const helpersModule = { exports: {} };
new Function("module", "exports", outputText)(helpersModule, helpersModule.exports);

const {
  normalizeOptionLabel,
  isOtherTriggerOption,
  buildMergedOptions,
  filterDropdownOptions,
  validateAndCreateCustomOption,
} = helpersModule.exports;

test("normalizeOptionLabel trims, strips control chars, and collapses spaces", () => {
  assert.equal(normalizeOptionLabel("  Quantum   Computing \t\n "), "Quantum Computing");
  assert.equal(normalizeOptionLabel("\u0000Bio\u0007informatics"), "Bio informatics");
  assert.equal(normalizeOptionLabel("   "), "");
});

test("isOtherTriggerOption matches case-insensitively on label or value", () => {
  assert.equal(isOtherTriggerOption({ value: "Other", label: "Other" }), true);
  assert.equal(isOtherTriggerOption({ value: "other", label: "  OTHER  " }), true);
  assert.equal(isOtherTriggerOption({ value: "Engineering", label: "Engineering" }), false);
  assert.equal(
    isOtherTriggerOption({ value: "custom", label: "Custom Entry" }, "Custom Entry"),
    true,
  );
});

test("buildMergedOptions removes static Other when allowCustomOption is enabled and sorts A-Z", () => {
  const base = [
    { value: "Engineering", label: "Engineering" },
    { value: "Economics", label: "Economics" },
    { value: "Other", label: "Other" },
  ];

  const mergedWithDynamic = buildMergedOptions({
    baseOptions: base,
    customOptions: [{ value: "Bioinformatics", label: "Bioinformatics", isCustom: true }],
    allowCustomOption: true,
  });
  assert.deepEqual(
    mergedWithDynamic.map((o) => o.label),
    ["Bioinformatics", "Economics", "Engineering"],
  );

  const mergedWithoutDynamic = buildMergedOptions({
    baseOptions: base,
    customOptions: [],
    allowCustomOption: false,
  });
  assert.deepEqual(
    mergedWithoutDynamic.map((o) => o.label),
    ["Economics", "Engineering", "Other"],
  );

  const mergedUnsorted = buildMergedOptions({
    baseOptions: base,
    customOptions: [{ value: "Bioinformatics", label: "Bioinformatics", isCustom: true }],
    allowCustomOption: true,
    sortAlphabetically: false,
  });
  assert.deepEqual(
    mergedUnsorted.map((o) => o.label),
    ["Engineering", "Economics", "Bioinformatics"],
  );
});

test("buildMergedOptions hydrates async saved custom selectedValue not in baseOptions", () => {
  const base = [
    { value: "Engineering", label: "Engineering" },
    { value: "Other", label: "Other" },
  ];

  const merged = buildMergedOptions({
    baseOptions: base,
    customOptions: [],
    selectedValue: "Astrophysics",
    allowCustomOption: true,
  });

  assert.equal(merged.length, 2);
  assert.deepEqual(merged[0], {
    value: "Astrophysics",
    label: "Astrophysics",
    isCustom: true,
  });
});

test("buildMergedOptions deduplicates case-insensitively across base and custom options", () => {
  const base = [
    { value: "Engineering", label: "Engineering" },
    { value: "Economics", label: "Economics" },
  ];

  const merged = buildMergedOptions({
    baseOptions: base,
    customOptions: [
      { value: "engineering", label: "engineering", isCustom: true },
      { value: "Robotics", label: "Robotics", isCustom: true },
    ],
    allowCustomOption: true,
  });

  assert.deepEqual(
    merged.map((o) => o.label),
    ["Economics", "Engineering", "Robotics"],
  );
});

test("validateAndCreateCustomOption creates normalized custom option", () => {
  const existing = [{ value: "Engineering", label: "Engineering" }];
  const res = validateAndCreateCustomOption({
    rawInput: "  Quantum   Computing  ",
    existingOptions: existing,
  });

  assert.equal(res.status, "created");
  assert.deepEqual(res.option, {
    value: "Quantum Computing",
    label: "Quantum Computing",
    isCustom: true,
  });
});

test("validateAndCreateCustomOption rejects empty, reserved Other, too-long, and max-limit inputs", () => {
  const existing = [{ value: "Engineering", label: "Engineering" }];

  assert.equal(
    validateAndCreateCustomOption({ rawInput: "   ", existingOptions: existing }).status,
    "invalid",
  );
  assert.equal(
    validateAndCreateCustomOption({ rawInput: "other", existingOptions: existing }).status,
    "invalid",
  );
  assert.equal(
    validateAndCreateCustomOption({
      rawInput: "x".repeat(81),
      existingOptions: existing,
      maxLength: 80,
    }).status,
    "invalid",
  );
  assert.equal(
    validateAndCreateCustomOption({
      rawInput: "Astrophysics",
      existingOptions: existing,
      maxCustomOptions: 2,
      currentCustomCount: 2,
    }).status,
    "invalid",
  );
});

test("validateAndCreateCustomOption detects case-insensitive duplicates cleanly", () => {
  const existing = [{ value: "Engineering", label: "Engineering" }];
  const res = validateAndCreateCustomOption({
    rawInput: "  ENGINEERING ",
    existingOptions: existing,
  });

  assert.equal(res.status, "duplicate");
  assert.equal(res.existingOption.value, "Engineering");
});

test("validateAndCreateCustomOption supports customValueTransform and customValidator", () => {
  const existing = [];
  const invalidRes = validateAndCreateCustomOption({
    rawInput: "123",
    existingOptions: existing,
    customValidator: (val) => (/^\d+$/.test(val) ? "Cannot be numeric only." : null),
  });
  assert.equal(invalidRes.status, "invalid");
  assert.equal(invalidRes.error, "Cannot be numeric only.");

  const validRes = validateAndCreateCustomOption({
    rawInput: "Cloud Native",
    existingOptions: existing,
    customValueTransform: (val) => val.toLowerCase().replace(/\s+/g, "_"),
  });
  assert.equal(validRes.status, "created");
  assert.equal(validRes.option.value, "cloud_native");
  assert.equal(validRes.option.label, "Cloud Native");
});

test("filterDropdownOptions matches substrings across label and value", () => {
  const options = [
    { value: "IN", label: "India" },
    { value: "US", label: "United States" },
    { value: "DE", label: "Germany" },
  ];
  assert.deepEqual(
    filterDropdownOptions(options, "ind").map((o) => o.value),
    ["IN"],
  );
  assert.deepEqual(
    filterDropdownOptions(options, "de").map((o) => o.value),
    ["DE"],
  );
});

test("DropdownFilter component satisfies SSR, race-condition, and accessibility contracts", () => {
  // Fresh componentSource reading
  const freshComponentSource = fs.readFileSync(
    new URL("../components/ui/DropdownFilter.tsx", import.meta.url),
    "utf8",
  );

  // Deterministic SSR ID and SSR-guarded portal target
  assert.match(freshComponentSource, /instanceId=\{reactId\}/);
  assert.match(freshComponentSource, /menuPortalTarget=\{isMounted \? document\.body : undefined\}/);

  // Blur-close guard and double-submit lock
  assert.match(freshComponentSource, /isEditingOtherRef/);
  assert.match(freshComponentSource, /isCommittingRef/);

  // IME composition guard on Enter
  assert.match(freshComponentSource, /event\.nativeEvent\.isComposing/);

  // Explicit type="button" on non-submit controls so parent <form> never submits
  assert.match(freshComponentSource, /className=\{`\$\{styles\.otherAddBtn\}/);
  assert.match(freshComponentSource, /type="button"/);

  // Prevent blur-before-click race on "+" button
  assert.match(freshComponentSource, /onMouseDown=\{\(event\) => \{\s*\/\/ Prevent blur-before-click race/);

  // Module-scoped SELECT_COMPONENTS so MenuList never remounts on keystrokes
  assert.match(freshComponentSource, /const SELECT_COMPONENTS = \{/);

  // Live region and accessible visually-hidden recipe
  assert.match(freshComponentSource, /aria-live="polite"/);
  assert.match(stylesSource, /clip-path:\s*inset\(50%\)/);

  // selectOnCreate defaults to true and closes the menu on option creation
  assert.match(freshComponentSource, /selectOnCreate\s*=\s*true/);
  assert.match(freshComponentSource, /applySelection\(created\);\s*setMenuIsOpen\(false\);/);
});

test("ExperienceStep uses DropdownFilter for Degree / Qualification and Field of Study with selectOnCreate", () => {
  const experienceStepSource = fs.readFileSync(
    new URL("../components/expert/onboarding/ExperienceStep.tsx", import.meta.url),
    "utf8",
  );
  assert.match(experienceStepSource, /import DropdownFilter/);
  assert.match(
    experienceStepSource,
    /<DropdownFilter[\s\S]*?id=\{`degree-\$\{degree\.id\}`\}[\s\S]*?options=\{degreeOptions\}[\s\S]*?placeholder="Select degree\.\.\."[\s\S]*?allowCustomOption[\s\S]*?selectOnCreate/,
  );
  assert.match(
    experienceStepSource,
    /<DropdownFilter[\s\S]*?id=\{`field-\$\{degree\.id\}`\}[\s\S]*?options=\{fieldOfStudyOptions\}[\s\S]*?placeholder="Select field of study\.\.\."[\s\S]*?allowCustomOption[\s\S]*?selectOnCreate/,
  );
});
