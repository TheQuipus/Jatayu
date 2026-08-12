"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCheck,
  Flag,
  Mic,
  MicOff,
  Send,
  Star,
  Video,
  VideoOff,
  Maximize,
  Minimize,
} from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ExpertReportForm from "@/app/expert/(app)/report/[requestId]/ExpertReportForm";
import { getRequestDetailById } from "@/lib/expertRequestDetailStore";
import styles from "./ExpertActiveRoom.module.css";

type ChatMessage = {
  id: string;
  sender: "expert" | "client";
  text: string;
  timestamp: string;
};

type ExpertActiveRoomProps = {
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

export default function ExpertActiveRoom({
  requestId = "req-1",
  clientName,
  clientAvatar,
  clientRole = "Head of Product",
  title,
  proposedPrice = "₹2,400.00",
  formatLabel = "Video Call",
  onLeaveRoom,
  onFinishSession,
}: ExpertActiveRoomProps) {
  const isVideoCall = !formatLabel.toLowerCase().includes("async") && !formatLabel.toLowerCase().includes("text");

  // Video toggle states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [notes, setNotes] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: "client",
      text: `Hi! Thank you for accepting my request "${title}". Excited for our session.`,
      timestamp: "10:30 AM",
    },
    {
      id: "msg-2",
      sender: "expert",
      text: "Hello! Happy to help. I've reviewed your brief and notes. Ready whenever you are!",
      timestamp: "10:31 AM",
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "expert",
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setChatMessages((prev) => [...prev, msg]);
    setNewMessage("");
  };

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
    onConfirmAction: () => {},
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
        <div className={styles.roomHeader}>
          <div className={styles.roomHeaderLeft}>
            <button
              type="button"
              onClick={handleLeaveClick}
              className={styles.roomBackBtn}
            >
              <ArrowLeft size={14} />
              Leave Room
            </button>
          </div>

          <div className={styles.roomHeaderRight}>
            <ContinueButton
              label="Finish Session"
              onClick={handleFinishClick}
              className={styles.endSessionBtn}
            />
          </div>
        </div>

        <div className={styles.roomGrid}>
          {/* Left Column: Chat & Video feed */}
          <div className={styles.roomMain}>
            {isVideoCall ? (
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
                    <div className={styles.videoFeedLabel}>
                      <span>{clientName} (Client)</span>
                    </div>
                  </div>
                )}

                {/* Picture-in-picture preview */}
                <div className={styles.pipContainer}>
                  <div className={styles.pipInner}>
                    {isMuted ? (
                      <span className={styles.pipMuteIndicator}>Mic Off</span>
                    ) : (
                      <span className={styles.pipLabel}>You (Expert)</span>
                    )}
                  </div>
                </div>

                {/* Video Call Controls Overlay */}
                <div className={styles.videoControls}>
                  <button
                    type="button"
                    className={`${styles.controlBtn} ${
                      isMuted ? styles.controlBtnActive : ""
                    }`}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>

                  <button
                    type="button"
                    className={`${styles.controlBtn} ${
                      isVideoOff ? styles.controlBtnActive : ""
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
                </div>
              </div>
            ) : (
              /* Chat Interface */
              <div
                className={`${styles.chatInterface} ${styles.chatInterfaceFullHeight}`}
              >
                <div className={styles.chatLog}>
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`${styles.chatMessage} ${
                        msg.sender === "expert"
                          ? styles.expertMessage
                          : styles.clientMessage
                      }`}
                    >
                      <div className={styles.msgBubble}>
                        <p className={styles.msgText}>{msg.text}</p>
                        <div className={styles.msgMeta}>
                          <span className={styles.msgTime}>{msg.timestamp}</span>
                          {msg.sender === "expert" && (
                            <CheckCheck size={14} className={styles.readReceipt} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className={styles.chatForm}>
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

          {/* Right Column: Client details + Notes notepad */}
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
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, fontSize: 12, color: "var(--dove-gray)" }}>
                        <Star size={12} fill="#EAB308" stroke="#EAB308" />
                        <strong style={{ color: "var(--ink)", fontWeight: 700 }}>5.0</strong>
                        <span>(Client Rating)</span>
                      </div>
                    </div>
                  </div>

                  <div className={styles.dashedDivider} />

                  <div className={styles.sessionInfoDetailsList}>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Request ID</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {requestId}
                      </strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Service</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {isVideoCall ? "1:1 Video Call" : "Text Consultation"}
                      </strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Payout</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {proposedPrice}
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
                      Report Client
                    </button>
                  </div>
                </div>
                <div className={styles.bookingFooter} aria-hidden="true" />
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
          request={getRequestDetailById(requestId) || {
            id: requestId,
            client: { name: clientName, avatar: "/avatars/avatar-1.jpg", email: "client@example.com" },
            consultationType: "video",
            consultationFee: 1500,
            platformFee: 150,
            gst: 297,
            totalPaid: 1947,
            scheduledDateLabel: "Today",
            scheduledTimeLabel: "10:30 AM",
            durationMinutes: 30,
            subject: title,
            context: "Live consultation session.",
            placedOnLabel: "Yesterday",
            invoiceId: `JTY-${requestId}`,
          }}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </section>
  );
}
