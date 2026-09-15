"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  BadgeCheck,
  Bold,
  CheckCheck,
  Clock,
  Copy,
  FileText,
  Flag,
  Headphones,
  Image as ImageIcon,
  Italic,
  MessageCircle,
  Paperclip,
  Reply,
  Send,
  Shield,
  Smile,
  Sparkles,
  Star,
  Underline,
  X,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ContinueButton from "@/components/ui/ContinueButton";
import ExpertReportForm from "@/app/expert/(app)/report/[requestId]/ExpertReportForm";
import styles from "@/components/seeker/bookings/ActiveRoom.module.css";
import { useAgoraRoom, type AgoraTextMessage } from "@/hooks/useAgoraRoom";

export type ChatMessage = {
  id: string;
  sender: "expert" | "client";
  text: string;
  timestamp: string;
  replyTo?: {
    sender: "expert" | "client";
    text: string;
  };
  attachment?: {
    name: string;
    size: string;
    type: "image" | "file";
  };
};

export type ExpertActiveChatRoomProps = {
  requestId?: string;
  clientName: string;
  clientAvatar: string;
  clientRole?: string;
  title: string;
  proposedPrice?: string;
  formatLabel?: string;
  scheduledEndAt?: string;
  onLeaveRoom: () => void;
  onFinishSession: () => void;
};

const ANIMATED_EMOJIS = ["👋", "🔥", "❤️", "👍", "💡", "🎯", "🚀", "✨", "👏", "💯", "🙏", "😊"];

function getEmojiCodepoint(emojiChar: string): string {
  const codePoints = Array.from(emojiChar).map((c) =>
    c.codePointAt(0)!.toString(16)
  );
  return codePoints.join("_");
}

function NotoAnimatedEmojiItem({ emoji, size = 76 }: { emoji: string; size?: number }) {
  const [hasError, setHasError] = useState(false);
  const codepoint = getEmojiCodepoint(emoji);
  const webpUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/512.webp`;
  const gifUrl = `https://fonts.gstatic.com/s/e/notoemoji/latest/${codepoint}/512.gif`;

  if (hasError) {
    return <span className={styles.msgTextEmojiOnly}>{emoji}</span>;
  }

  return (
    <picture className={styles.notoAnimatedEmojiPic}>
      <source srcSet={webpUrl} type="image/webp" />
      <img
        src={gifUrl}
        alt={emoji}
        width={size}
        height={size}
        className={styles.notoAnimatedEmojiImg}
        onError={() => setHasError(true)}
      />
    </picture>
  );
}

