"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  Bell,
  Globe,
  Trash2,
  Save,
  Check,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Download,
  Smartphone,
  Laptop,
  AlertTriangle,
  AlertCircle,
  UserX,
  UserCog,
  Key,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  LogOut,
  Sliders,
} from "lucide-react";
import styles from "./ExpertSettings.module.css";
import {
  changeExpertPassword,
  deleteExpertAccount,
  exportExpertAccountData,
  getExpertSecurity,
  getExpertNotificationPreferences,
  logoutExpertOtherSessions,
  logoutExpertCurrentSession,
  requestExpertContactVerification,
  revokeExpertSession,
  setExpertTwoFactor,
  saveExpertNotificationPreferences,
  verifyExpertContact,
  type ExpertSecuritySession,
  type ExpertNotificationPreferences,
} from "@/lib/api";
import { clearAuthSession } from "@/lib/expertAuth";

const SETTINGS_STORAGE_KEY = "jatayu_expert_settings";

export default function ExpertSettings() {
  // Privacy State (matching screenshot precisely)
  const [profileVisibility, setProfileVisibility] = useState("everyone");
  const [showBookingActivity, setShowBookingActivity] = useState(true);
  const [showReviewsGiven, setShowReviewsGiven] = useState(false);
  const [personalisationData, setPersonalisationData] = useState(true);

  // Security State (matching screenshot precisely)
  const [registeredPhone, setRegisteredPhone] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);
  const [hasPassword, setHasPassword] = useState(false);
  const [sessions, setSessions] = useState<ExpertSecuritySession[]>([]);
  const [loginHistory, setLoginHistory] = useState<ExpertSecuritySession[]>([]);
  const [securityLoading, setSecurityLoading] = useState(true);
  const [securityError, setSecurityError] = useState<string | null>(null);

  // Password update modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  // Regional State
  const [interfaceLanguage, setInterfaceLanguage] = useState("en-US");
  const [displayTimezone, setDisplayTimezone] = useState("Asia/Kolkata (IST +5:30)");
  const [currencyDisplay, setCurrencyDisplay] = useState("INR (₹)");
  const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");

  // Vacation / Pause Mode
  const [vacationMode, setVacationMode] = useState(false);

  // Notifications Matrix State
  const [notifications, setNotifications] = useState<ExpertNotificationPreferences>({
    sessionRequests: { push: true, email: true, sms: true },
    reminders: { push: true, email: true, sms: false },
    messages: { push: true, email: true, sms: false },
    payouts: { push: true, email: true, sms: true },
  });
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const [notificationsDirty, setNotificationsDirty] = useState(false);

  // Modals & Feedback
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [newPhoneInput, setNewPhoneInput] = useState("");
  const [newEmailInput, setNewEmailInput] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [contactChallenge, setContactChallenge] = useState<{ id: string; type: "email" | "phone" } | null>(null);
  const [contactBusy, setContactBusy] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([
    "SpamBot_992",
    "anonymous_inquiry_41",
  ]);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [accountActionError, setAccountActionError] = useState<string | null>(null);
  const [accountActionBusy, setAccountActionBusy] = useState<"export" | "logout" | "delete" | null>(null);

  // Load saved settings
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.profileVisibility !== undefined) setProfileVisibility(parsed.profileVisibility);
        if (parsed.showBookingActivity !== undefined) setShowBookingActivity(parsed.showBookingActivity);
        if (parsed.showReviewsGiven !== undefined) setShowReviewsGiven(parsed.showReviewsGiven);
        if (parsed.personalisationData !== undefined) setPersonalisationData(parsed.personalisationData);
        if (parsed.displayTimezone !== undefined) setDisplayTimezone(parsed.displayTimezone);
        if (parsed.interfaceLanguage !== undefined) setInterfaceLanguage(parsed.interfaceLanguage);
        if (parsed.vacationMode !== undefined) setVacationMode(parsed.vacationMode);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadSecurity = async () => {
    setSecurityError(null);
    try {
      const data = await getExpertSecurity();
      setRegisteredPhone(data.maskedPhone || "Not added");
      setEmailAddress(data.email);
      setEmailVerified(data.emailVerified);
      setPhoneVerified(data.phoneVerified);
      setTwoFactorAuth(data.twoFactorEnabled);
      setHasPassword(data.hasPassword);
      setSessions(data.sessions);
      setLoginHistory(data.loginHistory);
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to load security settings.");
    } finally {
      setSecurityLoading(false);
    }
  };

  useEffect(() => { void loadSecurity(); }, []);

  useEffect(() => {
    getExpertNotificationPreferences()
      .then(({ preferences }) => { setNotifications(preferences); setNotificationsDirty(false); })
      .catch((error) => setNotificationsError(error instanceof Error ? error.message : "Unable to load notification preferences."))
      .finally(() => setNotificationsLoading(false));
  }, []);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setNotificationsError(null);
    const payload = {
      profileVisibility,
      showBookingActivity,
      showReviewsGiven,
      personalisationData,
      displayTimezone,
      interfaceLanguage,
      vacationMode,
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }

    if (notificationsDirty) {
      try {
        const { preferences } = await saveExpertNotificationPreferences(notifications);
        setNotifications(preferences);
        setNotificationsDirty(false);
      } catch (error) {
        setNotificationsError(error instanceof Error ? error.message : "Unable to save notification preferences.");
        setIsSaving(false);
        return;
      }
    }
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 4000);
    }, 400);
  };

  const handleToggleNotif = (
    category: keyof typeof notifications,
    channel: "push" | "email" | "sms",
  ) => {
    setIsSaved(false);
    setNotificationsDirty(true);
    setNotifications((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category][channel],
      },
    }));
  };

  const handleRequestDataExport = async () => {
    setAccountActionBusy("export");
    setAccountActionError(null);
    try {
      const data = await exportExpertAccountData();
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `jatayu-expert-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setExportNotice("Your data archive was downloaded.");
      window.setTimeout(() => setExportNotice(null), 6000);
    } catch (error) {
      setAccountActionError(error instanceof Error ? error.message : "Unable to download account data.");
    } finally {
      setAccountActionBusy(null);
    }
  };

  const handleLogout = async () => {
    setAccountActionBusy("logout");
    setAccountActionError(null);
    try {
      await logoutExpertCurrentSession();
    } catch {
      // Clear the local session even when the server session already expired.
    } finally {
      clearAuthSession();
      window.location.assign("/login");
    }
  };

  const handleDeleteAccount = async () => {
    setAccountActionBusy("delete");
    setAccountActionError(null);
    try {
      await deleteExpertAccount(deleteConfirmText);
      clearAuthSession();
      window.location.assign("/login?accountDeleted=1");
    } catch (error) {
      setAccountActionError(error instanceof Error ? error.message : "Unable to delete account.");
      setAccountActionBusy(null);
    }
  };

  const handleUnblockUser = (name: string) => {
    setBlockedUsers((prev) => prev.filter((u) => u !== name));
  };

  const startContactVerification = async (type: "email" | "phone", value: string) => {
    setContactBusy(true);
    setSecurityError(null);
    try {
      const result = await requestExpertContactVerification(type, value);
      setContactChallenge({ id: result.challengeId, type });
      setVerificationCode("");
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to send verification code.");
    } finally {
      setContactBusy(false);
    }
  };

  const confirmContactVerification = async () => {
    if (!contactChallenge || verificationCode.length !== 6) return;
    setContactBusy(true);
    setSecurityError(null);
    try {
      await verifyExpertContact(contactChallenge.id, verificationCode);
      await loadSecurity();
      setContactChallenge(null);
      setVerificationCode("");
      setNewPhoneInput("");
      setNewEmailInput("");
      setShowPhoneModal(false);
      setShowEmailModal(false);
    } catch (error) {
      setSecurityError(error instanceof Error ? error.message : "Unable to verify code.");
    } finally {
      setContactBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.pageInner}`}>
        {/* ----------------------------------------------------
            1. BREADCRUMBS
        ---------------------------------------------------- */}
        <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
          <Link href="/expert/dashboard/" className={styles.breadcrumbLink}>
            My Account
          </Link>
          <span className={styles.breadcrumbSeparator}>
            <ChevronRight size={13} />
          </span>
          <span className={styles.breadcrumbCurrent}>Settings</span>
        </nav>

        {/* ----------------------------------------------------
            2. PAGE HEADER
        ---------------------------------------------------- */}
        <header className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Account Settings</h1>
            <p className={styles.pageSubtitle}>
              Manage your privacy, security, language, notifications, and subscription
            </p>
          </div>

          <div className={styles.topActions}>
            <button
              type="button"
              className={`${styles.btnSaveTop} ${isSaved ? styles.btnSavedState : ""}`}
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaved ? (
                <>
                  <Check size={15} /> Saved
                </>
              ) : (
                <>
                  <Save size={15} /> Save Changes
                </>
              )}
            </button>
          </div>
        </header>

        {/* Feedback Toast if saved or export requested */}
        {isSaved && (
          <div className={styles.feedbackToast}>
            <span>
              <CheckCircle2 size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Your account settings have been saved successfully.
            </span>
          </div>
        )}

        {exportNotice && (
          <div className={styles.feedbackToast} style={{ background: "#eff6ff", borderColor: "#bfdbfe", color: "#1e40af" }}>
            <span>
              <Download size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              {exportNotice}
            </span>
          </div>
        )}

        {/* ----------------------------------------------------
            3. PRIVACY CARD (MATCHES USER SCREENSHOT PRECISELY)
        ---------------------------------------------------- */}
        <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIconBox}>
                <Shield size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Privacy</h2>
                <p className={styles.cardSubtitle}>Control who sees your profile and activity</p>
              </div>
            </div>

            <div className={styles.rowsContainer}>
              {/* Row 1: Profile Visibility */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Profile Visibility</span>
                  <span className={styles.settingDesc}>
                    Who can discover your profile on Jatayu
                  </span>
                </div>
                <select
                  value={profileVisibility}
                  onChange={(e) => {
                    setProfileVisibility(e.target.value);
                    setIsSaved(false);
                  }}
                  className={styles.selectDropdown}
                  aria-label="Profile Visibility"
                >
                  <option value="everyone">Everyone</option>
                  <option value="verified">Verified Seekers Only</option>
                  <option value="private">Private (Link Only)</option>
                </select>
              </div>

              {/* Row 2: Show Booking Activity */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Show Booking Activity</span>
                  <span className={styles.settingDesc}>
                    Allow experts to see your past consultation topics
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showBookingActivity}
                  onClick={() => {
                    setShowBookingActivity((prev) => !prev);
                    setIsSaved(false);
                  }}
                  className={`${styles.toggleSwitch} ${
                    showBookingActivity ? styles.toggleSwitchActive : ""
                  }`}
                  aria-label="Show Booking Activity toggle"
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              {/* Row 3: Show Reviews Given */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Show Reviews Given</span>
                  <span className={styles.settingDesc}>
                    Make your expert ratings visible publicly
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showReviewsGiven}
                  onClick={() => {
                    setShowReviewsGiven((prev) => !prev);
                    setIsSaved(false);
                  }}
                  className={`${styles.toggleSwitch} ${
                    showReviewsGiven ? styles.toggleSwitchActive : ""
                  }`}
                  aria-label="Show Reviews Given toggle"
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              {/* Row 4: Personalisation Data Sharing */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Personalisation Data Sharing</span>
                  <span className={styles.settingDesc}>
                    Allow Jatayu to use your activity for better recommendations
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={personalisationData}
                  onClick={() => {
                    setPersonalisationData((prev) => !prev);
                    setIsSaved(false);
                  }}
                  className={`${styles.toggleSwitch} ${
                    personalisationData ? styles.toggleSwitchActive : ""
                  }`}
                  aria-label="Personalisation Data Sharing toggle"
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              {/* Row 5: Blocked Users */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Blocked Users</span>
                  <span className={styles.settingDesc}>
                    Manage users you&apos;ve blocked from contacting you
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => setShowBlockedModal(true)}
                >
                  View List <ArrowRight size={13} />
                </button>
              </div>

              {/* Row 6: Download My Data */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Download My Data</span>
                  <span className={styles.settingDesc}>
                    Export a copy of all your Jatayu data
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={handleRequestDataExport}
                >
                  <Download size={14} /> Request Export
                </button>
              </div>
            </div>
          </section>

        {/* ----------------------------------------------------
            4. SECURITY CARD (MATCHES USER SCREENSHOT PRECISELY)
        ---------------------------------------------------- */}
        <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTop}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className={`${styles.cardIconBox} ${styles.cardIconBoxGreen}`}>
                    <Lock size={18} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Security</h2>
                    <p className={styles.cardSubtitle}>
                      Manage login, OTP, and active sessions
                    </p>
                  </div>
                </div>

                <span className={styles.secureBadge}>
                  <CheckCircle2 size={13} /> {securityLoading ? "Checking…" : twoFactorAuth ? "2FA enabled" : "Protected"}
                </span>
              </div>
            </div>

            <div className={styles.rowsContainer}>
              {/* Row 1: Registered Phone */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Registered Phone</span>
                  <div className={styles.subMetaRow}>
                    <span className={styles.subMetaText}>
                      <span style={{ color: "#25D366", marginRight: 5, fontSize: 13 }}>💬</span>
                      {registeredPhone}
                    </span>
                    <span className={phoneVerified ? styles.verifiedPill : styles.unverifiedPill}>{phoneVerified ? "Verified" : "Unverified"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => { setContactChallenge(null); setVerificationCode(""); setShowPhoneModal(true); }}
                >
                  Change Number
                </button>
              </div>

              {/* Row 2: Email Address */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Email Address</span>
                  <div className={styles.subMetaRow}>
                    <span className={styles.subEmailText}>{emailAddress}</span>
                    <span className={emailVerified ? styles.verifiedPill : styles.unverifiedPill}>
                      {emailVerified ? "Verified" : "Unverified"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => { setContactChallenge(null); setVerificationCode(""); setNewEmailInput(emailVerified ? "" : emailAddress); setShowEmailModal(true); }}
                >
                  {emailVerified ? "Change" : "Verify"}
                </button>
              </div>

              {/* Row 3: Two-Factor Authentication */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Two-Factor Authentication</span>
                  <span className={styles.settingDesc}>
                    Require OTP for every login attempt
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={twoFactorAuth}
                  disabled={securityLoading}
                  onClick={async () => {
                    try {
                      const result = await setExpertTwoFactor(!twoFactorAuth);
                      setTwoFactorAuth(result.twoFactorEnabled);
                    } catch (error) {
                      setSecurityError(error instanceof Error ? error.message : "Unable to update two-factor authentication.");
                    }
                  }}
                  className={`${styles.toggleSwitch} ${
                    twoFactorAuth ? styles.toggleSwitchActive : ""
                  }`}
                  aria-label="Two-Factor Authentication toggle"
                >
                  <span className={styles.toggleThumb} />
                </button>
              </div>

              {/* Row 4: Account Password */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Account Password</span>
                  <span className={styles.settingDesc}>
                    Set a unique password to protect your account login
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => {
                    setPasswordError(null);
                    setPasswordSuccess(null);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setShowPasswordModal(true);
                  }}
                >
                  <Key size={14} /> {hasPassword ? "Update Password" : "Set Password"}
                </button>
              </div>

              {/* Row 5: Active Sessions Block */}
              <div className={styles.activeSessionsBlock}>
                <div className={styles.activeSessionsHeader}>
                  <div>
                    <div className={styles.settingLabel}>Active Sessions</div>
                    <div className={styles.settingDesc}>
                      Devices currently logged into your account
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.logoutAllBtn}
                    disabled={securityLoading || sessions.every((session) => session.activeNow)}
                    onClick={async () => {
                      try {
                        await logoutExpertOtherSessions();
                        await loadSecurity();
                      } catch (error) {
                        setSecurityError(error instanceof Error ? error.message : "Unable to log out other sessions.");
                      }
                    }}
                  >
                    Logout Others
                  </button>
                </div>

                <div className={styles.deviceCardsList}>
                  {sessions.map((sess) => (
                    <div
                      key={sess.id}
                      className={sess.activeNow ? styles.deviceCardCurrent : styles.deviceCardOther}
                    >
                      <div className={styles.deviceLeft}>
                        <div
                          className={
                            sess.activeNow
                              ? styles.deviceIconBoxCurrent
                              : styles.deviceIconBoxOther
                          }
                        >
                          {/iOS|Android|iPhone/i.test(sess.device) ? <Smartphone size={18} /> : <Laptop size={18} />}
                        </div>
                        <div>
                          <div className={styles.deviceTitle}>
                            {sess.device}
                          </div>
                          <div className={styles.deviceSub}>{sess.activeNow ? "Active now · This device" : `Signed in ${new Date(sess.createdAt).toLocaleString()}`}{sess.ipAddress ? ` · ${sess.ipAddress}` : ""}</div>
                        </div>
                      </div>

                      {sess.activeNow ? (
                        <span className={styles.liveGreenDot} title="Live connection on this device" />
                      ) : (
                        <button
                          type="button"
                          className={styles.btnRemoveDevice}
                          onClick={async () => {
                            try {
                              await revokeExpertSession(sess.id);
                              setSessions((current) => current.filter((item) => item.id !== sess.id));
                            } catch (error) {
                              setSecurityError(error instanceof Error ? error.message : "Unable to remove session.");
                            }
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {securityError && <p role="alert" className={styles.settingDesc}>{securityError}</p>}

              {/* Row 5: Login History */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Login History</span>
                  <span className={styles.settingDesc}>
                    View recent sign-in activity for your account
                  </span>
                </div>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => setShowHistoryModal(true)}
                >
                  View History <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </section>

        {/* ----------------------------------------------------
            5. NOTIFICATION PREFERENCES MATRIX CARD
        ---------------------------------------------------- */}
        <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIconBox} ${styles.cardIconBoxOrange}`}>
                <Bell size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Notification Preferences</h2>
                <p className={styles.cardSubtitle}>
                  Select your alert channels for incoming bookings, client chats, and platform payouts
                </p>
              </div>
            </div>

            <fieldset className={styles.notifMatrix} disabled={notificationsLoading || isSaving} style={{ border: 0, padding: 0, margin: 0 }}>
              <div className={styles.notifMatrixHeader}>
                <span className={styles.notifMatrixHeaderLabel}>Notification Type</span>
                <span>Push</span>
                <span>Email</span>
                <span>SMS</span>
              </div>

              {/* Booking Requests */}
              <div className={styles.notifMatrixRow}>
                <div>
                  <div className={styles.settingLabel}>New Session Requests</div>
                  <div className={styles.settingDesc}>When seekers book an instant or scheduled call</div>
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.sessionRequests.push}
                    onChange={() => handleToggleNotif("sessionRequests", "push")}
                    aria-label="Push notifications for session requests"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.sessionRequests.email}
                    onChange={() => handleToggleNotif("sessionRequests", "email")}
                    aria-label="Email notifications for session requests"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.sessionRequests.sms}
                    onChange={() => handleToggleNotif("sessionRequests", "sms")}
                    aria-label="SMS notifications for session requests"
                  />
                </div>
              </div>

              {/* Call Reminders */}
              <div className={styles.notifMatrixRow}>
                <div>
                  <div className={styles.settingLabel}>Upcoming Call Reminders</div>
                  <div className={styles.settingDesc}>15 minutes before your scheduled consultation</div>
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.reminders.push}
                    onChange={() => handleToggleNotif("reminders", "push")}
                    aria-label="Push notifications for reminders"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.reminders.email}
                    onChange={() => handleToggleNotif("reminders", "email")}
                    aria-label="Email notifications for reminders"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.reminders.sms}
                    onChange={() => handleToggleNotif("reminders", "sms")}
                    aria-label="SMS notifications for reminders"
                  />
                </div>
              </div>

              {/* Client Messages */}
              <div className={styles.notifMatrixRow}>
                <div>
                  <div className={styles.settingLabel}>Client Direct Messages</div>
                  <div className={styles.settingDesc}>When clients send text inquiries or async questions</div>
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.messages.push}
                    onChange={() => handleToggleNotif("messages", "push")}
                    aria-label="Push notifications for messages"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.messages.email}
                    onChange={() => handleToggleNotif("messages", "email")}
                    aria-label="Email notifications for messages"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.messages.sms}
                    onChange={() => handleToggleNotif("messages", "sms")}
                    aria-label="SMS notifications for messages"
                  />
                </div>
              </div>

              {/* Payouts & Earnings */}
              <div className={styles.notifMatrixRow}>
                <div>
                  <div className={styles.settingLabel}>Payouts & Settlement Alerts</div>
                  <div className={styles.settingDesc}>Bank deposits, credit statements, and tax invoices</div>
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.payouts.push}
                    onChange={() => handleToggleNotif("payouts", "push")}
                    aria-label="Push notifications for payouts"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.payouts.email}
                    onChange={() => handleToggleNotif("payouts", "email")}
                    aria-label="Email notifications for payouts"
                  />
                </div>
                <div className={styles.notifChannelToggle}>
                  <input
                    type="checkbox"
                    checked={notifications.payouts.sms}
                    onChange={() => handleToggleNotif("payouts", "sms")}
                    aria-label="SMS notifications for payouts"
                  />
                </div>
              </div>
            </fieldset>
            {notificationsLoading && <p role="status" className={styles.settingDesc}>Loading notification preferences…</p>}
            {notificationsError && <p role="alert" className={styles.settingDesc}>{notificationsError}</p>}
          </section>

        {/* ----------------------------------------------------
            6. LANGUAGE & REGIONAL SETTINGS CARD
        ---------------------------------------------------- */}
        <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIconBox} ${styles.cardIconBoxGreen}`}>
                <Globe size={20} />
              </div>
              <div>
                <h2 className={styles.cardTitle}>Language & Regional Settings</h2>
                <p className={styles.cardSubtitle}>
                  Set your portal display language, calendar timezone, and currency defaults
                </p>
              </div>
            </div>

            <div className={styles.rowsContainer}>
              {/* Language */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Interface Language</span>
                  <span className={styles.settingDesc}>
                    Choose the primary language for your dashboard and expert tools
                  </span>
                </div>
                <select
                  value={interfaceLanguage}
                  onChange={(e) => {
                    setInterfaceLanguage(e.target.value);
                    setIsSaved(false);
                  }}
                  className={styles.selectDropdown}
                  aria-label="Interface Language"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-UK">English (UK / Commonwealth)</option>
                  <option value="hi-IN">Hindi (हिन्दी)</option>
                  <option value="mr-IN">Marathi (मराठी)</option>
                </select>
              </div>

              {/* Timezone */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Display Timezone</span>
                  <span className={styles.settingDesc}>
                    Used to calculate calendar availability and slot reservations
                  </span>
                </div>
                <select
                  value={displayTimezone}
                  onChange={(e) => {
                    setDisplayTimezone(e.target.value);
                    setIsSaved(false);
                  }}
                  className={styles.selectDropdown}
                  aria-label="Display Timezone"
                >
                  <option value="Asia/Kolkata (IST +5:30)">Asia/Kolkata (IST +5:30)</option>
                  <option value="UTC (GMT +0:00)">UTC (GMT +0:00)</option>
                  <option value="America/New_York (EST -5:00)">America/New_York (EST -5:00)</option>
                  <option value="Europe/London (BST +1:00)">Europe/London (BST +1:00)</option>
                  <option value="Asia/Dubai (GST +4:00)">Asia/Dubai (GST +4:00)</option>
                  <option value="Asia/Singapore (SGT +8:00)">Asia/Singapore (SGT +8:00)</option>
                </select>
              </div>

              {/* Currency */}
              <div className={styles.settingRow}>
                <div className={styles.settingMeta}>
                  <span className={styles.settingLabel}>Currency & Formats</span>
                  <span className={styles.settingDesc}>
                    Primary currency symbol across statements and invoices
                  </span>
                </div>
                <select
                  value={currencyDisplay}
                  onChange={(e) => {
                    setCurrencyDisplay(e.target.value);
                    setIsSaved(false);
                  }}
                  className={styles.selectDropdown}
                  aria-label="Currency"
                >
                  <option value="INR (₹)">Indian Rupee (INR · ₹)</option>
                  <option value="USD ($)">US Dollar (USD · $)</option>
                  <option value="GBP (£)">British Pound (GBP · £)</option>
                  <option value="EUR (€)">Euro (EUR · €)</option>
                </select>
              </div>
            </div>
          </section>

        {/* ----------------------------------------------------
            7. ACCOUNT ACTIONS (MATCHES USER SCREENSHOT PRECISELY)
        ---------------------------------------------------- */}
        <section className={styles.settingsCard}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderTop}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className={`${styles.cardIconBox} ${styles.cardIconBoxBlue}`}>
                    <UserCog size={18} />
                  </div>
                  <div>
                    <h2 className={styles.cardTitle}>Account Actions</h2>
                    <p className={styles.cardSubtitle}>
                      Manage your account
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.actionCardsStack}>
              {/* Button 1: Download My Data */}
              <button
                type="button"
                className={styles.actionCardItem}
                onClick={handleRequestDataExport}
                disabled={accountActionBusy !== null}
              >
                <div className={styles.actionCardItemLeft}>
                  <Download size={18} />
                  <span>{accountActionBusy === "export" ? "Preparing Download…" : "Download My Data"}</span>
                </div>
                <ArrowRight size={16} className={styles.actionCardArrow} />
              </button>
              {accountActionError && <p role="alert" className={styles.settingDesc}>{accountActionError}</p>}

              {/* Button 2: Logout of Jatayu */}
              <button
                type="button"
                className={`${styles.actionCardItem} ${styles.actionCardAmber}`}
                onClick={() => setShowLogoutModal(true)}
              >
                <div className={styles.actionCardItemLeft}>
                  <LogOut size={18} />
                  <span>Logout of Jatayu</span>
                </div>
                <ArrowRight size={16} className={styles.actionCardArrow} />
              </button>

              {/* Button 3: Delete Account */}
              <button
                type="button"
                className={`${styles.actionCardItem} ${styles.actionCardRed}`}
                onClick={() => setShowDeleteModal(true)}
              >
                <div className={styles.actionCardItemLeft}>
                  <Trash2 size={18} />
                  <span>Delete Account</span>
                </div>
                <ArrowRight size={16} className={styles.actionCardArrow} />
              </button>
            </div>
          </section>
      </div>

      {/* ----------------------------------------------------
          MODAL: BLOCKED USERS LIST
      ---------------------------------------------------- */}
      {showBlockedModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowBlockedModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Blocked Users ({blockedUsers.length})</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowBlockedModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {blockedUsers.length === 0 ? (
                <p style={{ margin: 0, fontSize: 13, color: "var(--dove-gray)" }}>
                  You currently have no blocked users.
                </p>
              ) : (
                blockedUsers.map((username) => (
                  <div
                    key={username}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "var(--seashell)",
                      borderRadius: "8px",
                      border: "1px solid var(--mercury)",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>
                      @{username}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnblockUser(username)}
                      className={styles.btnAction}
                      style={{ minHeight: 30, padding: "0 10px", fontSize: 12 }}
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnAction}
                onClick={() => setShowBlockedModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: CHANGE PHONE NUMBER
      ---------------------------------------------------- */}
      {showPhoneModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowPhoneModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Change Registered Phone Number</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowPhoneModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--dove-gray)" }}>
                {contactChallenge?.type === "phone" ? "Enter the 6-digit code sent to your new number." : "We will send an SMS OTP to your new mobile number for verification."}
              </p>
              {contactChallenge?.type === "phone" ? <input
                type="text" inputMode="numeric" value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit code" className={styles.selectDropdown}
                style={{ width: "100%", backgroundImage: "none", textAlign: "center" }}
              /> : <div style={{ display: "flex", gap: 8 }}>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    background: "var(--seashell)",
                    border: "1px solid var(--mercury)",
                    borderRadius: "8px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  +91
                </span>
                <input
                  type="tel"
                  value={newPhoneInput}
                  onChange={(e) => setNewPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="98765 43210"
                  className={styles.selectDropdown}
                  style={{ flex: 1, backgroundImage: "none", padding: "0 12px" }}
                />
              </div>}
              {securityError && <p role="alert" className={styles.settingDesc}>{securityError}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSaveTop}
                style={{ minHeight: 36, fontSize: 13 }}
                onClick={() => contactChallenge?.type === "phone"
                  ? void confirmContactVerification()
                  : void startContactVerification("phone", `+91${newPhoneInput}`)}
                disabled={contactBusy || (contactChallenge?.type === "phone" ? verificationCode.length !== 6 : newPhoneInput.length !== 10)}
              >
                {contactBusy ? "Please wait…" : contactChallenge?.type === "phone" ? "Confirm Code" : "Send Verification OTP"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: VERIFY EMAIL ADDRESS
      ---------------------------------------------------- */}
      {showEmailModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowEmailModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Verify Email Address</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowEmailModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--dove-gray)" }}>
                {contactChallenge?.type === "email" ? <>Enter the code sent to <strong>{newEmailInput}</strong>.</> : "Enter the email address you want to verify."}
              </p>
              <input
                type={contactChallenge?.type === "email" ? "text" : "email"}
                value={contactChallenge?.type === "email" ? verificationCode : newEmailInput}
                onChange={(e) => contactChallenge?.type === "email"
                  ? setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  : setNewEmailInput(e.target.value)}
                placeholder={contactChallenge?.type === "email" ? "Enter 6-digit code" : "name@example.com"}
                maxLength={contactChallenge?.type === "email" ? 6 : 254}
                className={styles.selectDropdown}
                style={{ width: "100%", backgroundImage: "none", padding: "0 12px", textAlign: "center", letterSpacing: "0.2em", fontFamily: "var(--font-mono)", fontSize: 16 }}
              />
              {securityError && <p role="alert" className={styles.settingDesc}>{securityError}</p>}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSaveTop}
                style={{ minHeight: 36, fontSize: 13 }}
                onClick={() => contactChallenge?.type === "email"
                  ? void confirmContactVerification()
                  : void startContactVerification("email", newEmailInput)}
                disabled={contactBusy || (contactChallenge?.type === "email" ? verificationCode.length !== 6 : !/^\S+@\S+\.\S+$/.test(newEmailInput))}
              >
                {contactBusy ? "Please wait…" : contactChallenge?.type === "email" ? "Confirm Verification" : "Send Verification Code"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: LOGIN HISTORY
      ---------------------------------------------------- */}
      {showHistoryModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowHistoryModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Recent Login History</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowHistoryModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {loginHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    background: "var(--seashell)",
                    borderRadius: "8px",
                    border: "1px solid var(--mercury)",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink)" }}>{item.device}</div>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--dove-gray)" }}>
                      {new Date(item.createdAt).toLocaleString()} · {item.ipAddress || "IP unavailable"} · {item.loginMethod}
                    </div>
                  </div>
                  <span className={item.revokedAt ? styles.unverifiedPill : styles.verifiedPill}>{item.revokedAt ? "Ended" : "Active"}</span>
                </div>
              ))}
              {loginHistory.length === 0 && <p className={styles.settingDesc}>No recorded login activity yet. New activity appears after your next login.</p>}
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnAction}
                onClick={() => setShowHistoryModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: LOGOUT CONFIRMATION
      ---------------------------------------------------- */}
      {showLogoutModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowLogoutModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Logout of Jatayu</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowLogoutModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--dove-gray)", lineHeight: 1.5 }}>
                Are you sure you want to log out of your expert session? You will need to re-authenticate with your phone number/email.
              </p>
            </div>

            <div className={styles.modalFooter} style={{ gap: 10 }}>
              <button
                type="button"
                className={styles.btnAction}
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={accountActionBusy !== null}
                className={`${styles.btnAction} ${styles.btnDanger}`}
                style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <LogOut size={14} /> {accountActionBusy === "logout" ? "Logging Out…" : "Log Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: DELETE ACCOUNT CONFIRMATION
      ---------------------------------------------------- */}
      {showDeleteModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{ color: "#dc2626" }}>Delete Expert Account</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowDeleteModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--dove-gray)", lineHeight: 1.5 }}>
                This disables your account and removes it from public results. Your records are retained using soft deletion so an administrator can recover the account if required.
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--dove-gray)" }}>
                To proceed, please type <strong>DELETE</strong> below:
              </p>
              <input
                type="text"
                placeholder="Type DELETE to confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className={styles.selectDropdown}
                style={{ width: "100%", backgroundImage: "none", padding: "0 12px", fontFamily: "var(--font-mono)" }}
              />
              {accountActionError && <p role="alert" className={styles.settingDesc}>{accountActionError}</p>}
            </div>

            <div className={styles.modalFooter} style={{ gap: 10 }}>
              <button
                type="button"
                className={styles.btnAction}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== "DELETE" || accountActionBusy !== null}
                className={`${styles.btnAction} ${styles.btnDanger}`}
                style={{ opacity: deleteConfirmText === "DELETE" ? 1 : 0.5 }}
                onClick={() => void handleDeleteAccount()}
              >
                <Trash2 size={14} /> {accountActionBusy === "delete" ? "Deleting…" : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          MODAL: UPDATE PASSWORD
      ---------------------------------------------------- */}
      {showPasswordModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowPasswordModal(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div className={`${styles.cardIconBox} ${styles.cardIconBoxGreen}`} style={{ width: 32, height: 32 }}>
                  <Key size={16} />
                </div>
                <h3 className={styles.modalTitle}>Update Password</h3>
              </div>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowPasswordModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setPasswordError(null);

                if (hasPassword && !currentPassword) {
                  setPasswordError("Please enter your current password.");
                  return;
                }
                if (newPassword.length < 8 || !/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
                  setPasswordError("New password must be at least 8 characters and include a letter, number, and symbol.");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setPasswordError("New password and confirm password do not match.");
                  return;
                }

                setPasswordBusy(true);
                try {
                  const result = await changeExpertPassword(currentPassword, newPassword);
                  setPasswordSuccess(result.message);
                  setHasPassword(true);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  await loadSecurity();
                } catch (error) {
                  setPasswordError(error instanceof Error ? error.message : "Unable to update password.");
                } finally {
                  setPasswordBusy(false);
                }
              }}
            >
              <div className={styles.modalBody}>
                {passwordError && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: "#fef2f2",
                      border: "1px solid #fee2e2",
                      borderRadius: "8px",
                      color: "#dc2626",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 14px",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: "8px",
                      color: "#059669",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {/* Current Password */}
                {hasPassword && <div className={styles.formFieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="current-password">
                    Current Password
                  </label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      id="current-password"
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className={styles.passwordInput}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowCurrentPass((prev) => !prev)}
                      aria-label={showCurrentPass ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>}

                {/* New Password */}
                <div className={styles.formFieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="new-password">
                    New Password
                  </label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      id="new-password"
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password (min. 8 characters)"
                      className={styles.passwordInput}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowNewPass((prev) => !prev)}
                      aria-label={showNewPass ? "Hide new password" : "Show new password"}
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className={styles.fieldHint}>
                    Use at least 8 characters with a mix of letters, numbers, and symbols.
                  </span>
                </div>

                {/* Confirm New Password */}
                <div className={styles.formFieldGroup}>
                  <label className={styles.fieldLabel} htmlFor="confirm-new-password">
                    Confirm New Password
                  </label>
                  <div className={styles.passwordInputWrapper}>
                    <input
                      id="confirm-new-password"
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className={styles.passwordInput}
                      required
                    />
                    <button
                      type="button"
                      className={styles.passwordToggleBtn}
                      onClick={() => setShowConfirmPass((prev) => !prev)}
                      aria-label={showConfirmPass ? "Hide confirm password" : "Show confirm password"}
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter} style={{ gap: 10 }}>
                <button
                  type="button"
                  className={styles.btnAction}
                  onClick={() => setShowPasswordModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordBusy}
                  className={styles.btnSaveTop}
                  style={{ minHeight: 36, fontSize: 13 }}
                >
                  {passwordBusy ? "Updating…" : hasPassword ? "Update Password" : "Set Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
