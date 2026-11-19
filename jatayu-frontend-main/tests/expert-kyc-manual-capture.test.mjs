import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

function loadTypeScriptModule(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  });
  const testModule = { exports: {} };
  vm.runInNewContext(outputText, { module: testModule, exports: testModule.exports });
  return testModule.exports;
}

const faceCapture = loadTypeScriptModule("../lib/kycFaceCapture.ts");
const photoHelpers = loadTypeScriptModule("../lib/expertKycPhotos.ts");
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

test("mirrored face bounds map to the live preview, including object-fit cover", () => {
  const mapped = faceCapture.mapMirroredKycFaceBounds(
    { left: 0.2, top: 0.2, right: 0.4, bottom: 0.6 },
    640,
    480,
    { left: 0, top: 0, width: 640, height: 480 },
  );
  assert.deepEqual(JSON.parse(JSON.stringify(mapped)), {
    left: 384,
    top: 96,
    right: 512,
    bottom: 288,
  });

  const cropped = faceCapture.mapMirroredKycFaceBounds(
    { left: 0.2, top: 0.2, right: 0.4, bottom: 0.6 },
    640,
    480,
    { left: 0, top: 0, width: 800, height: 480 },
  );
  assert.ok(cropped.left > mapped.left);
  assert.ok(cropped.right > cropped.left);
});

test("face bounds and oval validation reject malformed or out-of-guide results", () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(faceCapture.getKycFaceBounds([
      { x: 0.2, y: 0.3 },
      { x: 0.7, y: 0.8 },
      { x: 0.4, y: 0.5 },
    ]))),
    { left: 0.2, top: 0.3, right: 0.7, bottom: 0.8 },
  );
  assert.equal(faceCapture.getKycFaceBounds([{ x: Number.NaN, y: 0.5 }]), null);

  const oval = { left: 0, top: 0, right: 100, bottom: 120 };
  assert.equal(
    faceCapture.isKycFaceInsideOval(
      { left: 38, top: 35, right: 62, bottom: 85 },
      oval,
    ),
    true,
  );
  assert.equal(
    faceCapture.isKycFaceInsideOval(
      { left: 15, top: 12, right: 85, bottom: 108 },
      oval,
    ),
    true,
  );
  assert.equal(
    faceCapture.isKycFaceInsideOval(
      { left: 0, top: 20, right: 24, bottom: 100 },
      oval,
    ),
    false,
  );
  assert.equal(
    faceCapture.isKycFaceInsideOval(
      { left: -10, top: 20, right: 110, bottom: 100 },
      oval,
    ),
    false,
  );
});

test("landmark yaw maps symmetric turns and neutral calibration to the requested pose", () => {
  const landmarks = Array.from({ length: 264 }, () => ({ x: 0.5, y: 0.5 }));
  landmarks[33] = { x: 0.4, y: 0.4 };
  landmarks[263] = { x: 0.6, y: 0.4 };
  landmarks[1] = { x: 0.52, y: 0.5 };
  assert.ok(Math.abs(faceCapture.getKycYawFromLandmarks(landmarks) + 0.2) < 1e-12);

  assert.equal(faceCapture.getKycPoseFromYaw(-0.05, 0, "left"), "left");
  assert.equal(faceCapture.getKycPoseFromYaw(-0.2, 0, "left"), "left");
  assert.equal(faceCapture.getKycPoseFromYaw(0.05, 0, "right"), "right");
  assert.equal(faceCapture.getKycPoseFromYaw(0.2, 0, "right"), "right");
  assert.equal(faceCapture.getKycPoseFromYaw(0.14, 0, "center"), "center");
  assert.equal(faceCapture.getKycPoseFromYaw(0.141, 0, "center"), null);
  assert.equal(faceCapture.getKycPoseFromYaw(0.13, 0, "right"), "right");
  assert.equal(faceCapture.getKycPoseFromYaw(0.2, 0.2, "center"), "center");
  assert.equal(faceCapture.getKycPoseFromYaw(0.03, 0, "right"), null);
});

test("automatic capture requires exactly one aligned, matching, stable face", () => {
  const valid = {
    faceCount: 1,
    faceInsideOval: true,
    poseMatches: true,
    stable: true,
  };
  assert.equal(faceCapture.canAutoCaptureKycFrame(valid), true);
  for (const change of [
    { faceCount: 0 },
    { faceCount: 2 },
    { faceInsideOval: false },
    { poseMatches: false },
    { stable: false },
  ]) {
    assert.equal(
      faceCapture.canAutoCaptureKycFrame({ ...valid, ...change }),
      false,
    );
  }
});

test("face stability tolerates small motion but rejects substantial movement", () => {
  const previous = { centerX: 0.5, centerY: 0.5, width: 0.2, height: 0.3 };
  assert.equal(faceCapture.isKycFaceStable(previous, {
    centerX: 0.53,
    centerY: 0.52,
    width: 0.225,
    height: 0.33,
  }), true);
  assert.equal(faceCapture.isKycFaceStable(previous, {
    centerX: 0.54,
    centerY: 0.5,
    width: 0.2,
    height: 0.3,
  }), false);
});

