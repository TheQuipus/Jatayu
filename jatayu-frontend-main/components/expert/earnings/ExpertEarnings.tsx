"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Bell,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Edit2,
  FileText,
  Filter,
  Hourglass,
  Percent,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  EARNINGS_SUMMARY,
  MONTHLY_REVENUE_DATA,
  WEEKLY_REVENUE_DATA,
  PAYOUT_METHODS,
  TRANSACTIONS_HISTORY,
  INVOICES_LIST,
  COMPLETED_JOBS_LIST,
  type PayoutStatus,
  type PayoutMethodType,
} from "@/lib/expertEarningsStore";
import styles from "./ExpertEarnings.module.css";

export default function ExpertEarnings() {
  const [chartView, setChartView] = useState<"monthly" | "weekly">("monthly");
  const [activeTab, setActiveTab] = useState<"history" | "invoices" | "jobs">("history");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const revenuePoints = chartView === "monthly" ? MONTHLY_REVENUE_DATA : WEEKLY_REVENUE_DATA;

  // Calculate SVG paths for Revenue chart
  const amounts = revenuePoints.map((p) => p.amount);
  const minVal = Math.min(...amounts) * 0.85;
  const maxVal = Math.max(...amounts) * 1.1;
  const range = maxVal - minVal || 1;

  const svgWidth = 600;
  const svgHeight = 180;
  const padX = 20;
  const padY = 20;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  const pts = revenuePoints.map((pt, i) => {
    const x = padX + (i / (revenuePoints.length - 1)) * chartW;
    const y = padY + chartH - ((pt.amount - minVal) / range) * chartH;
    return { x, y, label: pt.label, amount: pt.amount };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${svgHeight - padY} L ${pts[0].x} ${svgHeight - padY} Z`;

  // Filter transactions
  const filteredTransactions = TRANSACTIONS_HISTORY.filter((t) => {
    if (statusFilter === "all") return true;
    return t.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const renderStatusBadge = (status: PayoutStatus) => {
    if (status === "Paid") return <span className={styles.statusPaid}>Paid</span>;
    if (status === "Pending") return <span className={styles.statusPending}>Pending</span>;
    return <span className={styles.statusTransit}>Transit</span>;
  };

  const renderTxnIcon = (status: PayoutStatus) => {
    if (status === "Paid")
      return (
        <div className={styles.typeIconPaid}>
          <ArrowUpRight size={16} />
        </div>
      );
    if (status === "Pending")
      return (
        <div className={styles.typeIconPending}>
          <Hourglass size={16} />
        </div>
      );
    return (
      <div className={styles.typeIconTransit}>
        <RefreshCw size={16} />
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        {/* --------------------------------------------------
            1. HEADER AREA
        -------------------------------------------------- */}
        <div className={styles.headerRow}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Earnings</h1>
            <p className={styles.pageSubtitle}>Financial overview, payouts & invoices</p>
          </div>
          <div className={styles.headerActions}>
            <select className={styles.selectDropdown} defaultValue="this-month">
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year (2024)</option>
            </select>
            <button type="button" className={styles.iconBtn} title="Export Report">
              <Download size={16} />
            </button>
            <button type="button" className={styles.iconBtn} title="Notifications">
              <Bell size={16} />
              <span className={styles.notificationDot} />
            </button>
          </div>
        </div>

        {/* --------------------------------------------------
            2. TOP STATS GRID
        -------------------------------------------------- */}
        <div className={styles.topGridRow1}>
          {/* Hero Balance Card */}
          <div className={`${styles.card} ${styles.heroBalanceCard}`}>
            <div className={styles.cardTopRow}>
              <span className={styles.metricLabel}>AVAILABLE BALANCE</span>
              <div className={styles.iconCircle}>
                <Wallet size={18} />
              </div>
            </div>
            <div>
              <div className={styles.balanceAmount}>
                {EARNINGS_SUMMARY.availableBalance}
              </div>
              <div className={styles.balanceSubtext}>
                <Clock size={13} />
                <span>Next payout: {EARNINGS_SUMMARY.nextPayoutDate}</span>
              </div>
            </div>
            <div className={styles.cardActions}>
              <button type="button" className={styles.withdrawBtn}>
                <ArrowUpRight size={14} /> Withdraw Funds
              </button>
              <button type="button" className={styles.transferBtn}>
                <RefreshCw size={14} /> Transfer
              </button>
            </div>
          </div>

          {/* Total Earned Card */}
          <div className={styles.card}>
            <div className={styles.cardTopRow}>
              <div className={styles.smallMetricIcon}>
                <TrendingUp size={18} />
              </div>
              <span className={styles.statBadgeGreen}>+18.4%</span>
            </div>
            <div>
              <div className={styles.statValue}>{EARNINGS_SUMMARY.totalEarned}</div>
              <span className={styles.metricLabel}>Total Earned (2024)</span>
            </div>
            <div className={styles.goalProgressBarWrap}>
              <div className={styles.progressBarBg}>
                <div
                  className={styles.progressBarFill}
                  style={{ width: `${EARNINGS_SUMMARY.annualGoalPercent}%` }}
                />
              </div>
              <span className={styles.progressLabel}>
                {EARNINGS_SUMMARY.annualGoalPercent}% of annual goal
              </span>
            </div>
          </div>

          {/* This Month Revenue Card */}
          <div className={styles.card}>
            <div className={styles.cardTopRow}>
              <div className={styles.smallMetricIcon}>
                <DollarSign size={18} />
              </div>
              <span className={styles.statBadgeNeutral}>Dec 2024</span>
            </div>
            <div>
              <div className={styles.statValue}>{EARNINGS_SUMMARY.thisMonthRevenue}</div>
              <span className={styles.metricLabel}>This Month Revenue</span>
            </div>
            <div className={styles.sessionsCompletedText}>
              <span className={styles.completedDot} />
              <span>{EARNINGS_SUMMARY.thisMonthSessions} sessions completed</span>
            </div>
          </div>
        </div>

        {/* Row 2: 4 Metric Cards */}
        <div className={styles.topGridRow2}>
          <div className={styles.smallMetricCard}>
            <div className={styles.smallMetricIcon}>
              <Hourglass size={18} />
            </div>
            <div className={styles.smallMetricContent}>
              <span className={styles.smallMetricVal}>
                {EARNINGS_SUMMARY.pendingPayout}
              </span>
              <span className={styles.smallMetricLabel}>Pending Payout</span>
            </div>
          </div>

          <div className={styles.smallMetricCard}>
            <div className={styles.smallMetricIcon}>
              <FileText size={18} />
            </div>
            <div className={styles.smallMetricContent}>
              <span className={styles.smallMetricVal}>
                {EARNINGS_SUMMARY.totalInvoices}
              </span>
              <span className={styles.smallMetricLabel}>Total Invoices</span>
            </div>
          </div>

          <div className={styles.smallMetricCard}>
            <div className={styles.smallMetricIcon}>
              <DollarSign size={18} />
            </div>
            <div className={styles.smallMetricContent}>
              <span className={styles.smallMetricVal}>
                {EARNINGS_SUMMARY.avgPerSession}
              </span>
              <span className={styles.smallMetricLabel}>Avg per Session</span>
            </div>
          </div>

          <div className={styles.smallMetricCard}>
            <div className={styles.smallMetricIcon}>
              <Percent size={18} />
            </div>
            <div className={styles.smallMetricContent}>
              <span className={styles.smallMetricVal}>
                {EARNINGS_SUMMARY.platformFee}
              </span>
              <span className={styles.smallMetricLabel}>Platform Fee</span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------
            3. MIDDLE SECTION: Revenue Chart & Payout Methods
        -------------------------------------------------- */}
        <div className={styles.middleGrid}>
          {/* Revenue Overview Chart */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div>
                <h2 className={styles.chartTitle}>Revenue Overview</h2>
                <span className={styles.chartSubtitle}>
                  {chartView === "monthly"
                    ? "Monthly earnings breakdown"
                    : "Weekly earnings breakdown"}
                </span>
              </div>
              <div className={styles.chartToggleGroup}>
                <button
                  type="button"
                  onClick={() => setChartView("monthly")}
                  className={`${styles.chartToggleBtn} ${
                    chartView === "monthly" ? styles.chartToggleActive : ""
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setChartView("weekly")}
                  className={`${styles.chartToggleBtn} ${
                    chartView === "weekly" ? styles.chartToggleActive : ""
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>

            <div className={styles.chartSvgWrap}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className={styles.svgElement}
                role="img"
                aria-label="Revenue chart"
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--pomegranate, #e53b17)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--pomegranate, #e53b17)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                <path d={areaPath} fill="url(#revenueGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--pomegranate, #e53b17)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {pts.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="var(--pomegranate, #e53b17)"
                    stroke="var(--white, #ffffff)"
                    strokeWidth="2"
                  />
                ))}
              </svg>

              <div className={styles.chartLabelsRow}>
                {pts.map((p, i) => (
                  <span key={i} className={styles.chartLabelText}>
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Payout Methods Card */}
          <div className={styles.payoutMethodsCard}>
            <div className={styles.payoutHeader}>
              <div>
                <h2 className={styles.chartTitle}>Payout Methods</h2>
                <span className={styles.chartSubtitle}>Manage your accounts</span>
              </div>
              <button
                type="button"
                className={styles.addMethodBtn}
                title="Add payout method"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className={styles.methodsList}>
              {PAYOUT_METHODS.map((method) => (
                <div
                  key={method.id}
                  className={`${styles.methodCard} ${
                    method.isDefault ? styles.methodCardDefault : ""
                  }`}
                >
                  <div className={styles.methodLeft}>
                    <div className={styles.methodLogoBox}>
                      {method.type === "stripe" && "STR"}
                      {method.type === "paypal" && "PP"}
                      {method.type === "bank" && "BANK"}
                    </div>
                    <div>
                      <div className={styles.methodTitleRow}>
                        <span className={styles.methodTitle}>{method.title}</span>
                        {method.badge === "Default" && (
                          <span className={styles.badgeDefault}>Default</span>
                        )}
                        {method.badge === "Verify" && (
                          <span className={styles.badgeVerify}>Verify</span>
                        )}
                      </div>
                      <span className={styles.methodDetail}>{method.detail}</span>
                    </div>
                  </div>
                  {method.isDefault && (
                    <CheckCircle2 size={16} color="#34C759" />
                  )}
                </div>
              ))}
            </div>

            <button type="button" className={styles.addMethodDashed}>
              + Add payout method
            </button>

            <div className={styles.payoutScheduleBox}>
              <span className={styles.scheduleLabel}>PAYOUT SCHEDULE</span>
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleKey}>Frequency</span>
                <span className={styles.scheduleVal}>Weekly (Mondays)</span>
              </div>
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleKey}>Minimum</span>
                <span className={styles.scheduleVal}>$100</span>
              </div>
              <div className={styles.scheduleRow}>
                <span className={styles.scheduleKey}>Processing</span>
                <span className={styles.scheduleVal}>1–3 business days</span>
              </div>
              <button type="button" className={styles.editScheduleBtn}>
                <Edit2 size={12} /> Edit Schedule
              </button>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------
            4. BOTTOM SECTION: Transaction Table
        -------------------------------------------------- */}
        <div className={styles.transactionsCard}>
          <div className={styles.tableHeaderRow}>
            <div className={styles.tableTabs}>
              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`${styles.tabBtn} ${
                  activeTab === "history" ? styles.tabBtnActive : ""
                }`}
              >
                Payout History
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("invoices")}
                className={`${styles.tabBtn} ${
                  activeTab === "invoices" ? styles.tabBtnActive : ""
                }`}
              >
                Invoices <span className={styles.tabBadge}>18</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("jobs")}
                className={`${styles.tabBtn} ${
                  activeTab === "jobs" ? styles.tabBtnActive : ""
                }`}
              >
                Completed Jobs
              </button>
            </div>

            {activeTab === "history" && (
              <div className={styles.tableControls}>
                <select
                  className={styles.selectDropdown}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="transit">Transit</option>
                </select>
              </div>
            )}
          </div>

          {/* Table Content */}
          <div className={styles.tableWrap}>
            {activeTab === "history" && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Transaction ID</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((txn) => (
                    <tr key={txn.id} className={styles.tableRow}>
                      <td>
                        <div className={styles.descCell}>
                          {renderTxnIcon(txn.status)}
                          <div className={styles.descTextGroup}>
                            <span className={styles.descTitle}>
                              {txn.description}
                            </span>
                            <span className={styles.descSubtext}>{txn.subtext}</span>
                            <div>{renderStatusBadge(txn.status)}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.dateCell}>{txn.date}</td>
                      <td>
                        <div className={styles.methodCell}>
                          <CreditCard size={14} />
                          <span>{txn.methodLabel}</span>
                        </div>
                      </td>
                      <td className={styles.txnIdCell}>{txn.transactionId}</td>
                      <td>
                        <span
                          className={
                            txn.status === "Paid"
                              ? styles.amountPaid
                              : txn.status === "Pending"
                              ? styles.amountPending
                              : styles.amountTransit
                          }
                        >
                          {txn.amount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "invoices" && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Client</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {INVOICES_LIST.map((inv) => (
                    <tr key={inv.id} className={styles.tableRow}>
                      <td className={styles.descTitle}>{inv.number}</td>
                      <td>{inv.client}</td>
                      <td className={styles.dateCell}>{inv.issueDate}</td>
                      <td className={styles.dateCell}>{inv.dueDate}</td>
                      <td className={styles.amountPaid}>{inv.amount}</td>
                      <td>
                        <span
                          className={
                            inv.status === "Paid"
                              ? styles.statusPaid
                              : styles.statusPending
                          }
                        >
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "jobs" && (
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Client</th>
                    <th>Completed Date</th>
                    <th>Duration</th>
                    <th>Payout</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPLETED_JOBS_LIST.map((job) => (
                    <tr key={job.id} className={styles.tableRow}>
                      <td className={styles.descTitle}>{job.title}</td>
                      <td>{job.client}</td>
                      <td className={styles.dateCell}>{job.completedDate}</td>
                      <td className={styles.dateCell}>{job.duration}</td>
                      <td className={styles.amountPaid}>{job.payout}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button type="button" className={styles.loadMoreBtn}>
            <ChevronDown size={14} /> Load more transactions
          </button>
        </div>
      </div>
    </div>
  );
}
