import type { KycPose } from "./expertKycPhotos";

export type KycFaceLandmark = {
  x: number;
  y: number;
};

export type KycFaceBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type KycFaceSnapshot = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export function getKycFaceBounds(
  landmarks: readonly KycFaceLandmark[],
): KycFaceBounds | null {
  if (landmarks.length === 0) return null;

  let left = Number.POSITIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;

  for (const landmark of landmarks) {
    if (!Number.isFinite(landmark.x) || !Number.isFinite(landmark.y)) return null;
    left = Math.min(left, landmark.x);
    top = Math.min(top, landmark.y);
    right = Math.max(right, landmark.x);
    bottom = Math.max(bottom, landmark.y);
  }

  return right > left && bottom > top ? { left, top, right, bottom } : null;
}

export function mapMirroredKycFaceBounds(
  bounds: KycFaceBounds,
  videoWidth: number,
  videoHeight: number,
  viewport: { left: number; top: number; width: number; height: number },
): KycFaceBounds | null {
  if (
    videoWidth <= 0 ||
    videoHeight <= 0 ||
    viewport.width <= 0 ||
    viewport.height <= 0
  ) {
    return null;
  }

  const scale = Math.max(viewport.width / videoWidth, viewport.height / videoHeight);
  const cropX = (videoWidth * scale - viewport.width) / 2;
  const cropY = (videoHeight * scale - viewport.height) / 2;
  const mapX = (x: number) => viewport.left + ((1 - x) * videoWidth * scale - cropX);
  const mapY = (y: number) => viewport.top + (y * videoHeight * scale - cropY);

  return {
    left: mapX(bounds.right),
    top: mapY(bounds.top),
    right: mapX(bounds.left),
    bottom: mapY(bounds.bottom),
  };
}

export function isKycFaceInsideOval(
  face: KycFaceBounds,
  oval: KycFaceBounds,
): boolean {
  const ovalWidth = oval.right - oval.left;
  const ovalHeight = oval.bottom - oval.top;
  const faceWidth = face.right - face.left;
  const faceHeight = face.bottom - face.top;
  if (
    ovalWidth <= 0 ||
    ovalHeight <= 0 ||
    faceWidth <= 0 ||
    faceHeight <= 0
  ) {
    return false;
  }

  const centerX = (oval.left + oval.right) / 2;
  const centerY = (oval.top + oval.bottom) / 2;
  const radiusX = ovalWidth * 0.375;
  const radiusY = ovalHeight * 0.375;
  const faceCenterX = (face.left + face.right) / 2;
  const faceCenterY = (face.top + face.bottom) / 2;
  const centerAligned =
    ((faceCenterX - centerX) / radiusX) ** 2
      + ((faceCenterY - centerY) / radiusY) ** 2 <= 1;
  const marginX = ovalWidth * 0.02;
  const marginY = ovalHeight * 0.02;
  const boundsFit = faceWidth <= ovalWidth * 1.04
    && faceHeight <= ovalHeight * 1.04
    && face.left >= oval.left - marginX
    && face.right <= oval.right + marginX
    && face.top >= oval.top - marginY
    && face.bottom <= oval.bottom + marginY;

  return centerAligned && boundsFit;
}

export function getKycYawFromLandmarks(
  landmarks: readonly KycFaceLandmark[],
): number | null {
  const nose = landmarks[1];
  const firstEye = landmarks[33];
  const secondEye = landmarks[263];
  if (!nose || !firstEye || !secondEye) return null;

  const eyeSpan = Math.abs(secondEye.x - firstEye.x);
  if (eyeSpan < 0.001) return null;

  const eyeMidpoint = (firstEye.x + secondEye.x) / 2;
  return -(nose.x - eyeMidpoint) / (eyeSpan / 2);
}

export function getKycPoseFromYaw(
  yaw: number,
  neutralYaw: number,
  requestedPose: KycPose,
): KycPose | null {
  const relativeYaw = yaw - neutralYaw;
  if (requestedPose === "center") {
    return Math.abs(relativeYaw) <= 0.14 ? "center" : null;
  }
  if (requestedPose === "left") return relativeYaw <= -0.05 ? "left" : null;
  if (requestedPose === "right") return relativeYaw >= 0.05 ? "right" : null;
  return null;
}

export function isKycFaceStable(
  previous: KycFaceSnapshot | null,
  current: KycFaceSnapshot,
): boolean {
  if (!previous) return false;
  const centerMovement = Math.hypot(
    current.centerX - previous.centerX,
    current.centerY - previous.centerY,
  );
  const widthChange = Math.abs(current.width - previous.width);
  const heightChange = Math.abs(current.height - previous.height);
  return centerMovement <= 0.04
    && widthChange <= Math.max(previous.width, current.width) * 0.15
    && heightChange <= Math.max(previous.height, current.height) * 0.15;
}

export function canAutoCaptureKycFrame({
  faceCount,
  faceInsideOval,
  poseMatches,
  stable,
}: {
  faceCount: number;
  faceInsideOval: boolean;
  poseMatches: boolean;
  stable: boolean;
}): boolean {
  return faceCount === 1 && faceInsideOval && poseMatches && stable;
}
