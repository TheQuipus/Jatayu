"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ShieldCheck, X } from "lucide-react";
import ShinyText from "@/components/ui/ShinyText";
import styles from "./KycVerificationPanel.module.css";

type KycVerificationPanelProps = {
  videoSrc: string;
  onVideoChange: (src: string) => void;
};

type PanelPhase = "intro" | "requesting" | "denied" | "guided" | "processing" | "complete";

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

const PREVIEW_POSES: { key: PoseKey; label: string }[] = [
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

function captureMirroredFrame(video: HTMLVideoElement): string | null {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  if (!context) return null;

  // Match the mirrored live preview (scaleX(-1)).
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return null;
  }
}

async function detectFaceInFrame(video: HTMLVideoElement): Promise<boolean> {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return false;
  }

  const FaceDetectorCtor = (
    window as Window & {
      FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => {
        detect: (source: HTMLVideoElement) => Promise<unknown[]>;
      };
    }
  ).FaceDetector;

  if (FaceDetectorCtor) {
    try {
      const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
      const faces = await detector.detect(video);
      if (faces.length > 0) return true;
    } catch {
      // Fall through to heuristic detection.
    }
  }

  const canvas = document.createElement("canvas");
  const width = 160;
  const height = 200;
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return false;

  const sourceX = video.videoWidth * 0.25;
  const sourceY = video.videoHeight * 0.12;
  const sourceWidth = video.videoWidth * 0.5;
  const sourceHeight = video.videoHeight * 0.72;

  context.drawImage(video, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
  const { data } = context.getImageData(0, 0, width, height);

  let brightnessSum = 0;
  let brightnessSqSum = 0;
  let skinLikePixels = 0;
  const pixelCount = width * height;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index];
    const green = data[index + 1];
    const blue = data[index + 2];
    const brightness = (red + green + blue) / 3;

    brightnessSum += brightness;
    brightnessSqSum += brightness * brightness;

    if (
      red > 60 &&
      green > 40 &&
      blue > 20 &&
      red > green &&
      red > blue &&
      brightness > 40 &&
      brightness < 220
    ) {
      skinLikePixels += 1;
    }
  }

  const meanBrightness = brightnessSum / pixelCount;
  const variance = brightnessSqSum / pixelCount - meanBrightness * meanBrightness;

  return (
    variance > 400 &&
    skinLikePixels / pixelCount > 0.14 &&
    meanBrightness > 35 &&
    meanBrightness < 200
  );
}

