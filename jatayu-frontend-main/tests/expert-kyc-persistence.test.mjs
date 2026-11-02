import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repo = path.resolve(root, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const readBackend = (file) => fs.readFileSync(path.join(repo, "backend", file), "utf8");

test("credential onboarding persists all supported certification and KYC metadata before advancing", () => {
  const onboarding = read("app/expert/expert-onboarding/page.tsx");
  assert.match(onboarding, /governmentId,\s*kycVideoUrl,\s*kycPhotos,\s*certificates,/);
  assert.match(onboarding, /const profileSaved = await saveProfileStep\([\s\S]*?onboardingMetadata:[\s\S]*?governmentId,[\s\S]*?kycPhotos,[\s\S]*?certificates,[\s\S]*?\);\s*if \(profileSaved\) setStep\("preferences"\);/);
  assert.match(onboarding, /setProfileError\(message\)/);
});

test("profile metadata size limits allow multiple supported documents without changing unrelated JSON routes", () => {
  const server = readBackend("server.js");
  const controller = readBackend("controllers/expertController.js");
  assert.match(server, /app\.use\('\/api\/expert\/profile', express\.json\(\{ limit: '32mb' \}\)\);\s*app\.use\(express\.json\(\{ limit: '7mb' \}\)\);/);
  assert.match(controller, /MAX_ONBOARDING_METADATA_BYTES = 30 \* 1024 \* 1024/);
  assert.match(controller, /onboardingMetadata must not exceed 30 MB/);
});

test("authenticated profile response retains persisted onboarding credentials and KYC metadata", () => {
  const controller = readBackend("controllers/expertController.js");
  assert.match(controller, /include:\s*\[[\s\S]*?Credential, as: 'credentials'[\s\S]*?Availability, as: 'availabilities'/);
  assert.match(controller, /\.\.\.publicExpert\(expert\)/);
  assert.match(controller, /expert\.onboardingMetadata = \{\s*\.\.\.storedMetadata,\s*\.\.\.onboardingMetadata/);
});

test("edit and read-only profiles load certification files and all saved KYC material", () => {
  const editor = read("components/expert/profile/ExpertProfileEditor.tsx");
  const view = read("components/expert/profile/ExpertProfileView.tsx");
  assert.match(editor, /metadata\.governmentId/);
  assert.match(editor, /metadata\.kycPhotos/);
  assert.match(editor, /metadata\.certificates/);
  assert.match(editor, /metadata\.portfolioSamples/);
  assert.match(editor, /Open document/);
  assert.match(editor, /View file/);
  assert.match(view, /metadata\.governmentId/);
  assert.match(view, /metadata\.kycPhotos/);
  assert.match(view, /metadata\.certificates/);
  assert.match(view, /metadata\.portfolioSamples/);
  assert.match(view, /getDigilockerKycStatus\(\)/);
  assert.match(view, /Credentials &amp; KYC Verification/);
});
