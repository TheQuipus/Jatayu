"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, RotateCcw, ShieldCheck, X } from "lucide-react";
import ShinyText from "@/components/ui/ShinyText";
import styles from "./KycVerificationPanel.module.css";
import {
  areKycPhotosComplete,
  getKycPhoto,
  isCurrentKycSession,
  isKycPoseMatch,
  manualPhotosAfterCancelledSession,
  MANUAL_KYC_POSES,
  nextMissingKycPoseIndex,
  runKycPoseDetection,
  withKycPhoto,
  type ExpertKycPhotos,
  type KycPoseDetectionLock,
  type KycPose,
} from "@/lib/expertKycPhotos";

type KycVerificationPanelProps = {
  videoSrc: string;
  onVideoChange: (src: string) => void;
  manualPhotos: ExpertKycPhotos;
  onManualPhotosChange: (photos: ExpertKycPhotos) => void;
};

type PanelPhase = "intro" | "requesting" | "denied" | "guided" | "manualReview" | "processing" | "complete";
type VerificationMode = "automatic" | "manual";

type PoseKey = "center" | "left" | "right";

type PoseFrames = Record<PoseKey, string>;

const EMPTY_POSE_FRAMES: PoseFrames = {
  center: "",
  left: "",
  right: "",
};

const KYC_STEPS = [
  {
    pose: "center" as const,
    instruction: "Look directly at the camera",
    sub: "Hold still while we capture your likeness",
    duration: 3,
    showIdFrame: false,
  },
  {
    pose: "left" as const,
    instruction: "Look to your left",
    sub: "Turn your head slowly and hold the pose",
    duration: 3,
    showIdFrame: false,
  },
  {
    pose: "right" as const,
    instruction: "Look to your right",
    sub: "Turn your head slowly and hold the pose",
    duration: 3,
    showIdFrame: false,
  },
] as const;

const MANUAL_KYC_STEPS: {
  pose: KycPose;
  instruction: string;
  sub: string;
}[] = [
  { pose: "left", instruction: "Face to your left", sub: "When ready, capture a photo of this position." },
  { pose: "center", instruction: "Face the camera", sub: "When ready, capture a photo of this position." },
  { pose: "right", instruction: "Face to your right", sub: "When ready, capture a photo of this position." },
];

const PREVIEW_POSES: { key: KycPose; label: string }[] = [
  { key: "left", label: "Left" },
  { key: "center", label: "Center" },
  { key: "right", label: "Right" },
];

const POSE_FRAMES_STORAGE_KEY = "jatayu-kyc-pose-frames";

function readStoredPoseFrames(): PoseFrames {
  if (typeof window === "undefined") return EMPTY_POSE_FRAMES;
  try {
    const raw = window.sessionStorage.getItem(POSE_FRAMES_STORAGE_KEY);
    if (!raw) return EMPTY_POSE_FRAMES;
    const parsed = JSON.parse(raw) as Partial<PoseFrames>;
    return {
      center: parsed.center ?? "",
      left: parsed.left ?? "",
      right: parsed.right ?? "",
    };
  } catch {
    return EMPTY_POSE_FRAMES;
  }
}

function writeStoredPoseFrames(frames: PoseFrames) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(POSE_FRAMES_STORAGE_KEY, JSON.stringify(frames));
  } catch {
    // Ignore quota / private-mode failures.
  }
}

function clearStoredPoseFrames() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(POSE_FRAMES_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}

function captureMirroredFrame(
  video: HTMLVideoElement,
  maxDimension?: number,
  quality = 0.85,
): string | null {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  const scale = maxDimension
    ? Math.min(1, maxDimension / Math.max(video.videoWidth, video.videoHeight))
    : 1;
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext("2d");
  if (!context) return null;

  // Match the mirrored live preview (scaleX(-1)).
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    return canvas.toDataURL("image/jpeg", quality);
  } catch {
    return null;
  }
}

type HeadPose = "center" | "left" | "right" | "none";

