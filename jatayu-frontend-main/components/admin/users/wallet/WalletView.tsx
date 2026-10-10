"use client";

import { useMemo, useState } from "react";
import { ArrowDownLeft, Calendar, Clock, FileText, Info, MessageSquare, PhoneCall, Plus, RotateCcw, ShieldCheck, Video, Wallet } from "lucide-react";
import type { AdminSeekerDetail } from "@/lib/adminSeekerApi";
import { grantAdminSeekerCredits } from "@/lib/adminSeekerApi";
import styles from "./WalletView.module.css";

type WalletViewProps = {
  seekerId?: string;
  credits?: AdminSeekerDetail["credits"];
  onCreditsAdded?: () => Promise<void> | void;
};

type Filter = "all" | "added" | "spent" | "refunds";

export default function WalletView({ seekerId, credits, onCreditsAdded }: WalletViewProps) {
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [customAmount, setCustomAmount] = useState("");
  const [txFilter, setTxFilter] = useState<Filter>("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const finalAmount = customAmount ? Number(customAmount) || 0 : selectedAmount;
  const transactions = credits?.transactions ?? [];
  const balance = credits?.balance ?? 0;
  const earned = credits?.earned ?? 0;
  const spent = credits?.spent ?? 0;
  const refunded = credits?.refunded ?? 0;
  const onboardingEarned = transactions.filter((item) => item.source === "onboarding").reduce((total, item) => total + Math.max(0, item.amount), 0);
  const reviewEarned = transactions.filter((item) => item.source === "booking_review").reduce((total, item) => total + Math.max(0, item.amount), 0);
  const bookingSpent = transactions.filter((item) => item.source === "booking").reduce((total, item) => total + Math.abs(Math.min(0, item.amount)), 0);
  const transactionItems = useMemo(() => transactions.map((item) => {
    const isRefund = item.amount > 0 && item.source.includes("refund");
    const type: Exclude<Filter, "all"> = item.amount < 0 ? "spent" : (isRefund ? "refunds" : "added");
    const Icon = type === "spent" ? Video : type === "refunds" ? RotateCcw : ArrowDownLeft;
    const color = type === "spent" ? "#9333ea" : type === "refunds" ? "#ca8a04" : "#16a34a";
    const background = type === "spent" ? "rgba(168, 85, 247, 0.1)" : type === "refunds" ? "rgba(234, 179, 8, 0.1)" : "rgba(34, 197, 94, 0.1)";
    return { ...item, type, Icon, color, background, date: new Date(item.createdAt).toLocaleString("en-IN"), title: item.description || item.source.replace(/_/g, " "), amountLabel: (item.amount > 0 ? "+" : "") + item.amount + " credits" };
  }), [transactions]);
  const filteredTransactions = transactionItems.filter((item) => txFilter === "all" || item.type === txFilter);
  const usedPercent = earned > 0 ? Math.min(100, Math.round((spent / earned) * 100)) : 0;

  const addCredits = async () => {
    if (saving) return;
    if (!seekerId || !Number.isInteger(finalAmount) || finalAmount < 1 || finalAmount > 100000) { setError("Enter a whole credit amount between 1 and 100000."); return; }
    setSaving(true); setError("");
    try {
      await grantAdminSeekerCredits(seekerId, finalAmount);
      setCustomAmount("");
      try { await onCreditsAdded?.(); }
      catch { setError("Credits were added. Reload the page to refresh the balance; do not add them again."); }
    }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to add credits"); }
    finally { setSaving(false); }
  };

  return (
    <div className={styles.walletView}>
      <div className={styles.walletHeaderRow}><div><h2 className={styles.walletPageTitle}>Wallet &amp; Credits</h2><p className={styles.walletPageSubtitle}>Credit balance and ledger history for this seeker</p></div></div>
      <div className={styles.walletTopThreeGrid}>
        <div className={styles.walletJatayuCard}><div className={styles.cardTopRow}><span className={styles.cardLabelTag}><Wallet size={16} /> JATAYU CREDITS</span><span className={styles.statusActiveTag}>● Active</span></div><div><h2 className={styles.bigBalance}>{balance.toLocaleString("en-IN")}</h2><span className={styles.balanceSubtext}>Available credit balance</span></div><div className={styles.cardBtnGroup}><button type="button" className={styles.btnWhitePill} onClick={() => setSelectedAmount(500)}><Plus size={14} /> Add Credits</button></div></div>
        <div className={styles.walletProCreditsCard}><span className={styles.proCreditsTag}>Credits Earned</span><div><h3 className={styles.creditValueBig}>{earned.toLocaleString("en-IN")}</h3><span className={styles.creditSub}>Ledger credits issued</span></div><div className={styles.creditExpiry}><Clock size={12} /> No expiry configured</div></div>
        <div className={styles.walletRefundCreditsCard}><span className={styles.refundCreditsTag}>Refund Credits</span><div><h3 className={styles.refundValueBig}>{refunded.toLocaleString("en-IN")}</h3><span className={styles.creditSub} style={{ color: "#166534" }}>Returned after bookings</span></div><div className={styles.creditExpiry} style={{ color: "#15803d" }}><Clock size={12} /> Based on credit ledger</div></div>
      </div>
      <div className={styles.walletMidGrid}>
        <div className={styles.subscriptionCard}>
          <div className={styles.subHeaderRow}><div className={styles.subTitleGroup}><Wallet size={20} style={{ color: "#8b5cf6" }} /><div><h3 className={styles.subTitle}>Credit Ledger Summary</h3><p className={styles.subSubtitle}>Actual earned and used credits</p></div></div><span className={styles.statusActiveTag} style={{ background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed", borderColor: "rgba(139, 92, 246, 0.3)" }}>● Current</span></div>
          <div className={styles.progressWrap}><div className={styles.progressMeta}><span>Credits Used</span><span>{spent} / {earned} credits</span></div><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: usedPercent + "%" }} /></div><div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", color: "var(--dove-gray)" }}><span>{balance} credits currently available</span><span>No subscription cycle</span></div></div>
          <div className={styles.usageBreakdownGrid}><div className={styles.usageMiniCard}><div className={styles.usageMiniHeader}><MessageSquare size={16} style={{ color: "#3b82f6" }} /> Onboarding</div><div className={styles.usageMiniVal}>{onboardingEarned} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--dove-gray)" }}>earned</span></div></div><div className={styles.usageMiniCard}><div className={styles.usageMiniHeader}><Video size={16} style={{ color: "#a855f7" }} /> Reviews</div><div className={styles.usageMiniVal}>{reviewEarned} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--dove-gray)" }}>earned</span></div></div><div className={styles.usageMiniCard}><div className={styles.usageMiniHeader}><PhoneCall size={16} style={{ color: "#22c55e" }} /> Bookings</div><div className={styles.usageMiniVal}>{bookingSpent} <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--dove-gray)" }}>used</span></div></div></div>
        </div>
        <div className={styles.addFundsCard}><div className={styles.addFundsHeader}><div className={styles.addFundsIcon}><Plus size={16} /></div><div><h3 className={styles.subTitle}>Add Credits</h3><p className={styles.subSubtitle}>Add an auditable credit adjustment for this seeker</p></div></div><div className={styles.chipGrid}>{[100,250,500,1000,2000,5000].map((amount) => <button key={amount} type="button" className={styles.amountChip + " " + (selectedAmount === amount && !customAmount ? styles.amountChipActive : "")} onClick={() => { setSelectedAmount(amount); setCustomAmount(""); }}>+{amount}</button>)}</div><div className={styles.customInputWrap}><input type="number" className={styles.customInput} placeholder="Enter custom credit amount" value={customAmount} onChange={(event) => setCustomAmount(event.target.value)} /></div>{error && <p className={styles.subSubtitle} style={{ color: "#dc2626" }}>{error}</p>}<button type="button" className={styles.payNowBtn} disabled={saving || !seekerId} onClick={addCredits}><Plus size={16} /> {saving ? "Adding credits..." : "Add " + finalAmount.toLocaleString("en-IN") + " Credits"}</button></div>
      </div>
      <div className={styles.walletLowerGrid}>
        <div className={styles.creditUsageCard}><div style={{ width: "100%", textAlign: "left" }}><h3 className={styles.subTitle}>Credit Usage</h3><p className={styles.subSubtitle}>All recorded credit activity</p></div><div className={styles.donutContainer}><svg width="170" height="170" viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="6" /><circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#a855f7" strokeWidth="6" strokeDasharray={usedPercent + " " + (100 - usedPercent)} strokeDashoffset="25" /></svg><div className={styles.donutCenterText}><div className={styles.donutCenterVal}>{spent}</div><div className={styles.donutCenterLabel}>used</div></div></div><div className={styles.legendList}><div className={styles.legendItem}><div className={styles.legendLeft}><div className={styles.colorDot} style={{ background: "#a855f7" }} /><span>Used for bookings</span></div><span className={styles.legendVal}>{spent} credits</span></div><div className={styles.legendItem}><div className={styles.legendLeft}><div className={styles.colorDot} style={{ background: "#cbd5e1" }} /><span>Available</span></div><span className={styles.legendVal}>{balance} credits</span></div></div></div>
        <div className={styles.txCard}><div className={styles.txHeaderRow}><div><h3 className={styles.subTitle}>Transaction History</h3><p className={styles.subSubtitle}>Recorded credit ledger entries</p></div><div className={styles.txTabs}>{(["all","added","spent","refunds"] as const).map((tab) => <button key={tab} type="button" className={styles.txTab + " " + (txFilter === tab ? styles.txTabActive : "")} onClick={() => setTxFilter(tab)}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>)}</div></div><div className={styles.txList}>{filteredTransactions.map((transaction) => { const Icon = transaction.Icon; return <div key={transaction.id} className={styles.txItem}><div className={styles.txLeft}><div className={styles.txIcon} style={{ background: transaction.background, color: transaction.color }}><Icon size={18} /></div><div><div className={styles.txTitle}>{transaction.title}</div><div className={styles.txSubtitle}><Calendar size={13} style={{ display: "inline", verticalAlign: "middle" }} /> {transaction.date} · Ref: {transaction.reference}</div></div></div><div className={styles.txRight}><span className={transaction.amount > 0 ? styles.txAmountPos : styles.txAmountNeg}>{transaction.amountLabel}</span><span className={transaction.type === "refunds" ? styles.tagOrange : styles.tagSuccess}>{transaction.type === "spent" ? "Used" : transaction.type === "refunds" ? "Refunded" : "Added"}</span></div></div>; })}</div><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--sand-light)" }}><span style={{ fontSize: "14px", color: "var(--dove-gray)" }}>Showing {filteredTransactions.length} of {transactions.length} transactions</span></div></div>
      </div>
      <div className={styles.walletPoliciesCard}><div className={styles.policyTitle}><Info size={16} style={{ color: "#ca8a04" }} /> Credit Ledger Information</div><p className={styles.subSubtitle}>Credits are recorded per transaction and their current balance is shown above.</p><div className={styles.policiesGrid}><div className={styles.policyBox}><div className={styles.policyTitle}><RotateCcw size={14} style={{ color: "#22c55e" }} /> Booking Refunds</div><div className={styles.policyDesc}>Declined bookings return any credits used through a separate refund ledger entry.</div></div><div className={styles.policyBox}><div className={styles.policyTitle}><FileText size={14} style={{ color: "#ca8a04" }} /> Audit Trail</div><div className={styles.policyDesc}>Every issued, used, or refunded credit is retained in this seeker’s transaction history.</div></div><div className={styles.policyBox}><div className={styles.policyTitle}><ShieldCheck size={14} style={{ color: "#ef4444" }} /> Admin Adjustments</div><div className={styles.policyDesc}>Credits added here are recorded with the administrator who issued them.</div></div></div></div>
    </div>
  );
}
