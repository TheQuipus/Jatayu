import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const timePicker = fs.readFileSync(
  new URL("../components/expert/onboarding/TimePicker.tsx", import.meta.url),
  "utf8",
);
const availabilityRow = fs.readFileSync(
  new URL("../components/expert/availability/AvailabilitySlotRow.tsx", import.meta.url),
  "utf8",
);
const availabilitySource = fs.readFileSync(
  new URL("../lib/expertAvailability.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(availabilitySource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const availabilityModule = { exports: {} };
vm.runInNewContext(outputText, {
  module: availabilityModule,
  exports: availabilityModule.exports,
});
const { isAvailabilityValid } = availabilityModule.exports;

test("availability time pickers expose missing required values as field-level errors", () => {
  assert.match(availabilityRow, /label="Start time"[\s\S]*?required/);
  assert.match(availabilityRow, /label="End time"[\s\S]*?required/);
  assert.match(timePicker, /required && !disabled && !parsedValue/);
  assert.match(timePicker, /`Select \$\{label\?\.toLowerCase\(\) \?\? "a time"\}\.`/);
  assert.match(timePicker, /"aria-required": required \|\| undefined/);
});

test("availability remains incomplete without selected times and validates after selection", () => {
  const slot = { id: "slot", days: ["Mon"], from: "", to: "" };
  assert.equal(isAvailabilityValid("Asia/Kolkata", [slot]), false);
  assert.equal(
    isAvailabilityValid("Asia/Kolkata", [{ ...slot, from: "09:00 AM", to: "10:00 AM" }]),
    true,
  );
});
