"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  CreditCard,
  Download,
  Edit2,
  FileText,
  Filter,
  Hourglass,
  IndianRupee,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  EARNINGS_SUMMARY,
  MONTHLY_REVENUE_DATA,
  WEEKLY_REVENUE_DATA,
  DAILY_REVENUE_DATA,
  YEARLY_REVENUE_DATA,
  PAYOUT_METHODS,
  TRANSACTIONS_HISTORY,
  INVOICES_LIST,
  type PayoutStatus,
  type PayoutMethodType,
} from "@/lib/expertEarningsStore";
import { printInvoicePdf } from "@/lib/invoicePdfGenerator";
import styles from "./ExpertEarnings.module.css";

function formatShortMoney(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(1)}Cr`;
  }
  if (amount >= 100000) {
    const lakh = amount / 100000;
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
  }
  if (amount >= 1000) {
    const k = amount / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}k`;
  }
  return `₹${Math.round(amount)}`;
}

export default function ExpertEarnings() {
  const [chartView, setChartView] = useState<"day" | "month" | "year">("month");
  const [activeTab, setActiveTab] = useState<"history" | "invoices">("history");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementFrom, setStatementFrom] = useState("2024-11-01");
  const [statementTo, setStatementTo] = useState("2024-12-31");
  const [statementPreset, setStatementPreset] = useState<string>("all");

  const applyPreset = (preset: string) => {
    setStatementPreset(preset);
    if (preset === "30d") {
      setStatementFrom("2024-11-17");
      setStatementTo("2024-12-17");
    } else if (preset === "quarter") {
      setStatementFrom("2024-10-01");
      setStatementTo("2024-12-31");
    } else if (preset === "fy") {
      setStatementFrom("2024-04-01");
      setStatementTo("2025-03-31");
    } else if (preset === "all") {
      setStatementFrom("2024-01-01");
      setStatementTo("2024-12-31");
    }
  };

  const handleDownloadStatement = () => {
    const lines = [
      "==========================================================================",
      "                       JATAYU ACCOUNT STATEMENT                           ",
      "==========================================================================",
      `Account Holder : Sarah Mitchell`,
      `Statement Range: ${statementFrom} to ${statementTo}`,
      `Generated Date : ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}`,
      `Currency       : INR (₹)`,
      `Available Bal  : ${EARNINGS_SUMMARY.availableBalance}`,
      `Total Earnings : ${EARNINGS_SUMMARY.totalEarned}`,
      "==========================================================================",
      "",
      "Date        | Transaction ID | Description (Subtext)             | Method  | Status  | Amount",
      "------------+----------------+-----------------------------------+---------+---------+-----------",
      ...TRANSACTIONS_HISTORY.map((t) =>
        `${t.date.padEnd(11)} | ${t.transactionId.padEnd(14)} | ${(t.description + " - " + t.subtext).slice(0, 33).padEnd(33)} | ${t.methodLabel.padEnd(7)} | ${t.status.padEnd(7)} | ${t.amount}`
      ),
      "------------+----------------+-----------------------------------+---------+---------+-----------",
      "",
      "Summary of Invoices in Period:",
      "Invoice No.   | Client             | Issue Date   | Due Date     | Status  | Amount",
      "--------------+--------------------+--------------+--------------+---------+-----------",
      ...INVOICES_LIST.map((inv) =>
        `${inv.number.padEnd(13)} | ${inv.client.slice(0, 18).padEnd(18)} | ${inv.issueDate.padEnd(12)} | ${inv.dueDate.padEnd(12)} | ${inv.status.padEnd(7)} | ${inv.amount}`
      ),
      "==========================================================================",
      "                      END OF STATEMENT                                    ",
      "==========================================================================",
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Jatayu_Statement_${statementFrom}_to_${statementTo}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsStatementModalOpen(false);
  };

  const revenuePoints =
    chartView === "day"
      ? DAILY_REVENUE_DATA
      : chartView === "year"
      ? YEARLY_REVENUE_DATA
      : MONTHLY_REVENUE_DATA;

  // Calculate SVG paths for Revenue chart
  const amounts = revenuePoints.map((p) => p.amount);
  const maxVal = Math.max(...amounts) * 1.15 || 100;
  const minVal = 0;
  const range = maxVal - minVal || 1;

  const svgWidth = 600;
  const svgHeight = 200;
  const padLeft = 48;
  const padRight = 20;
  const padTop = 16;
  const padBottom = 26;
  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const yTickRatios = [1.0, 0.66, 0.33, 0];
  const yTicks = yTickRatios.map((ratio) => {
    const val = ratio * maxVal;
    const y = padTop + chartH - ((val - minVal) / range) * chartH;
    return { val, y };
  });

  const pts = revenuePoints.map((pt, i) => {
    const x = padLeft + (i / (revenuePoints.length - 1)) * chartW;
    const y = padTop + chartH - ((pt.amount - minVal) / range) * chartH;
    return { x, y, label: pt.label, amount: pt.amount };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${padTop + chartH} L ${pts[0].x} ${padTop + chartH} Z`;

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
              <div className={styles.goalInfoRow}>
                <span className={styles.progressLabel}>
                  {EARNINGS_SUMMARY.annualGoalPercent}% of annual goal
                </span>
                <button
                  type="button"
                  disabled
                  className={styles.setGoalBtn}
                  title="Set annual goal (Coming soon)"
                >
                  Set annual goal <span className={styles.comingSoonBadge}>Coming soon</span>
                </button>
              </div>
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
              <IndianRupee size={18} />
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
              <Coins size={18} />
            </div>
            <div className={styles.smallMetricContent}>
              <span className={styles.smallMetricVal}>
                {EARNINGS_SUMMARY.credits}
              </span>
              <span className={styles.smallMetricLabel}>Credits</span>
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
                  {chartView === "day"
                    ? "Daily earnings breakdown (Past 7 Days)"
                    : chartView === "month"
                    ? "Monthly earnings breakdown (Last 6 Months)"
                    : "Yearly earnings breakdown (Past 4 Years)"}
                </span>
              </div>
              <div className={styles.timeframeSelectWrapper}>
                <select
                  className={styles.timeframeSelect}
                  value={chartView}
                  onChange={(e) => setChartView(e.target.value as "day" | "month" | "year")}
                  aria-label="Filter revenue by timeframe"
                >
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
              </div>
            </div>

            <div className={styles.chartSvgWrap}>
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className={styles.svgElement}
                role="img"
                aria-label="Revenue chart with money Y-axis"
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--pomegranate, #e53b17)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--pomegranate, #e53b17)" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {/* Horizontal Gridlines & Y-Axis Money Labels */}
                {yTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={padLeft}
                      y1={tick.y}
                      x2={padLeft + chartW}
                      y2={tick.y}
                      className={styles.chartGridLine}
                    />
                    <text
                      x={padLeft - 8}
                      y={tick.y + 3.5}
                      textAnchor="end"
                      className={styles.chartAxisText}
                    >
                      {formatShortMoney(tick.val)}
                    </text>
                  </g>
                ))}

                {/* Gradient Fill Area */}
                <path d={areaPath} fill="url(#revenueGrad)" />

                {/* Primary Trend Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--pomegranate, #e53b17)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data Point Circles with Tooltip and X-Axis Labels */}
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4"
                      fill="var(--pomegranate, #e53b17)"
                      stroke="var(--white, #ffffff)"
                      strokeWidth="2"
                      className={styles.chartDot}
                    >
                      <title>{`${p.label}: ₹${p.amount.toLocaleString("en-IN")}`}</title>
                    </circle>
                    <text
                      x={p.x}
                      y={svgHeight - 6}
                      textAnchor="middle"
                      className={styles.chartAxisText}
                    >
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Payout Methods Card */}
          <div className={styles.payoutMethodsCard}>
            <div className={styles.payoutHeader}>
              <div>
                <h2 className={styles.chartTitle}>Payout Methods</h2>
                <span className={styles.chartSubtitle}>Manage your accounts</span>
              </div>
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
                <span className={styles.scheduleVal}>₹1,000</span>
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
            </div>

            <div className={styles.tableControls}>
              {activeTab === "history" && (
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
              )}

              <button
                type="button"
                className={styles.statementDownloadBtn}
                onClick={() => setIsStatementModalOpen(true)}
                title="Download Account Statement"
              >
                <Download size={14} />
                <span>Download Statement</span>
              </button>
            </div>
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
                    <th>Action</th>
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
                      <td>
                        <button
                          type="button"
                          className={styles.invoiceDownloadBtn}
                          title={`Download invoice ${inv.number}`}
                          onClick={() => {
                            const rawAmount = parseFloat(inv.amount.replace(/[^0-9.]/g, "")) || 10800;
                            const fee = Math.round(rawAmount * 0.82);
                            const gst = Math.round(rawAmount * 0.18);
                            printInvoicePdf({
                              invoiceId: inv.number,
                              referenceId: `REF-${inv.number.slice(-7)}`,
                              issueDate: inv.issueDate,
                              clientName: inv.client,
                              expertName: "Sarah Mitchell",
                              consultationLabel: "Product Strategy Consultation",
                              scheduledDate: inv.issueDate,
                              consultationFee: fee,
                              platformFee: 0,
                              gst: gst,
                              totalPaid: rawAmount,
                              paymentMethod: "Bank Transfer",
                              paymentStatus: inv.status === "Paid" ? "Paid" : "Pending",
                            });
                          }}
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>
                      </td>
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

        {/* Statement Download Modal */}
        {isStatementModalOpen && (
          <div
            className={styles.modalOverlay}
            onClick={() => setIsStatementModalOpen(false)}
          >
            <div
              className={styles.statementModal}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className={styles.modalHeader}>
                <div>
                  <h3 className={styles.modalTitle}>Download Account Statement</h3>
                  <p className={styles.modalSubtitle}>
                    Select date range for bank statement style record
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.modalCloseBtn}
                  onClick={() => setIsStatementModalOpen(false)}
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className={styles.modalBody}>
                <div className={styles.presetRow}>
                  <button
                    type="button"
                    className={`${styles.presetBtn} ${
                      statementPreset === "30d" ? styles.presetBtnActive : ""
                    }`}
                    onClick={() => applyPreset("30d")}
                  >
                    Last 30 Days
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetBtn} ${
                      statementPreset === "quarter" ? styles.presetBtnActive : ""
                    }`}
                    onClick={() => applyPreset("quarter")}
                  >
                    This Quarter
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetBtn} ${
                      statementPreset === "fy" ? styles.presetBtnActive : ""
                    }`}
                    onClick={() => applyPreset("fy")}
                  >
                    FY 2024–25
                  </button>
                  <button
                    type="button"
                    className={`${styles.presetBtn} ${
                      statementPreset === "all" ? styles.presetBtnActive : ""
                    }`}
                    onClick={() => applyPreset("all")}
                  >
                    All Time
                  </button>
                </div>

                <div className={styles.dateInputsGrid}>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>Start Date (From)</label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={statementFrom}
                      onChange={(e) => {
                        setStatementFrom(e.target.value);
                        setStatementPreset("custom");
                      }}
                    />
                  </div>
                  <div className={styles.dateField}>
                    <label className={styles.dateLabel}>End Date (To)</label>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={statementTo}
                      onChange={(e) => {
                        setStatementTo(e.target.value);
                        setStatementPreset("custom");
                      }}
                    />
                  </div>
                </div>

                <div className={styles.statementPreviewBox}>
                  <div className={styles.previewHeader}>
                    <Calendar size={14} />
                    <span>Statement Period Summary</span>
                  </div>
                  <div className={styles.previewStats}>
                    <div className={styles.previewStatItem}>
                      <span className={styles.previewKey}>Period Range:</span>
                      <span className={styles.previewVal}>
                        {statementFrom} &nbsp;→&nbsp; {statementTo}
                      </span>
                    </div>
                    <div className={styles.previewStatItem}>
                      <span className={styles.previewKey}>Account Balance:</span>
                      <span className={styles.previewVal}>
                        {EARNINGS_SUMMARY.availableBalance}
                      </span>
                    </div>
                    <div className={styles.previewStatItem}>
                      <span className={styles.previewKey}>Total Payouts:</span>
                      <span className={styles.previewVal}>
                        {EARNINGS_SUMMARY.totalEarned}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsStatementModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={styles.downloadConfirmBtn}
                  onClick={handleDownloadStatement}
                >
                  <Download size={15} />
                  <span>Download Statement</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
