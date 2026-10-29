import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const experienceSelect = fs.readFileSync(
  new URL("../components/expert/onboarding/ExperienceSelect.tsx", import.meta.url),
  "utf8",
);
const experienceStep = fs.readFileSync(
  new URL("../components/expert/onboarding/ExperienceStep.tsx", import.meta.url),
  "utf8",
);
const experienceStyles = fs.readFileSync(
  new URL("../components/expert/onboarding/ExperienceStep.module.css", import.meta.url),
  "utf8",
);
const smartSearchSelect = fs.readFileSync(
  new URL("../components/admin/settings/SmartSearchSelect.tsx", import.meta.url),
  "utf8",
);
const expertFilterSection = fs.readFileSync(
  new URL("../components/expert/ExpertFilterSection.tsx", import.meta.url),
  "utf8",
);
const positionSource = fs.readFileSync(
  new URL("../components/expert/onboarding/experienceSelectPosition.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(positionSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const positionModule = { exports: {} };
vm.runInNewContext(outputText, {
  module: positionModule,
  exports: positionModule.exports,
});
const {
  getExperienceSelectMenuPosition,
  shouldScrollExperienceSelectAnchor,
} = positionModule.exports;
const employmentSource = fs.readFileSync(
  new URL("../lib/expertEmployment.ts", import.meta.url),
  "utf8",
);
const { outputText: employmentOutput } = ts.transpileModule(employmentSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const employmentModule = { exports: {} };
vm.runInNewContext(employmentOutput, {
  module: employmentModule,
  exports: employmentModule.exports,
  require: (specifier) => {
    if (specifier === "@/lib/uuid") return { generateUUID: () => "test-id" };
    throw new Error(`Unexpected dependency: ${specifier}`);
  },
});
const {
  getEmploymentDateFieldError,
  isEmploymentPositionStarted,
  isEmploymentPositionValid,
  isEducationDegreeValid,
  createEmptyEmploymentPosition,
  createEmptyEducationDegree,
  MONTH_OPTIONS,
} = employmentModule.exports;

test("page scrolling closes the menu while scrolling its options keeps it open", () => {
  const scrollHandler = experienceSelect.match(
    /const handleScroll = \(event: Event\) => \{[\s\S]*?\n  \};/,
  )?.[0];
  assert.ok(scrollHandler, "the menu should handle scrolling separately from repositioning");
  assert.match(scrollHandler, /event\.target instanceof Node && menuRef\.current\?\.contains\(event\.target\)/);
  assert.match(scrollHandler, /setIsOpen\(false\)/);
  assert.match(experienceSelect, /window\.addEventListener\("scroll", handleScroll, true\)/);
  assert.doesNotMatch(experienceSelect, /window\.addEventListener\("scroll", updatePosition, true\)/);
});

test("reopening after page scroll measures the current anchor before showing the menu", () => {
  const updatePosition = experienceSelect.match(
    /const updatePosition = \(\) => \{[\s\S]*?\n  \};/,
  )?.[0];
  const toggleHandler = experienceSelect.match(
    /const handleToggle = \(\) => \{[\s\S]*?\n  \};/,
  )?.[0];

  assert.ok(updatePosition);
  assert.match(updatePosition, /triggerRef\.current\.getBoundingClientRect\(\)/);
  assert.match(experienceSelect, /useState<React\.CSSProperties \| null>\(null\)/);
  assert.match(toggleHandler, /setMenuStyle\(null\)/);
  assert.doesNotMatch(toggleHandler, /updatePosition\(\)/);
  assert.match(experienceSelect, /menuStyle \?\? \{ visibility: "hidden" \}/);
  const scrollHandler = experienceSelect.match(
    /const handleScroll = \(event: Event\) => \{[\s\S]*?\n    \};/,
  )?.[0];
  assert.ok(scrollHandler);
  assert.match(scrollHandler, /menuRef\.current\?\.contains\(event\.target\)/);
  assert.doesNotMatch(scrollHandler, /updatePosition/);
  assert.match(experienceSelect, /updatePosition\(\);\s*const handleScroll/);
  assert.match(experienceStyles, /\.selectMenu\s*\{[^}]*position:\s*fixed;/s);
  assert.doesNotMatch(experienceStyles.match(/\.selectMenu\s*\{([^}]*)\}/s)?.[1] ?? "", /(?:^|\s)top\s*:\s*0/);
  assert.match(experienceSelect, /triggerRef\.current\.scrollIntoView\(\{[\s\S]*?block: "center",[\s\S]*?behavior: "instant"/);
  assert.match(experienceSelect, /programmaticScrollAnchorRef/);
  assert.match(experienceStyles, /\.selectMenu\s*\{[^}]*overflow-y:\s*auto;/s);
  assert.match(experienceSelect, /maxHeight: position\.maxHeight/);
});

test("the popup follows the anchor's current viewport coordinates after page scrolling", () => {
  const beforeScroll = getExperienceSelectMenuPosition(
    { top: 520, bottom: 560, left: 80, width: 180 },
    { width: 1000, height: 800 },
    220,
  );
  const afterScroll = getExperienceSelectMenuPosition(
    { top: 260, bottom: 300, left: 80, width: 180 },
    { width: 1000, height: 800 },
    220,
  );

  assert.equal(beforeScroll.top, 564);
  assert.equal(afterScroll.top, 304);
  assert.equal(afterScroll.left, 80);
});

test("the popup always opens below the anchor and constrains height near the bottom edge", () => {
  const position = getExperienceSelectMenuPosition(
    { top: 740, bottom: 780, left: 930, width: 180 },
    { width: 1000, height: 800 },
    440,
  );

  assert.equal(position.top, 784);
  assert.equal("bottom" in position, false);
  assert.equal(position.maxHeight, 8);
  assert.equal(position.left, 812);
  assert.equal(position.width, 180);
});

test("insufficient space below requests scrolling the anchor into a usable position", () => {
  const position = getExperienceSelectMenuPosition(
    { top: 86, bottom: 126, left: 6, width: 90 },
    { width: 300, height: 140 },
    440,
  );

  assert.equal(position.top, 130);
  assert.equal("bottom" in position, false);
  assert.equal(position.maxHeight, 2);
  assert.equal(position.left, 8);
  assert.equal(position.width, 90);
  assert.equal(
    shouldScrollExperienceSelectAnchor(
      { top: 86, bottom: 126, left: 6, width: 90 },
      { width: 300, height: 140 },
    ),
    true,
  );
  assert.equal(
    shouldScrollExperienceSelectAnchor(
      { top: 200, bottom: 240, left: 6, width: 90 },
      { width: 300, height: 800 },
    ),
    false,
  );
});

test("selecting a month or year still updates the value and closes the menu", () => {
  const selectionHandler = experienceSelect.match(
    /const handleSelect = \(optionValue: string\) => \{[\s\S]*?\n  \};/,
  )?.[0];
  assert.ok(selectionHandler);
  assert.match(selectionHandler, /onChange\(optionValue\)/);
  assert.match(selectionHandler, /setIsOpen\(false\)/);
});

test("all four Start Date and End Date month/year fields use the shared dropdown", () => {
  const getMonthSelect = (field) => {
    const fieldIndex = experienceStep.indexOf(`value={position.${field} ?? ""}`);
    const start = experienceStep.lastIndexOf("<ExperienceSelect", fieldIndex);
    const end = experienceStep.indexOf("/>", fieldIndex);
    return fieldIndex < 0 || start < 0 || end < 0
      ? ""
      : experienceStep.slice(start, end + 2);
  };
  for (const field of ["startMonth", "startYear", "endMonth", "endYear"]) {
    const control = getMonthSelect(field);
    assert.ok(control, `${field} should use ExperienceSelect`);
    assert.match(control, new RegExp(`\\{ ${field}: nextValue \\}`));
    if (field.startsWith("start")) {
      assert.match(control, /required=\{positionStarted\}/);
    } else {
      assert.match(control, /disabled=\{Boolean\(position\.currentlyWorking\)\}/);
      assert.match(control, /required=\{positionStarted && !position\.currentlyWorking\}/);
    }
  }
  assert.match(experienceSelect, /window\.addEventListener\("scroll", handleScroll, true\)/);
});

test("Month, Year, and education prompts remain placeholders rather than selectable options", () => {
  assert.doesNotMatch(
    experienceStep,
    /\{\s*value:\s*"",\s*label:\s*"(?:Month|Year|Select degree\.\.\.|Select field of study\.\.\.)"\s*\}/,
  );
  assert.match(experienceStep, /placeholder="Month"/);
  assert.match(experienceStep, /placeholder="Year"/);
  assert.match(experienceStep, /placeholder="Select degree\.\.\."/);
  assert.match(experienceStep, /placeholder="Select field of study\.\.\."/);
  assert.ok(MONTH_OPTIONS.every((option) => option.value !== ""));
});

test("new Step 3 employment and education entries start with no dropdown selections", () => {
  const position = createEmptyEmploymentPosition();
  assert.deepEqual(
    [position.startMonth, position.startYear, position.endMonth, position.endYear],
    ["", "", "", ""],
  );
  const degree = createEmptyEducationDegree();
  assert.deepEqual([degree.degree, degree.fieldOfStudy], ["", ""]);
});

test("the Step 3 dropdown supports arrow, Home/End, Enter, and Escape navigation", () => {
  assert.match(experienceSelect, /event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"/);
  assert.match(experienceSelect, /event\.key === "Home" \|\| event\.key === "End"/);
  assert.match(experienceSelect, /event\.key === "Enter" \|\| event\.key === " "/);
  assert.match(experienceSelect, /event\.key === "Escape" && isOpen/);
  assert.match(experienceSelect, /aria-activedescendant=/);
});

test("searchable dropdown supports keyboard navigation, listbox semantics, and Escape", () => {
  assert.match(smartSearchSelect, /event\.key === "ArrowDown" \|\| event\.key === "ArrowUp"/);
  assert.match(smartSearchSelect, /event\.key === "Home" \|\| event\.key === "End"/);
  assert.match(smartSearchSelect, /event\.key === "Enter"/);
  assert.match(smartSearchSelect, /filteredOptions\[0\]\.value/);
  assert.match(smartSearchSelect, /event\.key === "Escape" && isOpen/);
  assert.match(smartSearchSelect, /role="combobox"/);
  assert.match(smartSearchSelect, /role="listbox"/);
  assert.match(smartSearchSelect, /role="option"/);
  assert.match(smartSearchSelect, /aria-activedescendant=/);
  assert.match(smartSearchSelect, /handleClickOutside/);
});

test("expert multi-select filter panels expose expanded state and close with Escape", () => {
  assert.match(expertFilterSection, /aria-expanded={isOpen}/);
  assert.match(expertFilterSection, /aria-controls={contentId}/);
  assert.match(expertFilterSection, /event\.key !== "Escape"/);
  assert.match(expertFilterSection, /type="checkbox"/);
});

test("employment date fields reject empty and placeholder values, then clear errors for valid choices", () => {
  const position = {
    id: "position",
    jobTitle: "Engineer",
    company: "Example",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    currentlyWorking: false,
    responsibilities: "",
  };
  const untouchedPosition = {
    ...position,
    jobTitle: "",
    company: "",
    responsibilities: "",
    currentlyWorking: false,
  };
  assert.equal(isEmploymentPositionStarted(untouchedPosition), false);
  assert.equal(getEmploymentDateFieldError(untouchedPosition, "startMonth"), undefined);
  assert.equal(isEmploymentPositionValid(position), false);
  for (const [field, expected] of [
    ["startMonth", "Select a valid start month."],
    ["startYear", "Select a valid start year."],
    ["endMonth", "Select a valid end month."],
    ["endYear", "Select a valid end year."],
  ]) {
    assert.equal(getEmploymentDateFieldError(position, field), expected);
    position[field] = field.endsWith("Month") ? "Month" : "Year";
    assert.equal(getEmploymentDateFieldError(position, field), expected);
    position[field] = field.endsWith("Month") ? "03" : "2024";
    assert.equal(getEmploymentDateFieldError(position, field), undefined);
  }
  assert.equal(isEmploymentPositionValid(position), true);

  const currentPosition = { ...position, currentlyWorking: true, endMonth: "", endYear: "" };
  assert.equal(getEmploymentDateFieldError(currentPosition, "endMonth"), undefined);
  assert.equal(getEmploymentDateFieldError(currentPosition, "endYear"), undefined);
  assert.equal(isEmploymentPositionValid(currentPosition), true);
});

test("date dropdown errors are rendered accessibly and clear with their selected value", () => {
  assert.match(experienceSelect, /aria-invalid=\{error \? true : undefined\}/);
  assert.match(experienceSelect, /aria-describedby=\{error && id \? `\$\{id\}-error` : undefined\}/);
  assert.match(experienceSelect, /className=\{\`\$\{styles\.fieldErrorText\} \$\{styles\.selectErrorText\}\`\}\s+role="alert"/);
  for (const field of ["startMonth", "startYear", "endMonth", "endYear"]) {
    assert.match(
      experienceStep,
      new RegExp(`error=\\{positionStarted \\? getEmploymentDateFieldError\\(position, "${field}"\\) : undefined\\}`),
    );
  }
});

test("education dropdown values remain optional and no empty placeholder is required", () => {
  const emptyDegree = {
    degree: "",
    fieldOfStudy: "",
    institution: "",
    graduationYear: "",
    honours: "",
  };
  assert.equal(isEducationDegreeValid(emptyDegree), true);
  const degreeOnly = { ...emptyDegree, degree: "Bachelor's Degree" };
  assert.equal(isEducationDegreeValid(degreeOnly), false);
  assert.match(experienceStep, /options=\{degreeOptions\}[\s\S]*?placeholder="Select degree\.\.\."/);
  assert.match(experienceStep, /options=\{fieldOfStudyOptions\}[\s\S]*?placeholder="Select field of study\.\.\."/);
});
