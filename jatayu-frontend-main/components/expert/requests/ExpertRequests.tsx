"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  Inbox,
  MessageSquare,
  Search,
  Video,
  X,
  Zap,
} from "lucide-react";
import faqStyles from "@/components/homepage/Faq.module.css";
import problemStyles from "@/components/homepage/Problem.module.css";
import {
  CLIENT_REQUESTS,
  REQUEST_STATUS_LABELS,
  REQUEST_SUMMARY,
  formatRequestPrice,
  getRequestCounts,
  type ClientRequest,
  type RequestSort,
  type RequestStatus,
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

const SUMMARY_CARDS = [
  { id: "new" as const, label: "New Requests", icon: Inbox, tone: styles.summaryNew },
  { id: "pending" as const, label: "Pending", icon: Clock, tone: styles.summaryPending },
  { id: "accepted" as const, label: "Accepted", icon: CalendarDays, tone: styles.summaryAccepted },
  { id: "declined" as const, label: "Declined", icon: X, tone: styles.summaryDeclined },
];

const SECTION_ORDER: RequestStatus[] = ["new", "pending", "accepted", "declined"];

const SECTION_LABELS: Record<RequestStatus, string> = {
  new: "New Requests",
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
};

function matchesSearch(request: ClientRequest, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return (
    request.clientName.toLowerCase().includes(normalized) ||
    request.title.toLowerCase().includes(normalized) ||
    request.description.toLowerCase().includes(normalized)
  );
}

function RequestCard({ request, index }: { request: ClientRequest; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const statusLabel = REQUEST_STATUS_LABELS[request.status];
  const requestNum = String(index + 1).padStart(3, "0");

  return (
    <li
      className={`${faqStyles.accItem} ${styles.requestItem} ${isOpen ? `${faqStyles.isOpen} ${styles.requestItemOpen}` : ""}`}
    >
      <button
        type="button"
        className={faqStyles.accBtn}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <div className={faqStyles.accTop}>
          <span className={faqStyles.accNum}>
            <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
            {requestNum}
          </span>
          <span className={faqStyles.accDots} aria-hidden="true" />
          <div className={styles.accTopEnd}>
            <span className={styles.requestPrice}>{formatRequestPrice(request.price)}</span>
          </div>
        </div>
        <span className={faqStyles.accTitle}>{request.title}</span>
        <span className={styles.requestClientLine}>
          <span className={styles.requestClientInline}>
            <Image
              src={request.clientAvatar}
              alt=""
              width={20}
              height={20}
              className={styles.requestAvatarInline}
              aria-hidden="true"
            />
            {request.clientName}
          </span>
          <span className={styles.requestClientDot} aria-hidden="true">
            ·
          </span>
          <span>{request.timeAgo}</span>
          <span className={`${styles.statusBadge} ${styles[`statusBadge_${request.status}`]}`}>
            {statusLabel}
          </span>
          {request.urgent ? (
            <span className={styles.urgentBadge}>
              <Zap size={11} aria-hidden="true" />
              Urgent
            </span>
          ) : null}
        </span>
      </button>

      <div className={`${faqStyles.accPanel} ${styles.requestPanel}`}>
        <p className={styles.requestDescription}>{request.description}</p>

        <ul className={styles.requestMeta}>
          <li>
            <CalendarDays size={14} aria-hidden="true" />
            {request.dateLabel}
          </li>
          <li>
            <Clock size={14} aria-hidden="true" />
            {request.durationLabel}
          </li>
          <li>
            <Video size={14} aria-hidden="true" />
            {request.formatLabel}
          </li>
        </ul>

        <div className={styles.requestActions}>
          <button type="button" className={`${styles.actionBtn} ${styles.actionAccept}`}>
            Accept
          </button>
          <button type="button" className={`${styles.actionBtn} ${styles.actionDecline}`}>
            <X size={14} aria-hidden="true" />
            Decline
          </button>
          <button type="button" className={`${styles.actionBtn} ${styles.actionMessage}`}>
            <MessageSquare size={14} aria-hidden="true" />
            Message
          </button>
          <button type="button" className={`${styles.actionBtn} ${styles.actionDetails}`}>
            View Details
          </button>
        </div>
      </div>
    </li>
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

  const groupedRequests = useMemo(() => {
    if (activeFilter !== "all") return null;

    return SECTION_ORDER.map((status) => ({
      status,
      label: SECTION_LABELS[status],
      items: filteredRequests.filter((request) => request.status === status),
    })).filter((group) => group.items.length > 0);
  }, [activeFilter, filteredRequests]);

  return (
    <section className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              Client <span className={styles.accentWord}>Requests</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Manage incoming session and consultation requests
            </p>
          </div>

          <div className={styles.pageHeaderActions}>
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
              <Download size={14} aria-hidden="true" />
              Export
            </button>
          </div>
        </header>

        <div className={styles.summaryGrid}>
          {SUMMARY_CARDS.map(({ id, label, icon: Icon, tone }) => (
            <article key={id} className={`${problemStyles.scardMini} ${styles.summaryCard}`}>
              <span className={problemStyles.scardMiniLabel}>
                <span className={`${styles.summaryIcon} ${tone}`}>
                  <Icon size={14} aria-hidden="true" />
                </span>
                {label}
              </span>
              <p className={problemStyles.scardMiniQuote}>{REQUEST_SUMMARY[id]}</p>
              <div className={problemStyles.scardMiniRule} aria-hidden="true" />
            </article>
          ))}
        </div>

        <div className={styles.toolbar}>
          <div className={styles.filterTabs} role="tablist" aria-label="Filter requests by status">
            {STATUS_FILTERS.map((filter) => {
              const isActive = activeFilter === filter.id;
              const count = counts[filter.id];

              return (
                <button
                  key={filter.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ""}`}
                >
                  {filter.label}
                  <span className={styles.filterCount}>({count})</span>
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

        <div className={styles.requestList}>
          {filteredRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <Inbox size={28} aria-hidden="true" />
              <p>No requests match your filters.</p>
            </div>
          ) : groupedRequests ? (
            groupedRequests.map((group) => (
              <section key={group.status} className={styles.requestGroup}>
                <h2 className={styles.groupTitle}>
                  <span
                    className={`${styles.groupDot} ${group.status === "new" ? styles.groupDotNew : ""}`}
                    aria-hidden="true"
                  />
                  {group.label}
                </h2>
                <ul className={`${faqStyles.accLight} ${styles.requestAccordion}`}>
                  {group.items.map((request, index) => (
                    <RequestCard key={request.id} request={request} index={index} />
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <ul className={`${faqStyles.accLight} ${styles.requestAccordion}`}>
              {filteredRequests.map((request, index) => (
                <RequestCard key={request.id} request={request} index={index} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
