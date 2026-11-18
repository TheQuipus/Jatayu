import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function loadTypeScript(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, { module: loaded, exports: loaded.exports });
  return loaded.exports;
}

const { resolveDigilockerKycState } = loadTypeScript("../lib/digilockerKycStatus.ts");
const { getExpertOnboardingStepCompletion } = loadTypeScript("../lib/expertOnboardingNavigation.ts");
const onboarding = fs.readFileSync(
  new URL("../app/expert/expert-onboarding/page.tsx", import.meta.url),
  "utf8",
);
const credentials = fs.readFileSync(
  new URL("../components/expert/onboarding/CredentialsStep.tsx", import.meta.url),
  "utf8",
);
const controller = fs.readFileSync(
  new URL("../../backend/controllers/digilockerController.js", import.meta.url),
  "utf8",
);

test("DigiLocker status distinguishes verified, pending, cancelled, failed, and expired results", () => {
  const now = Date.parse("2026-01-01T00:00:00.000Z");
  assert.equal(resolveDigilockerKycState(null, now), "not_started");
  assert.equal(resolveDigilockerKycState({ status: "verified" }, now), "verified");
  assert.equal(resolveDigilockerKycState({
    status: "authorization_pending",
    authorizationExpiresAt: "2026-01-01T00:01:00.000Z",
  }, now), "authorization_pending");
  assert.equal(resolveDigilockerKycState({ status: "denied" }, now), "cancelled");
  assert.equal(resolveDigilockerKycState({ status: "cancelled" }, now), "cancelled");
  assert.equal(resolveDigilockerKycState({ status: "failed" }, now), "failed");
  assert.equal(resolveDigilockerKycState({ status: "expired" }, now), "expired");
  assert.equal(resolveDigilockerKycState({
    status: "authorization_pending",
    authorizationExpiresAt: "2025-12-31T23:59:59.000Z",
  }, now), "expired");
});

test("callback return routes authenticated users to Credentials without trusting its result", () => {
  assert.match(onboarding, /params\.get\("kyc"\)/);
  assert.match(onboarding, /digilockerReturnRef\.current = true;\s*setStep\("credentials"\)/s);
  assert.match(onboarding, /if \(digilockerReturnRef\.current\) \{\s*setStep\("credentials"\)/s);
  assert.match(onboarding, /if \(!kycVideoUrl && !areKycPhotosComplete\(kycPhotos\)\) \{\s*try \{\s*const status = await getDigilockerKycStatus\(\);\s*if \(status\.kyc\?\.status !== "verified"\)/s);
  assert.match(credentials, /const status = resolveDigilockerKycState\(response\.kyc\)/);
  assert.match(credentials, /setDigilockerVerified\(status === "verified"\)/);
  assert.match(credentials, /window\.location\.assign\(response\.authorizationUrl\)/);
  assert.match(controller, /authorizationExpiresAt: record\.authorizationExpiresAt/);
});

test("saved completion cannot bypass compulsory KYC step validation", () => {
  const validity = Array(9).fill(false);
  const emptyOptionalSteps = Array(9).fill(true);
  const saved = Array(9).fill(false);
  const live = Array(9).fill(false);
  saved[4] = true;

  assert.equal(
    getExpertOnboardingStepCompletion(validity, emptyOptionalSteps, saved, live)[4],
    false,
  );
  assert.match(onboarding, /Boolean\(kycVideoUrl \|\| areKycPhotosComplete\(kycPhotos\) \|\| liveStepCompletion\[5\]\)/);
  assert.match(credentials, /hasKycPhotos \|\| digilockerVerified/);
});

test("DigiLocker authorization expiry is persisted and its state token is consumed", () => {
  assert.match(controller, /verification\.status = 'expired'/);
  assert.match(controller, /verification\.stateHash = null;\s*verification\.codeVerifier = null;/);
  assert.match(controller, /return redirectWithResult\(res, config\.frontendReturnUrl, 'error'\)/);
});
