"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Hourglass,
  Inbox,
  MessageSquare,
  Search,
  SlidersHorizontal,
  Video,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import {
  CLIENT_REQUESTS,
  formatRequestPrice,
  getRequestCounts,
  type ClientRequest,
  type RequestSort,
  type RequestStatusFilter,
} from "@/lib/expertRequests";
import styles from "./ExpertRequests.module.css";

const STATUS_FILTERS: { id: RequestStatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "pending", label: "Pending" },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Declined" },
];

function matchesSearch(request: ClientRequest, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    request.clientName.toLowerCase().includes(normalized) ||
    request.title.toLowerCase().includes(normalized) ||
    request.description.toLowerCase().includes(normalized)
  );
}

export default function ExpertRequests() {
  const [activeFilter, setActiveFilter] = useState<RequestStatusFilter>("all");
  const [sort, setSort] = useState<RequestSort>("newest");
  const [search, setSearch] = useState("");
  const counts = getRequestCounts();

  const filteredRequests = useMemo(() => {
    const list = CLIENT_REQUESTS.filter((request) => {
      const matchesStatus = activeFilter === "all" || request.status === activeFilter;
      return matchesStatus && matchesSearch(request, search);
    });

    return [...list].sort((a, b) =>
      sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt,
    );
  }, [activeFilter, search, sort]);

  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        {/* Header */}
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <p className={styles.pageSubtitle}>
              Manage incoming session and consultation requests
            </p>
            <h1 className={styles.pageTitle}>
              Client <span className={styles.accentWord}>Requests</span>
            </h1>
          </div>

          <div className={styles.pageHeaderActions}>
            <button
              type="button"
              className={styles.notificationBtn}
              aria-label="Notifications"
            >
              <Bell size={18} aria-hidden="true" />
              <span className={styles.notificationBadge}>3</span>
            </button>

            <label className={styles.sortControl}>
              <span className={styles.sortLabel}>Sort</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as RequestSort)}
                className={styles.sortSelect}
                aria-label="Sort requests"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <ChevronDown size={14} className={styles.sortChevron} aria-hidden="true" />
            </label>

            <button type="button" className={styles.exportBtn}>
              <SlidersHorizontal size={14} aria-hidden="true" />
              Export
            </button>
          </div>
        </header>

        {/* Summary Stat Cards */}
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={`${styles.summaryIconBox} ${styles.summaryIconNew}`}>
              <Inbox size={20} aria-hidden="true" />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>New Requests</span>
              <span className={styles.summaryValue}>{counts.new}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.summaryIconBox} ${styles.summaryIconPending}`}>
              <Hourglass size={20} aria-hidden="true" />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Pending</span>
              <span className={styles.summaryValue}>{counts.pending}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.summaryIconBox} ${styles.summaryIconAccepted}`}>
              <CheckCircle2 size={20} aria-hidden="true" />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Accepted</span>
              <span className={styles.summaryValue}>{counts.accepted}</span>
            </div>
          </div>

          <div className={styles.summaryCard}>
            <div className={`${styles.summaryIconBox} ${styles.summaryIconDeclined}`}>
              <XCircle size={20} aria-hidden="true" />
            </div>
            <div className={styles.summaryContent}>
              <span className={styles.summaryLabel}>Declined</span>
              <span className={styles.summaryValue}>{counts.declined}</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filterTabs} role="tablist" aria-label="Filter requests by status">
            {STATUS_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              const count = counts[filter.id];
              const dotClass =
                filter.id === "new"
                  ? styles.dotNew
                  : filter.id === "pending"
                  ? styles.dotPending
                  : filter.id === "accepted"
                  ? styles.dotAccepted
                  : filter.id === "declined"
                  ? styles.dotDeclined
                  : styles.dotAll;

              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ""}`}
                >
                  <span className={`${styles.tabDot} ${dotClass}`} aria-hidden="true" />
                  {filter.label}
                  <span className={styles.filterCount}>{count}</span>
                </button>
              );
            })}
          </div>

          <label className={styles.searchField}>
            <Search size={16} className={styles.searchIcon} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search requests..."
              className={styles.searchInput}
              aria-label="Search requests"
            />
          </label>
        </div>

        {/* Section Header */}
        <div className={styles.sectionHeader}>
          <span className={styles.sectionDot} aria-hidden="true" />
          <h2 className={styles.sectionTitle}>
            {activeFilter === "all" ? "NEW REQUESTS" : `${activeFilter.toUpperCase()} REQUESTS`}
          </h2>
        </div>

        {/* Request Cards */}
        <div className={styles.requestList}>
          {filteredRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox size={32} aria-hidden="true" />
              <p>No requests match your filters.</p>
            </div>
          ) : (
            filteredRequests.map((request) => (
              <article key={request.id} className={styles.requestCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.avatarWrapper}>
                    <Image
                      src={request.clientAvatar}
                      alt={request.clientName}
                      width={48}
                      height={48}
                      className={styles.clientAvatar}
                    />
                    <span className={styles.onlineDot} aria-hidden="true" />
                  </div>

                  <div className={styles.headerMain}>
                    <div className={styles.clientRow}>
                      <span className={styles.clientName}>{request.clientName}</span>
                      <span className={styles.badgeNew}>• New</span>
                      {request.urgent && (
                        <span className={styles.badgeUrgent}>
                          <Zap size={11} aria-hidden="true" /> Urgent
                        </span>
                      )}
                      {request.repeatClient && (
                        <span className={styles.badgeRepeat}>Repeat client</span>
                      )}
                    </div>

                    <h3 className={styles.requestTitle}>{request.title}</h3>
                    <p className={styles.requestDescription}>{request.description}</p>
                  </div>

                  <div className={styles.priceMeta}>
                    <span className={styles.priceTag}>{formatRequestPrice(request.price)}</span>
                    <span className={styles.timeAgo}>{request.timeAgo}</span>
                  </div>
                </div>

                <div className={styles.cardMetaRow}>
                  <span className={styles.metaItem}>
                    <CalendarDays size={14} aria-hidden="true" />
                    {request.dateLabel}
                  </span>
                  <span className={styles.metaItem}>
                    <Clock size={14} aria-hidden="true" />
                    {request.durationLabel}
                  </span>
                  <span className={styles.metaItem}>
                    <Video size={14} aria-hidden="true" />
                    {request.formatLabel}
                  </span>
                </div>

                <div className={styles.cardActions}>
                  <button type="button" className={styles.btnAccept}>
                    <Check size={14} aria-hidden="true" />
                    Accept
                  </button>
                  <button type="button" className={styles.btnDecline}>
                    <X size={14} aria-hidden="true" />
                    Decline
                  </button>
                  <button type="button" className={styles.btnMessage}>
                    <MessageSquare size={14} aria-hidden="true" />
                    Message
                  </button>
                  <Link href={`/expert/requests/${request.id}/`} className={styles.btnDetails}>
                    <ExternalLink size={14} aria-hidden="true" />
                    View Details
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
