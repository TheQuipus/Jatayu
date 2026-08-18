"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
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
  MoreVertical,
  Paperclip,
  Pencil,
  PhoneOff,
  Plus,
  PlusCircle,
  Reply,
  Search,
  Send,
  Shield,
  Smile,
  Sparkles,
  Star,
  Trash2,
  Underline,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ContinueButton from "@/components/ui/ContinueButton";
import ReportForm from "@/app/seeker/report/[bookingId]/ReportForm";
import { formatCurrency, SEEKER_PROFILE, type BookingDetail } from "@/lib/seekerDashboard";
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

function NotoAnimatedEmojiMessage({ text, size = 76 }: { text: string; size?: number }) {
  let emojis: string[] = [];
  if (typeof Intl !== "undefined" && (Intl as unknown as { Segmenter?: new (loc: string, opt: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter) {
    const SegmenterClass = (Intl as unknown as { Segmenter: new (loc: string, opt: { granularity: string }) => { segment: (s: string) => Iterable<{ segment: string }> } }).Segmenter;
    const segmenter = new SegmenterClass("en", { granularity: "grapheme" });
    emojis = Array.from(segmenter.segment(text.trim())).map((s) => s.segment);
  } else {
    emojis = Array.from(text.trim());
  }

  return (
    <div className={styles.notoEmojiContainer}>
      {emojis.map((emojiChar, idx) => (
        <NotoAnimatedEmojiItem key={`${emojiChar}-${idx}`} emoji={emojiChar} size={size} />
      ))}
    </div>
  );
}

function FormattedMessageText({ text }: { text: string }) {
  const parseFormattedText = (str: string): React.ReactNode[] => {
    const regex = /(<u>.*?<\/u>|\*\*.*?\*\*|\*.*?\*)/g;
    const parts = str.split(regex);

    return parts.map((part, index) => {
      if (part.startsWith("<u>") && part.endsWith("</u>")) {
        const inner = part.slice(3, -4);
        return <u key={index}>{inner}</u>;
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        const inner = part.slice(2, -2);
        return <strong key={index}>{inner}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
        const inner = part.slice(1, -1);
        return <em key={index}>{inner}</em>;
      }
      return part;
    });
  };

  return <p className={styles.msgText}>{parseFormattedText(text)}</p>;
}

const QUICK_EMOJIS = ["💖", "👍", "🎉", "👏", "😂", "😮", "😢", "🤔"];

const EXTENSION_PACKS = [
  { id: "5m", mins: 5, price: 150, tag: "", discount: "" },
  { id: "10m", mins: 10, price: 280, tag: "POPULAR", discount: "Save 7%" },
  { id: "15m", mins: 15, price: 400, tag: "BEST VALUE", discount: "Save 12%" },
];

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
  const chatLogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleApplyFormat = (format: "bold" | "italic" | "underline") => {
    if (!inputRef.current) return;
    const input = inputRef.current;
    const start = input.selectionStart ?? newMessage.length;
    const end = input.selectionEnd ?? newMessage.length;
    const selectedText = newMessage.substring(start, end);

    let prefix = "";
    let suffix = "";
    if (format === "bold") {
      prefix = "**";
      suffix = "**";
    } else if (format === "italic") {
      prefix = "*";
      suffix = "*";
    } else if (format === "underline") {
      prefix = "<u>";
      suffix = "</u>";
    }

    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}text${suffix}`;

    const updated = newMessage.substring(0, start) + replacement + newMessage.substring(end);
    setNewMessage(updated);

    setTimeout(() => {
      input.focus();
      if (selectedText) {
        input.setSelectionRange(start + prefix.length, end + prefix.length);
      } else {
        input.setSelectionRange(start + prefix.length, start + prefix.length + 4);
      }
    }, 0);
  };

  // Astrotalk Extend Session & Timer states
  const [secondsRemaining, setSecondsRemaining] = useState(900); // 15 mins
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [selectedPackId, setSelectedPackId] = useState("10m");
  const [walletBalance, setWalletBalance] = useState(1250);

  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const formatTimer = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleConfirmExtend = () => {
    const pack = EXTENSION_PACKS.find((p) => p.id === selectedPackId) || EXTENSION_PACKS[1];
    if (walletBalance < pack.price) {
      showToast("Insufficient balance! Please add funds to your wallet.");
      return;
    }
    setWalletBalance((prev) => prev - pack.price);
    setSecondsRemaining((prev) => prev + pack.mins * 60);
    setIsExtendModalOpen(false);
    showToast(`Session extended by ${pack.mins} mins! Chat active 🎉`);
  };

  // Reaction state per message: { msgId: { "👍": count } }
  const [msgReactions, setMsgReactions] = useState<Record<string, Record<string, number>>>({
    "1": { "👍": 1, "🎉": 1 },
    "2": { "💖": 1 },
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

  // Editing state
  const [editingMsg, setEditingMsg] = useState<ChatMessage | null>(null);

  // Active 3-dots dropdown menu msg ID
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);

  // Deleted message IDs set
  const [deletedMsgIds, setDeletedMsgIds] = useState<Set<string>>(new Set());

  // Close 3-dots dropdown menu when clicking anywhere outside
  useEffect(() => {
    if (!activeMenuMsgId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`.${styles.msgHoverActionsWrap}`)) {
        setActiveMenuMsgId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuMsgId]);

  // Emoji picker & attachment drawer
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Notes save status state
  const [isNotesSaved, setIsNotesSaved] = useState(false);
  const handleSaveNotes = () => {
    setIsNotesSaved(true);
    setTimeout(() => setIsNotesSaved(false), 2500);
  };

  const scrollToBottom = (instant = false) => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTo({
        top: chatLogRef.current.scrollHeight,
        behavior: instant ? "auto" : "smooth",
      });
    }
  };

  // Auto-scroll to bottom immediately when joining chat session & after layout settles
  useEffect(() => {
    scrollToBottom(true);
    const timer = setTimeout(() => scrollToBottom(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Auto-scroll when new messages update
  useEffect(() => {
    scrollToBottom(false);
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

  const isEmojiOnlyText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    return /^[\s\p{Extended_Pictographic}\u200d\ufe0f]+$/u.test(trimmed);
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

    if (editingMsg) {
      setLocalMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingMsg.id ? { ...msg, text: newMessage.trim() } : msg
        )
      );
      setEditingMsg(null);
      setNewMessage("");
      showToast("Message updated! ✨");
    } else {
      onSendMessage(e);
      setReplyingMsg(null);
    }
    setShowEmojiPicker(false);
    setShowAttachmentMenu(false);
  };

  const handleInsertEmoji = (emoji: string) => {
    setNewMessage(newMessage + emoji);
    setShowEmojiPicker(false);
  };

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>(chatMessages);

  useEffect(() => {
    setLocalMessages(chatMessages);
  }, [chatMessages]);

  const handleDeleteMessage = (msgId: string) => {
    setDeletedMsgIds((prev) => new Set(prev).add(msgId));
    showToast("Message deleted");
  };

  const handleUndoDelete = (msgId: string) => {
    setDeletedMsgIds((prev) => {
      const next = new Set(prev);
      next.delete(msgId);
      return next;
    });
    showToast("Message restored! 🪄");
  };

  // Filter messages based on search and starred toggle
  const filteredMessages = localMessages.filter((msg) => {
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
    onConfirmAction: () => { },
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
                  <div
                    className={`${styles.timerBadgeHeader} ${secondsRemaining > 300
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
                </div>
              </div>

              {/* Toast Feedback Banner */}
              {toastMessage && (
                <div className={styles.chatToastNotification}>
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Chat Log */}
              <div className={styles.chatLog} ref={chatLogRef}>
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
                    const isDeleted = deletedMsgIds.has(msg.id);
                    const reactionsMap = msgReactions[msg.id] || {};
                    const hasReactions = Object.keys(reactionsMap).length > 0;
                    const isEmojiOnly = isEmojiOnlyText(msg.text);

                    if (isDeleted) {
                      return (
                        <div
                          key={msg.id}
                          className={`${styles.chatMessage} ${msg.sender === "seeker" ? styles.seekerMessage : styles.expertMessage
                            }`}
                        >
                          <div className={styles.msgAvatarWrap}>
                            <Image
                              src={
                                msg.sender === "seeker"
                                  ? SEEKER_PROFILE.avatar || "/assets/img/avatar1.png"
                                  : booking.expert.image
                              }
                              alt=""
                              width={36}
                              height={36}
                              className={styles.msgAvatarImg}
                            />
                          </div>

                          <div className={styles.msgWrapper}>
                            <div className={styles.deletedMsgPill}>
                              <span className={styles.deletedMsgText}>This message has been deleted.</span>
                              <button
                                type="button"
                                className={styles.undoDeleteBtn}
                                onClick={() => handleUndoDelete(msg.id)}
                              >
                                Undo
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`${styles.chatMessage} ${msg.sender === "seeker" ? styles.seekerMessage : styles.expertMessage
                          }`}
                      >
                        <div className={styles.msgAvatarWrap}>
                          <Image
                            src={
                              msg.sender === "seeker"
                                ? SEEKER_PROFILE.avatar || "/assets/img/avatar1.png"
                                : booking.expert.image
                            }
                            alt=""
                            width={36}
                            height={36}
                            className={styles.msgAvatarImg}
                          />
                        </div>

                        <div className={styles.msgWrapper}>
                          {/* Sender Info Line: Name • Time */}
                          <div className={styles.msgHeaderLine}>
                            <span className={styles.msgSenderName}>
                              {msg.sender === "seeker" ? "You" : booking.expert.name}
                            </span>
                            <span className={styles.msgHeaderDot}>•</span>
                            <span className={styles.msgHeaderTime}>{msg.timestamp}</span>
                            {isStarred && (
                              <span title="Starred message" className={styles.starredIcon}>
                                <Star size={12} fill="#EAB308" stroke="#EAB308" />
                              </span>
                            )}
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

                          {/* Message Bubble + Hover Trigger */}
                          <div className={styles.msgBubbleRow}>
                            <div
                              className={`${styles.msgBubble} ${msg.sender === "seeker" ? styles.seekerBubble : styles.expertBubble
                                } ${isEmojiOnly ? styles.msgBubbleEmojiOnly : ""}`}
                            >
                              {isEmojiOnly ? (
                                <NotoAnimatedEmojiMessage text={msg.text} size={76} />
                              ) : (
                                <FormattedMessageText text={msg.text} />
                              )}
                            </div>

                            {/* Hover Reaction Toolbar & 3-Dots Trigger */}
                            <div className={styles.msgHoverActionsWrap}>
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
                                  className={`${styles.toolbarActionBtn} ${activeMenuMsgId === msg.id ? styles.toolbarActionBtnActive : ""
                                    }`}
                                  onClick={() =>
                                    setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)
                                  }
                                  title="More options"
                                >
                                  <MoreVertical size={15} />
                                </button>
                              </div>

                              <button
                                type="button"
                                className={styles.msgReactionTriggerBtn}
                                title="Add reaction"
                              >
                                <Smile size={18} />
                              </button>

                              {/* 3-Dots Dropdown Menu Popover */}
                              {activeMenuMsgId === msg.id && (
                                <div className={styles.msgMoreMenuPopover}>
                                  {msg.sender === "seeker" && (
                                    <button
                                      type="button"
                                      className={styles.msgMoreMenuItem}
                                      onClick={() => {
                                        setEditingMsg(msg);
                                        setNewMessage(msg.text);
                                        setReplyingMsg(null);
                                        setActiveMenuMsgId(null);
                                      }}
                                    >
                                      <Pencil size={14} />
                                      <span>Edit Message</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    className={styles.msgMoreMenuItem}
                                    onClick={() => {
                                      handleToggleStar(msg.id);
                                      setActiveMenuMsgId(null);
                                    }}
                                  >
                                    <Star
                                      size={14}
                                      fill={isStarred ? "#EAB308" : "none"}
                                      stroke={isStarred ? "#EAB308" : "currentColor"}
                                    />
                                    <span>{isStarred ? "Unstar Message" : "Star Message"}</span>
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.msgMoreMenuItem}
                                    onClick={() => {
                                      setReplyingMsg(msg);
                                      setEditingMsg(null);
                                      setActiveMenuMsgId(null);
                                    }}
                                  >
                                    <Reply size={14} />
                                    <span>Reply</span>
                                  </button>

                                  <button
                                    type="button"
                                    className={styles.msgMoreMenuItem}
                                    onClick={() => {
                                      handleCopyText(msg.text);
                                      setActiveMenuMsgId(null);
                                    }}
                                  >
                                    <Copy size={14} />
                                    <span>Copy Text</span>
                                  </button>

                                  <button
                                    type="button"
                                    className={`${styles.msgMoreMenuItem} ${styles.msgMoreMenuItemDanger}`}
                                    onClick={() => {
                                      handleDeleteMessage(msg.id);
                                      setActiveMenuMsgId(null);
                                    }}
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </div>
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
                                    className={`${styles.reactionPill} ${isUserReacted ? styles.reactionPillActive : ""
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

              {/* Edit Preview Bar */}
              {editingMsg && (
                <div className={styles.editPreviewBar}>
                  <div className={styles.editPreviewContent}>
                    <span className={styles.editPreviewTitle}>
                      <Pencil size={12} /> Editing Message
                    </span>
                    <p className={styles.editPreviewText}>{editingMsg.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMsg(null);
                      setNewMessage("");
                    }}
                    className={styles.closeEditBtn}
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

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
                  {["💖", "👍", "🎉", "👏", "😂", "😮", "😢", "🤔"].map((emoji) => (
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

              {/* Bottom Chat Bar: Morphs to Continue Chat Bar when time runs out */}
              {secondsRemaining <= 0 ? (
                <div className={styles.bottomContinueChatBar}>
                  <div className={styles.bottomContinueHeader}>
                    <div className={styles.bottomContinueTitleRow}>
                      <Clock size={16} className={styles.bottomContinueClockIcon} />
                      <span className={styles.bottomContinueTitle}>
                        SESSION EXPIRED • CONTINUE CHATTING
                      </span>
                    </div>
                    <span className={styles.bottomContinueSub}>
                      Select duration to reactivate live chat with {booking.expert.name}
                    </span>
                  </div>

                  <div className={styles.bottomPacksRow}>
                    {EXTENSION_PACKS.map((pack) => {
                      const isSelected = pack.id === selectedPackId;
                      return (
                        <button
                          key={pack.id}
                          type="button"
                          className={`${styles.bottomPackChip} ${isSelected ? styles.bottomPackChipActive : ""
                            }`}
                          onClick={() => setSelectedPackId(pack.id)}
                        >
                          <span className={styles.bottomPackMins}>+{pack.mins} Mins</span>
                          <span className={styles.bottomPackPrice}>{formatCurrency(pack.price)}</span>
                          {pack.discount && (
                            <span className={styles.bottomPackTag}>{pack.discount}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className={styles.bottomContinueActionRow}>
                    <div className={styles.bottomWalletInfo}>
                      <Wallet size={14} />
                      <span>
                        Wallet: <strong>{formatCurrency(walletBalance)}</strong>
                      </span>
                    </div>

                    <ContinueButton
                      label={`Continue Chat • Pay ${formatCurrency(
                        EXTENSION_PACKS.find((p) => p.id === selectedPackId)?.price || 280
                      )}`}
                      showArrow={false}
                      onClick={handleConfirmExtend}
                      className={styles.bottomContinuePayBtn}
                    />
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmitForm} className={styles.chatForm}>
                  <div className={styles.chatInputContainer}>
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

                    <div className={styles.formatBtnGroup}>
                      <button
                        type="button"
                        className={styles.formatBtn}
                        onClick={() => handleApplyFormat("bold")}
                        title="Bold (**text**)"
                      >
                        <Bold size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.formatBtn}
                        onClick={() => handleApplyFormat("italic")}
                        title="Italic (*text*)"
                      >
                        <Italic size={15} />
                      </button>
                      <button
                        type="button"
                        className={styles.formatBtn}
                        onClick={() => handleApplyFormat("underline")}
                        title="Underline (<u>text</u>)"
                      >
                        <Underline size={15} />
                      </button>
                    </div>

                    <input
                      ref={inputRef}
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
              )}
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

      {/* Astrotalk Continue Chat Extension Modal */}
      {isExtendModalOpen && (
        <div className={styles.astrotalkModalOverlay} onClick={() => setIsExtendModalOpen(false)}>
          <div className={styles.astrotalkModalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.bookingHeader}>
              <span className={styles.bookingHeaderTitle}>
                {secondsRemaining <= 0 ? "SESSION EXPIRED • CONTINUE CHAT" : "EXTEND SESSION TIME"}
              </span>
              <div className={styles.soundwaveIcon} aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
              </div>
              <button
                type="button"
                onClick={() => setIsExtendModalOpen(false)}
                className={styles.astrotalkCloseBtn}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className={styles.astrotalkModalBody}>
              <div className={styles.sessionInfoExpertRow} style={{ marginBottom: 18 }}>
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
                    {secondsRemaining <= 0
                      ? "15 min consultation ended. Choose duration to keep chatting:"
                      : "Add more consultation time to keep chatting:"}
                  </p>
                </div>
              </div>

              <div className={styles.astrotalkPacksHeader}>
                <span>Select Extension Duration</span>
                <span className={styles.astrotalkFastTag}>⚡ Instant Chat Activation</span>
              </div>

              <div className={styles.astrotalkPacksGrid}>
                {EXTENSION_PACKS.map((pack) => {
                  const isSelected = pack.id === selectedPackId;
                  return (
                    <div
                      key={pack.id}
                      className={`${styles.astrotalkPackItem} ${isSelected ? styles.astrotalkPackItemActive : ""
                        }`}
                      onClick={() => setSelectedPackId(pack.id)}
                    >
                      <div className={styles.astrotalkPackLeft}>
                        <div
                          className={`${styles.astrotalkRadioSquare} ${isSelected ? styles.astrotalkRadioSquareSelected : ""
                            }`}
                        >
                          {isSelected && <div className={styles.astrotalkRadioInner} />}
                        </div>
                        <div>
                          <div className={styles.astrotalkPackMins}>
                            +{pack.mins} Minutes
                            {pack.discount && (
                              <span className={styles.astrotalkDiscountTag}>
                                {pack.discount}
                              </span>
                            )}
                          </div>
                          <span className={styles.astrotalkRateText}>
                            ₹{Math.round(pack.price / pack.mins)}/min • Instant activation
                          </span>
                        </div>
                      </div>

                      <div className={styles.astrotalkPackRight}>
                        {pack.tag && (
                          <span className={styles.astrotalkBadgeTag}>{pack.tag}</span>
                        )}
                        <span className={styles.astrotalkPackPrice}>
                          {formatCurrency(pack.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={styles.astrotalkWalletRow}>
                <div className={styles.astrotalkWalletLeft}>
                  <Wallet size={15} />
                  <span>
                    Wallet Balance: <strong>{formatCurrency(walletBalance)}</strong>
                  </span>
                </div>
                <div className={styles.astrotalkPayableVal}>
                  Payable:{" "}
                  <strong>
                    {formatCurrency(
                      EXTENSION_PACKS.find((p) => p.id === selectedPackId)?.price || 280
                    )}
                  </strong>
                </div>
              </div>

              <div className={styles.astrotalkModalFooter}>
                <ContinueButton
                  label={`Continue Chat • Pay ${formatCurrency(
                    EXTENSION_PACKS.find((p) => p.id === selectedPackId)?.price || 280
                  )}`}
                  showArrow={false}
                  onClick={handleConfirmExtend}
                  className={styles.astrotalkPayBtn}
                />
                <button
                  type="button"
                  className={styles.astrotalkCancelBtn}
                  onClick={() => setIsExtendModalOpen(false)}
                >
                  End & Exit Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
