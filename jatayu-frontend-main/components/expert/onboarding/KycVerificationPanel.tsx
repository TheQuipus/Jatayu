"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Camera, ShieldCheck, X } from "lucide-react";
import Image from "next/image";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";
import styles from "./KycVerificationPanel.module.css";
import ContinueButton from "@/components/ui/ContinueButton";
import {
  areKycPhotosComplete,
  getKycPhoto,
  isCurrentKycSession,
  isKycPoseMatch,
  runKycPoseDetection,
  withKycPhoto,
  type ExpertKycPhotos,
  type KycPoseDetectionLock,
  type KycPose,
} from "@/lib/expertKycPhotos";
import {
  canAutoCaptureKycFrame,
  getKycFaceBounds,
  getKycPoseFromYaw,
  getKycYawFromLandmarks,
  isKycFaceInsideOval,
  isKycFaceStable,
  mapMirroredKycFaceBounds,
  type KycFaceBounds,
  type KycFaceSnapshot,
} from "@/lib/kycFaceCapture";

type KycVerificationPanelProps = {
  videoSrc: string;
  onVideoChange: (src: string) => void;
  manualPhotos: ExpertKycPhotos;
  onManualPhotosChange?: (photos: ExpertKycPhotos) => void;
  digilockerLoading: boolean;
  digilockerVerified: boolean;
  digilockerError: string | null;
  onDigilockerVerification: () => void;
  onVerificationComplete?: () => void;
};

type PanelPhase = "intro" | "requesting" | "denied" | "guided" | "review" | "complete";

type PoseKey = "center" | "left" | "right";

type PoseFrames = Record<PoseKey, string>;

function PoseGuideAvatar({ pose }: { pose: PoseKey }) {
  const clipId = `avatar-clip-${pose}`;
  const skinGradId = `skin-grad-${pose}`;
  const hairGradId = `hair-grad-${pose}`;
  const bgGradId = `bg-grad-${pose}`;

  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="32" cy="32" r="30" />
        </clipPath>

        {/* Deep studio backdrop gradient */}
        <radialGradient id={bgGradId} cx="50%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#2B2E3B" />
          <stop offset="100%" stopColor="#14161D" />
        </radialGradient>

        {/* Realistic directional skin shading */}
        <radialGradient
          id={skinGradId}
          cx={pose === "left" ? "35%" : pose === "right" ? "65%" : "50%"}
          cy="40%"
          r="60%"
        >
          <stop offset="0%" stopColor="#F5C8A8" />
          <stop offset="65%" stopColor="#D99B72" />
          <stop offset="100%" stopColor="#A86B46" />
        </radialGradient>

        {/* Rich dark hair gradient */}
        <linearGradient id={hairGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C2F3A" />
          <stop offset="100%" stopColor="#121318" />
        </linearGradient>
      </defs>

      {/* Outer circular badge */}
      <circle cx="32" cy="32" r="30" fill={`url(#${bgGradId})`} />

      <g clipPath={`url(#${clipId})`}>
        {/* Subtle biometric scan ring */}
        <circle
          cx="32"
          cy="32"
          r="25"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Shoulders / Collar */}
        <path
          d="M10 64C12 52 21 48 32 48C43 48 52 52 54 64H10Z"
          fill="#262934"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* Neck with shadow */}
        <path
          d={
            pose === "left"
              ? "M25 41H35L36 51C32 53 26 53 24 51L25 41Z"
              : pose === "right"
                ? "M29 41H39L40 51C38 53 32 53 28 51L29 41Z"
                : "M27 41H37L38 51C34 53 30 53 26 51L27 41Z"
          }
          fill="#B67953"
        />

        {/* === CENTER POSE (FRONT) === */}
        {pose === "center" && (
          <g>
            {/* Ears */}
            <ellipse cx="19.5" cy="29.5" rx="2.3" ry="4.2" fill="#C98A63" />
            <ellipse cx="44.5" cy="29.5" rx="2.3" ry="4.2" fill="#C98A63" />

            {/* Head & Jawline */}
            <path
              d="M20.5 25C20.5 17.5 25.5 13 32 13C38.5 13 43.5 17.5 43.5 25C43.5 34.5 39 42.5 32 42.5C25 42.5 20.5 34.5 20.5 25Z"
              fill={`url(#${skinGradId})`}
            />

            {/* Hair */}
            <path
              d="M19.8 25C19.5 16.5 24.5 11 32 11C39.5 11 44.5 16.5 44.2 25C43.5 20 40.5 17.5 36.5 17.2C32.5 16.9 29 18.2 25.5 17.8C22.5 17.5 20.5 20.5 19.8 25Z"
              fill={`url(#${hairGradId})`}
            />

            {/* Eyebrows */}
            <path d="M24.5 25.2C26 24.3 28.2 24.4 29.5 25" stroke="#1E1F26" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M39.5 25.2C38 24.3 35.8 24.4 34.5 25" stroke="#1E1F26" strokeWidth="1.5" strokeLinecap="round" />

            {/* Eyes */}
            <circle cx="27" cy="27.8" r="1.4" fill="#181920" />
            <circle cx="27.4" cy="27.4" r="0.45" fill="#FFFFFF" />
            <circle cx="37" cy="27.8" r="1.4" fill="#181920" />
            <circle cx="37.4" cy="27.4" r="0.45" fill="#FFFFFF" />

            {/* Nose bridge & tip */}
            <path
              d="M32 27.5V32.5C32 33.2 31.2 33.6 30.6 33.4"
              stroke="#9C5F3C"
              strokeWidth="1.3"
              strokeLinecap="round"
            />

            {/* Mouth */}
            <path
              d="M28.8 36.8C30.5 37.8 33.5 37.8 35.2 36.8"
              stroke="#8F4F32"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* === LEFT POSE (3/4 PROFILE TURNED LEFT) === */}
        {pose === "left" && (
          <g>
            {/* Right ear visible in foreground */}
            <ellipse cx="38.5" cy="30" rx="2.6" ry="4.5" fill="#C98A63" />

            {/* 3/4 Turned Head */}
            <path
              d="M18.5 25.5C18.5 17.5 24 13 31 13C38 13 42.5 17.8 42 26C41.5 35 36.5 42.5 29 42.5C22 42.5 18.5 35 18.5 25.5Z"
              fill={`url(#${skinGradId})`}
            />

            {/* Styled Hair Swept Left */}
            <path
              d="M18.2 24.5C18 16 23.5 11 31.5 11C39 11 43.2 16.5 42.5 26.5C41.2 24 39.8 23.5 38.5 25.5C37.5 21 33 17.5 27.5 17.5C22.5 17.5 19.5 20.5 18.2 24.5Z"
              fill={`url(#${hairGradId})`}
            />

            {/* Eyebrows shifted left */}
            <path d="M20.5 25.2C21.5 24.4 23 24.5 24 25" stroke="#1E1F26" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M27.5 25C29 24.2 31.2 24.4 32.5 25.2" stroke="#1E1F26" strokeWidth="1.5" strokeLinecap="round" />

            {/* Eyes shifted left */}
            <circle cx="22.3" cy="27.8" r="1.3" fill="#181920" />
            <circle cx="22.6" cy="27.4" r="0.4" fill="#FFFFFF" />
            <circle cx="29.8" cy="27.8" r="1.45" fill="#181920" />
            <circle cx="30.2" cy="27.4" r="0.45" fill="#FFFFFF" />

            {/* Angled Nose pointing left */}
            <path
              d="M25.2 27.5L23.5 32.6C23.3 33.2 23.9 33.7 24.6 33.6"
              stroke="#9C5F3C"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mouth shifted left */}
            <path
              d="M23.5 36.8C25 37.7 27.2 37.7 28.5 36.8"
              stroke="#8F4F32"
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* Sleek Orange-Red Directional Turn Arrow (Left) */}
            <path
              d="M54 31H44.5M44.5 31L48 27.5M44.5 31L48 34.5"
              stroke="#E53B17"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* === RIGHT POSE (3/4 PROFILE TURNED RIGHT) === */}
        {pose === "right" && (
          <g>
            {/* Left ear visible in foreground */}
            <ellipse cx="25.5" cy="30" rx="2.6" ry="4.5" fill="#C98A63" />

            {/* 3/4 Turned Head */}
            <path
              d="M45.5 25.5C45.5 17.5 40 13 33 13C26 13 21.5 17.8 22 26C22.5 35 27.5 42.5 35 42.5C42 42.5 45.5 35 45.5 25.5Z"
              fill={`url(#${skinGradId})`}
            />

            {/* Styled Hair Swept Right */}
            <path
              d="M45.8 24.5C46 16 40.5 11 32.5 11C25 11 20.8 16.5 21.5 26.5C22.8 24 24.2 23.5 25.5 25.5C26.5 21 31 17.5 36.5 17.5C41.5 17.5 44.5 20.5 45.8 24.5Z"
              fill={`url(#${hairGradId})`}
            />

            {/* Eyebrows shifted right */}
            <path d="M43.5 25.2C42.5 24.4 41 24.5 40 25" stroke="#1E1F26" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M36.5 25C35 24.2 32.8 24.4 31.5 25.2" stroke="#1E1F26" strokeWidth="1.5" strokeLinecap="round" />

            {/* Eyes shifted right */}
            <circle cx="41.7" cy="27.8" r="1.3" fill="#181920" />
            <circle cx="42" cy="27.4" r="0.4" fill="#FFFFFF" />
            <circle cx="34.2" cy="27.8" r="1.45" fill="#181920" />
            <circle cx="34.6" cy="27.4" r="0.45" fill="#FFFFFF" />

            {/* Angled Nose pointing right */}
            <path
              d="M38.8 27.5L40.5 32.6C40.7 33.2 40.1 33.7 39.4 33.6"
              stroke="#9C5F3C"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Mouth shifted right */}
            <path
              d="M40.5 36.8C39 37.7 36.8 37.7 35.5 36.8"
              stroke="#8F4F32"
              strokeWidth="1.4"
              strokeLinecap="round"
            />

            {/* Sleek Orange-Red Directional Turn Arrow (Right) */}
            <path
              d="M10 31H19.5M19.5 31L16 27.5M19.5 31L16 34.5"
              stroke="#E53B17"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}
      </g>

      {/* Crisp Outer Rim */}
      <circle cx="32" cy="32" r="30" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" />
    </svg>
  );
}

