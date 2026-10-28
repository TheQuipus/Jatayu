import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.join(currentDirectory, "..", "lib", "otpFlow.ts"),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const loaded = { exports: {} };
vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
const { getOtpBackStep } = loaded.exports;

test("login-origin OTP returns to the login step", () => {
  assert.equal(getOtpBackStep("login"), "login");
});

test("signup-origin and older OTP sessions return to registration", () => {
  assert.equal(getOtpBackStep("signup"), "register");
  assert.equal(getOtpBackStep(undefined), "register");
});
