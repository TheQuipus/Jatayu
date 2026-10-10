"use client";

import { Award, CheckCircle2, Mail, MessageSquare, Phone, Wallet } from "lucide-react";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import type { AdminSeekerDetail } from "@/lib/adminSeekerApi";
import styles from "./ProfileRightSidebar.module.css";

type ProfileRightSidebarProps = {
  user: ExpertUser | SeekerUser;
  status: string;
  setActiveTab: (tab: string) => void;
  handleToggleStatus: () => void;
  seekerDetail?: AdminSeekerDetail | null;
};

export default function ProfileRightSidebar({ user, setActiveTab, seekerDetail }: ProfileRightSidebarProps) {
  const isSeeker = "preferredCategory" in user || "totalSpent" in user;
  const seeker = isSeeker ? (user as SeekerUser) : undefined;
  const verification = seekerDetail?.verification;
  const creditBalance = seeker?.walletBalance ?? 0;
  const verificationStatus = (verified: boolean) => verified
    ? <CheckCircle2 size={16} className={styles.trustCheck} />
    : <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--dove-gray)" }}>Not verified</span>;

  return (
    <aside className={styles.sidebarRight}>
      <div className={styles.walletCard}>
        <div className={styles.walletHeader}>
          <span className={styles.walletTag}>{isSeeker ? "Wallet Credits" : "Wallet Balance"}</span>
          <div className={styles.walletIconBox}><Wallet size={16} /></div>
        </div>
        <h2 className={styles.walletAmount}>{isSeeker ? creditBalance.toLocaleString("en-IN") : "—"}</h2>
        <p className={styles.walletSub}>{isSeeker ? creditBalance.toLocaleString("en-IN") + " credits available" : "No balance data"}</p>
        <div className={styles.walletActions}>
          <button type="button" className={styles.walletBtnAdd} onClick={() => setActiveTab("wallet")}>
            {isSeeker ? "View Credits" : "View Wallet"}
          </button>
        </div>
      </div>

      {isSeeker && seeker && (
        <div className={styles.actionCard}>
          <div className={styles.navCardTitle} style={{ paddingLeft: 0 }}>Onboarding Snapshot</div>
          <div className={styles.trustList}>
            <div className={styles.trustItem}>
              <div className={styles.trustMeta}>
                <div className={styles.trustIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#059669" }}><Award size={14} /></div>
                <div><div className={styles.trustTitle}>Onboarding Status</div><div className={styles.trustDetail}>{seeker.onboardingComplete ? "Complete" : "In Progress"}</div></div>
              </div>
              {seeker.onboardingComplete && <CheckCircle2 size={16} className={styles.trustCheck} />}
            </div>
            {seeker.budgetTier && (
              <div className={styles.trustItem}>
                <div className={styles.trustMeta}>
                  <div className={styles.trustIcon} style={{ background: "rgba(230, 81, 0, 0.1)", color: "var(--tango)" }}><Wallet size={14} /></div>
                  <div><div className={styles.trustTitle}>Budget Preference</div><div className={styles.trustDetail}>{seeker.budgetTier}</div></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={styles.actionCard}>
        <div className={styles.navCardTitle} style={{ paddingLeft: 0 }}>Trust &amp; Safety</div>
        <div className={styles.trustList}>
          <div className={styles.trustItem}>
            <div className={styles.trustMeta}><div className={styles.trustIcon}><Phone size={14} /></div><div><div className={styles.trustTitle}>Phone Verified</div><div className={styles.trustDetail}>{user.phone || "Not provided"}</div></div></div>
            {isSeeker ? verificationStatus(Boolean(verification?.phoneVerified)) : <CheckCircle2 size={16} className={styles.trustCheck} />}
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustMeta}><div className={styles.trustIcon}><Mail size={14} /></div><div><div className={styles.trustTitle}>Email Linked</div><div className={styles.trustDetail}>{user.email}</div></div></div>
            {isSeeker ? verificationStatus(Boolean(verification?.emailVerified)) : <CheckCircle2 size={16} className={styles.trustCheck} />}
          </div>
          <div className={styles.trustItem}>
            <div className={styles.trustMeta}><div className={styles.trustIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563eb" }}><MessageSquare size={14} /></div><div><div className={styles.trustTitle}>{isSeeker ? "In-app Notifications" : "WhatsApp Alerts"}</div><div className={styles.trustDetail}>{isSeeker ? (seekerDetail?.notifications.unreadCount ?? 0) + " unread" : "Enabled"}</div></div></div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--tango)" }}>{isSeeker ? "Current" : "Active"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