const KYC_STEPS = [
  {
    pose: "center" as const,
    instruction: "Look directly at the camera",
    sub: "Turn your face slowly and hold the pose",
  },
  {
    pose: "left" as const,
    instruction: "Look to your left",
    sub: "Turn your head slowly and hold the pose",
  },
  {
    pose: "right" as const,
    instruction: "Look to your right",
    sub: "Turn your head slowly and hold the pose",
  },
] as const;

const PREVIEW_POSES: { key: KycPose; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "center", label: "Center" },
  { key: "right", label: "Right" },
];

const FACE_LANDMARKER_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm";
const FACE_LANDMARKER_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const STABLE_FACE_SAMPLES_REQUIRED = 5;

function poseFramesFromPhotos(photos: ExpertKycPhotos): PoseFrames {
  return {
    center: getKycPhoto(photos, "center"),
    left: getKycPhoto(photos, "left"),
    right: getKycPhoto(photos, "right"),
  };
}

function captureMirroredFrame(video: HTMLVideoElement): string | null {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 960 / video.videoWidth, 960 / video.videoHeight);
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));

  const context = canvas.getContext("2d", { alpha: false });
  if (!context) return null;

  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

function getPoseFramePayload(
  existingPhotos: ExpertKycPhotos,
  frames: PoseFrames,
): ExpertKycPhotos {
  let photos = { ...existingPhotos };
  for (const pose of ["center", "left", "right"] as const) {
    if (frames[pose]) photos = withKycPhoto(photos, pose, frames[pose]);
  }
  return photos;
}

function getFaceSnapshot(
  bounds: KycFaceBounds,
  videoRect: DOMRect,
): KycFaceSnapshot {
  const width = videoRect.width || 1;
  const height = videoRect.height || 1;
  return {
    centerX: ((bounds.left + bounds.right) / 2 - videoRect.left) / width,
    centerY: ((bounds.top + bounds.bottom) / 2 - videoRect.top) / height,
    width: (bounds.right - bounds.left) / width,
    height: (bounds.bottom - bounds.top) / height,
  };
}

