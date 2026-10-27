import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const helperSource = fs.readFileSync(
  new URL("../lib/expertKycPhotos.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(helperSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});
const helperModule = { exports: {} };
vm.runInNewContext(outputText, {
  module: helperModule,
  exports: helperModule.exports,
});
const {
  areKycPhotosComplete,
  getKycPhoto,
  MANUAL_KYC_POSES,
  isKycPoseMatch,
  isCurrentKycSession,
  manualPhotosAfterCancelledSession,
  nextMissingKycPoseIndex,
  normalizeKycPhotos,
  runKycPoseDetection,
  withKycPhoto,
} = helperModule.exports;

const panel = fs.readFileSync(
  new URL("../components/expert/onboarding/KycVerificationPanel.tsx", import.meta.url),
  "utf8",
);
const credentials = fs.readFileSync(
  new URL("../components/expert/onboarding/CredentialsStep.tsx", import.meta.url),
  "utf8",
);
const onboardingPage = fs.readFileSync(
  new URL("../app/expert/expert-onboarding/page.tsx", import.meta.url),
  "utf8",
);
const backendMapper = fs.readFileSync(
  new URL("../lib/backendApplicationMapper.ts", import.meta.url),
  "utf8",
);
const applicationStore = fs.readFileSync(
  new URL("../lib/expertApplicationsStore.ts", import.meta.url),
  "utf8",
);
const adminReview = fs.readFileSync(
  new URL("../components/admin/review/ApplicationReview.tsx", import.meta.url),
  "utf8",
);

test("manual positions are captured left, center, then right and progress follows them", () => {
  assert.deepEqual(Array.from(MANUAL_KYC_POSES), ["left", "center", "right"]);
  let photos = {};
  for (const [index, pose] of MANUAL_KYC_POSES.entries()) {
    assert.equal(nextMissingKycPoseIndex(photos), index);
    photos = withKycPhoto(photos, pose, `photo-${pose}`);
  }
  assert.equal(areKycPhotosComplete(photos), true);
  assert.equal(nextMissingKycPoseIndex(photos), 0);
});

test("manual flow requires confirmation and retakes only the chosen photo", () => {
  const confirmed = {
    left: "left-original",
    centre: "center-original",
    right: "right-original",
  };
  assert.equal(areKycPhotosComplete({ left: confirmed.left, centre: confirmed.centre }), false);

  const retaken = withKycPhoto(confirmed, "center", "center-retake");
  assert.equal(getKycPhoto(retaken, "center"), "center-retake");
  assert.equal(retaken.left, confirmed.left);
  assert.equal(retaken.right, confirmed.right);
  assert.match(panel, /onClick=\{confirmManualCapture\}/);
  assert.match(panel, /const confirmManualCapture = \(\) =>/);
  assert.match(panel, /withKycPhoto\(manualPhotos, pose, reviewFrame\)/);
});

test("manual cancellation restores the session baseline without deleting saved photos", () => {
  const savedBeforeSession = { left: "saved-left" };
  const capturedDuringSession = {
    left: "saved-left",
    centre: "new-centre",
  };
  assert.deepEqual(
    JSON.parse(JSON.stringify(
      manualPhotosAfterCancelledSession(capturedDuringSession, savedBeforeSession),
    )),
    savedBeforeSession,
  );
  assert.deepEqual(
    JSON.parse(JSON.stringify(manualPhotosAfterCancelledSession(capturedDuringSession, null))),
    capturedDuringSession,
  );
  assert.match(panel, /const cancelManualCapture = useCallback/);
  assert.match(panel, /onManualPhotosChange\(manualPhotosAfterCancelledSession/);
});

test("automatic verification remains available alongside manual mode", () => {
  assert.match(panel, /beginVerification\("automatic"\)/);
  assert.match(panel, /beginVerification\("manual"\)/);
  assert.match(panel, /mode === "automatic" && typeof MediaRecorder !== "undefined"/);
  assert.match(panel, /verificationMode !== "automatic"/);
});

test("automatic capture accepts only the exact requested pose", () => {
  for (const requestedPose of MANUAL_KYC_POSES) {
    assert.equal(isKycPoseMatch(requestedPose, requestedPose, true), true);
    for (const detectedPose of MANUAL_KYC_POSES) {
      if (detectedPose !== requestedPose) {
        assert.equal(isKycPoseMatch(requestedPose, detectedPose, true), false);
      }
    }
    assert.equal(isKycPoseMatch(requestedPose, "none", true), false);
    assert.equal(isKycPoseMatch(requestedPose, requestedPose, false), false);
  }
  assert.match(panel, /isKycPoseMatch\(targetPose, result\.pose, result\.faceDetected\)/);
});

test("both modes can be switched while active and cancellation returns to mode selection", () => {
  assert.match(panel, /const switchVerificationMode = \(mode: VerificationMode\)/);
  assert.match(panel, /switchVerificationMode\(verificationMode === "manual" \? "automatic" : "manual"\)/);
  assert.match(panel, /const cancelAutomaticVerification = useCallback/);
  assert.match(panel, /onClick=\{cancelAutomaticVerification\}/);
  assert.match(panel, /onClick=\{cancelManualCapture\}/);
  assert.match(panel, /const discardPendingAutomaticResult = useCallback/);
  assert.match(panel, /discardPendingAutomaticResult\(\)/);
  assert.match(panel, /prevVideoSrcRef\.current = baselineVideo;\s*onVideoChange\(baselineVideo\)/);
  assert.match(panel, /setPhase\("intro"\)/);
  assert.match(panel, /cameraRequestPromiseRef\.current/);
});

test("confirmed photos are saved, restored, and included in application review data", () => {
  assert.match(credentials, /areKycPhotosComplete\(kycPhotos\)/);
  assert.match(onboardingPage, /setKycPhotos\(normalizeKycPhotos\(metadata\.kycPhotos\)\)/);
  assert.match(onboardingPage, /onboardingMetadata:\s*\{[\s\S]*kycPhotos,/);
  assert.match(applicationStore, /kycPhotos:\s*draft\.kycPhotos/);
  assert.match(backendMapper, /kycPhotos:\s*metadata\.kycPhotos/);
  assert.match(adminReview, /application\.kycPhotos\?\.centre/);
});

test("camera failures are reported and camera tracks are cleaned up", () => {
  assert.match(panel, /Camera permission was denied/);
  assert.match(panel, /The camera could not be started/);
  assert.match(panel, /streamRef\.current\?\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(panel, /return \(\) => \{\s*stopCameraSession\(false\);/);
});

test("camera cleanup invalidates stale requests and detection results", () => {
  assert.equal(isCurrentKycSession(4, 4), true);
  assert.equal(isCurrentKycSession(4, 5), false);
  assert.match(panel, /cameraRequestIdRef\.current \+= 1/);
  assert.match(panel, /!cancelled && isCurrentKycSession\(sessionId, cameraRequestIdRef\.current\)/);
  assert.match(panel, /recorder\.onstop = null/);
  assert.match(panel, /recorder\.stop\(\)/);
  assert.match(panel, /runKycPoseDetection\(\s*poseCheckInFlightRef\.current,\s*sessionId/s);
});

test("stale detection completions cannot update state or overlap a newer camera session", async () => {
  const lock = { sessionId: null };
  let activeSessionId = 20;
  let resolveDetection;
  let stateUpdates = 0;
  const staleDetection = runKycPoseDetection(
    lock,
    20,
    () => isCurrentKycSession(20, activeSessionId),
    () => new Promise((resolve) => { resolveDetection = resolve; }),
    () => { stateUpdates += 1; },
  );

  assert.equal(lock.sessionId, 20);
  const overlappingDetection = await runKycPoseDetection(
    lock,
    21,
    () => isCurrentKycSession(21, activeSessionId),
    async () => "new",
    () => { stateUpdates += 1; },
  );
  assert.equal(overlappingDetection, false);

  activeSessionId = 21;
  resolveDetection("stale");
  assert.equal(await staleDetection, false);
  assert.equal(stateUpdates, 0);
  assert.equal(lock.sessionId, null);

  assert.equal(
    await runKycPoseDetection(
      lock,
      21,
      () => isCurrentKycSession(21, activeSessionId),
      async () => "current",
      () => { stateUpdates += 1; },
    ),
    true,
  );
  assert.equal(stateUpdates, 1);
  assert.equal(lock.sessionId, null);
});

test("automatic verification requires MediaRecorder and offers manual fallback", () => {
  assert.match(panel, /mode === "automatic" && typeof MediaRecorder === "undefined"/);
  assert.match(panel, /Automatic verification is not supported in this browser/);
  assert.match(panel, /disabled=\{typeof MediaRecorder === "undefined"\}/);
  assert.match(panel, /beginVerification\("manual"\)/);
  assert.match(panel, /verificationMode === "automatic" && typeof MediaRecorder === "undefined"\)/);
});

test("KYC photo hydration ignores unexpected metadata shapes", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(normalizeKycPhotos({ left: "left", centre: 42, right: "right" }))),
    { left: "left", right: "right" },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(normalizeKycPhotos(null))), {});
});
