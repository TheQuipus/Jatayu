"use client";

import {
  Award,
  Ban,
  Bell,
  CheckCircle2,
  ChevronRight,
  Mail,
  MessageSquare,
  Phone,
  Settings,
  Shield,
  Wallet,
} from "lucide-react";
import type { ExpertUser, SeekerUser } from "@/lib/adminUserManagement";
import styles from "./ProfileRightSidebar.module.css";

type ProfileRightSidebarProps = {
  user: ExpertUser | SeekerUser;
  status: string;
  setActiveTab: (tab: string) => void;
  handleToggleStatus: () => void;
};

export default function ProfileRightSidebar({
  user,
  status,
  setActiveTab,
  handleToggleStatus,
}: ProfileRightSidebarProps) {
  return (
    <aside className={styles.sidebarRight}>
      {/* Wallet Balance Card */}
      <div className={styles.walletCard}>
        <div className={styles.walletHeader}>
          <span className={styles.walletTag}>Wallet Balance</span>
          <div className={styles.walletIconBox}>
            <Wallet size={16} />
          </div>
        </div>
        <h2 className={styles.walletAmount}>₹2,450</h2>
        <p className={styles.walletSub}>+ 120 credits available</p>

        <div className={styles.walletActions}>
          <button type="button" className={styles.walletBtnAdd} onClick={() => setActiveTab("wallet")}>
            Add Credits
          </button>
        </div>
      </div>



      {/* Trust & Safety Card */}
      <div className={styles.actionCard}>
        <div className={styles.navCardTitle} style={{ paddingLeft: 0 }}>Trust &amp; Safety</div>
        <div className={styles.trustList}>
          <div className={styles.trustItem}>
            <div className={styles.trustMeta}>
              <div className={styles.trustIcon}>
                <Phone size={14} />
              </div>
              <div>
                <div className={styles.trustTitle}>Phone Verified</div>
                <div className={styles.trustDetail}>{user.phone || "+91 98765 XXXXX"}</div>
              </div>
            </div>
            <CheckCircle2 size={16} className={styles.trustCheck} />
          </div>

          <div className={styles.trustItem}>
            <div className={styles.trustMeta}>
              <div className={styles.trustIcon}>
                <Mail size={14} />
              </div>
              <div>
                <div className={styles.trustTitle}>Email Linked</div>
                <div className={styles.trustDetail}>{user.email}</div>
              </div>
            </div>
            <CheckCircle2 size={16} className={styles.trustCheck} />
          </div>

          <div className={styles.trustItem}>
            <div className={styles.trustMeta}>
              <div className={styles.trustIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#2563eb" }}>
                <MessageSquare size={14} />
              </div>
              <div>
                <div className={styles.trustTitle}>WhatsApp Alerts</div>
                <div className={styles.trustDetail}>Enabled</div>
              </div>
            </div>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--tango)" }}>Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