type KycDetectionDiagnostic = {
  reason: string;
  faceCount: number;
  faceBounds: KycFaceBounds | null;
  faceInsideGuide: boolean;
  detectedPose: PoseKey | "none";
  expectedPose: PoseKey;
  stabilitySamples: number;
  yawRatio: number | null;
  neutralYaw: number | null;
  errorMessage?: string;
};

function logKycDetectionDiagnostic(
  lastDiagnostic: { current: { signature: string; timestamp: number } },
  videoRect: DOMRect | null,
  diagnostic: KycDetectionDiagnostic,
): void {
  if (process.env.NODE_ENV !== "development") return;

  const now = performance.now();
  const signature = [
    diagnostic.reason,
    diagnostic.faceCount,
    diagnostic.faceInsideGuide,
    diagnostic.detectedPose,
    diagnostic.expectedPose,
  ].join(":");
  const elapsed = now - lastDiagnostic.current.timestamp;
  if (
    (signature === lastDiagnostic.current.signature && elapsed < 1200) ||
    (signature !== lastDiagnostic.current.signature && elapsed < 300)
  ) {
    return;
  }

  lastDiagnostic.current = { signature, timestamp: now };
  const faceBox = diagnostic.faceBounds && videoRect?.width && videoRect.height
    ? {
      left: Number(((diagnostic.faceBounds.left - videoRect.left) / videoRect.width).toFixed(2)),
      top: Number(((diagnostic.faceBounds.top - videoRect.top) / videoRect.height).toFixed(2)),
      right: Number(((diagnostic.faceBounds.right - videoRect.left) / videoRect.width).toFixed(2)),
      bottom: Number(((diagnostic.faceBounds.bottom - videoRect.top) / videoRect.height).toFixed(2)),
    }
    : null;

  console.debug("[KYC auto-capture]", {
    landmarksDetected: diagnostic.faceCount > 0,
    faceCount: diagnostic.faceCount,
    faceBox,
    faceInsideGuide: diagnostic.faceInsideGuide,
    yawRatio: diagnostic.yawRatio === null ? null : Number(diagnostic.yawRatio.toFixed(3)),
    neutralYaw: diagnostic.neutralYaw === null ? null : Number(diagnostic.neutralYaw.toFixed(3)),
    detectedPose: diagnostic.detectedPose,
    expectedPose: diagnostic.expectedPose,
    stabilitySamples: diagnostic.stabilitySamples,
    blockedReason: diagnostic.reason,
    ...(diagnostic.errorMessage ? { errorMessage: diagnostic.errorMessage } : {}),
  });
}

