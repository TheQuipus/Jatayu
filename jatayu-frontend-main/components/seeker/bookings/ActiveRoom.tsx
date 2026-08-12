"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  BadgeCheck,
  Captions,
  CheckCheck,
  Flag,
  Mic,
  MicOff,
  Phone,
  Send,
  Video,
  VideoOff,
  Maximize,
  Minimize,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ReportForm from "@/app/seeker/report/[bookingId]/ReportForm";
import { formatCurrency, type BookingDetail } from "@/lib/seekerDashboard";
import styles from "./ActiveRoom.module.css";

type ChatMessage = {
  id: string;
  sender: "seeker" | "expert";
  text: string;
  timestamp: string;
};

type ActiveRoomProps = {
  booking: BookingDetail;
  notes: string;
  setNotes: (notes: string) => void;
  notesSavedStatus: "idle" | "saving" | "saved";
  chatMessages: ChatMessage[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onLeaveRoom: () => void;
  onFinishSession: () => void;
};

export default function ActiveRoom({
  booking,
  notes,
  setNotes,
  notesSavedStatus,
  chatMessages,
  newMessage,
  setNewMessage,
  onSendMessage,
  onLeaveRoom,
  onFinishSession,
}: ActiveRoomProps) {
  // Video toggle states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(true);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-scroll chat log
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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

  // Reusable confirmation modal state
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
    onConfirmAction: () => { },
  });

  const handleLeaveClick = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Leave Active Session?",
      message: "Are you sure you want to leave the session room? You can return anytime before the consultation ends.",
      confirmText: "Yes, Leave",
      cancelText: "No, Stay",
      variant: "warning",
      onConfirmAction: onLeaveRoom,
    });
  };

  const handleFinishClick = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Finish Consultation?",
      message: "Are you sure you want to end this session?",
      confirmText: "Yes, Finish Session",
      cancelText: "No, Keep Call Active",
      variant: "danger",
      onConfirmAction: onFinishSession,
    });
  };

  return (
    <section className={styles.sessionRoom}>
      <div className="container">
        <div className={styles.roomGrid}>
          {/* Left Column: Chat & Video feed */}
          <div className={styles.roomMain}>
            {booking.consultationType === "video" && (
              <div ref={videoContainerRef} className={styles.videoFeedContainer}>
                {isVideoOff ? (
                  <div className={styles.videoPlaceholder}>
                    <div className={styles.videoPlaceholderAvatar}>
                      <Image
                        src={booking.expert.image}
                        alt={booking.expert.name}
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
                      src={booking.expert.image}
                      alt={booking.expert.name}
                      fill
                      className={styles.videoFeedImage}
                      priority
                    />
                    <div className={styles.videoFeedLabel}>
                      <span>{booking.expert.name} (Expert)</span>
                    </div>
                  </div>
                )}

                {/* Picture-in-picture preview */}
                <div className={styles.pipContainer}>
                  <div className={styles.pipInner}>
                    {isMuted ? (
                      <span className={styles.pipMuteIndicator}>Mic Off</span>
                    ) : (
                      <span className={styles.pipLabel}>You (Seeker)</span>
                    )}
                  </div>
                </div>

                {/* Video Call Controls Overlay */}
                <div className={styles.videoControls}>
                  <button
                    type="button"
                    className={`${styles.controlBtn} ${isMuted ? styles.controlBtnActive : ""
                      }`}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <button
                    type="button"
                    className={`${styles.controlBtn} ${isVideoOff ? styles.controlBtnActive : ""
                      }`}
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                  >
                    {isVideoOff ? <VideoOff size={16} /> : <Video size={16} />}
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
                    className={`${styles.controlBtn} ${isTranscriptVisible ? styles.controlBtnActive : ""}`}
                    onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
                    title={isTranscriptVisible ? "Hide Transcript" : "Show Transcript"}
                  >
                    <Captions size={16} />
                  </button>

                  <button
                    type="button"
                    className={`${styles.controlBtn} ${styles.controlBtnEndCall}`}
                    onClick={handleFinishClick}
                    title="End Call"
                  >
                    <Phone size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Live Transcript Panel */}
            {booking.consultationType === "video" && isTranscriptVisible && (
              <div className={styles.transcriptPanel}>
                <div className={styles.transcriptHeader}>
                  <Captions size={14} className={styles.transcriptIcon} />
                  <span className={styles.transcriptTitle}>Transcript</span>
                </div>
                <div className={styles.transcriptBody}>
                  <div className={styles.transcriptLine}>
                    <span className={styles.transcriptSpeaker}>Expert</span>
                    <span className={styles.transcriptText}>Welcome to the session! Let me start by understanding your current situation...</span>
                    <span className={styles.transcriptTime}>00:12</span>
                  </div>
                  <div className={styles.transcriptLine}>
                    <span className={`${styles.transcriptSpeaker} ${styles.transcriptSpeakerYou}`}>You</span>
                    <span className={styles.transcriptText}>Thank you! I wanted to discuss the funding strategy for my startup...</span>
                    <span className={styles.transcriptTime}>00:34</span>
                  </div>
                  <div className={styles.transcriptLine}>
                    <span className={styles.transcriptSpeaker}>Expert</span>
                    <span className={styles.transcriptText}>That's a great starting point. Let's talk about your current traction and metrics first.</span>
                    <span className={styles.transcriptTime}>00:51</span>
                  </div>
                  <div className={`${styles.transcriptLine} ${styles.transcriptLineCurrent}`}>
                    <span className={styles.transcriptSpeaker}>Expert</span>
                    <span className={styles.transcriptText}>What stage are you at — pre-seed, seed, or Series A?</span>
                    <span className={styles.transcriptTime}>01:10</span>
                  </div>
                </div>
              </div>
            )}

            {/* Chat Interface */}
            {booking.consultationType === "text" && (
              <div
                className={`${styles.chatInterface} ${styles.chatInterfaceFullHeight}`}
              >
                <div className={styles.chatLog}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.chatMessage} ${msg.sender === "seeker"
                        ? styles.seekerMessage
                        : styles.expertMessage
                        }`}
                    >
                      <div className={styles.msgBubble}>
                        <p className={styles.msgText}>{msg.text}</p>
                        <div className={styles.msgMeta}>
                          <span className={styles.msgTime}>{msg.timestamp}</span>
                          {msg.sender === "seeker" && (
                            <CheckCheck size={14} className={styles.readReceipt} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={onSendMessage} className={styles.chatForm}>
                  <div className={styles.chatInputContainer}>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message here..."
                      className={styles.chatInput}
                    />
                    <button type="submit" className={styles.chatSendBtn}>
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Expert summary + Notes notepad */}
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
                        src={booking.expert.image}
                        alt={booking.expert.name}
                        fill
                        className={styles.sessionInfoExpertImg}
                        sizes="52px"
                      />
                    </div>
                    <div className={styles.sessionInfoExpertText}>
                      <h3 className={styles.sessionInfoExpertName}>
                        {booking.expert.name}
                        <BadgeCheck size={14} className={styles.verifiedIcon} />
                      </h3>
                      <p className={styles.sessionInfoExpertRole}>
                        {booking.expert.role || "Startup & VC Expert"}
                      </p>
                    </div>
                  </div>

                  <div className={styles.dashedDivider} />

                  <div className={styles.sessionInfoDetailsList}>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Booking ID</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {booking.referenceId}
                      </strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Service</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {booking.consultationType === "video"
                          ? "1:1 Video Call"
                          : "Text Consultation"}
                      </strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Amount Paid</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {formatCurrency(booking.totalPaid)}
                      </strong>
                    </div>
                  </div>

                  <div className={styles.sessionInfoReportContainer}>
                    <button
                      type="button"
                      onClick={() => setIsReportModalOpen(true)}
                      className={styles.sessionInfoReportLink}
                    >
                      <Flag size={12} aria-hidden="true" />
                      Report Expert
                    </button>
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
                    </div>
                  </div>
                </div>
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
        <ReportForm
          booking={booking}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </section>
  );
}
