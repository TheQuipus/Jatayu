"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Hand,
  Layers,
  Search,
  X,
  AlertTriangle,
} from "lucide-react";
import problemStyles from "@/components/homepage/Problem.module.css";
import { getSlaAlert } from "@/lib/adminApplicationMappers";
import {
  getAdminReviewHref,
  getFirstReviewAppId,
} from "@/lib/adminNavigation";
import type { ApplicationStatus } from "@/lib/expertApplicationSubmission";
import { useExpertApplications, type ExpertApplicationListItem } from "@/hooks/useExpertApplications";
import styles from "./ExpertApplications.module.css";

type ColumnFilters = {
  name: string;
  category: string;
  language: string;
  submitted: string;
  completeness: string;
  sla: string;
  status: string;
  reviewer: string;
};

const DEFAULT_COLUMN_FILTERS: ColumnFilters = {
  name: "all",
  category: "all",
  language: "all",
  submitted: "all",
  completeness: "all",
  sla: "all",
  status: "all",
  reviewer: "all",
};

const COMPLETENESS_FILTER_OPTIONS = [
  { value: "high", label: "90%+" },
  { value: "medium", label: "75–89%" },
  { value: "low", label: "Below 75%" },
] as const;

const SLA_FILTER_OPTIONS = [
  { value: "breached", label: "≥ 48 hrs" },
  { value: "at_risk", label: "40–48 hrs" },
  { value: "on_track", label: "< 40 hrs" },
] as const;

const KPI_ICONS = {
  all: Layers,
  pending: Clock,
  review: Search,
  hold: Hand,
  approved: CheckCircle2,
  rejected: Ban,
} as const;

const STATUS_BADGE_CLASS: Record<ApplicationStatus, string> = {
  pending: styles.statusPending,
  in_review: styles.statusInReview,
  on_hold: styles.statusOnHold,
  approved: styles.statusApproved,
  rejected: styles.statusRejected,
};

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  pending: "Pending",
  in_review: "In Review",
  on_hold: "On Hold",
  approved: "Approved",
  rejected: "Rejected",
};

const ONBOARDING_STEP_LABEL: Record<string, string> = {
  otp: "Verifying",
  category: "Category",
  credentials: "Credentials",
  experience: "Experience",
  preferences: "Preferences",
  review: "Review",
  success: "Submitted",
};

const STATUS_FILTER_OPTIONS = (
  Object.entries(STATUS_LABEL) as [ApplicationStatus, string][]
).map(([value, label]) => ({ value, label }));

function completenessColor(pct: number): string {
  if (pct >= 90) return "var(--green)";
  if (pct >= 75) return "var(--tango)";
  return "var(--pomegranate)";
}

function slaClass(status: ExpertApplicationListItem["slaStatus"]): string {
  if (status === "breached") return styles.slaBreached;
  if (status === "at_risk") return styles.slaAtRisk;
  return styles.slaOnTrack;
}

function matchesCompletenessFilter(pct: number, filter: string): boolean {
  if (filter === "high") return pct >= 90;
  if (filter === "medium") return pct >= 75 && pct < 90;
  if (filter === "low") return pct < 75;
  return true;
}

