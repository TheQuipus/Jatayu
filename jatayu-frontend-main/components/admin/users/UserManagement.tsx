"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Ban,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Search,
  UserCheck,
  Users,
  X,
  ShieldAlert,
  IndianRupee,
  Calendar,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  UserX,
  AlertTriangle,
} from "lucide-react";
import problemStyles from "@/components/homepage/Problem.module.css";
import {
  useUserManagement,
} from "@/hooks/useUserManagement";
import type {
  ExpertUser,
  SeekerUser,
  UserStatus,
} from "@/lib/adminUserManagement";
import styles from "./UserManagement.module.css";

type UserManagementProps = {
  subSection: "experts" | "seekers";
};

export default function UserManagement({ subSection }: UserManagementProps) {
  const { ready, experts, seekers, updateExpertStatus, updateSeekerStatus } = useUserManagement();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Expert statistics
  const totalExperts = experts.length;
  const activeExperts = experts.filter((e) => e.status === "active").length;
  const onHoldExperts = experts.filter((e) => e.status === "on_hold").length;
  const suspendedExperts = experts.filter((e) => e.status === "suspended").length;

  // Seeker statistics
  const totalSeekers = seekers.length;
  const activeSeekers = seekers.filter((s) => s.status === "active").length;
  const suspendedSeekers = seekers.filter((s) => s.status === "suspended").length;
  const deletedSeekers = seekers.filter((s) => s.status === "deleted").length;
  const flaggedSeekers = seekers.filter((s) => s.status === "flagged").length;
  const totalBookingsCount = seekers.reduce((sum, s) => sum + s.totalBookings, 0);

  // Categories list for filter
  const categories = useMemo(() => {
    const set = new Set(experts.map((e) => e.category));
    return Array.from(set);
  }, [experts]);

  // Filtered Experts
  const filteredExperts = useMemo(() => {
    return experts.filter((exp) => {
      const matchSearch =
        search === "" ||
        exp.name.toLowerCase().includes(search.toLowerCase()) ||
        exp.email.toLowerCase().includes(search.toLowerCase()) ||
        exp.phone.includes(search) ||
        exp.category.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || exp.status === statusFilter;
      const matchCat = categoryFilter === "all" || exp.category === categoryFilter;

      return matchSearch && matchStatus && matchCat;
    });
  }, [experts, search, statusFilter, categoryFilter]);

  // Filtered Seekers
  const filteredSeekers = useMemo(() => {
    return seekers.filter((skr) => {
      const matchSearch =
        search === "" ||
        skr.name.toLowerCase().includes(search.toLowerCase()) ||
        skr.email.toLowerCase().includes(search.toLowerCase()) ||
        skr.phone.includes(search) ||
        skr.city.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "all" || skr.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [seekers, search, statusFilter]);

  if (!ready) {
    return (
      <section className={styles.dashboard}>
        <div className={`container ${styles.dashboardInner}`}>
          <div className={styles.loadingState}>
            Loading user records...
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>User Management</h1>
            <p className={styles.subtitle}>
              Manage system users, expert providers, seeker accounts, and access permissions.
            </p>
          </div>
        </div>

      {/* KPI Metrics Bar */}
      {subSection === "experts" ? (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Total Experts</span>
              <span className={styles.metricValue}>{totalExperts}</span>
            </div>
            <div className={styles.metricIcon}>
              <UserCheck size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Active</span>
              <span className={`${styles.metricValue} ${styles.metricValueActive}`}>
                {activeExperts}
              </span>
            </div>
            <div className={`${styles.metricIcon} ${styles.metricIconActive}`}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>On Hold</span>
              <span className={`${styles.metricValue} ${styles.metricValueHold}`}>
                {onHoldExperts}
              </span>
            </div>
            <div className={`${styles.metricIcon} ${styles.metricIconHold}`}>
              <Clock size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Suspended</span>
              <span className={`${styles.metricValue} ${styles.metricValueSuspended}`}>
                {suspendedExperts}
              </span>
            </div>
            <div className={`${styles.metricIcon} ${styles.metricIconSuspended}`}>
              <Ban size={20} />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.metricsGrid} role="group" aria-label="Filter by status">
          {[
            { id: "all", label: "Total", value: totalSeekers, icon: Users },
            { id: "active", label: "Active", value: activeSeekers, icon: CheckCircle2 },
            { id: "suspended", label: "Suspended", value: suspendedSeekers, icon: Ban },
            { id: "deleted", label: "Deleted", value: deletedSeekers, icon: UserX },
            { id: "flagged", label: "Flagged", value: flaggedSeekers, icon: AlertTriangle },
          ].map((kpi) => {
            const Icon = kpi.icon;
            const isActive =
              statusFilter === kpi.id || (kpi.id === "all" && statusFilter === "all");

            return (
              <button
                key={kpi.id}
                type="button"
                className={`${problemStyles.scardMini} ${styles.kpiCard} ${isActive ? problemStyles.active : ""} ${isActive ? styles.kpiCardActive : ""}`}
                onClick={() => setStatusFilter(isActive && kpi.id !== "all" ? "all" : kpi.id)}
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
      )}

      {/* Control Bar: Search */}
      <div className={styles.controlsCard}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} size={16} />
          <input
            type="search"
            className={styles.searchInput}
            placeholder={
              subSection === "experts"
                ? "Search experts by name, email, category..."
                : "Search seekers by name, email, phone, city..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          {subSection === "experts" ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colNum}>#</th>
                  <th><span className={styles.thFilterSelect}>Expert Name & Contact</span></th>
                  <th><span className={styles.thFilterSelect}>Domain & Specialty</span></th>
                  <th><span className={styles.thFilterSelect}>Status</span></th>
                  <th><span className={styles.thFilterSelect}>Last Active</span></th>
                  <th><span className={styles.thFilterSelect}>Sessions</span></th>
                  <th><span className={styles.thFilterSelect}>Money</span></th>
                  <th><span className={styles.thFilterSelect}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredExperts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={styles.emptyStateCell}>
                      No expert records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredExperts.map((exp, index) => (
                    <tr key={exp.id}>
                      <td className={styles.rowNum}>{index + 1}</td>
                      <td>
                        <div className={styles.userCell}>
                          <Image
                            src={exp.avatar}
                            alt={exp.name}
                            width={36}
                            height={36}
                            className={styles.avatar}
                          />
                          <div className={styles.userInfo}>
                            <Link href={`/admin/users/experts/${exp.id}`} className={styles.userName}>
                              {exp.name}
                            </Link>
                            <span className={styles.userEmail}>{exp.email}</span>
                            <span className={styles.userMeta}>{exp.phone} • {exp.city}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.domainCell}>
                          <span className={styles.domainTitle}>{exp.category}</span>
                          <span className={styles.domainSub}>{exp.subCategory}</span>
                        </div>
                      </td>
                      <td>
                        {exp.status === "active" && <span className={styles.badgeActive}>Active</span>}
                        {exp.status === "on_hold" && <span className={styles.badgeHold}>On Hold</span>}
                        {exp.status === "suspended" && <span className={styles.badgeSuspended}>Suspended</span>}
                      </td>
                      <td>
                        <span className={styles.lastActiveText}>{exp.lastActive || exp.joinedDate}</span>
                      </td>
                      <td>
                        <span className={styles.sessionsText}>{exp.totalSessions} sessions</span>
                      </td>
                      <td>
                        <span className={styles.earningsText}>
                          ₹{exp.totalEarnings.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <span className={styles.actionMenu}>
                          <Link
                            href={`/admin/users/experts/${exp.id}`}
                            className={styles.actionBtn}
                            title="View Profile Details"
                          >
                            <Eye size={14} /> View
                          </Link>
                          {exp.status === "active" ? (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              onClick={() => updateExpertStatus(exp.id, "suspended")}
                              title="Suspend Account"
                            >
                              <Ban size={14} /> Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => updateExpertStatus(exp.id, "active")}
                              title="Activate Account"
                            >
                              <CheckCircle2 size={14} className={styles.activateIcon} /> Activate
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colNum}>#</th>
                  <th><span className={styles.thFilterSelect}>Seeker Name & Contact</span></th>
                  <th><span className={styles.thFilterSelect}>Status</span></th>
                  <th><span className={styles.thFilterSelect}>Last Active</span></th>
                  <th><span className={styles.thFilterSelect}>Sessions</span></th>
                  <th><span className={styles.thFilterSelect}>Money</span></th>
                  <th><span className={styles.thFilterSelect}>Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filteredSeekers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyStateCell}>
                      No seeker records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredSeekers.map((skr, index) => (
                    <tr key={skr.id}>
                      <td className={styles.rowNum}>{index + 1}</td>
                      <td>
                        <div className={styles.userCell}>
                          <Image
                            src={skr.avatar}
                            alt={skr.name}
                            width={36}
                            height={36}
                            className={styles.avatar}
                          />
                          <div className={styles.userInfo}>
                            <Link href={`/admin/users/seekers/${skr.id}`} className={styles.userName}>
                              {skr.name}
                            </Link>
                            <span className={styles.userEmail}>{skr.email}</span>
                            <span className={styles.userMeta}>{skr.phone} • {skr.city}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        {skr.status === "active" && <span className={styles.badgeActive}>Active</span>}
                        {skr.status === "suspended" && <span className={styles.badgeSuspended}>Suspended</span>}
                        {skr.status === "deleted" && <span className={styles.badgeDeleted}>Deleted</span>}
                        {skr.status === "flagged" && <span className={styles.badgeFlagged}>Flagged</span>}
                      </td>
                      <td>
                        <span className={styles.lastActiveText}>{skr.lastActive}</span>
                      </td>
                      <td>
                        <span className={styles.sessionsText}>{skr.totalBookings} bookings</span>
                      </td>
                      <td>
                        <span className={styles.spentText}>
                          ₹{skr.totalSpent.toLocaleString("en-IN")}
                        </span>
                      </td>
                      <td>
                        <span className={styles.actionMenu}>
                          <Link
                            href={`/admin/users/seekers/${skr.id}`}
                            className={styles.actionBtn}
                            title="View Profile Details"
                          >
                            <Eye size={14} /> View
                          </Link>
                          {skr.status === "active" ? (
                            <button
                              type="button"
                              className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                              onClick={() => updateSeekerStatus(skr.id, "suspended")}
                              title="Suspend Account"
                            >
                              <Ban size={14} /> Suspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => updateSeekerStatus(skr.id, "active")}
                              title="Activate Account"
                            >
                              <CheckCircle2 size={14} className={styles.activateIcon} /> Activate
                            </button>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  </section>
  );
}