export default function ExpertActiveChatRoom({
  requestId = "req-1",
  clientName,
  clientAvatar,
  clientRole = "Head of Product",
  title,
  proposedPrice = "₹2,400.00",
  formatLabel = "Text Chat",
  scheduledEndAt,
  onLeaveRoom,
  onFinishSession,
}: ExpertActiveChatRoomProps) {
  const [notes, setNotes] = useState("");
  const [notesSavedStatus, setNotesSavedStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Notes autosave
  useEffect(() => {
    if (!notes) {
      setNotesSavedStatus("idle");
      return;
    }
    setNotesSavedStatus("saving");
    const timer = setTimeout(() => {
      setNotesSavedStatus("saved");
    }, 600);
    return () => clearTimeout(timer);
  }, [notes]);
  const [newMessage, setNewMessage] = useState("");
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const [secondsRemaining, setSecondsRemaining] = useState(() => Math.max(0, Math.ceil(
    (new Date(scheduledEndAt || Date.now()).getTime() - Date.now()) / 1000,
  )));

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      const endAt = scheduledEndAt;
      const remaining = endAt ? Math.max(0, Math.ceil((new Date(endAt).getTime() - Date.now()) / 1000)) : 0;
      setSecondsRemaining(remaining);
      if (remaining === 0) onFinishSession();
    }, 1000);
    return () => clearInterval(timer);
  }, [onFinishSession, scheduledEndAt, secondsRemaining]);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const receiveAgoraMessage = useCallback((message: AgoraTextMessage) => {
    setChatMessages((previous) => [...previous, {
      id: message.id || `agora-${Date.now()}-${Math.random()}`,
      sender: message.sender === "expert" ? "expert" : "client",
      text: message.text,
      timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
  }, []);
  const agora = useAgoraRoom({
    bookingId: requestId,
    role: "expert",
    enabled: true,
    requestVideo: false,
    requestAudio: false,
    onMessage: receiveAgoraMessage,
  });

  useEffect(() => {
    if (!agora.scheduledEndAt) return;
    setSecondsRemaining(Math.max(0, Math.ceil((new Date(agora.scheduledEndAt).getTime() - Date.now()) / 1000)));
  }, [agora.scheduledEndAt]);

  const chatLogRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatLogRef.current?.scrollTo({
      top: chatLogRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages]);

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



  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    if (await agora.sendMessage(newMessage)) {
      setNewMessage("");
      setReplyingTo(null);
      setShowEmojiPicker(false);
    }
  };

  const handleSendEmoji = (emoji: string) => {
    void agora.sendMessage(emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImg = file.type.startsWith("image/");
    void agora.sendMessage(isImg ? `Shared an image: ${file.name}` : `Shared a file: ${file.name}`);
  };

  const handleFinishClick = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Finish Consultation?",
      message: "Are you sure you want to mark this text consultation as completed?",
      confirmText: "Yes, Finish Session",
      cancelText: "No, Keep Active",
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
    <section className={`${styles.sessionRoom} ${styles.expertChatRoom}`}>
      {agora.status === "error" ? <p role="alert" className={styles.chatErrorBanner}>{agora.error}</p> : null}
      {agora.chatError ? <p role="alert" className={styles.chatErrorBanner}>{agora.chatError}</p> : null}
      <div className="container">
        <div className={`${styles.roomGrid} ${styles.expertChatGrid}`}>
          {/* Left Column: Full Height Interactive Chat Interface */}
          <div className={styles.roomMain}>
            <div className={`${styles.chatInterface} ${styles.chatInterfaceFullHeight} ${styles.expertChatInterface}`}>
              {/* Lively Chat Header Bar */}
              <div className={styles.chatRoomHeader}>
                <div className={styles.chatHeaderExpertInfo}>
                  <div className={styles.chatHeaderAvatarWrap}>
                    <Image
                      src={clientAvatar || "/assets/img/avatar1.png"}
                      alt={clientName}
                      fill
                      className={styles.chatHeaderAvatarImg}
                    />
                    <span className={styles.chatHeaderStatusDot} aria-hidden="true" />
                  </div>
                  <div className={styles.chatHeaderDetails}>
                    <h3 className={styles.chatHeaderName}>
                      {clientName}
                      <BadgeCheck size={14} className={styles.chatHeaderVerified} />
                    </h3>
                    <span className={styles.chatHeaderSubtitle}>
                      Live Consultation • {formatLabel}
                    </span>
                  </div>
                </div>

                <div className={styles.chatHeaderActions}>
                  <div
                    className={`${styles.timerBadgeHeader} ${
                      secondsRemaining > 300
                        ? styles.timerGreen
                        : secondsRemaining > 120
                        ? styles.timerYellow
                        : styles.timerRed
                    }`}
                  >
                    <Clock size={14} className={styles.timerClockIcon} />
                    <span>{formatTimer(secondsRemaining)}</span>
                  </div>

                  <button
                    type="button"
                    className={styles.chatHeaderBtn}
                    onClick={handleFinishClick}
                    title="End Chat Session"
                  >
                    <span>Finish Session</span>
                  </button>
                </div>
              </div>

              {/* Chat Log Scroll Area */}
              <div className={`${styles.chatLog} ${styles.expertChatLog}`} ref={chatLogRef} aria-live="polite">
                {chatMessages.length === 0 && (
                  <div className={styles.expertEmptyChat}>
                    <span className={styles.expertEmptyChatIcon}>
                      <MessageCircle size={26} aria-hidden="true" />
                    </span>
                    <strong>Start the conversation</strong>
                    <p>Send a message to {clientName} about “{title}”.</p>
                  </div>
                )}
                {chatMessages.map((msg) => {
                  const isExpert = msg.sender === "expert";
                  const isSingleEmoji = ANIMATED_EMOJIS.includes(msg.text.trim());

                  return (
                    <div
                      key={msg.id}
                      className={`${styles.chatMsgRow} ${
                        isExpert ? styles.chatMsgRowYou : styles.chatMsgRowExpert
                      }`}
                    >
                      {!isExpert && (
                        <div className={styles.chatMsgAvatar}>
                          <Image
                            src={clientAvatar || "/assets/img/avatar1.png"}
                            alt={clientName}
                            width={32}
                            height={32}
                            className={styles.chatAvatarImg}
                          />
                        </div>
                      )}

                      <div className={styles.chatMsgContent}>
                        {msg.replyTo && (
                          <div className={styles.replyPreviewHeader}>
                            <Reply size={12} />
                            <span>
                              Replying to {msg.replyTo.sender === "expert" ? "You" : clientName}:
                            </span>
                            <p className={styles.replyPreviewText}>{msg.replyTo.text}</p>
                          </div>
                        )}

                        <div
                          className={`${styles.chatBubble} ${
                            isExpert ? styles.chatBubbleYou : styles.chatBubbleExpert
                          } ${isSingleEmoji ? styles.chatBubbleEmojiOnly : ""}`}
                        >
                          {isSingleEmoji ? (
                            <NotoAnimatedEmojiItem emoji={msg.text.trim()} size={80} />
                          ) : (
                            <p className={styles.msgText}>{msg.text}</p>
                          )}

                          {msg.attachment && (
                            <div className={styles.msgAttachmentBox}>
                              {msg.attachment.type === "image" ? (
                                <div className={styles.attachmentImgWrap}>
                                  <ImageIcon size={20} />
                                  <span>{msg.attachment.name}</span>
                                </div>
                              ) : (
                                <div className={styles.attachmentFileWrap}>
                                  <FileText size={20} />
                                  <div>
                                    <strong>{msg.attachment.name}</strong>
                                    <span>{msg.attachment.size}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={styles.msgMetaRow}>
                          <span className={styles.msgTime}>{msg.timestamp}</span>
                          {isExpert && <CheckCheck size={14} className={styles.readCheckIcon} />}
                          <button
                            type="button"
                            className={styles.replyBtn}
                            onClick={() => setReplyingTo(msg)}
                            title="Reply to message"
                          >
                            <Reply size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Replying Banner */}
              {replyingTo && (
                <div className={styles.replyBar}>
                  <div className={styles.replyBarLeft}>
                    <Reply size={14} />
                    <span>
                      Replying to {replyingTo.sender === "expert" ? "You" : clientName}: "
                      {replyingTo.text}"
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className={styles.closeReplyBtn}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Quick Emoji Drawer */}
              {showEmojiPicker && (
                <div className={styles.emojiPickerDrawer}>
                  <div className={styles.emojiPickerHeader}>
                    <span>Quick Emojis</span>
                    <button type="button" onClick={() => setShowEmojiPicker(false)}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className={styles.emojiGrid}>
                    {ANIMATED_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={styles.emojiBtn}
                        onClick={() => handleSendEmoji(emoji)}
                      >
                        <NotoAnimatedEmojiItem emoji={emoji} size={40} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className={`${styles.chatInputArea} ${styles.expertChatInputArea}`}>
                <form onSubmit={handleSendMessage} className={styles.chatForm}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />

                  <div className={styles.inputBoxWrap}>
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker((prev) => !prev)}
                      className={styles.inputToolBtn}
                      title="Emoji drawer"
                    >
                      <Smile size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={styles.inputToolBtn}
                      title="Attach file or image"
                    >
                      <Paperclip size={18} />
                    </button>

                    <input
                      type="text"
                      placeholder="Type a message to client..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className={styles.chatInput}
                    />

                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={styles.chatSendBtn}
                    >
                      <Send size={16} />
                      <span>Send</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* Right Column: Client summary + Notes notepad + Need Help */}
          <aside className={`${styles.roomSidebar} ${styles.expertChatSidebar}`}>
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
                      <span>Notes are private and auto-saved.</span>
                      {notesSavedStatus !== "idle" && (
                        <span
                          className={`${styles.saveStatus} ${
                            notesSavedStatus === "saving"
                              ? styles["saveStatus-saving"]
                              : styles["saveStatus-saved"]
                          }`}
                        >
                          {notesSavedStatus === "saving" ? "Saving..." : "Saved ✓"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Help and Support Box */}
              <div className={styles.bookingBox}>
                <div className={styles.bookingHeader}>
                  <span className={styles.bookingHeaderTitle}>Help and Support</span>
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