function filterApplications(
  apps: ExpertApplicationListItem[],
  query: string,
  filters: ColumnFilters,
): ExpertApplicationListItem[] {
  let result = apps;

  if (filters.name !== "all") {
    result = result.filter((app) => app.name === filters.name);
  }
  if (filters.category !== "all") {
    result = result.filter((app) => app.category === filters.category);
  }
  if (filters.language !== "all") {
    result = result.filter((app) => app.languages.includes(filters.language));
  }
  if (filters.submitted !== "all") {
    result = result.filter((app) => app.submittedDate === filters.submitted);
  }
  if (filters.completeness !== "all") {
    result = result.filter((app) =>
      matchesCompletenessFilter(app.completeness, filters.completeness),
    );
  }
  if (filters.sla !== "all") {
    result = result.filter((app) => app.slaStatus === filters.sla);
  }
  if (filters.status !== "all") {
    result = result.filter((app) => app.status === filters.status);
  }
  if (filters.reviewer !== "all") {
    result = result.filter(
      (app) => (app.reviewer?.name || "Admin") === filters.reviewer,
    );
  }

  const q = query.trim().toLowerCase();
  if (!q) return result;

  return result.filter(
    (app) =>
      app.name.toLowerCase().includes(q) ||
      app.city.toLowerCase().includes(q) ||
      app.appId.toLowerCase().includes(q) ||
      app.category.toLowerCase().includes(q) ||
      app.languages.some((l) => l.toLowerCase().includes(q)),
  );
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
      className={`${styles.thFilterSelect} ${value !== "all" ? styles.thFilterSelectActive : ""}`}
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

export default function ExpertApplications() {
  const { ready, applications, listItems, kpis } =
    useExpertApplications();
  const slaAlert = useMemo(() => getSlaAlert(applications), [applications]);
  const slaReviewHref = useMemo(() => {
    if (slaAlert.oldestAppId) {
      return getAdminReviewHref(slaAlert.oldestAppId);
    }
    const appId = getFirstReviewAppId(applications);
    return appId ? getAdminReviewHref(appId) : "/admin/applications";
  }, [slaAlert.oldestAppId, applications]);
  const [query, setQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>(DEFAULT_COLUMN_FILTERS);
  const [showAlert, setShowAlert] = useState(true);

  const setColumnFilter = (key: keyof ColumnFilters, value: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  };

  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const languages = new Set<string>();
    const submittedDates = new Set<string>();
    const reviewers = new Set<string>();

    for (const app of listItems) {
      categories.add(app.category);
      app.languages.forEach((lang) => languages.add(lang));
      submittedDates.add(app.submittedDate);
      reviewers.add(app.reviewer?.name || "Admin");
    }

    return {
      names: [...new Set(listItems.map((app) => app.name))].sort((a, b) =>
        a.localeCompare(b),
      ),
      categories: [...categories].sort((a, b) => a.localeCompare(b)),
      languages: [...languages].sort((a, b) => a.localeCompare(b)),
      submittedDates: [...submittedDates].sort((a, b) => b.localeCompare(a)),
      reviewers: [...reviewers].sort((a, b) => a.localeCompare(b)),
    };
  }, [listItems]);

  const filtered = useMemo(
    () => filterApplications(listItems, query, columnFilters),
    [listItems, query, columnFilters],
  );

  if (!ready) {
    return null;
  }

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              Expert <span className={styles.accentWord}>Applications</span>
            </h1>
            <p className={styles.pageSubtitle}>
              Review and manage submitted expert applications
            </p>
          </div>
        </header>

        <div className={styles.kpiRow} role="group" aria-label="Filter by status">
          {kpis
            .filter((kpi) => ["pending", "in_review", "on_hold"].includes(kpi.id))
            .map((kpi) => {
              const Icon = KPI_ICONS[kpi.variant];
              const isActive = columnFilters.status === kpi.id;

              return (
                <button
                  key={kpi.id}
                  type="button"
                  className={`${problemStyles.scardMini} ${styles.kpiCard} ${isActive ? problemStyles.active : ""} ${isActive ? styles.kpiCardActive : ""}`}
                  onClick={() => setColumnFilter("status", isActive ? "all" : kpi.id)}
                  aria-pressed={isActive}
                >
                  <div className={styles.kpiHeader}>
                    <span className={styles.kpiLabel}>{kpi.label}</span>
                    <span className={styles.kpiIconBox}>
                      <Icon size={24} aria-hidden="true" />
                    </span>
                  </div>
                  <p className={styles.kpiValue}>
                    {String(kpi.value).padStart(2, "0")}
                  </p>
                </button>
              );
            })}
        </div>

        <div className={styles.filtersCard}>
          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={16} />
            <input
              type="search"
              className={styles.searchInput}
              placeholder="Search by name, category, city, app ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search applications"
            />
          </div>
        </div>

        {showAlert && slaAlert.count > 0 && (
          <div className={styles.slaAlert} role="alert">
            <div className={styles.slaAlertContent}>
              <AlertTriangle className={styles.slaAlertIcon} size={20} />
              <p className={styles.slaAlertText}>
                <strong>{slaAlert.count} applications</strong> have exceeded the 48-hour SLA —
                immediate review required. Oldest: {slaAlert.oldestName} ({slaAlert.oldestCategory}) —{" "}
                {slaAlert.oldestHours} hours ago — Risk: {slaAlert.risk}
              </p>
            </div>
            <div className={styles.slaAlertActions}>
              <Link href={slaReviewHref} className={styles.slaAlertBtn}>
                Review Overdue
              </Link>
              <button
                type="button"
                className={styles.dismissBtn}
                onClick={() => setShowAlert(false)}
                aria-label="Dismiss alert"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <div className={styles.tablePanel}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colNum}>#</th>
                  <th className={styles.colApplicant}>
                    <TableHeaderFilter
                      label="Applicant"
                      value={columnFilters.name}
                      onChange={(value) => setColumnFilter("name", value)}
                      options={filterOptions.names.map((name) => ({ value: name, label: name }))}
                      ariaLabel="Filter by applicant name"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Category"
                      value={columnFilters.category}
                      onChange={(value) => setColumnFilter("category", value)}
                      options={filterOptions.categories.map((category) => ({
                        value: category,
                        label: category,
                      }))}
                      ariaLabel="Filter by category"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Languages"
                      value={columnFilters.language}
                      onChange={(value) => setColumnFilter("language", value)}
                      options={filterOptions.languages.map((language) => ({
                        value: language,
                        label: language,
                      }))}
                      ariaLabel="Filter by language"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Submitted"
                      value={columnFilters.submitted}
                      onChange={(value) => setColumnFilter("submitted", value)}
                      options={filterOptions.submittedDates.map((date) => ({
                        value: date,
                        label: date,
                      }))}
                      ariaLabel="Filter by submitted date"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="SLA"
                      value={columnFilters.sla}
                      onChange={(value) => setColumnFilter("sla", value)}
                      options={SLA_FILTER_OPTIONS.map((option) => ({
                        value: option.value,
                        label: option.label,
                      }))}
                      ariaLabel="Filter by SLA"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Status"
                      value={columnFilters.status}
                      onChange={(value) => setColumnFilter("status", value)}
                      options={STATUS_FILTER_OPTIONS}
                      ariaLabel="Filter by status"
                    />
                  </th>
                  <th>
                    <TableHeaderFilter
                      label="Reviewer"
                      value={columnFilters.reviewer}
                      onChange={(value) => setColumnFilter("reviewer", value)}
                      options={filterOptions.reviewers.map((reviewer) => ({
                        value: reviewer,
                        label: reviewer,
                      }))}
                      ariaLabel="Filter by reviewer"
                    />
                  </th>
                  <th className={styles.colActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <div className={styles.emptyState}>No applications match your filters.</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((app, index) => (
                    <tr key={app.id}>
                      <td className={styles.rowNum}>{index + 1}</td>
                      <td>
                        <div className={styles.applicantCell}>
                          <Image
                            src={app.avatar}
                            alt=""
                            width={36}
                            height={36}
                            className={styles.applicantAvatar}
                          />
                          <div>
                            <div className={styles.applicantName}>{app.name}</div>
                            <div className={styles.applicantMeta}>
                              {app.city} · {app.appId}
                              {app.onboardingStep && app.onboardingStep !== "success" && (
                                <> · {ONBOARDING_STEP_LABEL[app.onboardingStep] || app.onboardingStep}</>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.categoryPill}>
                          {app.category}
                        </span>
                      </td>
                      <td>
                        {app.languages.length > 0 ? (
                          <div className={styles.languagePillList}>
                            {app.languages.map((lang) => (
                              <span key={lang} className={styles.languagePill}>
                                {lang}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={styles.languageEmpty}>—</span>
                        )}
                      </td>
                      <td>
                        <div className={styles.submittedDate}>{app.submittedDate}</div>
                        <div className={styles.submittedAgo}>{app.submittedAgo}</div>
                      </td>
                      <td>
                        <span className={`${styles.slaBadge} ${slaClass(app.slaStatus)}`}>
                          {app.slaLabel}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${STATUS_BADGE_CLASS[app.status]}`}>
                          {STATUS_LABEL[app.status]}
                        </span>
                      </td>
                      <td>
                        <span className={styles.reviewerName}>
                          {app.reviewer?.name || "Admin"}
                        </span>
                      </td>
                      <td>
                        <Link href={getAdminReviewHref(app.appId)} className={styles.reviewLink}>
                          <Eye size={14} aria-hidden="true" />
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
