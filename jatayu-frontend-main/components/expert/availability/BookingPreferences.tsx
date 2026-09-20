"use client";

import { useEffect, useState } from "react";
import { Zap, Calendar, Bell, ShieldCheck, Check, Save } from "lucide-react";
import { connectExpertCalendar, disconnectExpertCalendar, getExpertCalendarConnections, syncExpertCalendar, updateProfile, type ExpertCalendarConnection } from "@/lib/api";
import {
  DEFAULT_EXPERT_BOOKING_PREFERENCES,
  fetchExpertProfileRecord,
  mapExpertBookingPreferences,
  type ExpertBookingPreferences,
} from "@/lib/expertProfileApi";
import styles from "./ExpertAvailabilityPage.module.css";

const OPTIONS = [
  { key: "autoAcceptBookings", title: "Auto-accept bookings", description: "Confirm paid bookings automatically without requiring you to accept each request manually.", icon: ShieldCheck },
  { key: "allowInstantBookings", title: "Allow instant bookings", description: "Bypass the admin booking lead time while still respecting your minimum notice period and available slots.", icon: Zap },
  { key: "syncCalendar", title: "Sync to calendar", description: "Automatically show confirmed Jatayu bookings in your expert calendar. This is always enabled.", icon: Calendar, locked: true },
  { key: "automatedReminders", title: "Automated session reminders", description: "Send configured reminders before a scheduled session.", icon: Bell },
] as const;