async function detectHeadPoseInFrame(video: HTMLVideoElement): Promise<{
  faceDetected: boolean;
  pose: HeadPose;
}> {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return { faceDetected: false, pose: "none" };
  }

  // 1. Native FaceDetector API with facial landmarks (Chrome / Edge / Opera / Android)
  const FaceDetectorCtor = (
    window as Window & {
      FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
        detect: (source: HTMLVideoElement) => Promise<{
          boundingBox: { x: number; y: number; width: number; height: number };
          landmarks?: { type: string; locations: { x: number; y: number }[] }[];
        }[]>;
      };
    }
  ).FaceDetector;

  if (FaceDetectorCtor) {
    try {
      const detector = new FaceDetectorCtor({ fastMode: false, maxDetectedFaces: 1 });
      const faces = await detector.detect(video);
      if (faces.length > 0) {
        const face = faces[0];
        const landmarks = face.landmarks || [];
        const nose = landmarks.find((l) => l.type === "nose")?.locations[0];
        const eyes = landmarks.filter((l) => l.type === "eye");

        if (nose && eyes.length >= 2) {
          const eye1 = eyes[0].locations[0];
          const eye2 = eyes[1].locations[0];
          const leftEye = eye1.x < eye2.x ? eye1 : eye2;
          const rightEye = eye1.x < eye2.x ? eye2 : eye1;

          const distLeft = nose.x - leftEye.x;
          const distRight = rightEye.x - nose.x;
          const ratio = distLeft / (distRight || 1);

          if (ratio < 0.65) return { faceDetected: true, pose: "left" };
          if (ratio > 1.55) return { faceDetected: true, pose: "right" };
          return { faceDetected: true, pose: "center" };
        }
        return { faceDetected: true, pose: "center" };
      }
    } catch {
      // Fall through to Canvas analysis
    }
  }

  // 2. High-speed Canvas Pixel & Feature Centroid Analysis (Cross-browser)
  const canvas = document.createElement("canvas");
  const width = 160;
  const height = 200;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return { faceDetected: false, pose: "none" };

  const sourceX = video.videoWidth * 0.2;
  const sourceY = video.videoHeight * 0.1;
  const sourceWidth = video.videoWidth * 0.6;
  const sourceHeight = video.videoHeight * 0.8;

  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);

  let leftWeight = 0;
  let rightWeight = 0;
  let skinCount = 0;
  let xSum = 0;

  for (let y = 30; y < height - 30; y += 3) {
    for (let x = 10; x < width - 10; x += 3) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const brightness = (r + g + b) / 3;

      const isSkin =
        r > 50 &&
        g > 35 &&
        b > 20 &&
        r > g &&
        r > b &&
        brightness > 35 &&
        brightness < 225;

      if (isSkin) {
        skinCount++;
        xSum += x;
        if (x < width / 2) {
          leftWeight += (width / 2 - x) * brightness;
        } else {
          rightWeight += (x - width / 2) * brightness;
        }
      }
    }
  }

  const totalPixels = ((width - 20) / 3) * ((height - 60) / 3);
  if (skinCount / totalPixels < 0.1) {
    return { faceDetected: false, pose: "none" };
  }

  const xCenter = xSum / skinCount;
  const normalizedCenter = (xCenter - width / 2) / (width / 2);
  const weightRatio = (rightWeight - leftWeight) / (rightWeight + leftWeight || 1);

  const poseScore = normalizedCenter * 0.6 + weightRatio * 0.4;

  if (poseScore < -0.05) return { faceDetected: true, pose: "right" };
  if (poseScore > 0.05) return { faceDetected: true, pose: "left" };
  return { faceDetected: true, pose: "center" };
}

