import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const employmentSource = fs.readFileSync(
  new URL("../lib/expertEmployment.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(employmentSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const employmentModule = { exports: {} };
vm.runInNewContext(outputText, {
  module: employmentModule,
  exports: employmentModule.exports,
  require: (name) => {
    if (name === "@/lib/uuid") return { generateUUID: () => "restored-position" };
    throw new Error(`Unexpected dependency: ${name}`);
  },
});
const { parseEmploymentPositions } = employmentModule.exports;
const page = fs.readFileSync(
  new URL("../app/expert/expert-onboarding/page.tsx", import.meta.url),
  "utf8",
);

test("employment persistence restores full records including dates and multiple positions", () => {
  const saved = [
    {
      id: "position-1",
      jobTitle: "Engineer",
      company: "Example Co",
      startMonth: "02",
      startYear: "2020",
      endMonth: "06",
      endYear: "2022",
      currentlyWorking: false,
      responsibilities: "Built systems",
    },
    {
      id: "position-2",
      jobTitle: "Lead",
      company: "Current Co",
      startMonth: "07",
      startYear: "2022",
      endMonth: "10",
      endYear: "2026",
      currentlyWorking: true,
      responsibilities: "Leading a team",
    },
  ];

  assert.deepEqual(JSON.parse(JSON.stringify(parseEmploymentPositions(saved))), saved);
});

test("missing and older saved records safely default fields without breaking legacy profile fallback", () => {
  assert.equal(parseEmploymentPositions(undefined), null);
  assert.equal(parseEmploymentPositions("invalid"), null);
  assert.deepEqual(
    JSON.parse(JSON.stringify(parseEmploymentPositions([{ id: "legacy", jobTitle: "Analyst" }]))),
    [{
      id: "legacy",
      jobTitle: "Analyst",
      company: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      currentlyWorking: false,
      responsibilities: "",
    }],
  );
  assert.match(page, /else if \(jobs\.length > 0\) \{\s*setEmploymentPositions\(jobs\)/);
});

test("experience continuation and step navigation save full employment records in profile metadata", () => {
  assert.match(page, /parseEmploymentPositions\(\s*user\.onboardingMetadata\?\.employmentPositions/);
  assert.match(page, /const buildExperiencePersistencePayload = \(\) => \(\{[\s\S]*?employmentPositions,/);
  assert.match(page, /handleExperienceContinue = async[\s\S]*?step: "identity",\s*\.\.\.buildExperiencePersistencePayload\(\)/);
  assert.match(page, /if \(step === "experience" && target !== "experience"\) \{\s*await saveProfileStep\(buildExperiencePersistencePayload\(\)\)/);
  assert.match(page, /handleBackToSkills = async[\s\S]*?saveProfileStep\(buildExperiencePersistencePayload\(\)\)/);
  assert.match(page, /if \(savedEmploymentPositions\?\.length\) \{\s*setEmploymentPositions\(savedEmploymentPositions\)/);
});
