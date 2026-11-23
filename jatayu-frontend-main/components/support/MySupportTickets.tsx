"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Archive,
  CheckCircle2,
  ChevronRight,
  Clock,
  Headphones,
  MessageSquare,
  Plus,
  Send,
  User,
  X,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import {
  createMySupportReply,
  getMySupportTicket,
  getMySupportTickets,
  MY_SUPPORT_TICKETS_UPDATED_EVENT,
  openGlobalSupportForm,
  type MySupportApiError,
  type MySupportThreadItem,
  type MySupportTicketDetail,
  type MySupportTicketsCounts,
  type MySupportTicketsPagination,
  type MySupportTicketSummary,
} from "@/lib/supportApi";
import {
  resolveTicketViewerStatus,
  type SupportStatusBadgeTone,
  type SupportViewerStatusKey,
} from "@/lib/supportStatus";
import styles from "./MySupportTickets.module.css";

const MAX_REPLY_CHARS = 5000;

type RequesterFilterKey = "all" | Exclude<SupportViewerStatusKey, "new">;

function formatTicketDate(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTicketDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
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

function getStatusBadgeClass(tone: SupportStatusBadgeTone): string {
  if (tone === "amber") return styles.statusResponseReceived;
  if (tone === "muted") return styles.statusClosed;
  return styles.statusInProgress;
}

export function isRequesterComposerVisible(
  ticket: Pick<MySupportTicketDetail, "status"> | null | undefined,
): boolean {
  if (!ticket) return false;
  return ticket.status !== "closed";
}

export function getRequesterReplyErrorMessage(
  apiError: MySupportApiError | null | undefined,
): { message: string; shouldReload: boolean } {
  if (apiError?.status === 502) {
    return {
      message: "Your reply could not be delivered, please try again",
      shouldReload: false,
    };
  }
  if (apiError?.status === 429 || apiError?.code === "SUPPORT_RATE_LIMITED") {
    return {
      message: "You are sending replies too quickly, please wait a minute",
      shouldReload: false,
    };
  }
  if (apiError?.status === 422) {
    return {
      message: apiError?.message || "Please enter a valid reply message.",
      shouldReload: false,
    };
  }
  if (apiError?.status === 409 || apiError?.code === "SUPPORT_TICKET_CLOSED") {
    return {
      message: "This ticket has been closed by Jatayu Support.",
      shouldReload: true,
    };
  }
  if (
    apiError instanceof TypeError ||
    apiError?.name === "TypeError" ||
    (!apiError?.status && /fetch|network/i.test(apiError?.message || ""))
  ) {
    return {
      message: "Unable to send reply. Please check your connection and try again.",
      shouldReload: false,
    };
  }
  return {
    message:
      apiError?.message ||
      "Unable to send reply. Please check your connection and try again.",
    shouldReload: false,
  };
}

export function getRequesterThreadItems(
  ticket: MySupportTicketDetail,
): MySupportThreadItem[] {
  if (Array.isArray(ticket.thread) && ticket.thread.length > 0) {
    return ticket.thread;
  }

  const initial: MySupportThreadItem = {
    id: `initial-${ticket.id}`,
    authorType: "seeker",
    authorName: "You",
    message: ticket.description,
    createdAt: ticket.createdAt,
    isInitial: true,
  };

  const replies = Array.isArray(ticket.replies) ? ticket.replies : [];
  const replyItems: MySupportThreadItem[] = replies.map((r) => ({
    id: r.id,
    authorType: r.authorType || "admin",
    authorName: r.authorName || r.adminName || "Jatayu Support",
    message: r.message,
    createdAt: r.createdAt,
    isInitial: false,
  }));

  return [initial, ...replyItems];
}

export default function MySupportTickets() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTicketParam = searchParams.get("ticket") || null;

  const [activeFilter, setActiveFilter] = useState<RequesterFilterKey>("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [tickets, setTickets] = useState<MySupportTicketSummary[]>([]);
  const [counts, setCounts] = useState<MySupportTicketsCounts>({
    all: 0,
    in_progress: 0,
    response_received: 0,
    closed: 0,
  });
  const [pagination, setPagination] = useState<MySupportTicketsPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // Selected Ticket Detail state
  const [detailTicket, setDetailTicket] = useState<MySupportTicketDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Requester reply composer state
  const [replyDraft, setReplyDraft] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);

  const threadScrollRef = useRef<HTMLDivElement | null>(null);
  const lastThreadCountRef = useRef(0);

  // 1. Fetch tickets list
  useEffect(() => {
    let active = true;

    getMySupportTickets(
      {
        page,
        limit,
        status: activeFilter,
      },
      pathname,
    )
      .then((res) => {
        if (!active) return;
        setTickets(res.items);
        setCounts(res.counts);
        setPagination(res.pagination);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as MySupportApiError;
        setError(apiError?.message || "Failed to load support tickets");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [pathname, page, limit, activeFilter, reloadKey]);

  // 2. Fetch selected ticket detail when query param ?ticket= changes
  useEffect(() => {
    if (!selectedTicketParam) return;

    let active = true;

    getMySupportTicket(selectedTicketParam, pathname)
      .then((res) => {
        if (!active) return;
        setDetailTicket(res.ticket);
        setDetailError(null);
        setDetailLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const apiError = err as MySupportApiError;
        setDetailError(
          apiError?.status === 404
            ? "Ticket not found or you do not have permission to view it."
            : apiError?.message || "Failed to load ticket details",
        );
        setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTicketParam, pathname, reloadKey]);

  // 3. Listen for window focus and MY_SUPPORT_TICKETS_UPDATED_EVENT
  useEffect(() => {
    const handleUpdate = () => {
      setReloadKey((k) => k + 1);
    };

    const handleFocus = () => {
      setReloadKey((k) => k + 1);
    };

    window.addEventListener(MY_SUPPORT_TICKETS_UPDATED_EVENT, handleUpdate);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener(MY_SUPPORT_TICKETS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const threadCount = detailTicket ? getRequesterThreadItems(detailTicket).length : 0;

  useEffect(() => {
    if (!detailTicket || !threadScrollRef.current) return;
    if (threadCount > 0 && threadCount !== lastThreadCountRef.current) {
      threadScrollRef.current.scrollTop = threadScrollRef.current.scrollHeight;
      lastThreadCountRef.current = threadCount;
    }
  }, [detailTicket, threadCount]);

  const handleSelectTicket = useCallback(
    (ticketNumber: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      lastThreadCountRef.current = 0;
      setReplyDraft("");
      setReplyError(null);
      setReplySuccess(null);

      if (selectedTicketParam === ticketNumber) {
        nextParams.delete("ticket");
        setDetailTicket(null);
        setDetailLoading(false);
        setDetailError(null);
      } else {
        nextParams.set("ticket", ticketNumber);
        setDetailTicket(null);
        setDetailLoading(true);
        setDetailError(null);
      }
      const qs = nextParams.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [pathname, router, searchParams, selectedTicketParam],
  );

  const handleCloseDetail = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("ticket");
    lastThreadCountRef.current = 0;
    setDetailTicket(null);
    setDetailLoading(false);
    setDetailError(null);
    setReplyDraft("");
    setReplyError(null);
    setReplySuccess(null);
    const qs = nextParams.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const handleFilterClick = (filter: RequesterFilterKey) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTicket || isSubmittingReply) return;

    const trimmed = replyDraft.trim();
    if (!trimmed) {
      setReplyError("Please enter a reply message.");
      return;
    }
    if (trimmed.length > MAX_REPLY_CHARS) {
      setReplyError(`Reply message must not exceed ${MAX_REPLY_CHARS} characters.`);
      return;
    }

    try {
      setIsSubmittingReply(true);
      setReplyError(null);
      setReplySuccess(null);

      const res = await createMySupportReply(detailTicket.id, trimmed, pathname);
      setDetailTicket(res.ticket);
      setReplyDraft("");
      setReplySuccess("Your reply has been sent.");
      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      const handled = getRequesterReplyErrorMessage(err as MySupportApiError);
      setReplyError(handled.message);
      if (handled.shouldReload) {
        setReloadKey((k) => k + 1);
      }
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const detailStatusMeta = detailTicket
    ? resolveTicketViewerStatus(detailTicket, "requester")
    : null;
  const detailThread = detailTicket ? getRequesterThreadItems(detailTicket) : [];
  const showComposer = isRequesterComposerVisible(detailTicket);
  const remainingReplyChars = MAX_REPLY_CHARS - replyDraft.length;

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              Support <span className={styles.accentWord}>TICKETS</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Track your support requests and replies
            </p>
          </div>

          <button
            type="button"
            onClick={() => openGlobalSupportForm()}
            className={styles.raiseBtn}
          >
            <Plus size={16} />
            Raise a Ticket
          </button>
        </header>

        {/* Filter Chips Bar */}
        <div className={styles.filterRow} role="group" aria-label="Filter tickets by status">
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === "all" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterClick("all")}
            aria-pressed={activeFilter === "all"}
          >
            <span>All</span>
            <span className={styles.chipCount}>{counts.all}</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === "in_progress" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterClick("in_progress")}
            aria-pressed={activeFilter === "in_progress"}
          >
            <span>In Progress</span>
            <span className={styles.chipCount}>{counts.in_progress}</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === "response_received" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterClick("response_received")}
            aria-pressed={activeFilter === "response_received"}
          >
            <span>Response Received</span>
            <span className={styles.chipCount}>{counts.response_received}</span>
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${activeFilter === "closed" ? styles.filterChipActive : ""}`}
            onClick={() => handleFilterClick("closed")}
            aria-pressed={activeFilter === "closed"}
          >
            <span>Closed</span>
            <span className={styles.chipCount}>{counts.closed}</span>
          </button>
        </div>

        {/* Error Banner */}
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

        {/* Loading Skeletons */}
        {loading && tickets.length === 0 ? (
          <div className={styles.ticketListFull}>
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={styles.skeletonBox}
                style={{ width: "100%", height: 110, marginBottom: 12 }}
              />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          /* Empty State */
          <div className={styles.emptyCard}>
            <Headphones size={48} className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>
              {activeFilter === "all"
                ? "You haven't raised any tickets yet"
                : `No ${
                    activeFilter === "in_progress"
                      ? "in-progress"
                      : activeFilter === "response_received"
                        ? "response-received"
                        : "closed"
                  } tickets found`}
            </h2>
            <p className={styles.emptyText}>
              Have a question, issue, or need help? Raise a support ticket and our team will get
              back to you.
            </p>
            <button
              type="button"
              onClick={() => openGlobalSupportForm()}
              className={styles.raiseBtn}
            >
              <Plus size={16} />
              Raise a Ticket
            </button>
          </div>
        ) : (
          /* Master-Detail Split Layout */
          <div className={selectedTicketParam ? styles.splitLayout : styles.ticketListFull}>
            {/* Tickets Column */}
            <div className={styles.ticketList}>
              {tickets.map((t) => {
                const isSelected = selectedTicketParam === t.ticketNumber || selectedTicketParam === t.id;
                const statusMeta = resolveTicketViewerStatus(t, "requester");

                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.ticketCard} ${isSelected ? styles.ticketCardSelected : ""}`}
                    onClick={() => handleSelectTicket(t.ticketNumber)}
                    aria-pressed={isSelected}
                  >
                    <div className={styles.ticketCardTop}>
                      <span className={styles.ticketNumberPill}>{t.ticketNumber}</span>
                      <span
                        className={`${styles.statusBadge} ${getStatusBadgeClass(statusMeta.badgeTone)}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <h2 className={styles.ticketSubject}>{t.subject}</h2>
                    <p className={styles.ticketPreview}>{t.description}</p>

                    <div className={styles.ticketCardBottom}>
                      <span>Submitted on {formatTicketDate(t.createdAt)}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {t.replyCount > 0 && (
                          <span className={styles.replyCountPill}>
                            <MessageSquare size={12} />
                            {t.replyCount} {t.replyCount === 1 ? "Reply" : "Replies"}
                          </span>
                        )}
                        <ChevronRight size={15} style={{ color: "var(--silver-chalice)" }} />
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                  <span className={styles.paginationSummary}>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} tickets)
                  </span>
                  <div className={styles.paginationActions}>
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className={styles.paginationButton}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className={styles.paginationButton}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Detail Side Panel */}
            {selectedTicketParam && (
              <aside className={styles.detailPanel} aria-label="Ticket detail">
                {detailLoading ? (
                  <div style={{ padding: 24 }}>
                    <div
                      className={styles.skeletonBox}
                      style={{ width: "40%", height: 24, marginBottom: 16 }}
                    />
                    <div
                      className={styles.skeletonBox}
                      style={{ width: "100%", height: 120, marginBottom: 20 }}
                    />
                    <div
                      className={styles.skeletonBox}
                      style={{ width: "100%", height: 160 }}
                    />
                  </div>
                ) : detailError ? (
                  <div style={{ padding: 24 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 16,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--pomegranate)" }}>
                        Error loading ticket
                      </span>
                      <button
                        type="button"
                        onClick={handleCloseDetail}
                        className={styles.closeBtn}
                        aria-label="Close detail"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p style={{ color: "var(--dove-gray)", fontSize: 14 }}>{detailError}</p>
                  </div>
                ) : detailTicket && detailStatusMeta ? (
                  <>
                    <div className={styles.detailHeader}>
                      <div className={styles.detailHeaderLeft}>
                        <div className={styles.detailMetaRow}>
                          <span className={styles.ticketNumberPill}>
                            {detailTicket.ticketNumber}
                          </span>
                          <span
                            className={`${styles.statusBadge} ${getStatusBadgeClass(detailStatusMeta.badgeTone)}`}
                          >
                            {detailStatusMeta.label}
                          </span>
                        </div>
                        <div className={styles.detailTimestamps}>
                          Submitted {formatTicketDateTime(detailTicket.createdAt)}
                          {detailTicket.lastRepliedAt &&
                            ` · Last message ${formatTicketDateTime(detailTicket.lastRepliedAt)}`}
                          {detailTicket.status === "closed" &&
                            detailTicket.closedAt &&
                            ` · Closed ${formatTicketDateTime(detailTicket.closedAt)}`}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCloseDetail}
                        className={styles.closeBtn}
                        aria-label="Close detail panel"
                        title="Close"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className={styles.detailBody}>
                      <div className={styles.detailSection}>
                        <h3 className={styles.detailSectionTitle}>{detailTicket.subject}</h3>
                      </div>

                      {detailTicket.status === "open" && !detailTicket.lastReplyBy && (
                        <div className={styles.openNotice} role="status">
                          <Clock size={16} style={{ flexShrink: 0 }} />
                          <span>
                            We have received your request and will reply to your registered email.
                          </span>
                        </div>
                      )}

                      {/* Full Conversation Thread (oldest first) */}
                      <div className={styles.repliesThread}>
                        <h4 className={styles.repliesHeaderTitle}>
                          <MessageSquare size={15} />
                          Conversation ({detailThread.length})
                        </h4>

                        <div className={styles.threadScroll} ref={threadScrollRef}>
                          {detailThread.map((item) => {
                            const isSupport = item.authorType === "admin";
                            return (
                              <div
                                key={item.id}
                                className={`${styles.replyItem} ${
                                  isSupport ? styles.replyItemSupport : styles.replyItemRequester
                                }`}
                              >
                                <div className={styles.replyTop}>
                                  <span className={styles.replyAuthor}>
                                    <User size={13} />
                                    {isSupport ? "Jatayu Support" : item.authorName || "You"}
                                    <span
                                      className={
                                        isSupport ? styles.staffBadge : styles.requesterBadge
                                      }
                                    >
                                      {isSupport ? "Support" : "You"}
                                    </span>
                                  </span>
                                  <span className={styles.replyTimestamp}>
                                    {formatTicketDateTime(item.createdAt)}
                                  </span>
                                </div>
                                <div className={styles.replyBody}>{item.message}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Requester Reply Composer OR Closed Ticket Notice */}
                      {showComposer ? (
                        <form onSubmit={handleSendReply} className={styles.composerForm}>
                          <div className={styles.composerLabelRow}>
                            <label htmlFor="requesterReplyInput" className={styles.composerLabel}>
                              Add a reply
                            </label>
                            <span
                              className={`${styles.charCount} ${
                                remainingReplyChars < 100 ? styles.charCountWarn : ""
                              }`}
                            >
                              {remainingReplyChars} characters left
                            </span>
                          </div>

                          <textarea
                            id="requesterReplyInput"
                            value={replyDraft}
                            onChange={(e) => {
                              setReplyDraft(e.target.value);
                              if (replyError) setReplyError(null);
                              if (replySuccess) setReplySuccess(null);
                            }}
                            placeholder="Write your reply..."
                            maxLength={MAX_REPLY_CHARS}
                            rows={3}
                            disabled={isSubmittingReply}
                            className={styles.composerTextarea}
                            aria-label="Reply message"
                          />

                          {replyError && (
                            <div className={styles.composerError} role="alert">
                              <AlertCircle size={15} style={{ flexShrink: 0 }} />
                              <span>{replyError}</span>
                            </div>
                          )}

                          {replySuccess && (
                            <div className={styles.composerSuccess} role="status">
                              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                              <span>{replySuccess}</span>
                            </div>
                          )}

                          <div className={styles.composerActions}>
                            <button
                              type="submit"
                              disabled={isSubmittingReply || !replyDraft.trim()}
                              className={styles.sendReplyBtn}
                            >
                              {isSubmittingReply ? (
                                <>
                                  <Spinner size={16} />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send size={15} />
                                  Send Reply
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className={styles.closedNotice} role="status">
                          <div className={styles.closedNoticeRow}>
                            <Archive size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                            <span>
                              This ticket has been closed by Jatayu Support. If you still need help,
                              please raise a new ticket.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => openGlobalSupportForm()}
                            className={styles.raiseBtn}
                          >
                            <Plus size={15} />
                            Raise a Ticket
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </aside>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