export default function KycVerificationPanel({
  videoSrc,
  onVideoChange,
  manualPhotos,
  onManualPhotosChange,
}: KycVerificationPanelProps) {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cameraRequestPromiseRef = useRef<Promise<MediaStream> | null>(null);
  const prevVideoSrcRef = useRef(videoSrc);
  const automaticVideoBaselineRef = useRef(videoSrc);
  const cameraStartingRef = useRef(false);
  const cameraRequestIdRef = useRef(0);
  const manualRetakeRef = useRef(false);
  const manualConfirmingRef = useRef(false);
  const manualSessionBaselineRef = useRef<ExpertKycPhotos | null>(null);
  const poseCheckInFlightRef = useRef<KycPoseDetectionLock>({ sessionId: null });
  const automaticCompletionStartedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  const initialManualComplete = areKycPhotosComplete(manualPhotos);
  const [verificationMode, setVerificationMode] = useState<VerificationMode>(
    initialManualComplete && !videoSrc ? "manual" : "automatic",
  );
  const [phase, setPhase] = useState<PanelPhase>(
    videoSrc || initialManualComplete ? "complete" : "intro",
  );
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [poseFrames, setPoseFrames] = useState<PoseFrames>(() =>
    videoSrc ? readStoredPoseFrames() : EMPTY_POSE_FRAMES,
  );
  const [reviewFrame, setReviewFrame] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isManualRetake, setIsManualRetake] = useState(false);

  const [detectedPose, setDetectedPose] = useState<HeadPose>("none");
  const [holdProgress, setHoldProgress] = useState(0);
  const holdProgressRef = useRef(0);

  const isModalOpen =
    phase === "requesting" || phase === "guided" || phase === "manualReview" ||
    phase === "processing" || phase === "denied";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const stopCameraSession = useCallback((updateUi = true) => {
    cameraRequestIdRef.current += 1;
    cameraStartingRef.current = false;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch (error) {
          if (!(error instanceof DOMException && error.name === "InvalidStateError")) {
            throw error;
          }
        }
      }
    }
    chunksRef.current = [];
    stopStream();
    if (updateUi) {
      setCountdown(null);
      setFaceDetected(false);
      setDetectedPose("none");
      setHoldProgress(0);
      holdProgressRef.current = 0;
    }
  }, [stopStream]);

  const discardPendingAutomaticResult = useCallback(() => {
    if (phase !== "processing" || videoSrc === automaticVideoBaselineRef.current) return;
    if (videoSrc.startsWith("blob:")) {
      URL.revokeObjectURL(videoSrc);
    }
    const baselineVideo = automaticVideoBaselineRef.current;
    prevVideoSrcRef.current = baselineVideo;
    onVideoChange(baselineVideo);
  }, [onVideoChange, phase, videoSrc]);

  const resetVerification = useCallback(() => {
    stopCameraSession();
    automaticCompletionStartedRef.current = false;
    if (videoSrc.startsWith("blob:")) {
      URL.revokeObjectURL(videoSrc);
    }
    onVideoChange("");
    manualRetakeRef.current = false;
    setIsManualRetake(false);
    setReviewFrame("");
    setCameraError("");
    setStepIndex(0);
    setPoseFrames(EMPTY_POSE_FRAMES);
    clearStoredPoseFrames();
    setPhase("intro");
  }, [onVideoChange, stopCameraSession, videoSrc]);

  const cancelManualCapture = useCallback(() => {
    stopCameraSession();
    const baseline = manualSessionBaselineRef.current;
    if (baseline) {
      onManualPhotosChange(manualPhotosAfterCancelledSession(manualPhotos, baseline));
    }
    manualSessionBaselineRef.current = null;
    manualRetakeRef.current = false;
    setIsManualRetake(false);
    setReviewFrame("");
    setCameraError("");
    setStepIndex(0);
    setPhase("intro");
  }, [manualPhotos, onManualPhotosChange, stopCameraSession]);

  const cancelAutomaticVerification = useCallback(() => {
    discardPendingAutomaticResult();
    stopCameraSession();
    automaticCompletionStartedRef.current = false;
    manualSessionBaselineRef.current = null;
    setReviewFrame("");
    setCameraError("");
    setStepIndex(0);
    setPhase("intro");
  }, [discardPendingAutomaticResult, stopCameraSession]);

  const closeCameraFlow = useCallback(() => {
    if (verificationMode === "manual") cancelManualCapture();
    else cancelAutomaticVerification();
  }, [cancelAutomaticVerification, cancelManualCapture, verificationMode]);

  const captureCurrentPose = useCallback(() => {
    const video = liveVideoRef.current;
    if (!video) return;

    const frame = captureMirroredFrame(video);
    if (!frame) return;

    const pose = KYC_STEPS[stepIndex].pose;
    setPoseFrames((prev) => {
      const next = { ...prev, [pose]: frame };
      writeStoredPoseFrames(next);
      return next;
    });
  }, [stepIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      stopCameraSession(false);
    };
  }, [stopCameraSession]);

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

  const finishRecording = useCallback(() => {
    if (automaticCompletionStartedRef.current) return;
    automaticCompletionStartedRef.current = true;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setPhase("processing");
      return;
    }

    const sessionId = cameraRequestIdRef.current;
    recorder.onstop = () => {
      if (!isCurrentKycSession(sessionId, cameraRequestIdRef.current)) return;
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      if (videoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(videoSrc);
      }
      onVideoChange(URL.createObjectURL(blob));
      recorderRef.current = null;
      chunksRef.current = [];
      stopStream();
      setPhase("processing");
    };

    recorder.stop();
  }, [onVideoChange, stopStream, videoSrc]);

  useEffect(() => {
    if (phase !== "guided" || verificationMode !== "automatic") {
      setFaceDetected(false);
      setDetectedPose("none");
      setHoldProgress(0);
      holdProgressRef.current = 0;
      return;
    }

    let cancelled = false;
    const sessionId = cameraRequestIdRef.current;

    const checkPose = async () => {
      const video = liveVideoRef.current;
      if (!video || cancelled) return;
      await runKycPoseDetection(
        poseCheckInFlightRef.current,
        sessionId,
        () => !cancelled && isCurrentKycSession(sessionId, cameraRequestIdRef.current),
        () => detectHeadPoseInFrame(video),
        (result) => {
          setFaceDetected(result.faceDetected);
          setDetectedPose(result.pose);

          const targetPose = KYC_STEPS[stepIndex].pose;
          const isPoseMatch = isKycPoseMatch(targetPose, result.pose, result.faceDetected);

          if (isPoseMatch) {
            const next = Math.min(100, holdProgressRef.current + 25);
            holdProgressRef.current = next;
            setHoldProgress(next);

            if (next >= 100) {
              captureCurrentPose();
              const isLastStep = stepIndex >= KYC_STEPS.length - 1;
              if (isLastStep) {
                finishRecording();
                return;
              }
              setStepIndex((current) => current + 1);
              holdProgressRef.current = 0;
              setHoldProgress(0);
            }
          } else {
            const next = Math.max(0, holdProgressRef.current - 15);
            holdProgressRef.current = next;
            setHoldProgress(next);
          }
        },
      );
    };

    void checkPose();
    const interval = window.setInterval(() => {
      void checkPose();
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [captureCurrentPose, finishRecording, phase, stepIndex, verificationMode]);

  useEffect(() => {
    if (phase !== "guided") return;
    const videoEl = liveVideoRef.current;
    const stream = streamRef.current;
    if (!videoEl || !stream) return;
    videoEl.srcObject = stream;
    void videoEl.play().catch(() => undefined);
  }, [phase, stepIndex]);

  useEffect(() => {
    if (phase !== "processing") return;
    const timer = window.setTimeout(() => setPhase("complete"), 1800);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const beginVerification = async (
    mode: VerificationMode,
    startIndex = mode === "manual" ? nextMissingKycPoseIndex(manualPhotos) : 0,
    isRetake = false,
  ) => {
    if (cameraStartingRef.current || streamRef.current) return;
    const pendingRequest = cameraRequestPromiseRef.current;
    if (pendingRequest) {
      const transitionId = cameraRequestIdRef.current;
      setVerificationMode(mode);
      setPhase("requesting");
      void pendingRequest.then(
        () => {
          if (isCurrentKycSession(transitionId, cameraRequestIdRef.current)) {
            void beginVerification(mode, startIndex, isRetake);
          }
        },
        () => {
          if (isCurrentKycSession(transitionId, cameraRequestIdRef.current)) {
            void beginVerification(mode, startIndex, isRetake);
          }
        },
      );
      return;
    }
    setVerificationMode(mode);
    if (mode === "manual" && manualSessionBaselineRef.current === null) {
      manualSessionBaselineRef.current = manualPhotos;
    }
    if (mode === "automatic" && typeof MediaRecorder === "undefined") {
      setCameraError(
        "Automatic verification is not supported in this browser. Use manual photo capture or try a browser that supports video recording.",
      );
      setPhase("denied");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("This browser does not support camera access. Try a current browser with camera permission.");
      setPhase("denied");
      return;
    }

    cameraStartingRef.current = true;
    automaticCompletionStartedRef.current = false;
    const requestId = cameraRequestIdRef.current + 1;
    cameraRequestIdRef.current = requestId;
    setCameraError("");
    setStepIndex(startIndex);
    setPhase("requesting");
    if (mode === "automatic") {
      automaticVideoBaselineRef.current = videoSrc;
    }
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

      if (mode === "automatic" && typeof MediaRecorder !== "undefined") {
        chunksRef.current = [];
        let recorder: MediaRecorder;
        try {
          recorder = new MediaRecorder(stream, { mimeType: getSupportedMimeType() });
        } catch {
          recorder = new MediaRecorder(stream);
        }
        recorderRef.current = recorder;
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunksRef.current.push(event.data);
        };
        recorder.start(250);
      }

      setStepIndex(startIndex);
      setCountdown(mode === "automatic" ? KYC_STEPS[0].duration : null);
      setFaceDetected(false);
      if (mode === "automatic") {
        setPoseFrames(EMPTY_POSE_FRAMES);
        clearStoredPoseFrames();
      }
      manualRetakeRef.current = isRetake;
      setIsManualRetake(isRetake);
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

  const switchVerificationMode = (mode: VerificationMode) => {
    if (verificationMode === "automatic") {
      discardPendingAutomaticResult();
    }
    if (verificationMode === "manual" && mode !== "manual") {
      const baseline = manualSessionBaselineRef.current;
      if (baseline) onManualPhotosChange(baseline);
      manualSessionBaselineRef.current = null;
    } else if (mode === "manual") {
      manualSessionBaselineRef.current = manualPhotos;
    }
    const pendingRequest = cameraRequestPromiseRef.current;
    stopCameraSession();
    manualRetakeRef.current = false;
    setIsManualRetake(false);
    setReviewFrame("");
    setCameraError("");
    setStepIndex(0);
    const transitionId = cameraRequestIdRef.current;
    if (pendingRequest) {
      void pendingRequest.then(
        () => {
          if (isCurrentKycSession(transitionId, cameraRequestIdRef.current)) {
            void beginVerification(mode);
          }
        },
        () => {
          if (isCurrentKycSession(transitionId, cameraRequestIdRef.current)) {
            void beginVerification(mode);
          }
        },
      );
    } else {
      void beginVerification(mode);
    }
  };

  const handleManualCapture = () => {
    const video = liveVideoRef.current;
    if (!video) {
      setCameraError("The camera preview is not ready yet. Please wait and try again.");
      return;
    }
    const captured = captureMirroredFrame(video, 720, 0.72);
    if (!captured) {
      setCameraError("Could not capture the photo. Keep the camera preview visible and try again.");
      return;
    }
    setCameraError("");
    setReviewFrame(captured);
    setPhase("manualReview");
  };

  const confirmManualCapture = () => {
    if (!reviewFrame || manualConfirmingRef.current) return;
    const pose = MANUAL_KYC_POSES[stepIndex];
    if (!pose) return;
    manualConfirmingRef.current = true;
    const nextPhotos = withKycPhoto(manualPhotos, pose, reviewFrame);
    onManualPhotosChange(nextPhotos);
    setReviewFrame("");
    manualConfirmingRef.current = false;

    if (manualRetakeRef.current) {
      manualRetakeRef.current = false;
      setIsManualRetake(false);
      manualSessionBaselineRef.current = null;
      stopStream();
      setPhase("complete");
      return;
    }

    const nextIndex = stepIndex + 1;
    if (nextIndex >= MANUAL_KYC_STEPS.length) {
      manualSessionBaselineRef.current = null;
      stopStream();
      setPhase("complete");
      return;
    }
    setStepIndex(nextIndex);
    setPhase("guided");
  };

  const startManualRetake = (pose: KycPose) => {
    const index = MANUAL_KYC_POSES.indexOf(pose);
    manualRetakeRef.current = true;
    setIsManualRetake(true);
    void beginVerification("manual", index, true);
  };

  const currentStep = verificationMode === "manual"
    ? MANUAL_KYC_STEPS[stepIndex]
    : KYC_STEPS[stepIndex];
  const isScanning = faceDetected && countdown !== null && countdown <= 2;
  const manualComplete = areKycPhotosComplete(manualPhotos);
  const displayMode: VerificationMode =
    manualComplete && !videoSrc && phase === "intro" ? "manual" : verificationMode;
  const showCompleteState =
    phase === "complete" &&
    (displayMode === "manual" ? manualComplete : Boolean(videoSrc)) &&
    !isModalOpen;

  const cameraModal =
    mounted && isModalOpen
      ? createPortal(
        <div className={styles.cameraModal} role="dialog" aria-modal="true" aria-label="Identity verification camera">
          {phase === "requesting" ? (
            <div className={styles.modalLoading}>
              <div className={styles.spinner} aria-hidden="true" />
              <p className={styles.processingText}>Starting camera…</p>
                  <button type="button" className={styles.modalCloseBtn} onClick={closeCameraFlow} aria-label="Cancel capture session">
                <X size={18} />
              </button>
                  <div className={styles.modalModeActions}>
                    <button type="button" className={styles.secondaryCaptureBtn} onClick={() => switchVerificationMode(verificationMode === "manual" ? "automatic" : "manual")}>
                      Switch to {verificationMode === "manual" ? "automatic verification" : "manual capture"}
                    </button>
                    <button type="button" className={styles.secondaryCaptureBtn} onClick={closeCameraFlow}>Cancel</button>
                  </div>
                </div>
              ) : null}

          {phase === "denied" ? (
            <div className={styles.modalDenied}>
              <div className={styles.introIconWrap}>
                <ShieldCheck size={28} strokeWidth={1.5} />
              </div>
              <h3 className={styles.modalDeniedTitle}>Camera access required</h3>
              <p className={styles.modalDeniedText}>
                {cameraError || "Allow camera access in your browser settings and try again."}
              </p>
              {!(verificationMode === "automatic" && typeof MediaRecorder === "undefined") && (
                <button type="button" className={styles.beginBtn} onClick={() => void beginVerification(
                  verificationMode,
                  verificationMode === "manual" ? stepIndex : 0,
                  isManualRetake,
                )}>
                  Try again
                </button>
              )}
              <button type="button" className={styles.modalCloseBtn} onClick={closeCameraFlow} aria-label="Close">
                <X size={18} />
              </button>
              <div className={styles.modalModeActions}>
                <button type="button" className={styles.secondaryCaptureBtn} onClick={() => switchVerificationMode(verificationMode === "manual" ? "automatic" : "manual")}>
                  Switch to {verificationMode === "manual" ? "automatic verification" : "manual capture"}
                </button>
                <button type="button" className={styles.secondaryCaptureBtn} onClick={closeCameraFlow}>Cancel</button>
              </div>
            </div>
          ) : null}

          {phase === "guided" ? (
            <div className={styles.session}>
              <video ref={liveVideoRef} className={styles.liveVideo} muted playsInline autoPlay />
              <div className={styles.sessionOverlay}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={closeCameraFlow}
                  aria-label="Cancel verification"
                >
                  <X size={16} />
                </button>

                <div className={styles.sessionTop}>
                  <div className={styles.sessionProgress}>
                    {verificationMode === "manual" && (
                      <span>
                        {isManualRetake ? "Retaking" : `Capture ${stepIndex + 1} of 3`}
                      </span>
                    )}
                    <div className={styles.stepDots}>
                    {MANUAL_KYC_STEPS.map(({ pose }, index) => (
                      <span
                        key={pose}
                        className={`${styles.stepDot} ${verificationMode === "manual"
                            ? getKycPhoto(manualPhotos, pose) && index !== stepIndex
                              ? styles.stepDotDone
                              : index === stepIndex
                                ? styles.stepDotActive
                                : ""
                            : index < stepIndex
                              ? styles.stepDotDone
                              : index === stepIndex
                              ? styles.stepDotActive
                              : ""
                          }`}
                      />
                    ))}
                    </div>
                  </div>
                  <div className={styles.sessionModeActions}>
                    <button
                      type="button"
                      className={styles.secondaryCaptureBtn}
                      onClick={() => switchVerificationMode(verificationMode === "manual" ? "automatic" : "manual")}
                    >
                      Switch to {verificationMode === "manual" ? "automatic verification" : "manual capture"}
                    </button>
                    <button type="button" className={styles.secondaryCaptureBtn} onClick={closeCameraFlow}>
                      Cancel
                    </button>
                  </div>
                </div>

                <div className={styles.frameArea}>
                  <div className={styles.ovalBlock}>
                    <div className={styles.instructionBlock}>
                      <p className={styles.instruction}>{currentStep.instruction}</p>
                      <p className={styles.instructionSub}>{currentStep.sub}</p>
                    </div>
                    <div
                      className={`${styles.faceOval} ${detectedPose === currentStep.pose
                          ? styles.faceOvalMatched
                          : faceDetected
                            ? styles.faceOvalWrongPose
                            : styles.faceOvalNotDetected
                        }`}
                    />
                  </div>
                </div>

                {verificationMode === "automatic" ? <div className={styles.countdownWrap}>
                  <div
                    className={`${styles.poseStatusBadge} ${detectedPose === currentStep.pose
                        ? styles.poseStatusBadgeMatched
                        : faceDetected
                          ? styles.poseStatusBadgeWaiting
                          : styles.poseStatusBadgeNone
                      }`}
                  >
                    {detectedPose === currentStep.pose ? (
                      <>
                        <span>✓ {currentStep.pose.toUpperCase()} POSE DETECTED</span>
                        <span>({holdProgress}%)</span>
                      </>
                    ) : faceDetected ? (
                      <span>
                        {currentStep.pose === "left"
                          ? "Turn head to your LEFT ←"
                          : currentStep.pose === "right"
                            ? "Turn head to your RIGHT →"
                            : "Look directly at camera"}
                      </span>
                    ) : (
                      <span>Position face in oval</span>
                    )}
                  </div>

                  <div className={styles.poseProgressBar}>
                    <div
                      className={styles.poseProgressBarFill}
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>
                </div> : (
                  <div className={styles.manualCaptureControls}>
                    <p className={styles.manualCaptureHint}>
                      Manual capture records a photo only; it does not verify identity or confirm head orientation.
                    </p>
                    {cameraError && <p className={styles.cameraError} role="alert">{cameraError}</p>}
                    <button
                      type="button"
                      className={styles.captureBtn}
                      onClick={handleManualCapture}
                    >
                      <Camera size={18} />
                      Capture photo
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {phase === "manualReview" ? (
            <div className={styles.manualReview}>
              <p className={styles.instruction}>
                Review your {MANUAL_KYC_STEPS[stepIndex]?.pose} photo
              </p>
              <img
                className={styles.manualReviewImage}
                src={reviewFrame}
                alt={`Captured ${MANUAL_KYC_STEPS[stepIndex]?.pose} position`}
              />
              <p className={styles.manualCaptureHint}>
                This photo is not an identity or head-pose verification result.
              </p>
              {cameraError && <p className={styles.cameraError} role="alert">{cameraError}</p>}
              <div className={styles.manualReviewActions}>
                <button
                  type="button"
                  className={styles.secondaryCaptureBtn}
                  onClick={() => {
                    setReviewFrame("");
                    setCameraError("");
                    setPhase("guided");
                  }}
                >
                  <RotateCcw size={16} />
                  Retake
                </button>
                <button
                  type="button"
                  className={styles.captureBtn}
                  onClick={confirmManualCapture}
                  disabled={!reviewFrame}
                >
                  <Check size={16} />
                  Confirm photo
                </button>
                <button
                  type="button"
                  className={styles.secondaryCaptureBtn}
                  onClick={() => switchVerificationMode("automatic")}
                >
                  Switch to automatic verification
                </button>
                <button
                  type="button"
                  className={styles.secondaryCaptureBtn}
                  onClick={cancelManualCapture}
                >
                  Cancel manual capture
                </button>
              </div>
            </div>
          ) : null}

          {phase === "processing" ? (
            <div className={styles.processing}>
              <div className={styles.spinner} aria-hidden="true" />
              <p className={styles.processingText}>Completing automatic verification</p>
              <p className={styles.processingSub}>
                Matching your live capture with submitted documents
              </p>
              <div className={styles.modalModeActions}>
                <button type="button" className={styles.secondaryCaptureBtn} onClick={() => switchVerificationMode("manual")}>
                  Switch to manual capture
                </button>
                <button type="button" className={styles.secondaryCaptureBtn} onClick={cancelAutomaticVerification}>
                  Cancel automatic verification
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
          <div className={styles.intro}>
            <div className={styles.introIconWrap}>
              <ShieldCheck size={22} strokeWidth={1.5} />
            </div>
            <h3 className={styles.introTitle}>Choose a verification method</h3>
            <p className={styles.introPrivacy}>
              Automatic verification checks head poses. Manual capture submits photos for review only.
            </p>
            <button
              type="button"
              className={styles.beginBtn}
              disabled={typeof MediaRecorder === "undefined"}
              onClick={() => void beginVerification("automatic")}
            >
              <ShinyText
                text="AUTOMATIC POSE VERIFICATION"
                iconSize={14}
                speed={2.5}
                color="#E53B17"
                shineColor="#ffffff"
                direction="right"
                className={styles.beginBtnShinyText}
              />
            </button>
            <button
              type="button"
              className={styles.manualModeBtn}
              onClick={() => void beginVerification("manual")}
            >
              <Camera size={16} />
              Manual photo capture
            </button>
            <p className={styles.manualModeNote}>
              {typeof MediaRecorder === "undefined"
                ? "Automatic verification is unavailable in this browser. Manual photos are submitted for review and do not verify identity or pose."
                : "Manual photos are submitted for review and do not verify identity or pose."}
            </p>
          </div>
        ) : null}

        {showCompleteState ? (
          <div className={styles.complete}>
            <div className={styles.completePreview}>
              <div className={styles.poseGrid}>
                {PREVIEW_POSES.map(({ key, label }) => (
                  <div key={key} className={styles.poseCard}>
                    {(displayMode === "manual"
                      ? getKycPhoto(manualPhotos, key)
                      : poseFrames[key]) ? (
                      <img
                        src={displayMode === "manual"
                          ? getKycPhoto(manualPhotos, key)
                          : poseFrames[key]}
                        alt={`${label} pose capture`}
                        className={styles.poseImage}
                      />
                    ) : (
                      <div className={styles.posePlaceholder} aria-hidden="true" />
                    )}
                    <span className={styles.poseLabel}>{label}</span>
                    {displayMode === "manual" && getKycPhoto(manualPhotos, key) && (
                      <button
                        type="button"
                        className={styles.poseRetakeBtn}
                        onClick={() => startManualRetake(key)}
                        aria-label={`Retake ${label} photo`}
                      >
                        <RotateCcw size={12} />
                        Retake
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.completeFooter}>
              <div className={styles.completeMeta}>
                <p className={styles.completeTitle}>
                  {displayMode === "manual" ? "Manual photos captured" : "Identity verification submitted"}
                </p>
                <p className={styles.completeHint}>
                  {displayMode === "manual"
                    ? "Photos are included for team review; they do not independently verify identity or pose."
                    : "Our team will review within 24–48 hours"}
                </p>
              </div>
              {displayMode === "automatic" && (
                <button type="button" className={styles.retakeBtn} onClick={resetVerification}>
                  Restart automatic verification
                </button>
              )}
            </div>
            <div className={styles.completeModeActions}>
              {displayMode === "manual" ? (
                <button
                  type="button"
                  className={styles.manualModeBtn}
                  onClick={() => switchVerificationMode("automatic")}
                >
                  <ShieldCheck size={16} />
                  Switch to automatic verification
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.manualModeBtn}
                  onClick={() => switchVerificationMode("manual")}
                >
                  <Camera size={16} />
                  Switch to manual capture
                </button>
              )}
            </div>
          </div>
        ) : null}

        {phase === "requesting" || phase === "guided" || phase === "manualReview" || phase === "processing" ? (
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

function getSupportedMimeType(): string {
  const types = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
  for (const type of types) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}
