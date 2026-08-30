"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  BadgeCheck,
  Captions,
  Clock,
  Disc,
  Flag,
  Headphones,
  Maximize,
  Mic,
  MicOff,
  Minimize,
  Phone,
  PlusCircle,
  ScreenShare,
  Shield,
  Video,
  VideoOff,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ContinueButton from "@/components/ui/ContinueButton";
import ExpertReportForm from "@/app/expert/(app)/report/[requestId]/ExpertReportForm";
import styles from "@/components/seeker/bookings/ActiveRoom.module.css";
import { useAgoraRoom } from "@/hooks/useAgoraRoom";

export type ChatMessage = {
  id: string;
  sender: "expert" | "client";
  text: string;
  timestamp: string;
};

export type ExpertActiveVideoRoomProps = {
  requestId?: string;
  clientName: string;
  clientAvatar: string;
  clientRole?: string;
  title: string;
  proposedPrice?: string;
  formatLabel?: string;
  onLeaveRoom: () => void;
  onFinishSession: () => void;
};

export default function ExpertActiveVideoRoom({
  requestId = "req-1",
  clientName,
  clientAvatar,
  clientRole = "Head of Product",
  title,
  proposedPrice = "₹2,400.00",
  formatLabel = "Video Call",
  onLeaveRoom,
  onFinishSession,
}: ExpertActiveVideoRoomProps) {
  const isAudioOnly = /audio|voice/i.test(formatLabel);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(isAudioOnly);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(115);
  const [extendNotification, setExtendNotification] = useState<string | null>(null);

  const [notes, setNotes] = useState("");
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const remoteVideoElementRef = useRef<HTMLDivElement>(null);
  const localVideoElementRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ignoreChatMessage = useCallback(() => undefined, []);
  const agora = useAgoraRoom({ bookingId: requestId, role: "expert", enabled: true, requestVideo: !isAudioOnly, onMessage: ignoreChatMessage });
  useEffect(() => {
    if (remoteVideoElementRef.current) agora.playRemoteVideo(remoteVideoElementRef.current);
  }, [agora, agora.remoteVideoVersion]);
  useEffect(() => {
    if (localVideoElementRef.current) agora.playLocalVideo(localVideoElementRef.current);
  }, [agora, agora.status]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleExtendSession = () => {
    setSecondsRemaining((prev) => prev + 900);
    setExtendNotification("Session successfully extended by 15 minutes!");
    setTimeout(() => {
      setExtendNotification(null);
    }, 4000);
  };

  const toggleFullscreen = () => {
    if (!videoContainerRef.current) return;

    if (!document.fullscreenElement) {
      videoContainerRef.current.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    variant: "warning" | "danger" | "default";
    onConfirmAction: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    cancelText: "",
    variant: "default",
    onConfirmAction: () => {},
  });

  const handleSaveNotes = () => {
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 2500);
  };

  const handleFinishClick = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Finish Consultation?",
      message: "Are you sure you want to end this video session?",
      confirmText: "Yes, Finish Session",
      cancelText: "No, Keep Call Active",
      variant: "danger",
      onConfirmAction: onFinishSession,
    });
  };

  const dummyReportData = {
    id: requestId,
    client: {
      name: clientName,
      avatar: clientAvatar,
    },
    title,
    submittedDate: "Today",
    sessionDetails: {
      proposedPrice,
      format: formatLabel,
      requestedDate: "Today",
      duration: "30 mins",
    },
  };

  return (
    <section className={styles.sessionRoom}>
      {agora.status === "error" ? <p role="alert" style={{ textAlign: "center" }}>{agora.error}</p> : null}
      <div className="container">
        <div className={styles.roomGrid}>
          {/* Left Column: Video Feed & Live Transcript */}
          <div className={styles.roomMain}>
            <div ref={videoContainerRef} className={styles.videoFeedContainer}>
              {isVideoOff ? (
                <div className={styles.videoPlaceholder}>
                  <div className={styles.videoPlaceholderAvatar}>
                    <Image
                      src={clientAvatar || "/assets/img/avatar1.png"}
                      alt={clientName}
                      fill
                      sizes="120px"
                      className={styles.placeholderAvatarImg}
                    />
                  </div>
                  <span>Video Paused</span>
                </div>
              ) : (
                <div className={styles.activeVideoFeed}>
                  <div ref={remoteVideoElementRef} style={{ position: "absolute", inset: 0, zIndex: 1 }} />
                  <Image
                    src={
                      clientAvatar &&
                      !clientAvatar.includes("avatar")
                        ? clientAvatar
                        : "/assets/img/manportrait.png"
                    }
                    alt={clientName}
                    fill
                    className={styles.videoFeedImage}
                    priority
                  />
                  <div className={styles.videoFeedLabel}>
                    <span>{clientName}</span>
                  </div>
                  <div ref={localVideoElementRef} style={{ position: "absolute", right: 16, bottom: 16, width: 180, height: 110, zIndex: 3 }} />
                </div>
              )}

              {/* Top Left Recording Badge */}
              {isRecording && (
                <div className={styles.recordingBadge}>
                  <span className={styles.recordingDot} />
                  <span>REC</span>
                </div>
              )}

              {/* Top Right Timer Badge & Extend Session Button */}
              <div className={styles.videoTopRightBar}>
                <div
                  className={`${styles.timerBadge} ${
                    secondsRemaining > 300
                      ? styles.timerGreen
                      : secondsRemaining > 120
                      ? styles.timerYellow
                      : styles.timerRed
                  }`}
                >
                  <Clock size={18} className={styles.timerIcon} />
                  <span>{formatTimer(secondsRemaining)} remaining</span>
                </div>

                {secondsRemaining <= 120 && (
                  <button
                    type="button"
                    className={styles.extendSessionBtn}
                    onClick={handleExtendSession}
                    title="Extend session by 15 minutes"
                  >
                    <PlusCircle size={14} />
                    Extend Session (+15m)
                  </button>
                )}
              </div>

              {extendNotification && (
                <div className={styles.extendToast}>
                  {extendNotification}
                </div>
              )}

              {/* Picture-in-picture preview (Expert Self Feed) */}
              <div className={styles.pipContainer}>
                <div className={styles.pipInner}>
                  {isMuted ? (
                    <span className={styles.pipMuteIndicator}>Mic Off</span>
                  ) : (
                    <>
                      <Image
                        src="/assets/img/Man.png"
                        alt="You (Expert)"
                        fill
                        className={styles.pipImage}
                        sizes="120px"
                      />
                      <span className={styles.pipLabel}>You (Expert)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Video Call Controls Overlay */}
              <div className={styles.videoControls}>
                <button
                  type="button"
                  className={`${styles.controlBtn} ${isMuted ? styles.controlBtnDanger : ""}`}
                  onClick={() => { void agora.toggleMute(); setIsMuted(!isMuted); }}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <button
                  type="button"
                  className={`${styles.controlBtn} ${isVideoOff ? styles.controlBtnDanger : ""}`}
                  onClick={() => { if (!isAudioOnly) { void agora.toggleVideo(); setIsVideoOff(!isVideoOff); } }}
                  disabled={isAudioOnly}
                  title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                </button>

                <button
                  type="button"
                  className={`${styles.controlBtn} ${isRecording ? styles.controlBtnRecording : ""}`}
                  onClick={() => setIsRecording(!isRecording)}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  <Disc size={16} />
                </button>

                <button
                  type="button"
                  className={`${styles.controlBtn} ${isTranscriptVisible ? styles.controlBtnActive : ""}`}
                  onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
                  title={isTranscriptVisible ? "Hide Captions" : "Show Captions"}
                >
                  <Captions size={16} />
                </button>

                <button
                  type="button"
                  className={styles.controlBtn}
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>

                <button
                  type="button"
                  className={`${styles.controlBtn} ${styles.controlBtnEndCall}`}
                  onClick={handleFinishClick}
                  title="End Call"
                >
                  <Phone size={16} style={{ transform: "rotate(135deg)" }} />
                </button>
              </div>
            </div>

            {/* Live AI Transcript Panel */}
            {isTranscriptVisible && (
              <div className={styles.transcriptPanel}>
                <div className={styles.transcriptHeader}>
                  <Captions size={14} className={styles.transcriptIcon} />
                  <span className={styles.transcriptTitle}>Live Transcript</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.transcriptBody}>
                  <div className={styles.transcriptLine}>
                    <span className={styles.transcriptSpeaker}>Client</span>
                    <span className={styles.transcriptText}>
                      "Hello! I am ready to discuss {title}."
                    </span>
                    <span className={styles.transcriptTime}>00:12</span>
                  </div>
                  <div className={styles.transcriptLine}>
                    <span className={`${styles.transcriptSpeaker} ${styles.transcriptSpeakerYou}`}>
                      You
                    </span>
                    <span className={styles.transcriptText}>
                      "Welcome! Let's go through your requirements step by step."
                    </span>
                    <span className={styles.transcriptTime}>00:34</span>
                  </div>
                  <div className={styles.transcriptLine}>
                    <span className={styles.transcriptSpeaker}>Client</span>
                    <span className={styles.transcriptText}>
                      "Great, I have a few specific questions prepared for our session."
                    </span>
                    <span className={styles.transcriptTime}>00:51</span>
                  </div>
                  <div className={`${styles.transcriptLine} ${styles.transcriptLineCurrent}`}>
                    <span className={styles.transcriptSpeaker}>Client</span>
                    <span className={styles.transcriptText}>
                      "Can we start with the overall strategy review?"
                    </span>
                    <span className={styles.transcriptTime}>01:10</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Client summary + Notes notepad + Need Help */}
          <aside className={styles.roomSidebar}>
            <div className={styles.roomSidebarInner}>
              {/* Session Info Box */}
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Session Info</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className={styles.panelBody}>
                  <div className={styles.sessionInfoExpertRow}>
                    <div className={styles.sessionInfoExpertAvatar}>
                      <Image
                        src={clientAvatar || "/assets/img/avatar1.png"}
                        alt={clientName}
                        fill
                        className={styles.sessionInfoExpertImg}
                        sizes="52px"
                      />
                    </div>
                    <div className={styles.sessionInfoExpertText}>
                      <h3 className={styles.sessionInfoExpertName}>
                        {clientName}
                        <BadgeCheck size={14} className={styles.verifiedIcon} />
                      </h3>
                      <p className={styles.sessionInfoExpertRole}>{clientRole}</p>
                    </div>
                  </div>

                  <div className={styles.sessionInfoDetailsList}>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Request ID</span>
                      <strong className={styles.sessionInfoDetailVal}>{requestId}</strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Service</span>
                      <strong className={styles.sessionInfoDetailVal}>{formatLabel}</strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Payout Amount</span>
                      <strong className={styles.sessionInfoDetailVal}>{proposedPrice}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notepad Box */}
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Session Notes</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className={styles.panelBody}>
                  <div className={styles.notepadContainer}>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Type personal advice, milestones, or to-dos shared during the session here..."
                      className={styles.notepadArea}
                    />
                    <div className={styles.notepadFooter}>
                      <span>{isNotesSaved ? "Saved ✓" : "Notes are private and auto-saved."}</span>
                      <ContinueButton
                        label="Save Notes"
                        showArrow={false}
                        onClick={handleSaveNotes}
                        className={styles.saveNotesActiveBtn}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Need Help Box */}
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Need Help?</span>
                  <span className={styles.bookingHeaderDots} />
                  <div className={styles.soundwaveIcon} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                <div className={styles.panelBody}>
                  <p className={styles.helpCopy}>
                    Having issues with your booking or the client? Our support team is here to help.
                  </p>
                  <ul className={styles.helpLinks}>
                    <li>
                      <Link href="#support" className={styles.helpLink}>
                        <Headphones size={14} aria-hidden="true" />
                        Contact Support
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className={styles.helpLinkDanger}
                      >
                        <Flag size={14} aria-hidden="true" />
                        Report Client Issue
                      </button>
                    </li>
                  </ul>
                </div>

                <div className={styles.bookingFooter} aria-hidden="true" />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirmAction}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        variant={confirmModalConfig.variant}
      />

      {isReportModalOpen && (
        <ExpertReportForm
          request={dummyReportData as any}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </section>
  );
}
