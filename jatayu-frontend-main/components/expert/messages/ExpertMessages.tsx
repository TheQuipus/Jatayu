"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Bell,
  Edit,
  Search,
  Pin,
  Video,
  Phone,
  Info,
  MoreVertical,
  Image as ImageIcon,
  Smile,
  Zap,
  Send,
  User,
  Calendar,
  Briefcase,
  X,
  Star,
  DollarSign,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  INITIAL_CONVERSATIONS,
  type Conversation,
  type ChatMessage,
} from "@/lib/expertMessagesStore";
import styles from "./ExpertMessages.module.css";

export default function ExpertMessages() {
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [selectedConvId, setSelectedConvId] = useState<string>("conv-1");
  const [filterChip, setFilterChip] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [messageInput, setMessageInput] = useState<string>("");
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  const chatFeedRef = useRef<HTMLDivElement>(null);

  // Active conversation
  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === selectedConvId) || conversations[0];
  }, [conversations, selectedConvId]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const matchesSearch =
        conv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.clientCompany.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (filterChip === "Unread") return conv.unreadCount > 0;
      if (filterChip === "Pinned") return conv.pinned;

      return true;
    });
  }, [conversations, searchQuery, filterChip]);

  const pinnedConversations = useMemo(
    () => filteredConversations.filter((c) => c.pinned),
    [filteredConversations]
  );
  const recentConversations = useMemo(
    () => filteredConversations.filter((c) => !c.pinned),
    [filteredConversations]
  );

  // Auto-scroll chat feed to bottom on new message or conversation change
  useEffect(() => {
    if (chatFeedRef.current) {
      chatFeedRef.current.scrollTop = chatFeedRef.current.scrollHeight;
    }
  }, [activeConv?.messages]);

  // Handle select conversation
  const handleSelectConv = (convId: string) => {
    setSelectedConvId(convId);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Handle send message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || messageInput).trim();
    if (!text || !activeConv) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "expert",
      senderName: "Sarah Mitchell",
      senderAvatar: "/assets/img/avatar1.png",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConv.id) {
          return {
            ...c,
            lastMessage: text,
            lastMessageTime: "Just now",
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    setMessageInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={styles.messagesContainer}>
      {/* --------------------------------------------------
          1. LEFT PANEL: Conversations Sidebar
      -------------------------------------------------- */}
      <aside className={styles.leftPanel}>
        <div className={styles.leftHeader}>
          <div className={styles.leftTopRow}>
            <div className={styles.titleArea}>
              <h1 className={styles.leftTitle}>Messages</h1>
              <span className={styles.unreadSubtitle}>5 unread conversations</span>
            </div>
            <div className={styles.leftActions}>
              <button
                type="button"
                className={styles.iconBtn}
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell size={16} />
                <span className={styles.notificationDot} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                title="New Message"
                aria-label="New Message"
              >
                <Edit size={16} />
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filter Chips (Removed 'Files' as requested) */}
          <div className={styles.filterChips}>
            {["All", "Unread", "Pinned"].map((chip) => {
              const count =
                chip === "Unread"
                  ? conversations.reduce((acc, c) => acc + c.unreadCount, 0)
                  : null;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setFilterChip(chip)}
                  className={`${styles.filterChip} ${
                    filterChip === chip ? styles.filterChipActive : ""
                  }`}
                >
                  {chip} {count ? ` ${count}` : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations List */}
        <div className={styles.conversationsList}>
          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div className={styles.convGroup}>
              <div className={styles.sectionLabel}>PINNED</div>
              {pinnedConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`${styles.convCard} ${
                    activeConv?.id === conv.id ? styles.convCardActive : ""
                  }`}
                >
                  <div className={styles.avatarWrap}>
                    <img
                      src={conv.avatar}
                      alt={conv.clientName}
                      className={styles.avatarImg}
                    />
                    {conv.online && <span className={styles.onlineBadge} />}
                  </div>
                  <div className={styles.convMeta}>
                    <div className={styles.convTopRow}>
                      <span className={styles.clientName}>{conv.clientName}</span>
                      <div className={styles.convTimeRow}>
                        <span className={styles.timeText}>{conv.lastMessageTime}</span>
                        {conv.unreadCount > 0 && (
                          <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                        )}
                        <Pin size={12} className={styles.pinIcon} />
                      </div>
                    </div>
                    <span className={styles.previewText}>{conv.lastMessage}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Section */}
          {recentConversations.length > 0 && (
            <div className={styles.convGroup}>
              <div className={styles.sectionLabel}>RECENT</div>
              {recentConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConv(conv.id)}
                  className={`${styles.convCard} ${
                    activeConv?.id === conv.id ? styles.convCardActive : ""
                  }`}
                >
                  <div className={styles.avatarWrap}>
                    <img
                      src={conv.avatar}
                      alt={conv.clientName}
                      className={styles.avatarImg}
                    />
                    {conv.online && <span className={styles.onlineBadge} />}
                  </div>
                  <div className={styles.convMeta}>
                    <div className={styles.convTopRow}>
                      <span className={styles.clientName}>{conv.clientName}</span>
                      <div className={styles.convTimeRow}>
                        <span className={styles.timeText}>{conv.lastMessageTime}</span>
                        {conv.unreadCount > 0 && (
                          <span className={styles.unreadBadge}>{conv.unreadCount}</span>
                        )}
                      </div>
                    </div>
                    <span className={styles.previewText}>{conv.lastMessage}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* --------------------------------------------------
          2. CENTER PANEL: Main Chat Feed
      -------------------------------------------------- */}
      <main className={styles.centerPanel}>
        {activeConv && (
          <>
            {/* Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderLeft}>
                <img
                  src={activeConv.avatar}
                  alt={activeConv.clientName}
                  className={styles.chatHeaderAvatar}
                />
                <div className={styles.chatHeaderInfo}>
                  <div className={styles.chatHeaderTitleRow}>
                    <span className={styles.chatHeaderName}>{activeConv.clientName}</span>
                    {activeConv.online && (
                      <span className={styles.statusTextOnline}>Online</span>
                    )}
                  </div>
                  <span className={styles.chatHeaderRole}>
                    {activeConv.clientRole} · {activeConv.clientCompany}
                  </span>
                </div>
              </div>

              <div className={styles.chatHeaderActions}>
                <button type="button" className={styles.iconBtn} title="Video Call">
                  <Video size={16} />
                </button>
                <button type="button" className={styles.iconBtn} title="Phone Call">
                  <Phone size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setShowRightPanel((prev) => !prev)}
                  className={styles.iconBtn}
                  title="Toggle Conversation Info"
                >
                  <Info size={16} />
                </button>
                <button type="button" className={styles.iconBtn} title="More Options">
                  <MoreVertical size={16} />
                </button>
              </div>
            </div>

            {/* Chat Feed */}
            <div className={styles.chatFeed} ref={chatFeedRef}>
              {activeConv.messages.map((msg) => {
                const isExpert = msg.senderId === "expert";
                return (
                  <React.Fragment key={msg.id}>
                    {msg.dateLabel && (
                      <div className={styles.dateDivider}>
                        <span className={styles.dateDividerPill}>{msg.dateLabel}</span>
                      </div>
                    )}

                    <div
                      className={`${styles.messageRow} ${
                        isExpert ? styles.messageRowOutgoing : styles.messageRowIncoming
                      }`}
                    >
                      <img
                        src={msg.senderAvatar}
                        alt={msg.senderName}
                        className={styles.msgAvatar}
                      />
                      <div className={styles.msgContentGroup}>
                        <div
                          className={`${styles.msgBubble} ${
                            isExpert
                              ? styles.msgBubbleOutgoing
                              : styles.msgBubbleIncoming
                          }`}
                        >
                          {msg.text}
                        </div>

                        <div className={styles.msgMetaRow}>
                          <span>{msg.timestamp}</span>
                          {isExpert && msg.status === "read" && (
                            <>
                              <span>· Read</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Input Section */}
            <div className={styles.inputSection}>
              <div className={styles.inputContainer}>
                <div className={styles.inputTools}>
                  <button type="button" className={styles.toolBtn} title="Upload image">
                    <ImageIcon size={18} />
                  </button>
                  <button type="button" className={styles.toolBtn} title="Add emoji">
                    <Smile size={18} />
                  </button>
                  <button type="button" className={styles.toolBtn} title="Quick Action">
                    <Zap size={18} />
                  </button>
                </div>

                <textarea
                  rows={1}
                  placeholder={`Message ${activeConv.clientName.split(" ")[0]}...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={styles.chatTextarea}
                />

                <div className={styles.inputRight}>
                  <span className={styles.charCounter}>
                    {messageInput.length}/1000
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    className={styles.sendBtn}
                    title="Send Message"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      {/* --------------------------------------------------
          3. RIGHT PANEL: Conversation Info
      -------------------------------------------------- */}
      {showRightPanel && activeConv && (
        <aside className={`${styles.rightPanel} ${showRightPanel ? styles.rightPanelOpen : ""}`}>
          <div className={styles.rightHeader}>
            <span className={styles.rightTitle}>Conversation Info</span>
            <button
              type="button"
              onClick={() => setShowRightPanel(false)}
              className={styles.iconBtn}
              title="Close Panel"
            >
              <X size={14} />
            </button>
          </div>

          <div className={styles.rightContent}>
            {/* Client Profile Header Card */}
            <div className={styles.clientHeaderCard}>
              <div className={styles.clientLargeAvatarWrap}>
                <img
                  src={activeConv.avatar}
                  alt={activeConv.clientName}
                  className={styles.clientLargeAvatar}
                />
              </div>
              <h2 className={styles.clientLargeName}>{activeConv.clientName}</h2>
              <span className={styles.clientLargeRole}>
                {activeConv.clientRole} · {activeConv.clientCompany}
              </span>
              <div className={styles.ratingBadge}>
                <Star size={14} className={styles.starIcon} fill="#FFB800" />
                <span>{activeConv.rating}</span>
                <span style={{ color: "#686868", fontWeight: 400 }}>
                  ({activeConv.totalSessions} sessions)
                </span>
              </div>

              <div className={styles.clientActionButtons}>
                <button type="button" className={styles.clientBtnOutline}>
                  <User size={13} /> Profile
                </button>
                <button type="button" className={styles.clientBtnOutline}>
                  <Calendar size={13} /> Schedule
                </button>
                <button type="button" className={styles.clientBtnSolid}>
                  <Sparkles size={13} /> Book
                </button>
              </div>
            </div>

            {/* Active Session Card */}
            {activeConv.activeSession && (
              <div className={styles.infoBlock}>
                <div className={styles.infoBlockTitle}>ACTIVE SESSION</div>
                <div className={styles.sessionBox}>
                  <div className={styles.sessionItem}>
                    <Briefcase size={14} className={styles.sessionIcon} />
                    <div>
                      <div className={styles.sessionLabelText}>Project</div>
                      <div className={styles.sessionValText}>
                        {activeConv.activeSession.projectTitle}
                      </div>
                    </div>
                  </div>

                  <div className={styles.sessionItem}>
                    <Calendar size={14} className={styles.sessionIcon} />
                    <div>
                      <div className={styles.sessionLabelText}>Date</div>
                      <div className={styles.sessionValText}>
                        {activeConv.activeSession.date}
                      </div>
                    </div>
                  </div>

                  <div className={styles.sessionItem}>
                    <DollarSign size={14} className={styles.sessionIcon} />
                    <div>
                      <div className={styles.sessionLabelText}>Payout</div>
                      <div
                        className={`${styles.sessionValText} ${styles.payoutGreen}`}
                      >
                        {activeConv.activeSession.payout}
                      </div>
                    </div>
                  </div>

                  <div className={styles.sessionItem}>
                    <Clock size={14} className={styles.sessionIcon} />
                    <div>
                      <div className={styles.sessionLabelText}>Status</div>
                      <div className={styles.statusConfirmed}>
                        <span className={styles.confirmedDot} />
                        {activeConv.activeSession.status}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Client Details Section */}
            <div className={styles.infoBlock}>
              <div className={styles.infoBlockTitle}>CLIENT DETAILS</div>
              <div className={styles.detailsGrid}>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Company</span>
                  <span className={styles.detailVal}>
                    {activeConv.clientDetails.company}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Industry</span>
                  <span className={styles.detailVal}>
                    {activeConv.clientDetails.industry}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Timezone</span>
                  <span className={styles.detailVal}>
                    {activeConv.clientDetails.timezone}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Sessions</span>
                  <span className={styles.detailVal}>
                    {activeConv.clientDetails.sessionsCompleted} completed
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailKey}>Total spent</span>
                  <span className={styles.detailVal}>
                    {activeConv.clientDetails.totalSpent}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
