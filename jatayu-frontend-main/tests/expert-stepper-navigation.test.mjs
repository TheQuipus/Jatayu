import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const availabilitySource = fs.readFileSync(
  new URL("../lib/expertAvailability.ts", import.meta.url),
  "utf8",
);
const { outputText: availabilityOutput } = ts.transpileModule(availabilitySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const availabilityModule = { exports: {} };
vm.runInNewContext(availabilityOutput, {
  module: availabilityModule,
  exports: availabilityModule.exports,
});
const { isAvailabilityStepEmpty } = availabilityModule.exports;

const navigationSource = fs.readFileSync(
  new URL("../lib/expertOnboardingNavigation.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(navigationSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const navigationModule = { exports: {} };
vm.runInNewContext(outputText, {
  module: navigationModule,
  exports: navigationModule.exports,
});
const {
  canNavigateToOnboardingStep,
  getExpertOnboardingStepCompletion,
} = navigationModule.exports;

const page = fs.readFileSync(
  new URL("../app/expert/expert-onboarding/page.tsx", import.meta.url),
  "utf8",
);
const progressBar = fs.readFileSync(
  new URL("../components/expert/onboarding/OnboardingProgressBar.tsx", import.meta.url),
  "utf8",
);
const sharedStyles = fs.readFileSync(
  new URL("../components/expert/onboarding/onboarding.shared.module.css", import.meta.url),
  "utf8",
);
const categoryStep = fs.readFileSync(
  new URL("../components/expert/onboarding/CategoryStep.tsx", import.meta.url),
  "utf8",
);
const experienceStep = fs.readFileSync(
  new URL("../components/expert/onboarding/ExperienceStep.tsx", import.meta.url),
  "utf8",
);

test("completed steps support direct backward and forward navigation", () => {
  const completed = [true, true, true, true, true, true, true, true, false];
  assert.equal(canNavigateToOnboardingStep(2, 6, completed), true);
  assert.equal(canNavigateToOnboardingStep(7, 3, completed), true);
  assert.equal(canNavigateToOnboardingStep(9, 3, completed), true);
});

test("navigation blocks incomplete prerequisites, the current step, and invalid targets", () => {
  const completion = [true, true, false, true, true, true, true, true, false];
  for (const target of [0, 3, 4, 9, -1, 1.5, Number.NaN]) {
    assert.equal(canNavigateToOnboardingStep(target, 2, completion), false);
  }
  assert.equal(canNavigateToOnboardingStep(2, 2, completion), false);
});

test("the review step is reachable when its preceding steps are complete", () => {
  const completion = [true, true, true, true, true, true, true, true, false];
  assert.equal(canNavigateToOnboardingStep(9, 4, completion), true);
});

test("restored optional skips remain eligible while invalid restored data does not", () => {
  const validity = [true, false, false, false, false, true, true, false, false];
  const emptyOptionalSteps = [false, true, true, true, true, false, false, true, false];
  const restoredPassedSteps = [false, true, true, true, true, false, false, true, false];

  const restored = getExpertOnboardingStepCompletion(
    validity,
    emptyOptionalSteps,
    restoredPassedSteps,
    Array(9).fill(false),
  );
  assert.deepEqual(Array.from(restored), [true, true, true, true, true, true, true, true, false]);

  const invalidExperience = getExpertOnboardingStepCompletion(
    validity,
    [false, true, false, true, true, false, false, true, false],
    restoredPassedSteps,
    Array(9).fill(false),
  );
  assert.equal(invalidExperience[2], false);
  assert.equal(canNavigateToOnboardingStep(6, 2, invalidExperience), false);
});

test("Step 8 is optional only when timezone and every slot field are empty", () => {
  const emptySlots = [];
  const untouchedSlot = [{ id: "empty", days: [], from: "", to: "" }];
  const selectedDayWithoutTimes = [{ id: "partial-day", days: ["Mon"], from: "", to: "" }];
  const partialTimes = [{ id: "partial-time", days: [], from: "09:00 AM", to: "" }];
  const invalidSlot = [{ id: "invalid", days: ["Mon"], from: "09:00 AM", to: "09:15 AM" }];

  assert.equal(isAvailabilityStepEmpty("", emptySlots), true);
  assert.equal(isAvailabilityStepEmpty("", untouchedSlot), true);
  assert.equal(isAvailabilityStepEmpty("Asia/Kolkata", emptySlots), false);
  assert.equal(isAvailabilityStepEmpty("", selectedDayWithoutTimes), false);
  assert.equal(isAvailabilityStepEmpty("", partialTimes), false);
  assert.equal(isAvailabilityStepEmpty("Asia/Kolkata", invalidSlot), false);
  assert.match(page, /isAvailabilityStepEmpty\(timezone, availabilitySlots \?\? \[\]\)/);
});

test("the parent hydrates saved progress and enforces the same eligibility handler", () => {
  assert.match(page, /setSavedStepCompletion\(getCompletedOnboardingStepFlags\(user\.onboardingStep\)\)/);
  assert.match(page, /getExpertOnboardingStepCompletion\(validity, emptyOptionalSteps, saved, live\)/);
  const handler = page.match(/const handleJumpToStepNumber = \(stepNumber: number\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handler, "parent step-jump handler should exist");
  assert.match(handler, /canNavigateToOnboardingStep\(stepNumber, currentStepNumber, stepCompletion\)/);
  assert.match(handler, /if \(!canNavigateToOnboardingStep[\s\S]*?return;/);
  assert.match(handler, /setStep\(target\)/);
});

test("progress controls use accessible buttons with practical visible focus targets", () => {
  assert.match(progressBar, /<button[\s\S]*?type="button"/);
  assert.match(progressBar, /aria-label=\{`Go to step \$\{stepNumber\}`\}/);
  assert.match(progressBar, /aria-current=\{isCurrent \? "step" : undefined\}/);
  assert.match(progressBar, /canNavigateToOnboardingStep\(stepNumber, currentStep, stepCompletion\)/);
  assert.match(progressBar, /disabled=\{!isClickable\}/);
  assert.match(sharedStyles, /\.progressBarSegment\s*\{[^}]*min-height:\s*44px/s);
  assert.match(sharedStyles, /\.progressBarSegment::before\s*\{[^}]*height:\s*4px/s);
  assert.match(sharedStyles, /\.progressBarSegmentClickable:focus-visible\s*\{[^}]*outline:/s);
});

test("Step 1 has no Back button while later steps retain Back and Continue", () => {
  const categoryFooter = categoryStep.match(/<div className=\{shared\.footerActions\}>[\s\S]*?<\/div>/)?.[0];
  assert.ok(categoryFooter, "Step 1 footer should exist");
  assert.doesNotMatch(categoryFooter, />\s*Back\s*</);
  assert.match(categoryFooter, /<ContinueButton/);

  const experienceFooter = experienceStep.match(/<div className=\{shared\.footerActions\}>[\s\S]*?<\/div>/)?.[0];
  assert.ok(experienceFooter, "Step 3 footer should exist");
  assert.match(experienceFooter, /onClick=\{onBack\}[\s\S]*?>\s*Back\s*</);
  assert.match(experienceFooter, /<ContinueButton/);
});

test("jumps only change the active step, preserving parent-owned form values", () => {
  const handler = page.match(/const handleJumpToStepNumber = \(stepNumber: number\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handler);
  assert.doesNotMatch(handler, /set(?:Selected|Employment|Education|Professional|TagLine|Bio|Portfolio|Languages|Timezone|Availability)/);
  assert.match(page, /const \[employmentPositions, setEmploymentPositions\]/);
  assert.match(page, /const \[languages, setLanguages\]/);
  assert.match(page, /const \[availabilitySlots, setAvailabilitySlots\]/);
});

test("changing the category invalidates saved skill-step completion", () => {
  const handler = page.match(/const handleSelectCategory = \(id: string\) => \{[\s\S]*?\n  \};/)?.[0];
  assert.ok(handler);
  assert.match(handler, /setSelectedSkills\(\[\]\)/);
  assert.match(handler, /clearStepPassed\(2\)/);
});
