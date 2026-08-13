"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import {
  BadgeCheck,
  CheckCheck,
  Copy,
  FileText,
  Flag,
  Headphones,
  Image as ImageIcon,
  Paperclip,
  PhoneOff,
  Plus,
  Reply,
  Search,
  Send,
  Shield,
  Smile,
  Star,
  X,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ReportForm from "@/app/seeker/report/[bookingId]/ReportForm";
import { formatCurrency, type BookingDetail } from "@/lib/seekerDashboard";
import styles from "./ActiveRoom.module.css";

export type ChatMessage = {
  id: string;
  sender: "seeker" | "expert";
  text: string;
  timestamp: string;
  replyTo?: {
    sender: "seeker" | "expert";
    text: string;
  };
  attachment?: {
    name: string;
    size: string;
    type: "image" | "file";
  };
};

export type ActiveChatRoomProps = {
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

const QUICK_EMOJIS = ["👍", "❤️", "💡", "🔥", "🙏", "🎉"];

export default function ActiveChatRoom({
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
}: ActiveChatRoomProps) {
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Reaction state per message: { msgId: { "👍": count } }
  const [msgReactions, setMsgReactions] = useState<Record<string, Record<string, number>>>({
    "1": { "👍": 1, "💡": 1 },
    "2": { "❤️": 1 },
  });

  // User's own reactions per message: { msgId: ["👍"] }
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});

  // Starred message IDs set
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set(["2"]));

  // Filter & Search states
  const [showOnlyStarred, setShowOnlyStarred] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Replying state
  const [replyingMsg, setReplyingMsg] = useState<ChatMessage | null>(null);

  // Emoji picker & attachment drawer
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-scroll chat log
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleToggleReaction = (msgId: string, emoji: string) => {
    const hasReacted = userReactions[msgId]?.includes(emoji);

    setMsgReactions((prev) => {
      const msgMap = { ...(prev[msgId] || {}) };
      if (hasReacted) {
        msgMap[emoji] = Math.max(0, (msgMap[emoji] || 1) - 1);
        if (msgMap[emoji] === 0) delete msgMap[emoji];
      } else {
        msgMap[emoji] = (msgMap[emoji] || 0) + 1;
      }
      return { ...prev, [msgId]: msgMap };
    });

    setUserReactions((prev) => {
      const currentList = prev[msgId] || [];
      return {
        ...prev,
        [msgId]: hasReacted
          ? currentList.filter((e) => e !== emoji)
          : [...currentList, emoji],
      };
    });
  };

  const handleToggleStar = (msgId: string) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
        showToast("Message unstarred");
      } else {
        next.add(msgId);
        showToast("Message starred ⭐");
      }
      return next;
    });
  };

  const handleCopyText = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    showToast("Copied to clipboard!");
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    onSendMessage(e);
    setReplyingMsg(null);
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  const handleInsertEmoji = (emoji: string) => {
    setNewMessage(newMessage + emoji);
    setShowEmojiPicker(false);
  };

  // Filter messages based on search and starred toggle
  const filteredMessages = chatMessages.filter((msg) => {
    if (showOnlyStarred && !starredIds.has(msg.id)) return false;
    if (searchQuery.trim() && !msg.text.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

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

  const handleFinishClick = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Finish Consultation?",
      message: "Are you sure you want to complete this text consultation session?",
      confirmText: "Yes, Finish Session",
      cancelText: "No, Keep Chat Active",
      variant: "danger",
      onConfirmAction: onFinishSession,
    });
  };

  return (
    <section className={styles.sessionRoom}>
      <div className="container">
        <div className={styles.roomGrid}>
          {/* Left Column: Full Height Interactive Chat Interface */}
          <div className={styles.roomMain}>
            <div className={`${styles.chatInterface} ${styles.chatInterfaceFullHeight}`}>
              {/* Lively Chat Header Bar */}
              <div className={styles.chatRoomHeader}>
                <div className={styles.chatHeaderExpertInfo}>
                  <div className={styles.chatHeaderAvatarWrap}>
                    <Image
                      src={booking.expert.image}
                      alt={booking.expert.name}
                      fill
                      className={styles.chatHeaderAvatarImg}
                    />
                    <span className={styles.chatHeaderStatusDot} title="Expert is online" />
                  </div>
                  <div className={styles.chatHeaderDetails}>
                    <h3 className={styles.chatHeaderName}>
                      {booking.expert.name}
                      <BadgeCheck size={14} className={styles.chatHeaderVerified} />
                    </h3>
                    <span className={styles.chatHeaderSubtitle}>
                      Live Consultation • {booking.consultationLabel}
                    </span>
                  </div>
                </div>

                <div className={styles.chatHeaderActions}>
                  <button
                    type="button"
                    className={`${styles.chatHeaderBtn} ${showOnlyStarred ? styles.chatHeaderBtnActive : ""}`}
                    onClick={() => setShowOnlyStarred(!showOnlyStarred)}
                    title="View Starred Messages"
                  >
                    <Star
                      size={14}
                      fill={showOnlyStarred ? "#EAB308" : "none"}
                      stroke={showOnlyStarred ? "#EAB308" : "currentColor"}
                    />
                    <span>Starred ({starredIds.size})</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.chatHeaderBtn} ${showSearch ? styles.chatHeaderBtnActive : ""}`}
                    onClick={() => setShowSearch(!showSearch)}
                    title="Search Messages"
                  >
                    <Search size={14} />
                  </button>

                  <button
                    type="button"
                    className={styles.chatHeaderEndBtn}
                    onClick={handleFinishClick}
                    title="End Session"
                  >
                    <PhoneOff size={13} />
                    <span>End Session</span>
                  </button>
                </div>
              </div>

              {/* Search Bar Drawer */}
              {showSearch && (
                <div className={styles.chatSearchBar}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in conversation..."
                    className={styles.chatSearchInput}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className={styles.clearSearchBtn}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Toast Feedback Banner */}
              {toastMessage && (
                <div className={styles.chatToastNotification}>
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Chat Log */}
              <div className={styles.chatLog}>
                {filteredMessages.length === 0 ? (
                  <div className={styles.emptyChatState}>
                    <p>No messages match your search or star filter.</p>
                    {showOnlyStarred && (
                      <button
                        type="button"
                        onClick={() => setShowOnlyStarred(false)}
                        className={styles.resetFilterBtn}
                      >
                        Show All Messages
                      </button>
                    )}
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const isStarred = starredIds.has(msg.id);
                    const reactionsMap = msgReactions[msg.id] || {};
                    const hasReactions = Object.keys(reactionsMap).length > 0;

                    return (
                      <div
                        key={msg.id}
                        className={`${styles.chatMessage} ${
                          msg.sender === "seeker"
                            ? styles.seekerMessage
                            : styles.expertMessage
                        }`}
                      >
                        <div className={styles.msgWrapper}>
                          {/* Floating Actions Toolbar on Hover */}
                          <div className={styles.msgHoverToolbar}>
                            <div className={styles.quickEmojisBar}>
                              {QUICK_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className={styles.quickEmojiBtn}
                                  onClick={() => handleToggleReaction(msg.id, emoji)}
                                  title={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            <button
                              type="button"
                              className={`${styles.toolbarActionBtn} ${
                                isStarred ? styles.toolbarActionBtnStarred : ""
                              }`}
                              onClick={() => handleToggleStar(msg.id)}
                              title={isStarred ? "Unstar message" : "Star message"}
                            >
                              <Star
                                size={13}
                                fill={isStarred ? "#EAB308" : "none"}
                                stroke={isStarred ? "#EAB308" : "currentColor"}
                              />
                            </button>

                            <button
                              type="button"
                              className={styles.toolbarActionBtn}
                              onClick={() => setReplyingMsg(msg)}
                              title="Reply to message"
                            >
                              <Reply size={13} />
                            </button>

                            <button
                              type="button"
                              className={styles.toolbarActionBtn}
                              onClick={() => handleCopyText(msg.text)}
                              title="Copy text"
                            >
                              <Copy size={13} />
                            </button>
                          </div>

                          {/* Quoted Message if Replying */}
                          {msg.replyTo && (
                            <div className={styles.quotedMsgBlock}>
                              <span className={styles.quotedSpeaker}>
                                {msg.replyTo.sender === "seeker" ? "You" : booking.expert.name}
                              </span>
                              <p className={styles.quotedText}>{msg.replyTo.text}</p>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div className={styles.msgBubble}>
                            <p className={styles.msgText}>{msg.text}</p>
                            <div className={styles.msgMeta}>
                              {isStarred && (
                                <span title="Starred message" className={styles.starredIcon}>
                                  <Star
                                    size={11}
                                    fill="#EAB308"
                                    stroke="#EAB308"
                                  />
                                </span>
                              )}
                              <span className={styles.msgTime}>{msg.timestamp}</span>
                              {msg.sender === "seeker" && (
                                <CheckCheck size={14} className={styles.readReceipt} />
                              )}
                            </div>
                          </div>

                          {/* Reaction Pills Row */}
                          {hasReactions && (
                            <div className={styles.msgReactionsRow}>
                              {Object.entries(reactionsMap).map(([emoji, count]) => {
                                const isUserReacted = userReactions[msg.id]?.includes(emoji);
                                return (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className={`${styles.reactionPill} ${
                                      isUserReacted ? styles.reactionPillActive : ""
                                    }`}
                                    onClick={() => handleToggleReaction(msg.id, emoji)}
                                  >
                                    <span className={styles.reactionEmoji}>{emoji}</span>
                                    <span className={styles.reactionCount}>{count}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Animated Typing Indicator */}
                <div className={styles.typingIndicatorRow}>
                  <div className={styles.typingAvatarWrap}>
                    <Image
                      src={booking.expert.image}
                      alt={booking.expert.name}
                      fill
                      className={styles.typingAvatarImg}
                    />
                  </div>
                  <div className={styles.typingBubble}>
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                    <span className={styles.typingDot} />
                  </div>
                  <span className={styles.typingText}>
                    {booking.expert.name} is typing...
                  </span>
                </div>

                <div ref={chatEndRef} />
              </div>

              {/* Reply Preview Bar */}
              {replyingMsg && (
                <div className={styles.replyPreviewBar}>
                  <div className={styles.replyPreviewContent}>
                    <span className={styles.replyPreviewTitle}>
                      Replying to {replyingMsg.sender === "seeker" ? "yourself" : booking.expert.name}
                    </span>
                    <p className={styles.replyPreviewText}>{replyingMsg.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyingMsg(null)}
                    className={styles.closeReplyBtn}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Attachment / Emoji Drawer Popovers */}
              {showEmojiPicker && (
                <div className={styles.emojiPickerPopover}>
                  {["😊", "👍", "🙏", "💡", "🔥", "🎉", "❤️", "👏", "🚀", "💯", "🎯", "✨"].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={styles.pickerEmojiBtn}
                      onClick={() => handleInsertEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {showAttachmentMenu && (
                <div className={styles.attachmentPopover}>
                  <button
                    type="button"
                    className={styles.attachmentOptionBtn}
                    onClick={() => {
                      setNewMessage(newMessage + " 📷 [Image attachment]");
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <ImageIcon size={14} />
                    <span>Send Image</span>
                  </button>
                  <button
                    type="button"
                    className={styles.attachmentOptionBtn}
                    onClick={() => {
                      setNewMessage(newMessage + " 📄 [Document attachment]");
                      setShowAttachmentMenu(false);
                    }}
                  >
                    <FileText size={14} />
                    <span>Send Document</span>
                  </button>
                </div>
              )}

              {/* Chat Input Form */}
              <form onSubmit={handleSubmitForm} className={styles.chatForm}>
                <div className={styles.chatInputContainer}>
                  <button
                    type="button"
                    className={`${styles.inputToolBtn} ${showAttachmentMenu ? styles.inputToolBtnActive : ""}`}
                    onClick={() => {
                      setShowAttachmentMenu(!showAttachmentMenu);
                      setShowEmojiPicker(false);
                    }}
                    title="Add attachment"
                  >
                    <Paperclip size={16} />
                  </button>

                  <button
                    type="button"
                    className={`${styles.inputToolBtn} ${showEmojiPicker ? styles.inputToolBtnActive : ""}`}
                    onClick={() => {
                      setShowEmojiPicker(!showEmojiPicker);
                      setShowAttachmentMenu(false);
                    }}
                    title="Insert emoji"
                  >
                    <Smile size={16} />
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className={styles.chatInput}
                  />

                  <button
                    type="submit"
                    className={styles.chatSendBtn}
                    title="Send Message"
                    disabled={!newMessage.trim()}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            </div>
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
                        Text Consultation
                      </strong>
                    </div>
                    <div className={styles.sessionInfoDetailRow}>
                      <span className={styles.sessionInfoDetailKey}>Amount Paid</span>
                      <strong className={styles.sessionInfoDetailVal}>
                        {formatCurrency(booking.totalPaid)}
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
                      <Link href="/terms-of-service/" className={styles.helpLink}>
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