test("automatic and manual capture share the same guarded pose capture path", () => {
  assert.match(panel, /numFaces:\s*2/);
  assert.match(panel, /faces\.length !== 1/);
  assert.match(panel, /landmarker\.detectForVideo\(video, timestamp\)/);
  assert.match(panel, /window\.setTimeout\(\(\) => \{\s*void checkPose\(\);\s*\}, 200\)/);
  assert.doesNotMatch(panel, /setInterval\(\(\) => \{\s*void checkPose\(\)/);
  assert.match(panel, /detectionRunningRef\.current/);
  assert.match(panel, /activeDetectionPromiseRef\.current/);
  assert.match(panel, /video\.readyState >= HTMLMediaElement\.HAVE_CURRENT_DATA/);
  assert.match(panel, /faceLandmarkerRef\.current === landmarker/);
  assert.match(panel, /activeDetection\.then\(closeLandmarker, closeLandmarker\)/);
  assert.match(panel, /STABLE_FACE_SAMPLES_REQUIRED = 5/);
  assert.match(panel, /logKycDetectionDiagnostic/);
  assert.match(panel, /process\.env\.NODE_ENV !== "development"/);
  assert.match(panel, /"face-outside-oval"/);
  assert.match(panel, /"wrong-pose"/);
  assert.match(panel, /"waiting-for-stability"/);
  assert.match(panel, /"detection-in-flight"/);
  assert.match(panel, /captureStep\(stepIndex\)/);
  assert.match(panel, /onClick=\{handleManualCapture\}/);
  assert.match(panel, /disabled=\{!cameraReady\}/);
  assert.match(panel, /Automatic detection unavailable\. Click Photo to capture manually\./);
  assert.match(panel, /capturedStepIndexRef\.current === poseIndex/);
  assert.doesNotMatch(panel, /MediaRecorder/);
});

test("captured photos are reviewed, retakable, and committed as KYC metadata", () => {
  assert.match(panel, /setPhase\("review"\)/);
  assert.match(panel, /onClick=\{\(\) => handleRetakePose\(index\)\}/);
  assert.match(panel, /onManualPhotosChange\?\.\(photos\)/);
  assert.match(credentials, /onManualPhotosChange=\{onKycPhotosChange\}/);
  assert.match(credentials, /areKycPhotosComplete\(kycPhotos\)/);
  assert.match(onboardingPage, /onKycPhotosChange=\{setKycPhotos\}/);
  assert.match(onboardingPage, /onboardingMetadata:\s*\{[\s\S]*kycPhotos,/);
  assert.match(backendMapper, /kycPhotos:\s*metadata\.kycPhotos/);
  assert.match(applicationStore, /kycPhotos:\s*draft\.kycPhotos/);
  assert.match(adminReview, /application\.kycPhotos\?\.centre/);
});

test("the camera session cleans up and stale detection cannot commit results", async () => {
  const { isCurrentKycSession, runKycPoseDetection } = photoHelpers;
  const lock = { sessionId: null };
  let activeSessionId = 12;
  let resolveDetection;
  let updates = 0;
  const staleDetection = runKycPoseDetection(
    lock,
    12,
    () => isCurrentKycSession(12, activeSessionId),
    () => new Promise((resolve) => { resolveDetection = resolve; }),
    () => { updates += 1; },
  );
  const overlappingDetection = await runKycPoseDetection(
    lock,
    13,
    () => isCurrentKycSession(13, activeSessionId),
    async () => "overlap",
    () => { updates += 1; },
  );
  assert.equal(overlappingDetection, false);
  activeSessionId = 13;
  resolveDetection("stale");
  assert.equal(await staleDetection, false);
  assert.equal(updates, 0);

  assert.match(panel, /streamRef\.current\?\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\)/);
  assert.match(
    panel,
    /return \(\) => \{\s*componentMountedRef\.current = false;\s*componentLifecycleIdRef\.current \+= 1;\s*stopCameraSession\(false\);/,
  );
  assert.match(panel, /cameraRequestIdRef\.current \+= 1/);
});

test("the detector lock skips stale frames and permits consecutive completed frames", async () => {
  const { runKycPoseDetection } = photoHelpers;
  const lock = { sessionId: null };
  let detectionCount = 0;
  const staleResult = await runKycPoseDetection(
    lock,
    21,
    () => false,
    () => {
      detectionCount += 1;
      return detectionCount;
    },
    () => {},
  );
  assert.equal(staleResult, false);
  assert.equal(detectionCount, 0);

  for (let frame = 1; frame <= 6; frame += 1) {
    let result = 0;
    assert.equal(
      await runKycPoseDetection(
        lock,
        22,
        () => true,
        () => ++detectionCount,
        (value) => { result = value; },
      ),
      true,
    );
    assert.equal(result, frame);
    assert.equal(lock.sessionId, null);
  }
});

test("KYC photos normalize to the existing center key and remain optional until complete", () => {
  const { areKycPhotosComplete, getKycPhoto, normalizeKycPhotos, withKycPhoto } =
    photoHelpers;
  let photos = {};
  photos = withKycPhoto(photos, "center", "center-photo");
  photos = withKycPhoto(photos, "left", "left-photo");
  assert.equal(areKycPhotosComplete(photos), false);
  photos = withKycPhoto(photos, "right", "right-photo");
  assert.equal(areKycPhotosComplete(photos), true);
  assert.equal(getKycPhoto(photos, "center"), "center-photo");
  assert.deepEqual(
    JSON.parse(JSON.stringify(normalizeKycPhotos({ centre: "center", right: 42, left: "left" }))),
    { left: "left", centre: "center" },
  );
  assert.match(credentials, /hasKycPhotos \|\| digilockerVerified/);
  assert.match(onboardingPage, /!kycVideoUrl && !areKycPhotosComplete\(kycPhotos\)/);
});
