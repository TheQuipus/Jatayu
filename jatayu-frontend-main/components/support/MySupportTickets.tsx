"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Headphones,
  Mail,
  MessageSquare,
  Plus,
  User,
  X,
} from "lucide-react";
import {
  getMySupportTicket,
  getMySupportTickets,
  MY_SUPPORT_TICKETS_UPDATED_EVENT,
  openGlobalSupportForm,
  type MySupportApiError,
  type MySupportTicketDetail,
  type MySupportTicketsCounts,
  type MySupportTicketsPagination,
  type MySupportTicketSummary,
} from "@/lib/supportApi";
import styles from "./MySupportTickets.module.css";

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

export default function MySupportTickets() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedTicketParam = searchParams.get("ticket") || null;

  const [activeFilter, setActiveFilter] = useState<"all" | "open" | "replied">("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [tickets, setTickets] = useState<MySupportTicketSummary[]>([]);
  const [counts, setCounts] = useState<MySupportTicketsCounts>({ all: 0, open: 0, replied: 0 });
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

  const handleSelectTicket = useCallback(
    (ticketNumber: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
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
    setDetailTicket(null);
    setDetailLoading(false);
    setDetailError(null);
    const qs = nextParams.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [pathname, router, searchParams]);

  const handleFilterClick = (filter: "all" | "open" | "replied") => {
    setActiveFilter(filter);
    setPage(1);
  };

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
          className={`${styles.filterChip} ${activeFilter === "open" ? styles.filterChipActive : ""}`}
          onClick={() => handleFilterClick("open")}
          aria-pressed={activeFilter === "open"}
        >
          <span>Open</span>
          <span className={styles.chipCount}>{counts.open}</span>
        </button>
        <button
          type="button"
          className={`${styles.filterChip} ${activeFilter === "replied" ? styles.filterChipActive : ""}`}
          onClick={() => handleFilterClick("replied")}
          aria-pressed={activeFilter === "replied"}
        >
          <span>Replied</span>
          <span className={styles.chipCount}>{counts.replied}</span>
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
              : `No ${activeFilter} tickets found`}
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
              const isOpen = t.status === "open";

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
                      className={`${styles.statusBadge} ${
                        isOpen ? styles.statusOpen : styles.statusReplied
                      }`}
                    >
                      {isOpen ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                      {isOpen ? "Open" : "Replied"}
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
              ) : detailTicket ? (
                <>
                  <div className={styles.detailHeader}>
                    <div className={styles.detailHeaderLeft}>
                      <div className={styles.detailMetaRow}>
                        <span className={styles.ticketNumberPill}>
                          {detailTicket.ticketNumber}
                        </span>
                        <span
                          className={`${styles.statusBadge} ${
                            detailTicket.status === "open"
                              ? styles.statusOpen
                              : styles.statusReplied
                          }`}
                        >
                          {detailTicket.status === "open" ? (
                            <Clock size={12} />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                          {detailTicket.status === "open" ? "Open" : "Replied"}
                        </span>
                      </div>
                      <div className={styles.detailTimestamps}>
                        Submitted {formatTicketDateTime(detailTicket.createdAt)}
                        {detailTicket.lastRepliedAt &&
                          ` · Last replied ${formatTicketDateTime(detailTicket.lastRepliedAt)}`}
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
                    {/* Enquiry Details */}
                    <div className={styles.detailSection}>
                      <h3 className={styles.detailSectionTitle}>{detailTicket.subject}</h3>
                      <p className={styles.detailDescription}>{detailTicket.description}</p>
                    </div>

                    {/* Open Notice */}
                    {detailTicket.status === "open" && (
                      <div className={styles.openNotice} role="status">
                        <Clock size={16} style={{ flexShrink: 0 }} />
                        <span>
                          We have received your request and will reply to your registered email.
                        </span>
                      </div>
                    )}

                    {/* Replies Thread */}
                    {detailTicket.replies && detailTicket.replies.length > 0 && (
                      <div className={styles.repliesThread}>
                        <h4 className={styles.repliesHeaderTitle}>
                          <Mail size={15} />
                          Replies ({detailTicket.replies.length})
                        </h4>

                        {detailTicket.replies.map((reply) => (
                          <div key={reply.id} className={styles.replyItem}>
                            <div className={styles.replyTop}>
                              <span className={styles.replyAuthor}>
                                <User size={13} />
                                {reply.adminName}
                                <span className={styles.staffBadge}>Staff</span>
                              </span>
                              <span className={styles.replyTimestamp}>
                                {formatTicketDateTime(reply.createdAt)}
                              </span>
                            </div>
                            <div className={styles.replyBody}>{reply.message}</div>
                          </div>
                        ))}
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
