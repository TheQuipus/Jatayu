"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  Search,
} from "lucide-react";
import ChamferCardBorder from "@/components/ui/ChamferCardBorder";
import {
  ADMIN_SUPPORT_UPDATED_EVENT,
  getAdminSupportTickets,
  type AdminSupportTicket,
} from "@/lib/adminSupportApi";
import baseStyles from "@/components/admin/applications/ExpertApplications.module.css";
import customStyles from "./AdminSupportList.module.css";

type ColumnFilters = {
  requesterName: string;
  role: string;
  subject: string;
  status: string;
  submittedDate: string;
};

const DEFAULT_COLUMN_FILTERS: ColumnFilters = {
  requesterName: "all",
  role: "all",
  subject: "all",
  status: "all",
  submittedDate: "all",
};

export function formatSubmittedDate(dateIso?: string | null): string {
  if (!dateIso) return "—";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatSubmittedTime(dateIso?: string | null): string {
  if (!dateIso) return "—";
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatSubmittedAgo(dateIso?: string | null): string {
  if (!dateIso) return "—";
  const time = new Date(dateIso).getTime();
  if (Number.isNaN(time)) return "—";
  const diffHours = Math.max(1, Math.floor((Date.now() - time) / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

export function filterSupportTickets(
  tickets: AdminSupportTicket[],
  filters: ColumnFilters,
): AdminSupportTicket[] {
  let result = tickets;

  if (filters.requesterName !== "all") {
    result = result.filter((t) => t.requesterName === filters.requesterName);
  }
  if (filters.role !== "all") {
    result = result.filter((t) => t.requesterType === filters.role);
  }
  if (filters.subject !== "all") {
    result = result.filter((t) => t.subject === filters.subject);
  }
  if (filters.status !== "all") {
    result = result.filter((t) => t.status === filters.status);
  }
  if (filters.submittedDate !== "all") {
    result = result.filter((t) => formatSubmittedDate(t.createdAt) === filters.submittedDate);
  }

  return result;
}

type TableHeaderFilterProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
};

function TableHeaderFilter({
  label,
  value,
  onChange,
  options,
  ariaLabel,
}: TableHeaderFilterProps) {
  return (
    <select
      className={`${baseStyles.thFilterSelect} ${value !== "all" ? baseStyles.thFilterSelectActive : ""}`}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
    >
      <option value="all">{label}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export default function AdminSupportList() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 25;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeCard, setActiveCard] = useState<"all" | "open" | "replied">("all");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(DEFAULT_COLUMN_FILTERS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [counts, setCounts] = useState({ all: 0, open: 0, replied: 0 });
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [reloadKey, setReloadKey] = useState(0);

  // Debounce search input by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  useEffect(() => {
    let active = true;

    getAdminSupportTickets({
      page,
      limit,
      status: activeCard,
      search: debouncedSearch,
    })
      .then((res) => {
        if (!active) return;
        setTickets(res.items || []);
        setCounts(res.counts || { all: 0, open: 0, replied: 0 });
        setTotalPages(res.pagination?.totalPages || 1);
        setTotalCount(res.pagination?.total || 0);
        setError(null);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : "Unable to load support tickets";
        setError(msg);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [page, limit, activeCard, debouncedSearch, reloadKey]);

  // Refresh on ADMIN_SUPPORT_UPDATED_EVENT and window focus
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

  const handleCardClick = (cardId: "all" | "open" | "replied") => {
    setPage(1);
    setColumnFilters(DEFAULT_COLUMN_FILTERS);
    setActiveCard(cardId);
  };

  const handleSetColumnFilter = (key: keyof ColumnFilters, val: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "status") {
        if (val === "open" || val === "replied") {
          setActiveCard(val);
        } else {
          setActiveCard("all");
        }
      }
      return next;
    });
  };

  // Derive column filter dropdown options from loaded page tickets
  const filterOptions = useMemo(() => {
    const names = new Set<string>();
    const subjects = new Set<string>();
    const dates = new Set<string>();

    for (const t of tickets) {
      if (t.requesterName) names.add(t.requesterName);
      if (t.subject) subjects.add(t.subject);
      const d = formatSubmittedDate(t.createdAt);
      if (d !== "—") dates.add(d);
    }

    return {
      names: [...names].sort((a, b) => a.localeCompare(b)),
      subjects: [...subjects].sort((a, b) => a.localeCompare(b)),
      dates: [...dates],
    };
  }, [tickets]);

  const filteredTickets = useMemo(
    () => filterSupportTickets(tickets, columnFilters),
    [tickets, columnFilters],
  );

  return (
    <section className={baseStyles.dashboard}>
      <div className={`container ${baseStyles.dashboardInner}`}>
        <header className={baseStyles.pageHeader}>
          <div className={baseStyles.pageHeaderText}>
            <h1 className={baseStyles.pageTitle}>
              Support <span className={baseStyles.accentWord}>TICKETS</span>
            </h1>
            <p className={baseStyles.pageSubtitle}>
              Review and reply to user support enquiries
            </p>
          </div>
        </header>

        {/* 3 KPI Cards */}
        <div
          className={baseStyles.kpiRow}
          role="group"
          aria-label="Filter by ticket status"
        >
          {/* Total */}
          <button
            type="button"
            className={`${baseStyles.kpiCard} ${activeCard === "all" ? baseStyles.kpiCardActive : ""}`}
            onClick={() => handleCardClick("all")}
            aria-pressed={activeCard === "all"}
          >
            <ChamferCardBorder />
            <div className={baseStyles.kpiHeader}>
              <span className={baseStyles.kpiLabel}>Total</span>
              <span className={baseStyles.kpiIconBox}>
                <Layers size={20} aria-hidden="true" />
              </span>
            </div>
            <p className={baseStyles.kpiValue}>
              {loading && counts.all === 0 ? (
                <span
                  className={baseStyles.skeletonBox}
                  style={{ display: "inline-block", width: 38, height: 30, borderRadius: 4 }}
                />
              ) : (
                String(counts.all).padStart(2, "0")
              )}
            </p>
          </button>

          {/* Open */}
          <button
            type="button"
            className={`${baseStyles.kpiCard} ${activeCard === "open" ? baseStyles.kpiCardActive : ""}`}
            onClick={() => handleCardClick("open")}
            aria-pressed={activeCard === "open"}
          >
            <ChamferCardBorder />
            <div className={baseStyles.kpiHeader}>
              <span className={baseStyles.kpiLabel}>Open</span>
              <span className={baseStyles.kpiIconBox}>
                <Clock size={20} aria-hidden="true" />
              </span>
            </div>
            <p className={baseStyles.kpiValue}>
              {loading && counts.open === 0 ? (
                <span
                  className={baseStyles.skeletonBox}
                  style={{ display: "inline-block", width: 38, height: 30, borderRadius: 4 }}
                />
              ) : (
                String(counts.open).padStart(2, "0")
              )}
            </p>
          </button>

          {/* Replied */}
          <button
            type="button"
            className={`${baseStyles.kpiCard} ${activeCard === "replied" ? baseStyles.kpiCardActive : ""}`}
            onClick={() => handleCardClick("replied")}
            aria-pressed={activeCard === "replied"}
          >
            <ChamferCardBorder />
            <div className={baseStyles.kpiHeader}>
              <span className={baseStyles.kpiLabel}>Replied</span>
              <span className={baseStyles.kpiIconBox}>
                <CheckCircle2 size={20} aria-hidden="true" />
              </span>
            </div>
            <p className={baseStyles.kpiValue}>
              {loading && counts.replied === 0 ? (
                <span
                  className={baseStyles.skeletonBox}
                  style={{ display: "inline-block", width: 38, height: 30, borderRadius: 4 }}
                />
              ) : (
                String(counts.replied).padStart(2, "0")
              )}
            </p>
          </button>
        </div>

        {/* Search Bar */}
        <div className={baseStyles.filtersCard}>
          <div className={baseStyles.searchWrap}>
            <Search className={baseStyles.searchIcon} size={16} />
            <input
              type="search"
              className={baseStyles.searchInput}
              placeholder="Search by ticket ID, requester, email, phone, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search support tickets"
            />
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className={customStyles.errorBanner} role="alert">
            <div className={customStyles.errorBannerContent}>
              <AlertCircle size={18} aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className={customStyles.errorRetryBtn}
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Table Panel */}
        <div className={baseStyles.tablePanel}>
          <div className={baseStyles.tableScroll}>
            <table className={baseStyles.table}>
              <thead>
                <tr>
                  <th className={baseStyles.colNum}>#</th>
                  <th>Ticket ID</th>
                  <th className={baseStyles.colApplicant}>
                    <TableHeaderFilter
                      label="Requester"
                      value={columnFilters.requesterName}
                      onChange={(v) => handleSetColumnFilter("requesterName", v)}
                      options={filterOptions.names.map((n) => ({ value: n, label: n }))}
                      ariaLabel="Filter by requester name"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Role"
                      value={columnFilters.role}
                      onChange={(v) => handleSetColumnFilter("role", v)}
                      options={[
                        { value: "seeker", label: "Seeker" },
                        { value: "expert", label: "Expert" },
                      ]}
                      ariaLabel="Filter by requester role"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Subject"
                      value={columnFilters.subject}
                      onChange={(v) => handleSetColumnFilter("subject", v)}
                      options={filterOptions.subjects.map((s) => ({ value: s, label: s }))}
                      ariaLabel="Filter by subject"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Submitted"
                      value={columnFilters.submittedDate}
                      onChange={(v) => handleSetColumnFilter("submittedDate", v)}
                      options={filterOptions.dates.map((d) => ({ value: d, label: d }))}
                      ariaLabel="Filter by submitted date"
                    />
                  </th>
                  <th className={baseStyles.colStatus}>
                    <TableHeaderFilter
                      label="Status"
                      value={columnFilters.status}
                      onChange={(v) => handleSetColumnFilter("status", v)}
                      options={[
                        { value: "open", label: "Open" },
                        { value: "replied", label: "Replied" },
                      ]}
                      ariaLabel="Filter by status"
                    />
                  </th>
                  <th className={baseStyles.colActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className={baseStyles.skeletonRow}>
                      <td className={baseStyles.rowNum}>
                        <div className={baseStyles.skeletonBox} style={{ width: 16, height: 16 }} />
                      </td>
                      <td>
                        <div className={baseStyles.skeletonBox} style={{ width: 75, height: 22, borderRadius: 6 }} />
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <div className={baseStyles.skeletonBox} style={{ width: 130, height: 14 }} />
                          <div className={baseStyles.skeletonBox} style={{ width: 150, height: 12 }} />
                        </div>
                      </td>
                      <td>
                        <div className={baseStyles.skeletonBox} style={{ width: 60, height: 20, borderRadius: 999 }} />
                      </td>
                      <td>
                        <div className={baseStyles.skeletonBox} style={{ width: 140, height: 14 }} />
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div className={baseStyles.skeletonBox} style={{ width: 76, height: 13 }} />
                          <div className={baseStyles.skeletonBox} style={{ width: 52, height: 10 }} />
                        </div>
                      </td>
                      <td>
                        <div className={baseStyles.skeletonBox} style={{ width: 68, height: 22, borderRadius: 999 }} />
                      </td>
                      <td>
                        <div className={baseStyles.skeletonBox} style={{ width: 60, height: 28, borderRadius: 8 }} />
                      </td>
                    </tr>
                  ))
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className={baseStyles.emptyState}>No tickets match your filters.</div>
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket, index) => {
                    const rowNumber = (page - 1) * limit + index + 1;
                    const ticketHref = `/admin/support/${ticket.id}`;
                    const isOpen = ticket.status === "open";

                    return (
                      <tr
                        key={ticket.id}
                        className={customStyles.clickableRow}
                        onClick={() => router.push(ticketHref)}
                      >
                        <td className={baseStyles.rowNum}>{rowNumber}</td>
                        <td>
                          <span className={customStyles.ticketIdPill}>
                            {ticket.ticketNumber}
                          </span>
                        </td>
                        <td>
                          <div className={customStyles.requesterCell}>
                            <div className={customStyles.requesterName}>{ticket.requesterName}</div>
                            <div className={customStyles.requesterContact}>
                              {ticket.email} · {ticket.phone}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${customStyles.roleBadge} ${
                              ticket.requesterType === "seeker"
                                ? customStyles.roleSeeker
                                : customStyles.roleExpert
                            }`}
                          >
                            {ticket.requesterType}
                          </span>
                        </td>
                        <td>
                          <div className={customStyles.subjectCell} title={ticket.subject}>
                            {ticket.subject}
                          </div>
                        </td>
                        <td>
                          <div className={baseStyles.submittedDate}>
                            {formatSubmittedDate(ticket.createdAt)}
                          </div>
                          <div className={baseStyles.submittedAgo}>
                            {formatSubmittedTime(ticket.createdAt)} ({formatSubmittedAgo(ticket.createdAt)})
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${baseStyles.statusBadge} ${
                              isOpen ? baseStyles.statusPending : baseStyles.statusApproved
                            }`}
                          >
                            {isOpen ? "Open" : "Replied"}
                          </span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <Link href={ticketHref} className={baseStyles.reviewLink}>
                            <Eye size={14} aria-hidden="true" />
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={baseStyles.pagination}>
            <span className={baseStyles.paginationSummary}>
              {loading
                ? "Loading tickets..."
                : totalCount === 0
                  ? "No tickets"
                  : `Showing ${(page - 1) * limit + 1}–${Math.min(page * limit, totalCount)} of ${totalCount}`}
            </span>
            <div className={baseStyles.paginationActions}>
              <button
                type="button"
                className={baseStyles.paginationButton}
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </button>
              <span className={baseStyles.paginationPage}>
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                className={baseStyles.paginationButton}
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
