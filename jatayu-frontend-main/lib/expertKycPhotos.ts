export type KycPose = "left" | "center" | "right";

export type ExpertKycPhotos = {
  left?: string;
  centre?: string;
  right?: string;
};

export type KycPoseDetectionLock = {
  sessionId: number | null;
};

export const MANUAL_KYC_POSES: readonly KycPose[] = ["left", "center", "right"];

export function isKycPoseMatch(
  requestedPose: KycPose,
  detectedPose: KycPose | "none",
  faceDetected: boolean,
): boolean {
  return faceDetected && detectedPose === requestedPose;
}

function tryStartKycPoseDetection(
  lock: KycPoseDetectionLock,
  sessionId: number,
): boolean {
  if (lock.sessionId !== null) return false;
  lock.sessionId = sessionId;
  return true;
}

function finishKycPoseDetection(
  lock: KycPoseDetectionLock,
  sessionId: number,
): void {
  if (lock.sessionId === sessionId) {
    lock.sessionId = null;
  }
}

export async function runKycPoseDetection<T>(
  lock: KycPoseDetectionLock,
  sessionId: number,
  isCurrent: () => boolean,
  detect: () => Promise<T>,
  onResult: (result: T) => void,
): Promise<boolean> {
  if (!tryStartKycPoseDetection(lock, sessionId)) return false;
  try {
    const result = await detect();
    if (!isCurrent()) return false;
    onResult(result);
    return true;
  } finally {
    finishKycPoseDetection(lock, sessionId);
  }
}

export function getKycPhoto(
  photos: ExpertKycPhotos,
  pose: KycPose,
): string {
  if (pose === "center") return photos.centre ?? "";
  return photos[pose] ?? "";
}

export function withKycPhoto(
  photos: ExpertKycPhotos,
  pose: KycPose,
  dataUrl: string,
): ExpertKycPhotos {
  if (pose === "center") return { ...photos, centre: dataUrl };
  return { ...photos, [pose]: dataUrl };
}

export function areKycPhotosComplete(photos: ExpertKycPhotos): boolean {
  return MANUAL_KYC_POSES.every((pose) => Boolean(getKycPhoto(photos, pose)));
}

export function nextMissingKycPoseIndex(photos: ExpertKycPhotos): number {
  const index = MANUAL_KYC_POSES.findIndex((pose) => !getKycPhoto(photos, pose));
  return index < 0 ? 0 : index;
}

export function normalizeKycPhotos(value: unknown): ExpertKycPhotos {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    ...(typeof record.left === "string" ? { left: record.left } : {}),
    ...(typeof record.centre === "string" ? { centre: record.centre } : {}),
    ...(typeof record.right === "string" ? { right: record.right } : {}),
  };
}

export function manualPhotosAfterCancelledSession(
  currentPhotos: ExpertKycPhotos,
  sessionBaseline: ExpertKycPhotos | null,
): ExpertKycPhotos {
  return sessionBaseline ?? currentPhotos;
}

export function isCurrentKycSession(sessionId: number, activeSessionId: number): boolean {
  return sessionId === activeSessionId;
}
