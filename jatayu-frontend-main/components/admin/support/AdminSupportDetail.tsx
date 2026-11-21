"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
  Send,
  User,
} from "lucide-react";
import {
  ADMIN_SUPPORT_UPDATED_EVENT,
  getAdminSupportTicket,
  replyToAdminSupportTicket,
  type AdminSupportApiError,
  type AdminSupportTicket,
} from "@/lib/adminSupportApi";
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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

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
      const apiError = err as AdminSupportApiError;
      if (apiError?.status === 502) {
        setReplyError("Email could not be sent, the ticket is still Open, please try again.");
      } else if (
        apiError?.code === "SUPPORT_SENDER_NOT_CONFIGURED" ||
        apiError?.status === 422
      ) {
        setReplyError(
          apiError?.message ||
            "Support sender address is not configured. Please contact an administrator.",
        );
      } else if (
        apiError?.code === "SUPPORT_TICKET_ALREADY_REPLIED" ||
        apiError?.status === 409
      ) {
        setReplyError("This ticket was already replied to by another admin.");
        setReloadKey((k) => k + 1);
      } else {
        setReplyError(apiError?.message || "Failed to send reply. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
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
                  <div className={styles.skeletonBox} style={{ width: 100, height: 18 }} />
                  <div className={styles.skeletonBox} style={{ width: 120, height: 22 }} />
                </div>
                <div className={styles.cardBody}>
                  <div
                    className={styles.skeletonBox}
                    style={{ width: "100%", height: 80, borderRadius: 8 }}
                  />
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.skeletonBox} style={{ width: 140, height: 18 }} />
                </div>
                <div className={styles.cardBody}>
                  <div
                    className={styles.skeletonBox}
                    style={{ width: "100%", height: 140, borderRadius: 8 }}
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

  const replies = ticket.replies || [];
  const isOpen = ticket.status === "open";
  const remainingChars = MAX_REPLY_CHARS - replyDraft.length;

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
                {ticket.status === "replied" && ticket.lastRepliedAt
                  ? ` · Last replied ${formatFullDateTime(ticket.lastRepliedAt)}`
                  : ""}
              </p>
            </div>

            <div className={styles.headerActions}>
              <Link href="/admin/support" className={styles.backBtn}>
                <ArrowLeft size={16} /> Back to Support
              </Link>
              <span
                className={`${styles.statusBadge} ${isOpen ? styles.statusOpen : styles.statusReplied}`}
              >
                {isOpen ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                {isOpen ? "Open" : "Replied"}
              </span>
            </div>
          </header>
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
            {/* Ticket Enquiry Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}>
                  <MessageSquare size={16} />
                  Enquiry
                </h2>
                <span className={styles.subjectPill}>{ticket.subject}</span>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.descriptionBox}>
                  <p className={styles.descriptionText}>{ticket.description}</p>
                </div>
              </div>
            </div>

            {/* Reply Thread Card */}
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardHeaderTitle}>
                  <Mail size={16} />
                  Reply History
                </h2>
                <span className={styles.replyCountBadge}>{replies.length}</span>
              </div>
              <div className={styles.cardBody}>
                {replies.length === 0 ? (
                  <p className={styles.noRepliesNotice}>
                    No replies yet. Use the composer below to reply to the requester.
                  </p>
                ) : (
                  <div className={styles.repliesList}>
                    {replies.map((reply) => (
                      <div key={reply.id} className={styles.replyItem}>
                        <div className={styles.replyHeader}>
                          <span className={styles.replyAuthor}>
                            <User size={15} />
                            {reply.adminName}
                            <span className={styles.replyAuthorBadge}>Staff</span>
                          </span>
                          <span className={styles.replyTimestamp}>
                            {formatFullDateTime(reply.createdAt)}
                          </span>
                        </div>
                        <div className={styles.replyRouting}>
                          From: {reply.fromEmail} &rarr; To: {reply.toEmail}
                        </div>
                        <div className={styles.replyMessage}>{reply.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Reply Composer Card (Open Tickets Only) */}
            {isOpen ? (
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
                        rows={7}
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
                          isSubmitting ||
                          !supportFromEmail ||
                          !replyDraft.trim()
                        }
                        className={styles.sendBtn}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className={styles.spinner} />
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
              /* Already Replied Note */
              <div className={styles.repliedNotice}>
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>
                  This ticket has been replied to. Further replies are locked to prevent
                  duplicate communications.
                </span>
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
                    <span
                      className={`${styles.roleBadge} ${
                        ticket.requesterType === "seeker"
                          ? styles.roleSeeker
                          : styles.roleExpert
                      }`}
                    >
                      {ticket.requesterType}
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
                      <span className={styles.infoLabel}>Last Replied At</span>
                      <span className={styles.infoValue}>
                        {formatFullDateTime(ticket.lastRepliedAt)}
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
