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
  Star,
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
} from "lucide-react";
import {
  useUserManagement,
} from "@/hooks/useUserManagement";
import {
  ADMIN_USERS_EXPERTS_HREF,
  ADMIN_USERS_SEEKERS_HREF,
  type ExpertUser,
  type SeekerUser,
  type UserStatus,
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

  const [selectedExpert, setSelectedExpert] = useState<ExpertUser | null>(null);
  const [selectedSeeker, setSelectedSeeker] = useState<SeekerUser | null>(null);

  // Expert statistics
  const totalExperts = experts.length;
  const activeExperts = experts.filter((e) => e.status === "active").length;
  const onHoldExperts = experts.filter((e) => e.status === "on_hold").length;
  const suspendedExperts = experts.filter((e) => e.status === "suspended").length;

  // Seeker statistics
  const totalSeekers = seekers.length;
  const activeSeekers = seekers.filter((s) => s.status === "active").length;
  const suspendedSeekers = seekers.filter((s) => s.status === "suspended").length;
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
      <div className={styles.container}>
        <div style={{ padding: "40px", textAlign: "center", color: "var(--dove-gray)" }}>
          Loading user records...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>User Management</h1>
          <p className={styles.subtitle}>
            Manage system users, expert providers, seeker accounts, and access permissions.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabBar} role="tablist">
          <Link
            href={ADMIN_USERS_EXPERTS_HREF}
            className={`${styles.tabBtn} ${subSection === "experts" ? styles.tabBtnActive : ""}`}
            role="tab"
          >
            <UserCheck size={16} />
            Experts ({totalExperts})
          </Link>
          <Link
            href={ADMIN_USERS_SEEKERS_HREF}
            className={`${styles.tabBtn} ${subSection === "seekers" ? styles.tabBtnActive : ""}`}
            role="tab"
          >
            <Users size={16} />
            Seekers ({totalSeekers})
          </Link>
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
              <span className={styles.metricValue} style={{ color: "#16a34a" }}>
                {activeExperts}
              </span>
            </div>
            <div className={styles.metricIcon} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>On Hold</span>
              <span className={styles.metricValue} style={{ color: "#ca8a04" }}>
                {onHoldExperts}
              </span>
            </div>
            <div className={styles.metricIcon} style={{ background: "rgba(234, 179, 8, 0.1)", color: "#ca8a04" }}>
              <Clock size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Suspended</span>
              <span className={styles.metricValue} style={{ color: "#dc2626" }}>
                {suspendedExperts}
              </span>
            </div>
            <div className={styles.metricIcon} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}>
              <Ban size={20} />
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Total Seekers</span>
              <span className={styles.metricValue}>{totalSeekers}</span>
            </div>
            <div className={styles.metricIcon}>
              <Users size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Active Seekers</span>
              <span className={styles.metricValue} style={{ color: "#16a34a" }}>
                {activeSeekers}
              </span>
            </div>
            <div className={styles.metricIcon} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Total Bookings</span>
              <span className={styles.metricValue}>{totalBookingsCount}</span>
            </div>
            <div className={styles.metricIcon} style={{ background: "var(--seashell)", color: "var(--tango)" }}>
              <Calendar size={20} />
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricMeta}>
              <span className={styles.metricLabel}>Suspended Accounts</span>
              <span className={styles.metricValue} style={{ color: "#dc2626" }}>
                {suspendedSeekers}
              </span>
            </div>
            <div className={styles.metricIcon} style={{ background: "rgba(239, 68, 68, 0.1)", color: "#dc2626" }}>
              <Ban size={20} />
            </div>
          </div>
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <div className={styles.controlBar}>
        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
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

        <div className={styles.filterGroup}>
          <Filter size={14} style={{ color: "var(--dove-gray)" }} />
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            {subSection === "experts" && <option value="on_hold">On Hold</option>}
            <option value="suspended">Suspended</option>
          </select>

          {subSection === "experts" && (
            <select
              className={styles.select}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Domains</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          {subSection === "experts" ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Expert Name & Contact</th>
                  <th>Domain & Specialty</th>
                  <th>Rating</th>
                  <th>Sessions / Earnings</th>
                  <th>Hourly Rate</th>
                  <th>Status</th>
                  <th>Joined Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExperts.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--dove-gray)" }}>
                      No expert records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredExperts.map((exp) => (
                    <tr key={exp.id}>
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
                            <span className={styles.userName}>{exp.name}</span>
                            <span className={styles.userEmail}>{exp.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{exp.category}</span>
                          <span style={{ fontSize: "11px", color: "var(--dove-gray)" }}>{exp.subCategory}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.ratingTag}>
                          <Star size={13} fill="#f59e0b" color="#f59e0b" />
                          {exp.rating.toFixed(1)}{" "}
                          <span style={{ fontSize: "11px", color: "var(--dove-gray)" }}>({exp.reviewCount})</span>
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{exp.totalSessions} sessions</span>
                          <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>
                            ₹{exp.totalEarnings.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                          ₹{exp.hourlyRate}/hr
                        </span>
                      </td>
                      <td>
                        {exp.status === "active" && <span className={styles.badgeActive}>Active</span>}
                        {exp.status === "on_hold" && <span className={styles.badgeHold}>On Hold</span>}
                        {exp.status === "suspended" && <span className={styles.badgeSuspended}>Suspended</span>}
                      </td>
                      <td style={{ color: "var(--dove-gray)", fontSize: "12px" }}>{exp.joinedDate}</td>
                      <td>
                        <div className={styles.actionMenu}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setSelectedExpert(exp)}
                            title="View Profile Details"
                          >
                            <Eye size={14} /> View
                          </button>
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
                              <CheckCircle2 size={14} style={{ color: "#16a34a" }} /> Activate
                            </button>
                          )}
                        </div>
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
                  <th>Seeker Name & Contact</th>
                  <th>Phone Number</th>
                  <th>Location</th>
                  <th>Bookings / Total Spent</th>
                  <th>Preferred Category</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSeekers.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "32px", color: "var(--dove-gray)" }}>
                      No seeker records match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredSeekers.map((skr) => (
                    <tr key={skr.id}>
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
                            <span className={styles.userName}>{skr.name}</span>
                            <span className={styles.userEmail}>{skr.email}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--dove-gray)" }}>{skr.phone}</td>
                      <td style={{ fontWeight: 500, color: "var(--ink)" }}>{skr.city}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: 600, color: "var(--ink)" }}>{skr.totalBookings} bookings</span>
                          <span style={{ fontSize: "11px", color: "var(--tango)", fontWeight: 600 }}>
                            ₹{skr.totalSpent.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "12px", color: "var(--dove-gray)" }}>
                          {skr.preferredCategory}
                        </span>
                      </td>
                      <td>
                        {skr.status === "active" ? (
                          <span className={styles.badgeActive}>Active</span>
                        ) : (
                          <span className={styles.badgeSuspended}>Suspended</span>
                        )}
                      </td>
                      <td style={{ color: "var(--dove-gray)", fontSize: "12px" }}>{skr.lastActive}</td>
                      <td>
                        <div className={styles.actionMenu}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => setSelectedSeeker(skr)}
                            title="View Profile Details"
                          >
                            <Eye size={14} /> View
                          </button>
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
                              <CheckCircle2 size={14} style={{ color: "#16a34a" }} /> Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Expert Profile Detail Modal */}
      {selectedExpert ? (
        <div className={styles.modalOverlay} onClick={() => setSelectedExpert(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Expert Profile Details</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelectedExpert(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.profileHero}>
                <Image
                  src={selectedExpert.avatar}
                  alt={selectedExpert.name}
                  width={56}
                  height={56}
                  className={styles.profileAvatar}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>
                    {selectedExpert.name}
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--dove-gray)" }}>
                    {selectedExpert.category} · {selectedExpert.location}
                  </p>
                </div>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Email</span>
                  <span className={styles.detailValue}>{selectedExpert.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Phone</span>
                  <span className={styles.detailValue}>{selectedExpert.phone}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Hourly Rate</span>
                  <span className={styles.detailValue}>₹{selectedExpert.hourlyRate}/hr</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Rating</span>
                  <span className={styles.detailValue}>
                    ⭐ {selectedExpert.rating.toFixed(1)} ({selectedExpert.reviewCount} reviews)
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Completed Sessions</span>
                  <span className={styles.detailValue}>{selectedExpert.totalSessions} sessions</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Platform Earnings</span>
                  <span className={styles.detailValue} style={{ color: "#16a34a" }}>
                    ₹{selectedExpert.totalEarnings.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <span className={styles.detailLabel}>Bio & Background</span>
                <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--ink)", lineHeight: 1.5 }}>
                  {selectedExpert.bio}
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              {selectedExpert.status !== "active" && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => {
                    updateExpertStatus(selectedExpert.id, "active");
                    setSelectedExpert({ ...selectedExpert, status: "active" });
                  }}
                >
                  Set Active
                </button>
              )}
              {selectedExpert.status !== "on_hold" && (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => {
                    updateExpertStatus(selectedExpert.id, "on_hold");
                    setSelectedExpert({ ...selectedExpert, status: "on_hold" });
                  }}
                >
                  Set On Hold
                </button>
              )}
              {selectedExpert.status !== "suspended" && (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => {
                    updateExpertStatus(selectedExpert.id, "suspended");
                    setSelectedExpert({ ...selectedExpert, status: "suspended" });
                  }}
                >
                  Suspend Expert
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Seeker Profile Detail Modal */}
      {selectedSeeker ? (
        <div className={styles.modalOverlay} onClick={() => setSelectedSeeker(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Seeker Account Details</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelectedSeeker(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.profileHero}>
                <Image
                  src={selectedSeeker.avatar}
                  alt={selectedSeeker.name}
                  width={56}
                  height={56}
                  className={styles.profileAvatar}
                />
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--ink)" }}>
                    {selectedSeeker.name}
                  </h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--dove-gray)" }}>
                    Seeker · {selectedSeeker.city}
                  </p>
                </div>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Email</span>
                  <span className={styles.detailValue}>{selectedSeeker.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Phone</span>
                  <span className={styles.detailValue}>{selectedSeeker.phone}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Bookings</span>
                  <span className={styles.detailValue}>{selectedSeeker.totalBookings} bookings</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Total Amount Spent</span>
                  <span className={styles.detailValue} style={{ color: "var(--tango)" }}>
                    ₹{selectedSeeker.totalSpent.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Joined Date</span>
                  <span className={styles.detailValue}>{selectedSeeker.joinedDate}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Last Activity</span>
                  <span className={styles.detailValue}>{selectedSeeker.lastActive}</span>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              {selectedSeeker.status !== "active" ? (
                <button
                  type="button"
                  className={styles.actionBtn}
                  onClick={() => {
                    updateSeekerStatus(selectedSeeker.id, "active");
                    setSelectedSeeker({ ...selectedSeeker, status: "active" });
                  }}
                >
                  Set Active
                </button>
              ) : (
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  onClick={() => {
                    updateSeekerStatus(selectedSeeker.id, "suspended");
                    setSelectedSeeker({ ...selectedSeeker, status: "suspended" });
                  }}
                >
                  Suspend Account
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
