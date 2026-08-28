"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  Download,
  FileText,
  Globe,
  KeyRound,
  Laptop,
  Lock,
  LogOut,
  Moon,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
  Volume2,
} from "lucide-react";
import styles from "./SettingsView.module.css";

export default function SettingsView() {
  // State variables for interactive settings controls
  const [profileVisibility, setProfileVisibility] = useState("everyone");
  const [showBookingActivity, setShowBookingActivity] = useState(true);
  const [showReviewsGiven, setShowReviewsGiven] = useState(false);
  const [personalisationData, setPersonalisationData] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);
  const [interfaceLanguage, setInterfaceLanguage] = useState("english");
  const [cityState, setCityState] = useState("mumbai");

  // Notification Toggles State
  const [notifState, setNotifState] = useState({
    bookingReminders: { sms: true, email: true, push: true },
    expertReplies: { sms: true, email: true, push: true },
    paymentAlerts: { sms: true, email: true, push: false },
    expertUpdates: { sms: false, email: true, push: true },
    offersPromotions: { sms: false, email: false, push: false },
  });

  const toggleNotif = (type: keyof typeof notifState, channel: "sms" | "email" | "push") => {
    setNotifState((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel],
      },
    }));
  };

  return (
    <div className={styles.settingsView}>
      {/* 1. Top Header Row */}
      <div className={styles.settingsHeaderRow}>
        <div>
          <h2 className={styles.settingsPageTitle}>Account Settings</h2>
          <p className={styles.settingsPageSubtitle}>
            Manage your privacy, security, language, notifications, and subscription
          </p>
        </div>

        <button type="button" className={styles.btnSaveSettingsTop}>
          <Save size={15} /> Save Changes
        </button>
      </div>

      {/* 2. Main 2-Column Grid Layout */}
      <div className={styles.settingsGrid}>
        {/* Left Column: Main Settings Cards */}
        <div className={styles.settingsLeftCol}>
          {/* Privacy Card */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <Shield size={18} style={{ color: "var(--tango)" }} />
              <div>
                <h3 className={styles.subTitle}>Privacy</h3>
                <p className={styles.subSubtitle}>Control who sees your profile and activity</p>
              </div>
            </div>

            <div className={styles.settingsGroup}>
              {/* Profile Visibility */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Profile Visibility</div>
                  <div className={styles.settingDesc}>Who can discover your profile on Jatayu</div>
                </div>
                <select
                  className={styles.settingSelect}
                  value={profileVisibility}
                  onChange={(e) => setProfileVisibility(e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="saved_experts">Saved Experts Only</option>
                  <option value="private">Private</option>
                </select>
              </div>

              {/* Show Booking Activity */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Show Booking Activity</div>
                  <div className={styles.settingDesc}>Allow experts to see your past consultation topics</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${showBookingActivity ? styles.toggleOn : ""}`}
                  onClick={() => setShowBookingActivity(!showBookingActivity)}
                >
                  <div className={styles.toggleKnob} />
                </button>
              </div>

              {/* Show Reviews Given */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Show Reviews Given</div>
                  <div className={styles.settingDesc}>Make your expert ratings visible publicly</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${showReviewsGiven ? styles.toggleOn : ""}`}
                  onClick={() => setShowReviewsGiven(!showReviewsGiven)}
                >
                  <div className={styles.toggleKnob} />
                </button>
              </div>

              {/* Personalisation Data Sharing */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Personalisation Data Sharing</div>
                  <div className={styles.settingDesc}>Allow Jatayu to use your activity for better recommendations</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${personalisationData ? styles.toggleOn : ""}`}
                  onClick={() => setPersonalisationData(!personalisationData)}
                >
                  <div className={styles.toggleKnob} />
                </button>
              </div>

              {/* Blocked Users */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Blocked Users</div>
                  <div className={styles.settingDesc}>Manage users you&apos;ve blocked from contacting you</div>
                </div>
                <button type="button" className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  View List →
                </button>
              </div>

              {/* Download My Data */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Download My Data</div>
                  <div className={styles.settingDesc}>Export a copy of all your Jatayu data</div>
                </div>
                <button type="button" className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  <Download size={13} /> Request Export
                </button>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <Lock size={18} style={{ color: "var(--tango)" }} />
              <div>
                <h3 className={styles.subTitle}>Security</h3>
                <p className={styles.subSubtitle}>Manage login, OTP, and active sessions</p>
              </div>
              <span className={styles.openBadge} style={{ background: "rgba(34, 197, 94, 0.12)", color: "#15803d", marginLeft: "auto" }}>
                Secure
              </span>
            </div>

            <div className={styles.settingsGroup}>
              {/* Registered Phone */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Registered Phone</div>
                  <div className={styles.settingMetaRow}>
                    <span>+91 98785 *****</span>
                    <span className={styles.tagVerified}>Verified</span>
                  </div>
                </div>
                <button type="button" className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  Change Number
                </button>
              </div>

              {/* Email Address */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Email Address</div>
                  <div className={styles.settingMetaRow}>
                    <span>priya.sharma@gmail.com</span>
                    <span className={styles.tagOrange}>Unverified</span>
                  </div>
                </div>
                <button type="button" className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px", color: "#2563eb" }}>
                  Verify
                </button>
              </div>

              {/* Two-Factor Authentication */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Two-Factor Authentication</div>
                  <div className={styles.settingDesc}>Require OTP for every login attempt</div>
                </div>
                <button
                  type="button"
                  className={`${styles.toggleSwitch} ${twoFactorAuth ? styles.toggleOn : ""}`}
                  onClick={() => setTwoFactorAuth(!twoFactorAuth)}
                >
                  <div className={styles.toggleKnob} />
                </button>
              </div>

              {/* Active Sessions */}
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div>
                    <div className={styles.settingLabel}>Active Sessions</div>
                    <div className={styles.settingDesc}>Devices currently logged into your account</div>
                  </div>
                  <button type="button" style={{ background: "none", border: "none", color: "#dc2626", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                    Logout All
                  </button>
                </div>

                <div className={styles.sessionList}>
                  <div className={styles.sessionItem}>
                    <div className={styles.sessionLeft}>
                      <Laptop size={16} style={{ color: "#2563eb" }} />
                      <div>
                        <div className={styles.sessionName}>Chrome on Windows · Mumbai</div>
                        <div className={styles.sessionSub}>Active now · This device</div>
                      </div>
                    </div>
                    <span className={styles.activeDotGreen}>●</span>
                  </div>

                  <div className={styles.sessionItem}>
                    <div className={styles.sessionLeft}>
                      <Smartphone size={16} style={{ color: "var(--dove-gray)" }} />
                      <div>
                        <div className={styles.sessionName}>Safari on iPhone · Pune</div>
                        <div className={styles.sessionSub}>2 days ago</div>
                      </div>
                    </div>
                    <button type="button" style={{ background: "none", border: "none", color: "#dc2626", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>

              {/* Login History */}
              <div className={styles.settingRow} style={{ borderBottom: "none" }}>
                <div>
                  <div className={styles.settingLabel}>Login History</div>
                  <div className={styles.settingDesc}>View recent sign-in activity for your account</div>
                </div>
                <button type="button" className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  View History →
                </button>
              </div>
            </div>
          </div>

          {/* Language & Region Card */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <Globe size={18} style={{ color: "var(--tango)" }} />
              <div>
                <h3 className={styles.subTitle}>Language &amp; Region</h3>
                <p className={styles.subSubtitle}>Personalise your Jatayu experience</p>
              </div>
            </div>

            <div className={styles.settingsGroup}>
              {/* Interface Language */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Interface Language</div>
                  <div className={styles.settingDesc}>Language for menus, buttons, and system messages</div>
                </div>
                <select
                  className={styles.settingSelect}
                  value={interfaceLanguage}
                  onChange={(e) => setInterfaceLanguage(e.target.value)}
                >
                  <option value="english">English</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="marathi">Marathi (मराठी)</option>
                </select>
              </div>

              {/* Content Languages */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>Content Languages</div>
                  <div className={styles.settingDesc}>Show experts and content in these languages</div>
                  <div className={styles.chipGroup} style={{ marginTop: "8px" }}>
                    <span className={styles.chip}>English ×</span>
                    <span className={styles.chip}>हिन्दी ×</span>
                    <span className={styles.chip}>मराठी ×</span>
                    <button type="button" className={styles.chipBtnAdd}>
                      + Add
                    </button>
                  </div>
                </div>
                <button type="button" className={styles.btnSecondary} style={{ fontSize: "12px", padding: "6px 12px" }}>
                  Edit
                </button>
              </div>

              {/* City / State */}
              <div className={styles.settingRow}>
                <div>
                  <div className={styles.settingLabel}>City / State</div>
                  <div className={styles.settingDesc}>Used for local expert discovery and events</div>
                </div>
                <select
                  className={styles.settingSelect}
                  value={cityState}
                  onChange={(e) => setCityState(e.target.value)}
                >
                  <option value="mumbai">Mumbai, Maharashtra</option>
                  <option value="pune">Pune, Maharashtra</option>
                  <option value="delhi">Delhi, NCR</option>
                  <option value="bengaluru">Bengaluru, Karnataka</option>
                </select>
              </div>

              {/* Currency & Tax Region */}
              <div className={styles.settingRow} style={{ borderBottom: "none" }}>
                <div>
                  <div className={styles.settingLabel}>Currency &amp; Tax Region</div>
                  <div className={styles.settingDesc}>Pricing and GST invoices based on your region</div>
                </div>
                <span className={styles.tagBlue}>₹ INR · India</span>
              </div>
            </div>
          </div>

          {/* Notification Preferences Card */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <Bell size={18} style={{ color: "var(--tango)" }} />
              <div>
                <h3 className={styles.subTitle}>Notification Preferences</h3>
                <p className={styles.subSubtitle}>Choose how and when you get notified</p>
              </div>
            </div>

            <div className={styles.notifPrefTable}>
              <div className={styles.notifPrefHeaderRow}>
                <div className={styles.notifPrefTypeCol}>NOTIFICATION TYPE</div>
                <div className={styles.notifPrefCol}>SMS</div>
                <div className={styles.notifPrefCol}>Email</div>
                <div className={styles.notifPrefCol}>Push</div>
              </div>

              {/* Row 1: Booking Reminders */}
              <div className={styles.notifPrefRow}>
                <div className={styles.notifPrefTypeCol}>
                  <div className={styles.settingLabel}>Booking Reminders</div>
                  <div className={styles.settingDesc}>Upcoming session alerts</div>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.bookingReminders.sms ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("bookingReminders", "sms")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.bookingReminders.email ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("bookingReminders", "email")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.bookingReminders.push ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("bookingReminders", "push")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
              </div>

              {/* Row 2: Expert Replies */}
              <div className={styles.notifPrefRow}>
                <div className={styles.notifPrefTypeCol}>
                  <div className={styles.settingLabel}>Expert Replies</div>
                  <div className={styles.settingDesc}>When expert responds to your query</div>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.expertReplies.sms ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("expertReplies", "sms")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.expertReplies.email ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("expertReplies", "email")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.expertReplies.push ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("expertReplies", "push")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
              </div>

              {/* Row 3: Payment Alerts */}
              <div className={styles.notifPrefRow}>
                <div className={styles.notifPrefTypeCol}>
                  <div className={styles.settingLabel}>Payment Alerts</div>
                  <div className={styles.settingDesc}>Receipts, refunds, wallet updates</div>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.paymentAlerts.sms ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("paymentAlerts", "sms")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.paymentAlerts.email ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("paymentAlerts", "email")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.paymentAlerts.push ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("paymentAlerts", "push")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
              </div>

              {/* Row 4: Expert Updates */}
              <div className={styles.notifPrefRow}>
                <div className={styles.notifPrefTypeCol}>
                  <div className={styles.settingLabel}>Expert Updates</div>
                  <div className={styles.settingDesc}>Saved expert availability, new events</div>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.expertUpdates.sms ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("expertUpdates", "sms")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.expertUpdates.email ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("expertUpdates", "email")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.expertUpdates.push ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("expertUpdates", "push")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
              </div>

              {/* Row 5: Offers & Promotions */}
              <div className={styles.notifPrefRow} style={{ borderBottom: "none" }}>
                <div className={styles.notifPrefTypeCol}>
                  <div className={styles.settingLabel}>Offers &amp; Promotions</div>
                  <div className={styles.settingDesc}>Discounts, credits, and special offers</div>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.offersPromotions.sms ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("offersPromotions", "sms")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.offersPromotions.email ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("offersPromotions", "email")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
                <div className={styles.notifPrefCol}>
                  <button
                    type="button"
                    className={`${styles.toggleSwitch} ${notifState.offersPromotions.push ? styles.toggleOn : ""}`}
                    onClick={() => toggleNotif("offersPromotions", "push")}
                  >
                    <div className={styles.toggleKnob} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Secondary Cards */}
        <div className={styles.settingsRightCol}>
          {/* Subscription Card */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <Crown size={18} style={{ color: "var(--tango)" }} />
              <div>
                <h3 className={styles.subTitle}>Subscription</h3>
                <p className={styles.subSubtitle}>Manage your Jatayu 7 Pro plan</p>
              </div>
            </div>

            <div className={styles.subBannerDark}>
              <div className={styles.subBannerHeader}>
                <span className={styles.subBannerTitle}>👑 Jatayu 7 Pro</span>
                <span className={styles.statusActiveTag}>Active</span>
              </div>
              <div className={styles.subBannerPrice}>
                ₹999 <span style={{ fontSize: "12px", fontWeight: 500 }}>/mo</span>
              </div>
              <div className={styles.subBannerMeta}>Monthly Plan · Renews On Jul 1, 2025</div>
              <div className={styles.subBannerAutoRenew}>● Auto-renew is ON via UPI</div>
            </div>

            <div className={styles.planIncludesList}>
              <div className={styles.planIncludeItem}>
                <Check size={14} style={{ color: "#22c55e" }} /> Priority booking with top experts
              </div>
              <div className={styles.planIncludeItem}>
                <Check size={14} style={{ color: "#22c55e" }} /> 1,000 Jatayu credits monthly
              </div>
              <div className={styles.planIncludeItem}>
                <Check size={14} style={{ color: "#22c55e" }} /> Exclusive expert access &amp; events
              </div>
              <div className={styles.planIncludeItem}>
                <Check size={14} style={{ color: "#22c55e" }} /> Dedicated support with 2hr SLA
              </div>
            </div>

            <button type="button" className={styles.btnUpgradePlan}>
              ↑ Upgrade Plan
            </button>

            <div className={styles.subActionRow}>
              <button type="button" className={styles.btnSubOutline}>
                Invoices
              </button>
              <button type="button" className={styles.btnSubDanger}>
                × Cancel Plan
              </button>
            </div>
          </div>


          {/* Account Actions Card */}
          <div className={styles.settingsCard}>
            <div className={styles.settingsCardHeader}>
              <User size={18} style={{ color: "var(--dove-gray)" }} />
              <div>
                <h3 className={styles.subTitle}>Account Actions</h3>
                <p className={styles.subSubtitle}>Manage your account</p>
              </div>
            </div>

            <div className={styles.accountActionList}>
              <div className={styles.accActionItem}>
                <div className={styles.accActionLeft}>
                  <RefreshCcw size={15} /> Reset Recommendations
                </div>
                <ChevronRight size={15} style={{ color: "var(--dove-gray)" }} />
              </div>

              <div className={styles.accActionItem}>
                <div className={styles.accActionLeft}>
                  <Download size={15} /> Download My Data
                </div>
                <ChevronRight size={15} style={{ color: "var(--dove-gray)" }} />
              </div>

              <div className={`${styles.accActionItem} ${styles.accActionLogout}`}>
                <div className={styles.accActionLeft}>
                  <LogOut size={15} /> Logout of Jatayu 7
                </div>
                <ChevronRight size={15} style={{ color: "#d97706" }} />
              </div>

              <div className={`${styles.accActionItem} ${styles.accActionDelete}`}>
                <div className={styles.accActionLeft}>
                  <Trash2 size={15} /> Delete Account
                </div>
                <ChevronRight size={15} style={{ color: "#dc2626" }} />
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