export default function KycVerificationPanel({
  videoSrc,
  onVideoChange,
  manualPhotos,
  onManualPhotosChange,
  digilockerLoading,
  digilockerVerified,
  digilockerError,
  onDigilockerVerification,
  onVerificationComplete,
}: KycVerificationPanelProps) {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const faceOvalRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestPromiseRef = useRef<Promise<MediaStream> | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const faceLandmarkerInitRef = useRef<Promise<FaceLandmarker | null> | null>(null);
  const prevVideoSrcRef = useRef(videoSrc);
  const cameraStartingRef = useRef(false);
  const cameraReadyRef = useRef(false);
  const componentMountedRef = useRef(false);
  const componentLifecycleIdRef = useRef(0);
  const cameraRequestIdRef = useRef(0);
  const poseCheckInFlightRef = useRef<KycPoseDetectionLock>({ sessionId: null });
  const detectionRunningRef = useRef(false);
  const activeDetectionPromiseRef = useRef<Promise<boolean> | null>(null);
  const lastDetectionDiagnosticRef = useRef({
    signature: "",
    timestamp: Number.NEGATIVE_INFINITY,
  });
  const captureInProgressRef = useRef(false);
  const lastLandmarkerTimestampRef = useRef(0);
  const neutralYawSamplesRef = useRef<number[]>([]);
  const stableFaceRef = useRef<{
    pose: PoseKey | null;
    snapshot: KycFaceSnapshot | null;
    sampleCount: number;
  }>({ pose: null, snapshot: null, sampleCount: 0 });
  const [mounted, setMounted] = useState(false);

  const [phase, setPhase] = useState<PanelPhase>(
    videoSrc || areKycPhotosComplete(manualPhotos) ? "complete" : "intro",
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceInsideGuide, setFaceInsideGuide] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [poseFrames, setPoseFrames] = useState<PoseFrames>(() =>
    poseFramesFromPhotos(manualPhotos),
  );
  const poseFramesRef = useRef(poseFrames);
  const [cameraError, setCameraError] = useState("");
  const [captureError, setCaptureError] = useState("");
  const [detectionError, setDetectionError] = useState("");
  const [detectionStatus, setDetectionStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [faceStatusMessage, setFaceStatusMessage] = useState("Position your face in the oval");
  const [detectedPose, setDetectedPose] = useState<PoseKey | "none">("none");
  const [holdProgress, setHoldProgress] = useState(0);
  const holdProgressRef = useRef(0);
  const poseStepGenerationRef = useRef(0);
  const capturedStepIndexRef = useRef<number | null>(null);

  const isModalOpen =
    phase === "requesting" || phase === "guided" || phase === "review" || phase === "denied";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    cameraReadyRef.current = false;
    if (componentMountedRef.current) setCameraReady(false);
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const stopCameraSession = useCallback((updateUi = true) => {
    cameraRequestIdRef.current += 1;
    cameraStartingRef.current = false;
    cameraRequestPromiseRef.current = null;
    stopStream();
    if (updateUi) {
      setFaceDetected(false);
      setFaceInsideGuide(false);
      setDetectedPose("none");
      setHoldProgress(0);
      holdProgressRef.current = 0;
      setFaceStatusMessage("Position your face in the oval");
    }
  }, [stopStream]);

 const resetVerification = useCallback(() => {
    stopCameraSession();
    if (videoSrc.startsWith("blob:")) {
      URL.revokeObjectURL(videoSrc);
    }
    onVideoChange("");
    setCameraError("");
    setCaptureError("");
    setStepIndex(0);
    const emptyFrames: PoseFrames = { center: "", left: "", right: "" };
    poseFramesRef.current = emptyFrames;
    setPoseFrames(emptyFrames);
    setPhase("intro");
  }, [onVideoChange, stopCameraSession, videoSrc]);

  const cancelCameraFlow = useCallback(() => {
    stopCameraSession();
    setCameraError("");
    setCaptureError("");
    setStepIndex(0);
    const emptyFrames: PoseFrames = { center: "", left: "", right: "" };
    poseFramesRef.current = emptyFrames;
    setPoseFrames(emptyFrames);
    setPhase("intro");
  }, [stopCameraSession]);

  const closeCameraFlow = cancelCameraFlow;

  const captureCurrentPose = useCallback((poseIndex: number): boolean => {
    const video = liveVideoRef.current;
    if (!cameraReadyRef.current || !video) {
      setCaptureError("Wait for the camera preview to finish starting before taking a photo.");
      return false;
    }

    const frame = captureMirroredFrame(video);
    if (!frame) {
      setCaptureError("The camera frame could not be captured. Please try again.");
      return false;
    }

    const pose = KYC_STEPS[poseIndex].pose;
    const next = { ...poseFramesRef.current, [pose]: frame };
    poseFramesRef.current = next;
    setPoseFrames(next);
    setCaptureError("");
    return true;
  }, []);

  const resetPoseStability = useCallback(() => {
    stableFaceRef.current = { pose: null, snapshot: null, sampleCount: 0 };
    holdProgressRef.current = 0;
    setHoldProgress(0);
  }, []);

  const captureStep = useCallback((poseIndex: number): boolean => {
    if (
      captureInProgressRef.current ||
      capturedStepIndexRef.current === poseIndex ||
      !cameraReadyRef.current
    ) {
      return false;
    }

    captureInProgressRef.current = true;
    try {
      if (!captureCurrentPose(poseIndex)) return false;

      poseStepGenerationRef.current += 1;
      capturedStepIndexRef.current = poseIndex;
      resetPoseStability();
      if (poseIndex === KYC_STEPS.length - 1) {
        setPhase("review");
      } else {
        setStepIndex(poseIndex + 1);
        setFaceStatusMessage(KYC_STEPS[poseIndex + 1].instruction);
      }
      return true;
    } finally {
      captureInProgressRef.current = false;
    }
  }, [captureCurrentPose, resetPoseStability]);

  const handleManualCapture = useCallback(() => {
    captureStep(stepIndex);
  }, [captureStep, stepIndex]);

  const handleRetakePose = useCallback((poseIndex: number) => {
    capturedStepIndexRef.current = null;
    poseStepGenerationRef.current += 1;
    resetPoseStability();
    cameraReadyRef.current = false;
    setCameraReady(false);
    setStepIndex(poseIndex);
    setCaptureError("");
    setFaceStatusMessage(KYC_STEPS[poseIndex].instruction);
    setPhase("guided");
  }, [resetPoseStability]);

  const handleContinueCapture = useCallback(() => {
    const photos = getPoseFramePayload(manualPhotos, poseFramesRef.current);
    if (!areKycPhotosComplete(photos)) {
      setCaptureError("Capture a photo for each pose before continuing.");
      return;
    }

    onManualPhotosChange?.(photos);
    onVerificationComplete?.();
    setCaptureError("");
    stopCameraSession(false);
    setPhase("complete");
  }, [manualPhotos, onManualPhotosChange, onVerificationComplete, stopCameraSession]);

  const initializeFaceLandmarker = useCallback(async () => {
    if (faceLandmarkerRef.current) return faceLandmarkerRef.current;
    if (faceLandmarkerInitRef.current) return faceLandmarkerInitRef.current;

    const lifecycleId = componentLifecycleIdRef.current;
    setDetectionStatus("loading");
    setDetectionError("");
    const initialization = (async () => {
      const { FaceLandmarker: MediaPipeFaceLandmarker, FilesetResolver } =
        await import("@mediapipe/tasks-vision");
      const fileset = await FilesetResolver.forVisionTasks(FACE_LANDMARKER_WASM_URL);
      const landmarker = await MediaPipeFaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numFaces: 2,
        minFaceDetectionConfidence: 0.6,
        minFacePresenceConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      if (
        !componentMountedRef.current ||
        lifecycleId !== componentLifecycleIdRef.current
      ) {
        landmarker.close();
        return null;
      }
      faceLandmarkerRef.current = landmarker;
      setDetectionStatus("ready");
      return landmarker;
    })();

    faceLandmarkerInitRef.current = initialization;
    try {
      return await initialization;
    } catch (error) {
      if (componentMountedRef.current) {
        setDetectionStatus("unavailable");
        setDetectionError(
          error instanceof Error
            ? `Automatic face detection could not start: ${error.message}`
            : "Automatic face detection could not start. Click Photo is still available.",
        );
      }
      return null;
    } finally {
      if (faceLandmarkerInitRef.current === initialization) {
        faceLandmarkerInitRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    componentMountedRef.current = true;
    componentLifecycleIdRef.current += 1;
    return () => {
      componentMountedRef.current = false;
      componentLifecycleIdRef.current += 1;
      stopCameraSession(false);
      const landmarker = faceLandmarkerRef.current;
      faceLandmarkerRef.current = null;
      const activeDetection = activeDetectionPromiseRef.current;
      if (landmarker) {
        const closeLandmarker = () => landmarker.close();
        if (activeDetection) {
          void activeDetection.then(closeLandmarker, closeLandmarker);
        } else {
          closeLandmarker();
        }
      }
      faceLandmarkerInitRef.current = null;
    };
  }, [stopCameraSession]);

  useEffect(() => {
    const originalError = console.error;

    console.error = (...args: unknown[]) => {
      const message = args.map((arg) => String(arg)).join(" ");
      if (message.includes("INFO: Created TensorFlow Lite XNNPACK delegate for CPU")) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  useEffect(() => {
    const previous = prevVideoSrcRef.current;
    prevVideoSrcRef.current = videoSrc;

    if (!previous && videoSrc) {
      setPhase("complete");
    } else if (previous && !videoSrc) {
      setPhase("intro");
    }
  }, [videoSrc]);

  useEffect(() => {
    if (!isModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isModalOpen]);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCameraFlow();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, closeCameraFlow]);

  useEffect(() => {
    if (phase !== "guided") return;

    let cancelled = false;
    let nextFrameTimeout: number | null = null;
    const sessionId = cameraRequestIdRef.current;
    const poseStepGeneration = poseStepGenerationRef.current;
    const scheduleNextFrame = () => {
      if (!cancelled) {
        nextFrameTimeout = window.setTimeout(() => {
          void checkPose();
        }, 200);
      }
    };

    const checkPose = async () => {
      const video = liveVideoRef.current;
      const landmarker = faceLandmarkerRef.current;
      const expectedPose = KYC_STEPS[stepIndex].pose;
      let detectionPromise: Promise<boolean> | null = null;
      let ownsDetectionGuard = false;
      const report = (
        reason: string,
        details: Partial<Omit<KycDetectionDiagnostic, "reason" | "expectedPose">> = {},
      ) => {
        logKycDetectionDiagnostic(
          lastDetectionDiagnosticRef,
          video?.getBoundingClientRect() ?? null,
          {
            reason,
            faceCount: details.faceCount ?? 0,
            faceBounds: details.faceBounds ?? null,
            faceInsideGuide: details.faceInsideGuide ?? false,
            detectedPose: details.detectedPose ?? "none",
            expectedPose,
            stabilitySamples: details.stabilitySamples ?? 0,
            yawRatio: details.yawRatio ?? null,
            neutralYaw: details.neutralYaw ?? null,
            errorMessage: details.errorMessage,
          },
        );
      };

      if (cancelled) return;
      const stream = streamRef.current;
      if (
        !video ||
        !cameraReadyRef.current ||
        !stream ||
        video.srcObject !== stream ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0 ||
        video.videoHeight === 0 ||
        !stream.getVideoTracks().some((track) => track.readyState === "live")
      ) {
        report("camera-frame-not-ready");
        scheduleNextFrame();
        return;
      }
      if (!landmarker) {
        report(detectionStatus === "unavailable" ? "detector-unavailable" : "detector-loading");
        if (detectionStatus === "unavailable") {
          setFaceStatusMessage("Automatic detection unavailable. Click Photo to capture manually.");
        }
        scheduleNextFrame();
        return;
      }
      if (detectionRunningRef.current) {
        report("detection-in-flight", {
          stabilitySamples: stableFaceRef.current.sampleCount,
        });
        scheduleNextFrame();
        return;
      }

      detectionRunningRef.current = true;
      ownsDetectionGuard = true;
      try {
        detectionPromise = runKycPoseDetection(
          poseCheckInFlightRef.current,
          sessionId,
          () => !cancelled
            && isCurrentKycSession(sessionId, cameraRequestIdRef.current)
            && poseStepGeneration === poseStepGenerationRef.current
            && componentMountedRef.current
            && cameraReadyRef.current
            && faceLandmarkerRef.current === landmarker
            && streamRef.current === stream
            && video.srcObject === stream
            && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
            && video.videoWidth > 0
            && video.videoHeight > 0
            && stream.getVideoTracks().some((track) => track.readyState === "live"),
          () => {
            const timestamp = Math.max(performance.now(), lastLandmarkerTimestampRef.current + 1);
            lastLandmarkerTimestampRef.current = timestamp;
            const originalError = console.error;
            console.error = (...args: unknown[]) => {
              if (
                typeof args[0] === "string" &&
                args[0].includes("INFO: Created TensorFlow Lite XNNPACK delegate for CPU")
              ) {
                return;
              }
              originalError.apply(console, args);
            };

            try {
              return landmarker.detectForVideo(video, timestamp);
            } finally {
              console.error = originalError;
            }
          },
          (result) => {
            const faces = result.faceLandmarks;
            setDetectionError("");
            setFaceDetected(faces.length > 0);

            if (faces.length === 0) {
              report("no-face", { faceCount: 0 });
              setFaceInsideGuide(false);
              setDetectedPose("none");
              setFaceStatusMessage("Position your face in the oval");
              stableFaceRef.current = { pose: null, snapshot: null, sampleCount: 0 };
              holdProgressRef.current = Math.max(0, holdProgressRef.current - 15);
              setHoldProgress(holdProgressRef.current);
              return;
            }
            if (faces.length !== 1) {
              report("multiple-faces", { faceCount: faces.length });
              setFaceInsideGuide(false);
              setDetectedPose("none");
              setFaceStatusMessage("Only one face can be in the frame");
              stableFaceRef.current = { pose: null, snapshot: null, sampleCount: 0 };
              holdProgressRef.current = Math.max(0, holdProgressRef.current - 15);
              setHoldProgress(holdProgressRef.current);
              return;
            }

            const landmarks = faces[0];
            const normalizedBounds = getKycFaceBounds(landmarks);
            const videoRect = video.getBoundingClientRect();
            const ovalRect = faceOvalRef.current?.getBoundingClientRect();
            const faceBounds = normalizedBounds && mapMirroredKycFaceBounds(
              normalizedBounds,
              video.videoWidth,
              video.videoHeight,
              videoRect,
            );
            const faceSizeValid = Boolean(
              normalizedBounds &&
              normalizedBounds.right - normalizedBounds.left >= 0.05 &&
              normalizedBounds.bottom - normalizedBounds.top >= 0.06,
            );
            const insideGuide = Boolean(
              faceBounds &&
              ovalRect &&
              faceSizeValid &&
              isKycFaceInsideOval(faceBounds, ovalRect),
            );
            setFaceInsideGuide(insideGuide);

            const yaw = getKycYawFromLandmarks(landmarks);
            if (yaw === null) {
              report("yaw-unavailable", {
                faceCount: faces.length,
                faceBounds,
                faceInsideGuide: insideGuide,
              });
              setDetectedPose("none");
              setFaceStatusMessage("Head position is unclear. Click Photo to capture manually.");
              stableFaceRef.current = { pose: null, snapshot: null, sampleCount: 0 };
              holdProgressRef.current = Math.max(0, holdProgressRef.current - 15);
              setHoldProgress(holdProgressRef.current);
              return;
            }

            if (
              stepIndex === 0 &&
              insideGuide &&
              Math.abs(yaw) <= 0.3 &&
              neutralYawSamplesRef.current.length < 5
            ) {
              neutralYawSamplesRef.current.push(yaw);
            }
            const neutralYaw = neutralYawSamplesRef.current.length > 0
              ? Math.max(
                -0.12,
                Math.min(
                  0.12,
                  neutralYawSamplesRef.current.reduce((sum, value) => sum + value, 0)
                    / neutralYawSamplesRef.current.length,
                ),
              )
              : 0;
            const pose = getKycPoseFromYaw(yaw, neutralYaw, expectedPose);
            setDetectedPose(pose ?? "none");

            if (!insideGuide) {
              const blockedReason = !normalizedBounds
              ? "face-bounds-unavailable"
              : !faceSizeValid
                ? "face-too-small"
                : !ovalRect
                  ? "oval-unavailable"
                  : "face-outside-oval";
              report(blockedReason, {
              faceCount: faces.length,
              faceBounds,
              detectedPose: pose ?? "none",
              yawRatio: yaw,
              neutralYaw,
              });
              setFaceStatusMessage(
              !faceSizeValid && normalizedBounds
                ? "Move closer so your face is clearly visible in the oval"
                : "Move your face toward the center of the oval",
              );
              stableFaceRef.current = { pose: null, snapshot: null, sampleCount: 0 };
              holdProgressRef.current = Math.max(0, holdProgressRef.current - 15);
              setHoldProgress(holdProgressRef.current);
              return;
            }

            const poseMatches = isKycPoseMatch(expectedPose, pose ?? "none", true);
            if (!poseMatches || !faceBounds) {
              report("wrong-pose", {
              faceCount: faces.length,
              faceBounds,
              faceInsideGuide: insideGuide,
              detectedPose: pose ?? "none",
              yawRatio: yaw,
              neutralYaw,
              });
              setFaceStatusMessage(KYC_STEPS[stepIndex].instruction);
              stableFaceRef.current = { pose: null, snapshot: null, sampleCount: 0 };
              holdProgressRef.current = Math.max(0, holdProgressRef.current - 15);
              setHoldProgress(holdProgressRef.current);
              return;
            }

            const snapshot = getFaceSnapshot(faceBounds, videoRect);
            const previous = stableFaceRef.current;
            const stable = previous.pose === pose
              && isKycFaceStable(previous.snapshot, snapshot);
            const sampleCount = stable ? previous.sampleCount + 1 : 1;
            stableFaceRef.current = { pose, snapshot, sampleCount };
            const nextProgress = Math.min(
              100,
              Math.round((sampleCount / STABLE_FACE_SAMPLES_REQUIRED) * 100),
            );
            holdProgressRef.current = nextProgress;
            setHoldProgress(nextProgress);
            setFaceStatusMessage(
              `✓ ${expectedPose.toUpperCase()} pose detected — hold still (${nextProgress}%)`,
            );

            const captureConditionsMet = canAutoCaptureKycFrame({
              faceCount: faces.length,
              faceInsideOval: insideGuide,
              poseMatches,
              stable: sampleCount >= STABLE_FACE_SAMPLES_REQUIRED,
            });
            if (captureConditionsMet && capturedStepIndexRef.current !== stepIndex) {
              report("capture-conditions-met", {
                faceCount: faces.length,
                faceBounds,
                faceInsideGuide: insideGuide,
                detectedPose: pose ?? "none",
                stabilitySamples: sampleCount,
                yawRatio: yaw,
                neutralYaw,
              });
              const captured = captureStep(stepIndex);
              if (!captured) {
                const captureBlockReason = captureInProgressRef.current
                  ? "capture-in-progress"
                  : capturedStepIndexRef.current === stepIndex
                    ? "step-already-captured"
                    : !cameraReadyRef.current
                      ? "camera-not-ready"
                      : "frame-capture-failed";
                report(captureBlockReason, {
                  faceCount: faces.length,
                  faceBounds,
                  faceInsideGuide: insideGuide,
                  detectedPose: pose ?? "none",
                  stabilitySamples: sampleCount,
                  yawRatio: yaw,
                  neutralYaw,
                });
              }
            } else {
              report("waiting-for-stability", {
                faceCount: faces.length,
                faceBounds,
                faceInsideGuide: insideGuide,
                detectedPose: pose ?? "none",
                stabilitySamples: sampleCount,
                yawRatio: yaw,
                neutralYaw,
              });
            }
          },
        );
        activeDetectionPromiseRef.current = detectionPromise;
        const detectionRan = await detectionPromise;
        if (
          !detectionRan &&
          !cancelled &&
          isCurrentKycSession(sessionId, cameraRequestIdRef.current)
        ) {
          report("detection-in-flight", {
            stabilitySamples: stableFaceRef.current.sampleCount,
          });
        }
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "Face detection failed.";
        report("inference-error", { errorMessage: message });
        setDetectionError(`Automatic detection will retry: ${message}. Click Photo to continue.`);
        setFaceStatusMessage("Face detection is retrying. Click Photo is still available.");
        stableFaceRef.current = { pose: null, snapshot: null, sampleCount: 0 };
        holdProgressRef.current = 0;
        setHoldProgress(0);
      } finally {
        if (ownsDetectionGuard) {
          if (activeDetectionPromiseRef.current === detectionPromise) {
            activeDetectionPromiseRef.current = null;
          }
          detectionRunningRef.current = false;
        }
        scheduleNextFrame();
      }
    };

    void checkPose();

    return () => {
      cancelled = true;
      if (nextFrameTimeout !== null) {
        window.clearTimeout(nextFrameTimeout);
      }
    };
  }, [captureStep, detectionStatus, phase, stepIndex]);

  useEffect(() => {
    if (phase !== "guided") return;
    const videoEl = liveVideoRef.current;
    const stream = streamRef.current;
    if (!videoEl || !stream) return;
    videoEl.srcObject = stream;
    const markReady = () => {
      if (videoEl.videoWidth === 0 || videoEl.videoHeight === 0) return;
      cameraReadyRef.current = true;
      setCameraReady(true);
      setCameraError("");
    };
    videoEl.addEventListener("loadeddata", markReady);
    void videoEl.play().then(markReady).catch(() => {
      setCameraError("The live camera preview could not be played. Check browser camera permissions and try again.");
      setPhase("denied");
      stopCameraSession();
    });
    return () => videoEl.removeEventListener("loadeddata", markReady);
  }, [phase, stopCameraSession]);

  const beginVerification = async () => {
    if (cameraStartingRef.current || streamRef.current || cameraRequestPromiseRef.current) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access. Try a current browser with camera permission.");
      setPhase("denied");
      return;
    }

    cameraStartingRef.current = true;
    poseStepGenerationRef.current += 1;
    capturedStepIndexRef.current = null;
    captureInProgressRef.current = false;
    resetPoseStability();
    neutralYawSamplesRef.current = [];
    lastLandmarkerTimestampRef.current = 0;
    cameraReadyRef.current = false;
    setCameraReady(false);
    setDetectionStatus(faceLandmarkerRef.current ? "ready" : "loading");
    setDetectionError("");
    const requestId = cameraRequestIdRef.current + 1;
    cameraRequestIdRef.current = requestId;
    setCameraError("");
    setCaptureError("");
    setStepIndex(0);
    const emptyFrames: PoseFrames = { center: "", left: "", right: "" };
    poseFramesRef.current = emptyFrames;
    setPoseFrames(emptyFrames);
    setFaceDetected(false);
    setFaceInsideGuide(false);
    setDetectedPose("none");
    setFaceStatusMessage("Position your face in the oval");
    void initializeFaceLandmarker();
    setPhase("requesting");
    let request: Promise<MediaStream> | null = null;
    try {
      request = navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      cameraRequestPromiseRef.current = request;
      const stream = await request;
      if (!isCurrentKycSession(requestId, cameraRequestIdRef.current)) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      setPhase("guided");
    } catch (error) {
      if (!isCurrentKycSession(requestId, cameraRequestIdRef.current)) return;
      stopCameraSession();
      const errorName = error instanceof DOMException ? error.name : "";
      setCameraError(
        errorName === "NotAllowedError" || errorName === "SecurityError"
          ? "Camera permission was denied. Allow camera access in your browser settings, then try again."
          : "The camera could not be started. Check that it is connected and not being used by another app.",
      );
      setPhase("denied");
    } finally {
      if (isCurrentKycSession(requestId, cameraRequestIdRef.current)) {
        cameraStartingRef.current = false;
      }
      if (request && cameraRequestPromiseRef.current === request) {
        cameraRequestPromiseRef.current = null;
      }
    }
  };

  const currentStep = KYC_STEPS[stepIndex];
  const manualComplete = areKycPhotosComplete(manualPhotos);
  const hasLegacyPhotos = !videoSrc && manualComplete;
  const statusText = !cameraReady
    ? "Starting camera preview…"
    : detectionStatus === "loading"
      ? "Loading face detection…"
      : faceStatusMessage;
  const showCompleteState =
    phase === "complete" &&
    (hasLegacyPhotos || Boolean(videoSrc)) &&
    !isModalOpen;

  const cameraModal =
    mounted && isModalOpen
      ? createPortal(
        <div className={styles.cameraModal} role="dialog" aria-modal="true" aria-label="Identity verification camera">
          {phase === "requesting" ? (
            <div className={styles.modalLoading}>
              <button
                type="button"
                className={styles.cameraBackBtn}
                onClick={closeCameraFlow}
                aria-label="Back to verification methods"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <div className={styles.spinner} aria-hidden="true" />
              <p className={styles.processingText}>Starting camera…</p>
            </div>
          ) : null}

          {phase === "denied" ? (
            <div className={styles.modalDenied}>
              <button
                type="button"
                className={styles.cameraBackBtn}
                onClick={closeCameraFlow}
                aria-label="Back to verification methods"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <div className={styles.introIconWrap}>
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
              <h3 className={styles.modalDeniedTitle}>Camera access required</h3>
              <p className={styles.modalDeniedText}>
                {cameraError || "Allow camera access in your browser settings and try again."}
              </p>
              <button
                type="button"
                className={styles.beginBtn}
                onClick={() => void beginVerification()}
              >
                Try again
              </button>
            </div>
          ) : null}

          {phase === "guided" ? (
            <div className={styles.session}>
              <video ref={liveVideoRef} className={styles.liveVideo} muted playsInline autoPlay />
              <div className={styles.sessionOverlay}>
                {/* <button
                  type="button"
                  className={styles.cameraBackBtn}
                  onClick={closeCameraFlow}
                  aria-label="Back to verification methods"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button> */}

                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeCameraFlow}
                  aria-label="Cancel verification"
                >
                  <X size={16} />
                </button>

                <div className={styles.frameArea}>
                  <div className={styles.ovalBlock}>
                    <div className={styles.instructionCard}>
                      <div className={styles.instructionInfo}>
                        <div className={styles.instructionAvatar} aria-hidden="true">
                          <img
                            src="/assets/img/avatar1.png"
                            alt="Expert advisor"
                            className={styles.instructionAvatarImg}
                          />
                        </div>
                        <div className={styles.instructionCopy}>
                          <p className={styles.instruction}>{currentStep.instruction}</p>
                          <p className={styles.instructionSub}>
                          {currentStep.sub} or Click Photo manually
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={styles.clickPhotoBtn}
                        onClick={handleManualCapture}
                        disabled={!cameraReady}
                      >
                        <span>Click Photo</span>
                        <Camera size={15} aria-hidden="true" />
                      </button>
                    </div>
                    <div
                      ref={faceOvalRef}
                      className={`${styles.faceOval} ${detectedPose === currentStep.pose
                        && faceInsideGuide
                        && holdProgress > 0
                        ? styles.faceOvalMatched
                        : faceDetected && !faceInsideGuide
                          ? styles.faceOvalWrongPose
                          : styles.faceOvalNotDetected
                        }`}
                    />
                  </div>
                </div>

                <div className={styles.countdownWrap}>
                  <div className={styles.stepDots}>
                    {KYC_STEPS.map(({ pose }, index) => (
                      <span
                        key={pose}
                        className={`${styles.stepDot} ${
                          index === stepIndex
                            ? styles.stepDotActive
                            : poseFrames[pose]
                              ? styles.stepDotDone
                              : ""
                        }`}
                        aria-label={`${pose} ${poseFrames[pose] ? "captured" : "not captured"}`}
                      />
                    ))}
                  </div>
                  <p className={styles.bottomPromptText}>{statusText}</p>
                  {detectionError ? <p className={styles.detectionError}>{detectionError}</p> : null}
                  {captureError ? <p className={styles.captureError} role="alert">{captureError}</p> : null}
                </div>
              </div>
            </div>
          ) : null}

          {phase === "review" ? (
            <div className={styles.captureReview}>
              <button
                type="button"
                className={styles.cameraBackBtn}
                onClick={closeCameraFlow}
                aria-label="Back to verification methods"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={closeCameraFlow}
                aria-label="Cancel verification"
              >
                <X size={16} />
              </button>
              <div className={styles.captureReviewContent}>
                <h2 className={styles.captureReviewTitle}>Review your photos</h2>
                <p className={styles.captureReviewSub}>
                  Retake any angle, or continue to attach these photos to your KYC submission.
                </p>
                <div className={styles.captureReviewGrid}>
                  {KYC_STEPS.map(({ pose, instruction }, index) => (
                    <div className={styles.captureReviewCard} key={pose}>
                      {poseFrames[pose] ? (
                        <img
                          className={styles.captureReviewImage}
                          src={poseFrames[pose]}
                          alt={`${pose} face capture`}
                        />
                      ) : (
                        <div className={styles.captureReviewPlaceholder}>
                          <span>{instruction}</span>
                        </div>
                      )}
                      <span className={styles.captureReviewLabel}>{instruction}</span>
                      <button
                        type="button"
                        className={styles.retakePoseButton}
                        onClick={() => handleRetakePose(index)}
                      >
                        Retake
                      </button>
                    </div>
                  ))}
                </div>
                {captureError ? <p className={styles.captureError} role="alert">{captureError}</p> : null}
                <button
                  type="button"
                  className={styles.continueCaptureButton}
                  onClick={handleContinueCapture}
                  disabled={!areKycPhotosComplete(getPoseFramePayload(manualPhotos, poseFrames))}
                >
                  Continue
                </button>
              </div>
            </div>
          ) : null}
        </div>,
        document.body,
      )
      : null;

  return (
    <>
      <div
        className={styles.kycPanel}
      >
        {phase === "intro" && !showCompleteState ? (
          <div className={styles.methodGrid}>
            <div className={`${styles.methodCardBox} ${styles.digilockerBox}`}>
              <div className={styles.fastestTag}>⚡ FASTEST (10s)</div>
              <div className={styles.cardHeader}>
                <div className={styles.digilockerBrand}>
                  <Image
                    src="/assets/img/DigiLockerDocumentIcon.png"
                    alt="DigiLocker document and cloud icon"
                    width={265}
                    height={236}
                    className={styles.digilockerLogoIcon}
                  />
                  <div className={styles.digilockerWordmark}>
                    <span className={styles.digilockerName}>DigiLocker</span>
                    <span className={styles.digilockerTagline}>Govt. of India Partner</span>
                  </div>
                </div>
                <span className={styles.brandDivider} aria-hidden="true" />
                <span className={styles.instantApprovedBadge}>
                  {digilockerVerified ? "Verified" : "Instant Approved"}
                </span>
              </div>
              <h4 className={styles.cardTitle}>Verify with DigiLocker</h4>
              <p className={styles.cardDesc}>
                Paperless, pre-verified &amp; 100% secure.
                <br />
                Fetch digital IDs in 1 click.
              </p>
              <ul className={styles.cardChecklist}>
                <li>
                  <span aria-hidden="true">✓</span>
                  <span>No manual reviews required</span>
                </li>
                <li>
                  <span aria-hidden="true">✓</span>
                  <span>Pre-approved trust badge</span>
                </li>
              </ul>
              {digilockerError ? <p className={styles.digilockerError} role="alert">{digilockerError}</p> : null}
              <ContinueButton
                type="button"
                className={styles.primaryDigiBtn}
                disabled={digilockerLoading}
                onClick={onDigilockerVerification}
                showArrow={false}
                label={digilockerVerified
                  ? "DIGILOCKER VERIFIED"
                  : digilockerLoading
                    ? "OPENING..."
                    : "CONTINUE WITH DIGILOCKER →"}
              />
            </div>

            <div className={`${styles.methodCardBox} ${styles.cameraVerificationBox}`}>
              <div className={styles.cardHeaderCenter}>
                <ShieldCheck size={28} className={styles.shieldIcon} />
              </div>
              <h4 className={styles.cardTitle}>Verify Manually</h4>
              <p className={styles.cardDesc}>
                Requires upload of photos &amp; docs.<br />Manual verification takes 24-48 hours.
              </p>
              <ul className={styles.cameraInstructions}>
                <li>Scan and upload IDs</li>
                <li>Face capture photo</li>
              </ul>
              <p className={styles.cameraVerificationNote}>
                Note: Ensure your face and ID are clearly visible during capture.
              </p>
              <button
                type="button"
                className={styles.cameraVerificationBtn}
                onClick={() => void beginVerification()}
              >
                <span className={styles.beginBtnLabelViewport}>
                  <span className={styles.beginBtnLabelTrack}>
                    <span className={styles.beginBtnLabelText}>BEGIN VERIFICATION</span>
                    <span className={styles.beginBtnLabelText} aria-hidden="true">
                      BEGIN VERIFICATION
                    </span>
                  </span>
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {showCompleteState ? (
          <div className={styles.complete}>
            <div className={styles.completePreview}>
              <div className={styles.poseGrid}>
                {PREVIEW_POSES.map(({ key, label }) => (
                  <div key={key} className={styles.poseCard}>
                    {(hasLegacyPhotos
                      ? getKycPhoto(manualPhotos, key)
                      : poseFrames[key]) ? (
                      <img
                        src={hasLegacyPhotos
                          ? getKycPhoto(manualPhotos, key)
                          : poseFrames[key]}
                        alt={`${label} pose capture`}
                        className={styles.poseImage}
                      />
                    ) : (
                      <div className={styles.posePlaceholder} aria-hidden="true" />
                    )}
                    <span className={styles.poseLabel}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.completeFooter}>
              <div className={styles.completeMeta}>
                <p className={styles.completeTitle}>
                  {hasLegacyPhotos ? "Saved KYC photos" : "Identity verification submitted"}
                </p>
                <p className={styles.completeHint}>
                  {hasLegacyPhotos
                    ? "These photos will be included with your onboarding submission."
                    : "Our team will review within 24–48 hours"}
                </p>
              </div>
              <button type="button" className={styles.retakeBtn} onClick={resetVerification}>
                {hasLegacyPhotos ? "Retake photos" : "Restart capture"}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "requesting" || phase === "guided" || phase === "review" ? (
          <div className={styles.inlineActive}>
            <div className={styles.spinner} aria-hidden="true" />
            <p className={styles.inlineActiveText}>Camera session in progress…</p>
          </div>
        ) : null}
      </div>

      {cameraModal}
    </>
  );
}