export default function BookingPreferences() {
  const [preferences, setPreferences] = useState<ExpertBookingPreferences>(DEFAULT_EXPERT_BOOKING_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");
  const [connections, setConnections] = useState<ExpertCalendarConnection[]>([]);
  const [calendarBusy, setCalendarBusy] = useState<string | null>(null);

  const loadConnections = () => getExpertCalendarConnections().then((result) => setConnections(result.connections));

  useEffect(() => {
    let active = true;
    void fetchExpertProfileRecord()
      .then((profile) => { if (active) setPreferences(mapExpertBookingPreferences(profile)); })
      .catch(() => { if (active) setError("Unable to load booking preferences."); })
      .finally(() => { if (active) setLoading(false); });
    void loadConnections().catch(() => { if (active) setError("Unable to load external calendar connections."); });
    const params = new URLSearchParams(window.location.search);
    if (params.get("calendarStatus") === "error") setError(params.get("calendarMessage") || "Calendar connection failed.");
    return () => { active = false; };
  }, []);

  const updatePreference = <K extends keyof ExpertBookingPreferences>(key: K, value: ExpertBookingPreferences[K]) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setIsSaved(false);
    setError("");
  };

  const handleCalendar = async (connection: ExpertCalendarConnection, action: "connect" | "disconnect" | "sync") => {
    setCalendarBusy(`${connection.provider}:${action}`); setError("");
    try {
      if (action === "connect") {
        const result = await connectExpertCalendar(connection.provider);
        window.location.assign(result.authorizationUrl);
        return;
      }
      if (action === "disconnect") await disconnectExpertCalendar(connection.provider);
      else await syncExpertCalendar(connection.provider);
      await loadConnections();
    } catch (calendarError) {
      setError(calendarError instanceof Error ? calendarError.message : "Unable to update calendar connection.");
    } finally { setCalendarBusy(null); }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await updateProfile({ onboardingMetadata: { bookingPreferences: preferences } });
      setIsSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save booking preferences.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div><span className={styles.sectionIndex}>03</span><h2>Booking preferences</h2><p>Control client reservation rules, buffer periods, and calendar synchronization.</p></div>
        <div className={styles.panelHeaderActions}>
          <button type="button" className={`${styles.panelSaveBtn} ${isSaved ? styles.savedState : ""}`} onClick={handleSave} disabled={loading || saving || isSaved} aria-label="Save preferences">
            {isSaved ? <><Check size={13} /><span>Preferences saved</span></> : <><Save size={13} /><span>{saving ? "Saving…" : "Save preferences"}</span></>}
          </button>
        </div>
      </div>

      {error && <p role="alert" className={styles.preferenceError}>{error}</p>}

      <div className={styles.preferencesList}>
        {OPTIONS.map((option) => {
          const isChecked = preferences[option.key];
          const Icon = option.icon;
          return (
            <label key={option.key} className={`${styles.preferenceRow} ${isChecked ? styles.preferenceRowActive : ""}`}>
              <div className={styles.preferenceIconBox}><Icon size={16} /></div>
              <div className={styles.preferenceText}><strong>{option.title}</strong><small>{option.description}</small></div>
              <div className={styles.switchWrapper}>
                <input type="checkbox" checked={isChecked} onChange={() => updatePreference(option.key, !isChecked)} disabled={loading || saving || ("locked" in option && option.locked)} aria-label={option.title} />
                <i className={styles.toggleSwitch} />
              </div>
            </label>
          );
        })}
      </div>

      <div className={styles.preferenceSelects}>
        <div className={styles.preferenceFieldGroup}>
          <label className={styles.preferenceFieldLabel} htmlFor="min-notice-select">Minimum notice period</label>
          <p className={styles.preferenceFieldDescription}>Shortest lead time required before a session begins. This is always respected, including when instant bookings are enabled.</p>
          <div className={styles.selectWrapper}>
            <select id="min-notice-select" value={preferences.minimumNoticeMinutes} onChange={(event) => updatePreference("minimumNoticeMinutes", Number(event.target.value))} className={styles.preferenceSelect} disabled={loading || saving}>
              <option value="0">No additional notice</option>
              <option value="60">1 hour in advance</option>
              <option value="120">2 hours in advance (Recommended)</option>
              <option value="240">4 hours in advance</option>
              <option value="1440">24 hours in advance</option>
            </select>
          </div>
        </div>

        <div className={styles.preferenceFieldGroup}>
          <label className={styles.preferenceFieldLabel} htmlFor="booking-window-select">Advance booking window</label>
          <p className={styles.preferenceFieldDescription}>How far into the future seekers can view and reserve open slots.</p>
          <div className={styles.selectWrapper}>
            <select id="booking-window-select" value={preferences.advanceBookingWindowDays} onChange={(event) => updatePreference("advanceBookingWindowDays", Number(event.target.value))} className={styles.preferenceSelect} disabled={loading || saving}>
              <option value="15">15 days ahead</option>
              <option value="30">30 days ahead</option>
              <option value="45">45 days ahead</option>
              <option value="60">60 days ahead</option>
              <option value="75">75 days ahead</option>
              <option value="90">90 days ahead (Default)</option>
            </select>
          </div>
        </div>
      </div>
      <div className={styles.preferenceSelects}>
        {connections.map((connection) => (
          <div className={styles.preferenceFieldGroup} key={connection.provider}>
            <label className={styles.preferenceFieldLabel}>{connection.provider === "google" ? "Google Calendar" : "Microsoft Outlook"}</label>
            <p className={styles.preferenceFieldDescription}>
              {!connection.available ? "Not configured by the administrator."
                : connection.status === "connected" ? `Connected${connection.accountEmail ? ` as ${connection.accountEmail}` : ""}. Confirmed sessions sync automatically.`
                  : "Connect your calendar to automatically add confirmed Jatayu sessions."}
            </p>
            {connection.lastError && <p role="alert" className={styles.preferenceError}>{connection.lastError}</p>}
            <div className={styles.panelHeaderActions}>
              {connection.status === "connected" ? <>
                <button type="button" className={styles.panelSaveBtn} disabled={calendarBusy !== null} onClick={() => void handleCalendar(connection, "sync")}>Sync now</button>
                <button type="button" className={styles.panelSaveBtn} disabled={calendarBusy !== null} onClick={() => void handleCalendar(connection, "disconnect")}>Disconnect</button>
              </> : <button type="button" className={styles.panelSaveBtn} disabled={!connection.available || calendarBusy !== null} onClick={() => void handleCalendar(connection, "connect")}>Connect</button>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
