"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Archive,
  ArrowLeft,
  CheckCircle2,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Send,
  User,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import {
  ADMIN_SUPPORT_UPDATED_EVENT,
  closeAdminSupportTicket,
  getAdminSupportTicket,
  reopenAdminSupportTicket,
  replyToAdminSupportTicket,
  type AdminSupportApiError,
  type AdminSupportThreadItem,
  type AdminSupportTicket,
} from "@/lib/adminSupportApi";
import {
  resolveTicketViewerStatus,
  type SupportStatusBadgeTone,
} from "@/lib/supportStatus";
import styles from "./AdminSupportDetail.module.css";

const MAX_REPLY_CHARS = 5000;

function formatFullDateTime(dateIso?: string | null): string {
  if (!dateIso) return "—";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function isReplyFormVisible(
  ticket: Pick<AdminSupportTicket, "status"> | null | undefined,
): boolean {
  if (!ticket) return false;
  return ticket.status !== "closed";
}

export function getReplyErrorMessage(apiError: AdminSupportApiError | null | undefined): {
  message: string;
  shouldReload: boolean;
} {
  if (apiError?.status === 502) {
    return {
      message: "Email could not be sent, please try again",
      shouldReload: false,
    };
  }
  if (
    apiError?.code === "SUPPORT_SENDER_NOT_CONFIGURED" ||
    apiError?.status === 422
  ) {
    return {
      message:
        apiError?.message ||
        "Support sender address not configured. Please configure Sender Email or SMTP Username in Admin Settings.",
      shouldReload: false,
    };
  }
  if (
    apiError?.code === "SUPPORT_TICKET_CLOSED" ||
    apiError?.status === 409
  ) {
    return {
      message: "This ticket is closed. Reopen it to reply.",
      shouldReload: true,
    };
  }
  return {
    message: apiError?.message || "Failed to send reply. Please try again.",
    shouldReload: false,
  };
}

export function getCloseReopenErrorMessage(
  apiError: AdminSupportApiError | null | undefined,
  action: "close" | "reopen",
): { message: string; shouldReload: boolean } {
  if (
    apiError?.code === "SUPPORT_TICKET_ALREADY_CLOSED" ||
    apiError?.code === "SUPPORT_TICKET_NOT_CLOSED" ||
    apiError?.status === 409
  ) {
    return {
      message:
        apiError?.message ||
        (action === "close"
          ? "This ticket is already closed."
          : "This ticket is not closed."),
      shouldReload: true,
    };
  }
  return {
    message:
      apiError?.message ||
      (action === "close"
        ? "Unable to close support ticket. Please try again."
        : "Unable to reopen support ticket. Please try again."),
    shouldReload: false,
  };
}

export function getThreadMessages(ticket: AdminSupportTicket): AdminSupportThreadItem[] {
  if (Array.isArray(ticket.thread) && ticket.thread.length > 0) {
    return ticket.thread;
  }

  const initial: AdminSupportThreadItem = {
    id: `initial-${ticket.id}`,
    authorType: ticket.requesterType,
    authorName: ticket.requesterName,
    message: ticket.description,
    createdAt: ticket.createdAt,
    isInitial: true,
  };

  const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
  const replyItems: AdminSupportThreadItem[] = replies.map((r) => ({
    id: r.id,
    authorType: r.authorType || "admin",
    authorName: r.authorName || r.adminName || "Platform Admin",
    message: r.message,
    createdAt: r.createdAt,
    isInitial: false,
    fromEmail: r.fromEmail,
    toEmail: r.toEmail,
  }));

  return [initial, ...replyItems];
}

function getStatusBadgeClass(tone: SupportStatusBadgeTone): string {
  if (tone === "red") return styles.statusNew;
  if (tone === "amber") return styles.statusResponseReceived;
  if (tone === "muted") return styles.statusClosed;
  return styles.statusInProgress;
}

function formatAuthorRoleLabel(authorType: AdminSupportThreadItem["authorType"]): string {
  if (authorType === "expert") return "Expert";
  if (authorType === "seeker") return "Seeker";
  return "Admin";
}

type AdminSupportDetailProps = {
  ticketId: string;
};

export default function AdminSupportDetail({ ticketId }: AdminSupportDetailProps) {
  const [ticket, setTicket] = useState<AdminSupportTicket | null>(null);
  const [supportFromEmail, setSupportFromEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  // Composer state
  const [replyDraft, setReplyDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Close / Reopen state
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState<"closing" | "reopening" | null>(null);

  const threadListRef = useRef<HTMLDivElement | null>(null);
  const lastThreadCountRef = useRef(0);

  useEffect(() => {
    let active = true;

    getAdminSupportTicket(ticketId)
      .then((data) => {
        if (!active) return;
        setTicket(data.ticket);
        setSupportFromEmail(data.supportFromEmail);
        setNotFound(false);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as AdminSupportApiError;
        if (apiError?.status === 404) {
          setNotFound(true);
          setError(null);
        } else {
          setError(apiError?.message || "Failed to load support ticket");
        }
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ticketId, reloadKey]);

  useEffect(() => {
    const handleUpdate = () => {
      setReloadKey((k) => k + 1);
    };

    const handleFocus = () => {
      setReloadKey((k) => k + 1);
    };

    window.addEventListener(ADMIN_SUPPORT_UPDATED_EVENT, handleUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener(ADMIN_SUPPORT_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const threadCount = ticket ? getThreadMessages(ticket).length : 0;

  useEffect(() => {
    if (!ticket || !threadListRef.current) return;
    if (threadCount > 0 && threadCount !== lastThreadCountRef.current) {
      threadListRef.current.scrollTop = threadListRef.current.scrollHeight;
      lastThreadCountRef.current = threadCount;
    }
  }, [ticket, threadCount]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || isChangingStatus) return;

    const trimmed = replyDraft.trim();
    if (!trimmed) {
      setReplyError("Reply message is required");
      return;
    }

    if (trimmed.length > MAX_REPLY_CHARS) {
      setReplyError(`Reply message must not exceed ${MAX_REPLY_CHARS} characters`);
      return;
    }

    try {
      setIsSubmitting(true);
      setReplyError(null);
      setSuccessMessage(null);

      const res = await replyToAdminSupportTicket(ticket.id, trimmed);
      setSuccessMessage(res.message || "Reply sent successfully.");
      setTicket(res.ticket);
      if (res.supportFromEmail !== undefined) {
        setSupportFromEmail(res.supportFromEmail);
      }
      setReplyDraft("");
    } catch (err: unknown) {
      const handled = getReplyErrorMessage(err as AdminSupportApiError);
      setReplyError(handled.message);
      if (handled.shouldReload) {
        setReloadKey((k) => k + 1);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmClose = async () => {
    if (!ticket || isChangingStatus) return;
    try {
      setIsChangingStatus("closing");
      setError(null);
      setReplyError(null);
      setSuccessMessage(null);
      const res = await closeAdminSupportTicket(ticket.id);
      setTicket(res.ticket);
      setConfirmCloseOpen(false);
      setSuccessMessage(res.message || "Support ticket marked as closed.");
    } catch (err: unknown) {
      const handled = getCloseReopenErrorMessage(err as AdminSupportApiError, "close");
      setError(handled.message);
      setConfirmCloseOpen(false);
      if (handled.shouldReload) {
        setReloadKey((k) => k + 1);
      }
    } finally {
      setIsChangingStatus(null);
    }
  };

  const handleReopen = async () => {
    if (!ticket || isChangingStatus) return;
    try {
      setIsChangingStatus("reopening");
      setError(null);
      setReplyError(null);
      setSuccessMessage(null);
      const res = await reopenAdminSupportTicket(ticket.id);
      setTicket(res.ticket);
      setSuccessMessage(res.message || "Support ticket reopened.");
    } catch (err: unknown) {
      const handled = getCloseReopenErrorMessage(err as AdminSupportApiError, "reopen");
      setError(handled.message);
      if (handled.shouldReload) {
        setReloadKey((k) => k + 1);
      }
    } finally {
      setIsChangingStatus(null);
    }
  };

  // 1. Loading Skeleton View
  if (loading && !ticket && !notFound) {
    return (
      <section className={styles.dashboard}>
        <div className={`container ${styles.dashboardInner}`}>
          <div className={styles.stickyTopSection}>
            <div
              className={styles.skeletonBox}
              style={{ width: 220, height: 16, marginBottom: 12 }}
            />
            <div className={styles.pageHeader}>
              <div className={styles.pageHeaderText}>
                <div
                  className={styles.skeletonBox}
                  style={{ width: 280, height: 32, marginBottom: 8 }}
                />
                <div className={styles.skeletonBox} style={{ width: 180, height: 16 }} />
              </div>
              <div className={styles.headerActions}>
                <div className={styles.skeletonBox} style={{ width: 130, height: 34 }} />
                <div className={styles.skeletonBox} style={{ width: 80, height: 34, borderRadius: 99 }} />
              </div>
            </div>
          </div>

          <div className={styles.contentGrid}>
            <div className={styles.mainCol}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.skeletonBox} style={{ width: 140, height: 18 }} />
                </div>
                <div className={styles.cardBody}>
                  <div
                    className={styles.skeletonBox}
                    style={{ width: "100%", height: 160, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            <div className={styles.sideCol}>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.skeletonBox} style={{ width: 150, height: 18 }} />
                </div>
                <div className={styles.cardBody}>
                  <div
                    className={styles.skeletonBox}
                    style={{ width: "100%", height: 200, borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. 404 Not Found View
  if (notFound) {
    return (
      <section className={styles.dashboard}>
        <div className={`container ${styles.dashboardInner}`}>
          <div className={styles.stickyTopSection}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
                Admin Console
              </Link>
              <span className={styles.breadcrumbSep}>/</span>
              <Link href="/admin/support" className={styles.breadcrumbLink}>
                Support
              </Link>
              <span className={styles.breadcrumbSep}>/</span>
              <span className={styles.breadcrumbCurrent}>{ticketId}</span>
            </nav>
          </div>

          <div className={styles.notFoundCard}>
            <AlertCircle size={44} className={styles.notFoundIcon} />
            <h1 className={styles.notFoundTitle}>Ticket Not Found</h1>
            <p className={styles.notFoundText}>
              Support ticket &ldquo;{ticketId}&rdquo; does not exist or has been removed.
            </p>
            <Link href="/admin/support" className={styles.backBtn}>
              <ArrowLeft size={16} /> Back to Support
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // 3. Network / Server Error View (when ticket failed to load initially)
  if (error && !ticket) {
    return (
      <section className={styles.dashboard}>
        <div className={`container ${styles.dashboardInner}`}>
          <div className={styles.stickyTopSection}>
            <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
              <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
                Admin Console
              </Link>
              <span className={styles.breadcrumbSep}>/</span>
              <Link href="/admin/support" className={styles.breadcrumbLink}>
                Support
              </Link>
              <span className={styles.breadcrumbSep}>/</span>
              <span className={styles.breadcrumbCurrent}>{ticketId}</span>
            </nav>
          </div>

          <div className={styles.errorBanner}>
            <div className={styles.errorBannerContent}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className={styles.errorRetryBtn}
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
            >
              Retry
            </button>
          </div>

          <Link href="/admin/support" className={styles.backBtn} style={{ alignSelf: "flex-start" }}>
            <ArrowLeft size={16} /> Back to Support
          </Link>
        </div>
      </section>
    );
  }

  if (!ticket) return null;

  const threadMessages = getThreadMessages(ticket);
  const statusMeta = resolveTicketViewerStatus(ticket, "admin");
  const isClosed = ticket.status === "closed";
  const showReplyForm = isReplyFormVisible(ticket);
  const remainingChars = MAX_REPLY_CHARS - replyDraft.length;
  const isBusy = isSubmitting || isChangingStatus !== null;

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        {/* Sticky Header Section */}
        <div className={styles.stickyTopSection}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
              Admin Console
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href="/admin/support" className={styles.breadcrumbLink}>
              Support
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>{ticket.ticketNumber}</span>
          </nav>

          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderText}>
              <h1 className={styles.pageTitle}>
                Support Ticket
                <span className={styles.ticketNumberAccent}>{ticket.ticketNumber}</span>
              </h1>
              <p className={styles.pageSubtitle}>
                Submitted {formatFullDateTime(ticket.createdAt)}
                {ticket.lastRepliedAt
                  ? ` · Last message ${formatFullDateTime(ticket.lastRepliedAt)}`
                  : ""}
                {isClosed && ticket.closedAt
                  ? ` · Closed ${formatFullDateTime(ticket.closedAt)}`
                  : ""}
              </p>
            </div>

            <div className={styles.headerActions}>
              <Link href="/admin/support" className={styles.backBtn}>
                <ArrowLeft size={16} /> Back to Support
              </Link>
              <span className={`${styles.statusBadge} ${getStatusBadgeClass(statusMeta.badgeTone)}`}>
                {statusMeta.label}
              </span>
              {!isClosed ? (
                <button
                  type="button"
                  className={styles.closeTicketBtn}
                  onClick={() => setConfirmCloseOpen((prev) => !prev)}
                  disabled={isBusy}
                >
                  {isChangingStatus === "closing" ? (
                    <>
                      <Spinner size={14} />
                      Closing...
                    </>
                  ) : (
                    <>
                      <Archive size={14} aria-hidden="true" />
                      Mark as Closed
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.reopenTicketBtn}
                  onClick={handleReopen}
                  disabled={isBusy}
                >
                  {isChangingStatus === "reopening" ? (
                    <>
                      <Spinner size={14} />
                      Reopening...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={14} aria-hidden="true" />
                      Reopen
                    </>
                  )}
                </button>
              )}
            </div>
          </header>

          {confirmCloseOpen && !isClosed && (
            <div className={styles.confirmBar} role="region" aria-label="Confirm closing ticket">
              <span className={styles.confirmText}>
                Mark ticket {ticket.ticketNumber} as closed? Neither side can reply until reopened.
              </span>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.confirmCancelBtn}
                  onClick={() => setConfirmCloseOpen(false)}
                  disabled={isChangingStatus === "closing"}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.confirmProceedBtn}
                  onClick={handleConfirmClose}
                  disabled={isChangingStatus === "closing"}
                >
                  {isChangingStatus === "closing" ? (
                    <>
                      <Spinner size={14} />
                      Closing...
                    </>
                  ) : (
                    "Confirm Close"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className={styles.successBanner} role="status">
            <CheckCircle2 size={18} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className={styles.errorBanner} role="alert">
            <div className={styles.errorBannerContent}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className={styles.errorRetryBtn}
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 2-Column Content Grid */}
        <div className={styles.contentGrid}>
          {/* Main Column */}
          <div className={styles.mainCol}>
            {/* Conversation Thread Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}>
                  <MessageSquare size={16} />
                  Conversation
                  <span className={styles.replyCountBadge}>{threadMessages.length}</span>
                </h2>
                <span className={styles.subjectPill}>{ticket.subject}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.repliesList} ref={threadListRef}>
                  {threadMessages.map((msg) => {
                    const isAdmin = msg.authorType === "admin";
                    return (
                      <div
                        key={msg.id}
                        className={`${styles.replyItem} ${
                          isAdmin ? styles.replyItemAdmin : styles.replyItemRequester
                        }`}
                      >
                        <div className={styles.replyHeader}>
                          <span className={styles.replyAuthor}>
                            <User size={15} />
                            {msg.authorName}
                            <span
                              className={`${styles.replyAuthorBadge} ${
                                !isAdmin ? styles.replyAuthorBadgeRequester : ""
                              }`}
                            >
                              {formatAuthorRoleLabel(msg.authorType)}
                            </span>
                          </span>
                          <span className={styles.replyTimestamp}>
                            {formatFullDateTime(msg.createdAt)}
                          </span>
                        </div>
                        {isAdmin && msg.fromEmail && msg.toEmail && (
                          <div className={styles.replyRouting}>
                            From: {msg.fromEmail} &rarr; To: {msg.toEmail}
                          </div>
                        )}
                        <div className={styles.replyMessage}>{msg.message}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reply Composer Card (Visible whenever ticket is NOT closed) */}
            {showReplyForm ? (
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardHeaderTitle}>
                    <Send size={16} />
                    Reply to Requester
                  </h2>
                </div>
                <div className={styles.cardBody}>
                  {!supportFromEmail && (
                    <div className={styles.warningBanner} style={{ marginBottom: 16 }}>
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <strong>Support sender address not configured.</strong>
                        <p style={{ margin: "4px 0 0" }}>
                          Configure FROM_EMAIL or SMTP_USER in Settings to reply to this
                          ticket.
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className={styles.composerForm}>
                    <div className={styles.composerFieldsGrid}>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>From (Support Address)</label>
                        <input
                          type="text"
                          readOnly
                          value={supportFromEmail || "Not configured"}
                          className={styles.readOnlyField}
                          aria-label="From address"
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label className={styles.fieldLabel}>To (Requester)</label>
                        <input
                          type="text"
                          readOnly
                          value={ticket.email}
                          className={styles.readOnlyField}
                          aria-label="To address"
                        />
                      </div>
                    </div>

                    <div className={styles.textareaWrap}>
                      <label htmlFor="replyMessage" className={styles.fieldLabel}>
                        Message
                      </label>
                      <textarea
                        id="replyMessage"
                        value={replyDraft}
                        onChange={(e) => {
                          setReplyDraft(e.target.value);
                          if (replyError) setReplyError(null);
                        }}
                        placeholder="Write your reply to the requester..."
                        maxLength={MAX_REPLY_CHARS}
                        rows={6}
                        disabled={isBusy}
                        className={styles.textarea}
                        aria-label="Reply message"
                        required
                      />
                    </div>

                    {replyError && (
                      <div className={styles.composerError} role="alert">
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{replyError}</span>
                      </div>
                    )}

                    <div className={styles.composerFooter}>
                      <span
                        className={`${styles.charCount} ${
                          remainingChars < 100 ? styles.charCountWarn : ""
                        }`}
                      >
                        {remainingChars} characters left
                      </span>

                      <button
                        type="submit"
                        disabled={
                          isBusy ||
                          !supportFromEmail ||
                          !replyDraft.trim()
                        }
                        className={styles.sendBtn}
                      >
                        {isSubmitting ? (
                          <>
                            <Spinner size={16} />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send size={16} />
                            Send Reply
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className={styles.closedNotice} role="status">
                <div className={styles.closedNoticeContent}>
                  <Archive size={18} style={{ flexShrink: 0 }} />
                  <span>This ticket is closed. Reopen it to reply.</span>
                </div>
                {ticket.closedAt && (
                  <span style={{ fontSize: 13 }}>
                    Closed on {formatFullDateTime(ticket.closedAt)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Column */}
          <div className={styles.sideCol}>
            {/* Requester Information Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}>
                  <User size={16} />
                  Requester Information
                </h2>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.infoList}>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Name</span>
                    <span className={styles.infoValue}>{ticket.requesterName}</span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Account Type</span>
                    <span className={styles.roleBadge}>
                      <span
                        className={`${styles.roleMarker} ${
                          ticket.requesterType === "seeker"
                            ? styles.roleMarkerSeeker
                            : styles.roleMarkerExpert
                        }`}
                        aria-hidden="true"
                      />
                      {ticket.requesterType === "expert" ? "Expert" : "Seeker"}
                    </span>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Email</span>
                    <a href={`mailto:${ticket.email}`} className={styles.contactLink}>
                      <Mail size={13} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} />
                      {ticket.email}
                    </a>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Phone</span>
                    <a href={`tel:${ticket.phone}`} className={styles.contactLink}>
                      <Phone size={13} style={{ display: "inline", marginRight: 4, verticalAlign: "-1px" }} />
                      {ticket.phone}
                    </a>
                  </div>

                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>Submitted At</span>
                    <span className={styles.infoValue}>
                      {formatFullDateTime(ticket.createdAt)}
                    </span>
                  </div>

                  {ticket.lastRepliedAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Last Message At</span>
                      <span className={styles.infoValue}>
                        {formatFullDateTime(ticket.lastRepliedAt)}
                      </span>
                    </div>
                  )}

                  {isClosed && ticket.closedAt && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Closed At</span>
                      <span className={styles.infoValue}>
                        {formatFullDateTime(ticket.closedAt)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