export default function KycVerificationPanel({
  videoSrc,
  onVideoChange,
}: KycVerificationPanelProps) {
  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const prevVideoSrcRef = useRef(videoSrc);
  const [mounted, setMounted] = useState(false);

  const [phase, setPhase] = useState<PanelPhase>(videoSrc ? "complete" : "intro");
  const [stepIndex, setStepIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [faceDetected, setFaceDetected] = useState(false);
  const [poseFrames, setPoseFrames] = useState<PoseFrames>(() =>
    videoSrc ? readStoredPoseFrames() : EMPTY_POSE_FRAMES,
  );

  const isModalOpen =
    phase === "requesting" || phase === "guided" || phase === "processing" || phase === "denied";

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
  }, []);

  const resetVerification = useCallback(() => {
    if (videoSrc.startsWith("blob:")) {
      URL.revokeObjectURL(videoSrc);
    }
    onVideoChange("");
    recorderRef.current = null;
    chunksRef.current = [];
    stopStream();
    setStepIndex(0);
    setCountdown(null);
    setFaceDetected(false);
    setPoseFrames(EMPTY_POSE_FRAMES);
    clearStoredPoseFrames();
    setPhase("intro");
  }, [onVideoChange, stopStream, videoSrc]);

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
      stopStream();
    };
  }, [stopStream]);

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
      if (event.key === "Escape" && phase !== "processing") {
        resetVerification();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, phase, resetVerification]);

  useEffect(() => {
    if (phase !== "guided") {
      setFaceDetected(false);
      return;
    }

    let cancelled = false;

    const checkFace = async () => {
      const video = liveVideoRef.current;
      if (!video || cancelled) return;

      const detected = await detectFaceInFrame(video);
      if (!cancelled) {
        setFaceDetected(detected);
      }
    };

    void checkFace();
    const interval = window.setInterval(() => {
      void checkFace();
    }, 400);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [phase, stepIndex]);

  useEffect(() => {
    if (phase !== "guided") return;
    const videoEl = liveVideoRef.current;
    const stream = streamRef.current;
    if (!videoEl || !stream) return;
    videoEl.srcObject = stream;
    void videoEl.play().catch(() => undefined);
  }, [phase, stepIndex]);

  const finishRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setPhase("processing");
      return;
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      if (videoSrc.startsWith("blob:")) {
        URL.revokeObjectURL(videoSrc);
      }
      onVideoChange(URL.createObjectURL(blob));
      stopStream();
      setPhase("processing");
    };

    recorder.stop();
  }, [onVideoChange, stopStream, videoSrc]);

  useEffect(() => {
    if (phase !== "guided" || countdown === null) return;

    if (countdown <= 0) {
      captureCurrentPose();
      const isLastStep = stepIndex >= KYC_STEPS.length - 1;
      if (isLastStep) {
        finishRecording();
        return;
      }
      setStepIndex((current) => current + 1);
      setCountdown(KYC_STEPS[stepIndex + 1].duration);
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => (current === null ? null : current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [captureCurrentPose, countdown, finishRecording, phase, stepIndex]);

  useEffect(() => {
    if (phase !== "processing") return;
    const timer = window.setTimeout(() => setPhase("complete"), 1800);
    return () => window.clearTimeout(timer);
  }, [phase]);

  const beginVerification = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase("denied");
      return;
    }

    try {
      setPhase("requesting");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;

      if (typeof MediaRecorder !== "undefined") {
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

      setStepIndex(0);
      setCountdown(KYC_STEPS[0].duration);
      setFaceDetected(false);
      setPoseFrames(EMPTY_POSE_FRAMES);
      clearStoredPoseFrames();
      setPhase("guided");
    } catch {
      stopStream();
      setPhase("denied");
    }
  };

  const currentStep = KYC_STEPS[stepIndex];
  const isScanning = faceDetected && countdown !== null && countdown <= 2;
  const showCompleteState = Boolean(videoSrc) && !isModalOpen;

  const cameraModal =
    mounted && isModalOpen
      ? createPortal(
          <div className={styles.cameraModal} role="dialog" aria-modal="true" aria-label="Identity verification camera">
            {phase === "requesting" ? (
              <div className={styles.modalLoading}>
                <div className={styles.spinner} aria-hidden="true" />
                <p className={styles.processingText}>Starting camera…</p>
                <button type="button" className={styles.modalCloseBtn} onClick={resetVerification} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            ) : null}

            {phase === "denied" ? (
              <div className={styles.modalDenied}>
                <div className={styles.introIconWrap}>
                  <ShieldCheck size={28} strokeWidth={1.5} />
                </div>
                <h3 className={styles.modalDeniedTitle}>Camera access required</h3>
                <p className={styles.modalDeniedText}>
                  Allow camera access in your browser settings and try again.
                </p>
                <button type="button" className={styles.beginBtn} onClick={() => void beginVerification()}>
                  Try again
                </button>
                <button type="button" className={styles.modalCloseBtn} onClick={resetVerification} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            ) : null}

            {phase === "guided" ? (
              <div className={styles.session}>
                <video ref={liveVideoRef} className={styles.liveVideo} muted playsInline autoPlay />
                <div className={styles.sessionOverlay}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={resetVerification}
                    aria-label="Cancel verification"
                  >
                    <X size={16} />
                  </button>

                  <div className={styles.sessionTop}>
                    <div className={styles.stepDots}>
                      {KYC_STEPS.map((_, index) => (
                        <span
                          key={index}
                          className={`${styles.stepDot} ${
                            index < stepIndex
                              ? styles.stepDotDone
                              : index === stepIndex
                                ? styles.stepDotActive
                                : ""
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className={styles.frameArea}>
                    <div className={styles.ovalBlock}>
                      <div className={styles.instructionBlock}>
                        <p className={styles.instruction}>{currentStep.instruction}</p>
                        <p className={styles.instructionSub}>{currentStep.sub}</p>
                      </div>
                      <div
                        className={`${styles.faceOval} ${
                          isScanning
                            ? styles.faceOvalScanning
                            : faceDetected
                              ? styles.faceOvalDetected
                              : ""
                        }`}
                      />
                    </div>
                  </div>

                  {countdown !== null ? (
                    <div className={styles.countdownWrap}>
                      <span className={styles.countdown}>{countdown}</span>
                      <span className={styles.countdownLabel}>
                        {faceDetected ? "Keep still" : "Position your face in the oval"}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {phase === "processing" ? (
              <div className={styles.processing}>
                <div className={styles.spinner} aria-hidden="true" />
                <p className={styles.processingText}>Verifying your identity</p>
                <p className={styles.processingSub}>
                  Matching your live capture with submitted documents
                </p>
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
            <h3 className={styles.introTitle}>Verify your identity</h3>
            <p className={styles.introPrivacy}>
              Encrypted and used only for verification <br /> never shown on your public profile.
            </p>
            <button type="button" className={styles.beginBtn} onClick={() => void beginVerification()}>
              <ShinyText
                text="Begin verification"
                iconSize={14}
                speed={2.5}
                color="#E53B17"
                shineColor="#ffffff"
                direction="right"
                className={styles.beginBtnShinyText}
              />
            </button>
          </div>
        ) : null}

        {showCompleteState ? (
          <div className={styles.complete}>
            <div className={styles.completePreview}>
              <div className={styles.poseGrid}>
                {PREVIEW_POSES.map(({ key, label }) => (
                  <div key={key} className={styles.poseCard}>
                    {poseFrames[key] ? (
                      <img
                        src={poseFrames[key]}
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
                <p className={styles.completeTitle}>Identity verification submitted</p>
                <p className={styles.completeHint}>Our team will review within 24–48 hours</p>
              </div>
              <button type="button" className={styles.retakeBtn} onClick={resetVerification}>
                Retake
              </button>
            </div>
          </div>
        ) : null}

        {phase === "requesting" || phase === "guided" || phase === "processing" ? (
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
