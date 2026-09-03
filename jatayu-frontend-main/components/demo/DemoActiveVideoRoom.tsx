"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import {
  BadgeCheck,
  Captions,
  Check,
  Clock,
  Disc,
  Flag,
  Headphones,
  Maximize,
  MessageSquare,
  Mic,
  MicOff,
  Minimize,
  Phone,
  PlusCircle,
  Shield,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import ReportForm from "@/app/seeker/report/[bookingId]/ReportForm";
import ExpertReportForm from "@/app/expert/(app)/report/[requestId]/ExpertReportForm";
import styles from "@/components/seeker/bookings/ActiveRoom.module.css";
import { getBookingById, type BookingDetail } from "@/lib/seekerDashboard";
import { getRequestDetailById } from "@/lib/expertRequestDetailStore";

import ExtendSessionChatOverlay from "./ExtendSessionChatOverlay";

export type DemoActiveVideoRoomProps = {
  initialRole?: "seeker" | "expert";
};

export default function DemoActiveVideoRoom({
  initialRole = "seeker",
}: DemoActiveVideoRoomProps) {
  // Video toggle states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(115);
  const [extendNotification, setExtendNotification] = useState<string | null>(null);

  // In-video extend chat overlay state (Seeker demo)
  const [isExtendChatOpen, setIsExtendChatOpen] = useState(false);

  const [notes, setNotes] = useState("");
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleExtendSession = () => {
    setIsExtendChatOpen(true);
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

  // Confirmation modal state
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

  const handleLeaveClick = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Leave Active Video Session?",
      message:
        "Are you sure you want to leave the video call? You can return anytime before the consultation ends.",
      confirmText: "Yes, Leave",
      cancelText: "No, Stay",
      variant: "warning",
      onConfirmAction: () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleFinishClick = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Finish Consultation?",
      message: "Are you sure you want to end this video session?",
      confirmText: "Yes, Finish Session",
      cancelText: "No, Keep Call Active",
      variant: "danger",
      onConfirmAction: () => {
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Seeker View
  if (initialRole === "seeker") {
    const dummyBooking: BookingDetail = getBookingById("booking-1")!;
    const expertImage = "/assets/img/team1.png";
    const expertName = "Dr. Ananya Sharma";
    const expertRole = "Startup & VC Expert";

    return (
      <section className={styles.sessionRoom}>
        <div className="container">
          <div className={styles.roomGrid}>
            {/* Left Column: Video Feed & Live Transcript */}
            <div className={styles.roomMain}>
              <div ref={videoContainerRef} className={styles.videoFeedContainer}>
                {isVideoOff ? (
                  <div className={styles.videoPlaceholder}>
                    <div className={styles.videoPlaceholderAvatar}>
                      <Image
                        src={expertImage}
                        alt={expertName}
                        fill
                        sizes="120px"
                        className={styles.placeholderAvatarImg}
                      />
                    </div>
                    <span>Video Paused</span>
                  </div>
                ) : (
                  <div className={styles.activeVideoFeed}>
                    <Image
                      src={expertImage}
                      alt={expertName}
                      fill
                      className={styles.videoFeedImage}
                      priority
                    />
                    <div
                      style={{
                        position: "absolute",
                        right: 16,
                        bottom: 16,
                        width: 180,
                        height: 110,
                        zIndex: 3,
                        background: "#14171d",
                        border: "2px solid #ffffff",
                        overflow: "hidden",
                      }}
                    >
                      <Image
                        src="/assets/img/manportrait.png"
                        alt="Local video preview"
                        fill
                        className={styles.pipImage}
                      />
                      <span className={styles.pipLabel}>You</span>
                    </div>
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

                  {secondsRemaining <= 300 && (
                    <ContinueButton
                      label="Extend Session"
                      showArrow={false}
                      onClick={handleExtendSession}
                      className={styles.extendSessionBtnPrimary}
                      title="Extend session by 15 minutes"
                    />
                  )}
                </div>

                {/* In-Video Pure Transparent Extension Screen */}
                <ExtendSessionChatOverlay
                  role="seeker"
                  isOpen={isExtendChatOpen}
                  expertName={expertName}
                  expertImage={expertImage}
                  clientName="You"
                  clientImage="/assets/img/manportrait.png"
                  onExtendSessionAdded={(secs) => setSecondsRemaining((prev) => prev + secs)}
                />

                {/* Google Meet style Video Call Controls Overlay */}
                <div className={styles.videoControls}>
                  <button
                    type="button"
                    className={`${styles.controlBtn} ${
                      isMuted ? styles.controlBtnDanger : ""
                    }`}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <button
                    type="button"
                    className={`${styles.controlBtn} ${
                      isVideoOff ? styles.controlBtnDanger : ""
                    }`}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                  >
                    {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                  </button>

                  <button
                    type="button"
                    className={`${styles.controlBtn} ${
                      isRecording ? styles.controlBtnRecording : ""
                    }`}
                    onClick={() => setIsRecording(!isRecording)}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                  >
                    <Disc size={16} />
                  </button>

                  <button
                    type="button"
                    className={`${styles.controlBtn} ${
                      isTranscriptVisible ? styles.controlBtnActive : ""
                    }`}
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

              {/* Live Transcript Panel */}
              {isTranscriptVisible && (
                <div className={styles.transcriptPanel}>
                  <div className={styles.transcriptHeader}>
                    <Captions size={14} className={styles.transcriptIcon} />
                    <span className={styles.transcriptTitle}>Transcript</span>
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
                      <span className={styles.transcriptSpeaker}>Expert</span>
                      <span className={styles.transcriptText}>
                        Welcome to the session! Let me start by understanding your current
                        situation...
                      </span>
                      <span className={styles.transcriptTime}>00:12</span>
                    </div>
                    <div className={styles.transcriptLine}>
                      <span
                        className={`${styles.transcriptSpeaker} ${styles.transcriptSpeakerYou}`}
                      >
                        You
                      </span>
                      <span className={styles.transcriptText}>
                        Thank you! I wanted to discuss the funding strategy for my startup...
                      </span>
                      <span className={styles.transcriptTime}>00:34</span>
                    </div>
                    <div className={styles.transcriptLine}>
                      <span className={styles.transcriptSpeaker}>Expert</span>
                      <span className={styles.transcriptText}>
                        That's a great starting point. Let's talk about your current traction
                        and metrics first.
                      </span>
                      <span className={styles.transcriptTime}>00:51</span>
                    </div>
                    <div
                      className={`${styles.transcriptLine} ${styles.transcriptLineCurrent}`}
                    >
                      <span className={styles.transcriptSpeaker}>Expert</span>
                      <span className={styles.transcriptText}>
                        What stage are you at — pre-seed, seed, or Series A?
                      </span>
                      <span className={styles.transcriptTime}>01:10</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Expert summary + Notes notepad + Need Help */}
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
                          src={expertImage}
                          alt={expertName}
                          fill
                          className={styles.sessionInfoExpertImg}
                          sizes="52px"
                        />
                      </div>
                      <div className={styles.sessionInfoExpertText}>
                        <h3 className={styles.sessionInfoExpertName}>
                          {expertName}
                          <BadgeCheck size={14} className={styles.verifiedIcon} />
                        </h3>
                        <p className={styles.sessionInfoExpertRole}>{expertRole}</p>
                      </div>
                    </div>

                    <div className={styles.sessionInfoDetailsList}>
                      <div className={styles.sessionInfoDetailRow}>
                        <span className={styles.sessionInfoDetailKey}>Booking ID</span>
                        <strong className={styles.sessionInfoDetailVal}>
                          {dummyBooking.referenceId || "BK-98274"}
                        </strong>
                      </div>
                      <div className={styles.sessionInfoDetailRow}>
                        <span className={styles.sessionInfoDetailKey}>Service</span>
                        <strong className={styles.sessionInfoDetailVal}>
                          1:1 Video Call
                        </strong>
                      </div>
                      <div className={styles.sessionInfoDetailRow}>
                        <span className={styles.sessionInfoDetailKey}>Amount Paid</span>
                        <strong className={styles.sessionInfoDetailVal}>₹2,400.00</strong>
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
                        <span>Your notes are private and auto-saved.</span>
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
                      Having issues with your booking or the expert? Our support team is
                      here to help.
                    </p>
                    <ul className={styles.helpLinks}>
                      <li>
                        <Link href="/seeker/dashboard/#support" className={styles.helpLink}>
                          <Headphones size={14} aria-hidden="true" />
                          Contact Support
                        </Link>
                      </li>
                      <li>
                        <Link href="/terms" className={styles.helpLink}>
                          <Shield size={14} aria-hidden="true" />
                          Quality Assurance Policy
                        </Link>
                      </li>
                      <li>
                        <button
                          type="button"
                          onClick={() => setIsReportModalOpen(true)}
                          className={styles.helpLinkDanger}
                        >
                          <Flag size={14} aria-hidden="true" />
                          Report an Issue
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
          onClose={() =>
            setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))
          }
          onConfirm={confirmModalConfig.onConfirmAction}
          title={confirmModalConfig.title}
          message={confirmModalConfig.message}
          confirmText={confirmModalConfig.confirmText}
          cancelText={confirmModalConfig.cancelText}
          variant={confirmModalConfig.variant}
        />

        {isReportModalOpen && (
          <ReportForm
            booking={dummyBooking}
            onClose={() => setIsReportModalOpen(false)}
          />
        )}
      </section>
    );
  }

  // Expert View
  const clientName = "Vikram Malhotra";
  const clientAvatar = "/assets/img/manportrait.png";
  const clientRole = "Head of Product";
  const title = "Product Roadmap & Architecture Review";
  const proposedPrice = "₹2,400.00";
  const formatLabel = "Video Call";

  return (
    <section className={styles.sessionRoom}>
      <div className="container">
        <div className={styles.roomGrid}>
          {/* Left Column: Video Feed & Live Transcript */}
          <div className={styles.roomMain}>
            <div ref={videoContainerRef} className={styles.videoFeedContainer}>
              {isVideoOff ? (
                <div className={styles.videoPlaceholder}>
                  <div className={styles.videoPlaceholderAvatar}>
                    <Image
                      src={clientAvatar}
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
                  <Image
                    src={clientAvatar}
                    alt={clientName}
                    fill
                    className={styles.videoFeedImage}
                    priority
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 16,
                      bottom: 16,
                      width: 180,
                      height: 110,
                      zIndex: 3,
                      background: "#14171d",
                      border: "2px solid #ffffff",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src="/assets/img/team1.png"
                      alt="Expert local self view"
                      fill
                      className={styles.pipImage}
                    />
                    <span className={styles.pipLabel}>You</span>
                  </div>
                </div>
              )}

              {/* Top Left Recording Badge */}
              {isRecording && (
                <div className={styles.recordingBadge}>
                  <span className={styles.recordingDot} />
                  <span>REC</span>
                </div>
              )}

              {/* Top Right Timer Badge */}
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
              </div>

              {/* In-Video Pure Transparent Extension Decision Screen (Expert) */}
              <ExtendSessionChatOverlay
                role="expert"
                expertName="You (Expert)"
                expertImage="/assets/img/team1.png"
                clientName={clientName}
                clientImage="/assets/img/manportrait.png"
                onExtendSessionAdded={(secs) => setSecondsRemaining((prev) => prev + secs)}
              />

              {/* Google Meet style Video Call Controls Overlay */}
              <div className={styles.videoControls}>
                <button
                  type="button"
                  className={`${styles.controlBtn} ${
                    isMuted ? styles.controlBtnDanger : ""
                  }`}
                  onClick={() => setIsMuted(!isMuted)}
                  title={isMuted ? "Unmute Mic" : "Mute Mic"}
                >
                  {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                </button>

                <button
                  type="button"
                  className={`${styles.controlBtn} ${
                    isVideoOff ? styles.controlBtnDanger : ""
                  }`}
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
                </button>

                <button
                  type="button"
                  className={`${styles.controlBtn} ${
                    isRecording ? styles.controlBtnRecording : ""
                  }`}
                  onClick={() => setIsRecording(!isRecording)}
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  <Disc size={16} />
                </button>

                <button
                  type="button"
                  className={`${styles.controlBtn} ${
                    isTranscriptVisible ? styles.controlBtnActive : ""
                  }`}
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

            {/* Live Transcript Panel */}
            {isTranscriptVisible && (
              <div className={styles.transcriptPanel}>
                <div className={styles.transcriptHeader}>
                  <Captions size={14} className={styles.transcriptIcon} />
                  <span className={styles.transcriptTitle}>Transcript</span>
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
                    <span className={`${styles.transcriptSpeaker} ${styles.transcriptSpeakerYou}`}>You</span>
                    <span className={styles.transcriptText}>
                      Welcome to the session! Let me start by understanding your current
                      situation...
                    </span>
                    <span className={styles.transcriptTime}>00:12</span>
                  </div>
                  <div className={styles.transcriptLine}>
                    <span className={styles.transcriptSpeaker}>Client</span>
                    <span className={styles.transcriptText}>
                      Thank you! I wanted to discuss the funding strategy for my startup...
                    </span>
                    <span className={styles.transcriptTime}>00:34</span>
                  </div>
                  <div className={styles.transcriptLine}>
                    <span className={`${styles.transcriptSpeaker} ${styles.transcriptSpeakerYou}`}>You</span>
                    <span className={styles.transcriptText}>
                      That's a great starting point. Let's talk about your current traction
                      and metrics first.
                    </span>
                    <span className={styles.transcriptTime}>00:51</span>
                  </div>
                  <div
                    className={`${styles.transcriptLine} ${styles.transcriptLineCurrent}`}
                  >
                    <span className={`${styles.transcriptSpeaker} ${styles.transcriptSpeakerYou}`}>You</span>
                    <span className={styles.transcriptText}>
                      What stage are you at — pre-seed, seed, or Series A?
                    </span>
                    <span className={styles.transcriptTime}>01:10</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Client Summary + Notes notepad + Need Help */}
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
                        src={clientAvatar}
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
                      <strong className={styles.sessionInfoDetailVal}>req-1</strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Service</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {formatLabel}
                      </strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Amount</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {proposedPrice}
                      </strong>
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
                      <span>Your notes are private and auto-saved.</span>
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
                    Having issues with your booking or the client? Our support team is
                    here to help.
                  </p>
                  <ul className={styles.helpLinks}>
                    <li>
                      <Link href="/expert/dashboard" className={styles.helpLink}>
                        <Headphones size={14} aria-hidden="true" />
                        Contact Support
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className={styles.helpLink}>
                        <Shield size={14} aria-hidden="true" />
                        Quality Assurance Policy
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => setIsReportModalOpen(true)}
                        className={styles.helpLinkDanger}
                      >
                        <Flag size={14} aria-hidden="true" />
                        Report an Issue
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
        onClose={() =>
          setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))
        }
        onConfirm={confirmModalConfig.onConfirmAction}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        variant={confirmModalConfig.variant}
      />

      {isReportModalOpen && (
        <ExpertReportForm
          request={getRequestDetailById("req-1")}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </section>
  );
}
