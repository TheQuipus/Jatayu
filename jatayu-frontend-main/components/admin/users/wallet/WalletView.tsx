"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  Calendar,
  Clock,
  CreditCard,
  Crown,
  FileText,
  History,
  Info,
  Lock,
  MessageSquare,
  PhoneCall,
  Plus,
  QrCode,
  RotateCcw,
  ShieldCheck,
  Video,
  Wallet,
  Zap,
} from "lucide-react";
import styles from "./WalletView.module.css";

type TransactionItem = {
  id: string;
  title: string;
  date: string;
  ref: string;
  amount: string;
  type: "added" | "spent" | "refunds";
  status: string;
  badgeClass: string;
  icon: any;
  iconBg: string;
  iconColor: string;
};

export default function WalletView() {
  // Wallet State
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [txFilter, setTxFilter] = useState<"all" | "added" | "spent" | "refunds">("all");

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount;

  // Mock Transactions List
  const transactions: TransactionItem[] = [
    {
      id: "tx-1",
      title: "Text Consultation — Rajan Mehta",
      date: "Jun 14, 2025 · 10:32 AM",
      ref: "Booking #JT-4821",
      amount: "-₹299",
      type: "spent",
      status: "Completed",
      badgeClass: styles.tagSuccess,
      icon: MessageSquare,
      iconBg: "rgba(59, 130, 246, 0.1)",
      iconColor: "#2563eb",
    },
    {
      id: "tx-2",
      title: "Wallet Top-up via UPI",
      date: "Jun 12, 2025 · 3:14 PM",
      ref: "Ref: UPI-9287831",
      amount: "+₹1,000",
      type: "added",
      status: "Success",
      badgeClass: styles.tagSuccess,
      icon: ArrowDownLeft,
      iconBg: "rgba(34, 197, 94, 0.1)",
      iconColor: "#16a34a",
    },
    {
      id: "tx-3",
      title: "Video Message — Sunita Rao",
      date: "Jun 10, 2025 · 6:45 PM",
      ref: "Booking #JT-4799",
      amount: "-₹499",
      type: "spent",
      status: "Completed",
      badgeClass: styles.tagSuccess,
      icon: Video,
      iconBg: "rgba(168, 85, 247, 0.1)",
      iconColor: "#9333ea",
    },
    {
      id: "tx-4",
      title: "Refund Credit — Cancelled Session",
      date: "Jun 8, 2025 · 11:00 AM",
      ref: "Case #RC-1124",
      amount: "+₹150",
      type: "refunds",
      status: "Credit Added",
      badgeClass: styles.tagOrange,
      icon: RotateCcw,
      iconBg: "rgba(234, 179, 8, 0.1)",
      iconColor: "#ca8a04",
    },
    {
      id: "tx-5",
      title: "Live Call — Arvind Kumar (30 min)",
      date: "Jun 5, 2025 · 4:00 PM",
      ref: "Booking #JT-4751",
      amount: "-₹899",
      type: "spent",
      status: "Completed",
      badgeClass: styles.tagSuccess,
      icon: PhoneCall,
      iconBg: "rgba(34, 197, 94, 0.1)",
      iconColor: "#16a34a",
    },
    {
      id: "tx-6",
      title: "Pro Plan Renewal — 1000 Credits Added",
      date: "Jun 1, 2025 · 12:00 AM",
      ref: "Sub #PRO-2025-08",
      amount: "1000 pts",
      type: "added",
      status: "Credits",
      badgeClass: styles.tagBlue,
      icon: Crown,
      iconBg: "rgba(99, 102, 241, 0.1)",
      iconColor: "#4f46e5",
    },
  ];

  const filteredTxs = transactions.filter((t) => {
    if (txFilter === "all") return true;
    return t.type === txFilter;
  });

  return (
    <div className={styles.walletView}>
      {/* 1. Header */}
      <div className={styles.walletHeaderRow}>
        <div>
          <div className={styles.breadcrumb}>My Account &gt; Wallet &amp; Credits</div>
          <h2 className={styles.walletPageTitle}>Wallet &amp; Credits</h2>
          <p className={styles.walletPageSubtitle}>Manage your balance, credits, and payment history</p>
        </div>
        <button type="button" className={styles.btnAddFundsTop} onClick={() => setSelectedAmount(500)}>
          <Plus size={16} /> Add Funds
        </button>
      </div>

      {/* 2. Top 3 Summary Cards */}
      <div className={styles.walletTopThreeGrid}>
        {/* Jatayu Wallet Main Card */}
        <div className={styles.walletJatayuCard}>
          <div className={styles.cardTopRow}>
            <span className={styles.cardLabelTag}>
              <Wallet size={16} /> JATAYU WALLET
            </span>
            <span className={styles.statusActiveTag}>● Active</span>
          </div>
          <div>
            <h2 className={styles.bigBalance}>₹2,450.00</h2>
            <span className={styles.balanceSubtext}>Available wallet balance</span>
          </div>
          <div className={styles.cardBtnGroup}>
            <button type="button" className={styles.btnWhitePill} onClick={() => setSelectedAmount(500)}>
              <Plus size={14} /> Add Money
            </button>
            <button type="button" className={styles.btnOutlineDark} onClick={() => setTxFilter("all")}>
              <History size={14} /> History
            </button>
          </div>
        </div>

        {/* Pro Credits Card */}
        <div className={styles.walletProCreditsCard}>
          <span className={styles.proCreditsTag}>Pro Credits</span>
          <div>
            <h3 className={styles.creditValueBig}>320</h3>
            <span className={styles.creditSub}>Credits available</span>
          </div>
          <div className={styles.creditExpiry}>
            <Clock size={12} /> Expires Jan 31, 2028
          </div>
        </div>

        {/* Refund Credits Card */}
        <div className={styles.walletRefundCreditsCard}>
          <span className={styles.refundCreditsTag}>Refund Credits</span>
          <div>
            <h3 className={styles.refundValueBig}>₹150.00</h3>
            <span className={styles.creditSub} style={{ color: "#166534" }}>Refund credit balance</span>
          </div>
          <div className={styles.creditExpiry} style={{ color: "#15803d" }}>
            <Clock size={12} /> Expires Mar 15, 2028
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Subscription Credits & Add Funds */}
      <div className={styles.walletMidGrid}>
        {/* Subscription Credit Details */}
        <div className={styles.subscriptionCard}>
          <div className={styles.subHeaderRow}>
            <div className={styles.subTitleGroup}>
              <Crown size={20} style={{ color: "#8b5cf6" }} />
              <div>
                <h3 className={styles.subTitle}>Subscription Credit Details</h3>
                <p className={styles.subSubtitle}>Jatayu 7 Pro — Monthly Plan</p>
              </div>
            </div>
            <span className={styles.statusActiveTag} style={{ background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed", borderColor: "rgba(139, 92, 246, 0.3)" }}>
              ● Active
            </span>
          </div>

          <div className={styles.progressWrap}>
            <div className={styles.progressMeta}>
              <span>Monthly Credits Used</span>
              <span>680 / 1000 credits</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: "68%" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--dove-gray)" }}>
              <span>320 credits remaining this cycle</span>
              <span>Resets Jul 1, 2025</span>
            </div>
          </div>

          <div className={styles.usageBreakdownGrid}>
            <div className={styles.usageMiniCard}>
              <div className={styles.usageMiniHeader}>
                <MessageSquare size={14} style={{ color: "#3b82f6" }} /> Text Sessions
              </div>
              <div className={styles.usageMiniVal}>250 <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--dove-gray)" }}>used</span></div>
              <div className={styles.usageMiniBar}>
                <div className={styles.miniBarFillBlue} />
              </div>
            </div>

            <div className={styles.usageMiniCard}>
              <div className={styles.usageMiniHeader}>
                <Video size={14} style={{ color: "#a855f7" }} /> Video Messages
              </div>
              <div className={styles.usageMiniVal}>280 <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--dove-gray)" }}>used</span></div>
              <div className={styles.usageMiniBar}>
                <div className={styles.miniBarFillPurple} />
              </div>
            </div>

            <div className={styles.usageMiniCard}>
              <div className={styles.usageMiniHeader}>
                <PhoneCall size={14} style={{ color: "#22c55e" }} /> Live Calls
              </div>
              <div className={styles.usageMiniVal}>150 <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--dove-gray)" }}>used</span></div>
              <div className={styles.usageMiniBar}>
                <div className={styles.miniBarFillGreen} />
              </div>
            </div>
          </div>

          <div className={styles.planRenewalBanner}>
            <div>
              <div className={styles.renewalText}>Plan renews on July 1, 2025</div>
              <div className={styles.renewalSub}>₹999/month · Auto-renewal enabled</div>
            </div>
            <button type="button" className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px" }}>
              Manage Plan
            </button>
          </div>
        </div>

        {/* Add Funds Form Card */}
        <div className={styles.addFundsCard}>
          <div className={styles.addFundsHeader}>
            <div className={styles.addFundsIcon}>
              <Plus size={16} />
            </div>
            <div>
              <h3 className={styles.subTitle}>Add Funds</h3>
              <p className={styles.subSubtitle}>Top up your wallet instantly</p>
            </div>
          </div>

          <div className={styles.chipGrid}>
            {[100, 250, 500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                type="button"
                className={`${styles.amountChip} ${selectedAmount === amt && !customAmount ? styles.amountChipActive : ""}`}
                onClick={() => {
                  setSelectedAmount(amt);
                  setCustomAmount("");
                }}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className={styles.customInputWrap}>
            <input
              type="number"
              className={styles.customInput}
              placeholder="₹ Enter custom amount"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>

          <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--dove-gray)", marginTop: "4px" }}>
            Payment Method
          </div>

          <div className={styles.paymentOptionList}>
            <div
              className={`${styles.paymentOption} ${paymentMethod === "upi" ? styles.paymentOptionSelected : ""}`}
              onClick={() => setPaymentMethod("upi")}
            >
              <input type="radio" checked={paymentMethod === "upi"} readOnly />
              <QrCode size={16} style={{ color: "#2563eb" }} />
              <span>UPI / QR Code</span>
            </div>

            <div
              className={`${styles.paymentOption} ${paymentMethod === "card" ? styles.paymentOptionSelected : ""}`}
              onClick={() => setPaymentMethod("card")}
            >
              <input type="radio" checked={paymentMethod === "card"} readOnly />
              <CreditCard size={16} style={{ color: "#7c3aed" }} />
              <span>Card / Net Banking</span>
            </div>
          </div>

          <button type="button" className={styles.payNowBtn}>
            <Zap size={16} /> Pay ₹{finalAmount.toLocaleString("en-IN")} Now
          </button>

          <div style={{ fontSize: "11px", color: "var(--dove-gray)", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
            <Lock size={12} /> Secured by Razorpay · GST as applicable
          </div>
        </div>
      </div>

      {/* 4. Lower Grid: Credit Usage Donut & Transaction History */}
      <div className={styles.walletLowerGrid}>
        {/* Credit Usage Donut Card */}
        <div className={styles.creditUsageCard}>
          <div style={{ width: "100%", textAlign: "left" }}>
            <h3 className={styles.subTitle}>Credit Usage</h3>
            <p className={styles.subSubtitle}>This billing cycle</p>
          </div>

          <div className={styles.donutContainer}>
            <svg width="170" height="170" viewBox="0 0 42 42">
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray="25 75" strokeDashoffset="25" />
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#a855f7" strokeWidth="6" strokeDasharray="28 72" strokeDashoffset="0" />
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#22c55e" strokeWidth="6" strokeDasharray="15 85" strokeDashoffset="-28" />
              <circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#e2e8f0" strokeWidth="6" strokeDasharray="32 68" strokeDashoffset="-43" />
            </svg>

            <div className={styles.donutCenterText}>
              <div className={styles.donutCenterVal}>680</div>
              <div className={styles.donutCenterLabel}>used</div>
            </div>
          </div>

          <div className={styles.legendList}>
            <div className={styles.legendItem}>
              <div className={styles.legendLeft}>
                <div className={styles.colorDot} style={{ background: "#3b82f6" }} />
                <span>Text Sessions</span>
              </div>
              <span className={styles.legendVal}>250 credits</span>
            </div>

            <div className={styles.legendItem}>
              <div className={styles.legendLeft}>
                <div className={styles.colorDot} style={{ background: "#a855f7" }} />
                <span>Video Messages</span>
              </div>
              <span className={styles.legendVal}>280 credits</span>
            </div>

            <div className={styles.legendItem}>
              <div className={styles.legendLeft}>
                <div className={styles.colorDot} style={{ background: "#22c55e" }} />
                <span>Live Calls</span>
              </div>
              <span className={styles.legendVal}>150 credits</span>
            </div>

            <div className={styles.legendItem}>
              <div className={styles.legendLeft}>
                <div className={styles.colorDot} style={{ background: "#cbd5e1" }} />
                <span>Remaining</span>
              </div>
              <span className={styles.legendVal}>320 credits</span>
            </div>
          </div>
        </div>

        {/* Transaction History Card */}
        <div className={styles.txCard}>
          <div className={styles.txHeaderRow}>
            <div>
              <h3 className={styles.subTitle}>Transaction History</h3>
              <p className={styles.subSubtitle}>All wallet activity</p>
            </div>

            <div className={styles.txTabs}>
              {(["all", "added", "spent", "refunds"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.txTab} ${txFilter === tab ? styles.txTabActive : ""}`}
                  onClick={() => setTxFilter(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.txList}>
            {filteredTxs.map((tx) => {
              const Icon = tx.icon;
              return (
                <div key={tx.id} className={styles.txItem}>
                  <div className={styles.txLeft}>
                    <div className={styles.txIcon} style={{ background: tx.iconBg, color: tx.iconColor }}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className={styles.txTitle}>{tx.title}</div>
                      <div className={styles.txSubtitle}>
                        <Calendar size={11} style={{ display: "inline", verticalAlign: "middle" }} /> {tx.date} · {tx.ref}
                      </div>
                    </div>
                  </div>

                  <div className={styles.txRight}>
                    <span className={tx.amount.startsWith("+") ? styles.txAmountPos : styles.txAmountNeg}>
                      {tx.amount}
                    </span>
                    <span className={tx.badgeClass}>{tx.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--sand-light)" }}>
            <span style={{ fontSize: "12px", color: "var(--dove-gray)" }}>Showing {filteredTxs.length} of 24 transactions</span>
            <button type="button" style={{ background: "none", border: "none", color: "var(--tango)", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
              View All Transactions →
            </button>
          </div>
        </div>
      </div>

      {/* 5. Wallet Rules & Policies */}
      <div className={styles.walletPoliciesCard}>
        <div className={styles.policyTitle}>
          <Info size={16} style={{ color: "#ca8a04" }} /> Wallet Rules &amp; Policies
        </div>
        <p className={styles.subSubtitle}>Important information about credits and wallet usage</p>

        <div className={styles.policiesGrid}>
          <div className={styles.policyBox}>
            <div className={styles.policyTitle}>
              <Clock size={14} style={{ color: "#3b82f6" }} /> Credit Expiry
            </div>
            <div className={styles.policyDesc}>
              Pro credits expire at the end of each billing cycle. Unused credits do not roll over to the next month.
            </div>
          </div>

          <div className={styles.policyBox}>
            <div className={styles.policyTitle}>
              <RotateCcw size={14} style={{ color: "#22c55e" }} /> Refund Credits
            </div>
            <div className={styles.policyDesc}>
              Refund credits are valid for 90 days from issue date and can be used for any future consultation.
            </div>
          </div>

          <div className={styles.policyBox}>
            <div className={styles.policyTitle}>
              <Wallet size={14} style={{ color: "#a855f7" }} /> Wallet Balance
            </div>
            <div className={styles.policyDesc}>
              Wallet funds are non-withdrawable and can only be used for bookings within Jatayu 7 platform.
            </div>
          </div>

          <div className={styles.policyBox}>
            <div className={styles.policyTitle}>
              <FileText size={14} style={{ color: "#ca8a04" }} /> GST &amp; Invoices
            </div>
            <div className={styles.policyDesc}>
              GST is applicable on all transactions. Invoices are available for download from your transaction history.
            </div>
          </div>

          <div className={styles.policyBox}>
            <div className={styles.policyTitle}>
              <ShieldCheck size={14} style={{ color: "#ef4444" }} /> Secure Payments
            </div>
            <div className={styles.policyDesc}>
              All transactions are encrypted and processed via RBI-compliant payment gateways including UPI and cards.
            </div>
          </div>

          <div className={styles.policyBox}>
            <div className={styles.policyTitle}>
              <MessageSquare size={14} style={{ color: "#06b6d4" }} /> WhatsApp Alerts
            </div>
            <div className={styles.policyDesc}>
              Receive instant payment confirmations and credit alerts on your registered WhatsApp number.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
