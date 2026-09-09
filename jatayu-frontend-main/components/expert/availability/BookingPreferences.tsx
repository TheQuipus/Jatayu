"use client";

import { useState } from "react";
import { Zap, Calendar, Bell, ShieldCheck, Check, Save } from "lucide-react";
import styles from "./ExpertAvailabilityPage.module.css";

const OPTIONS = [
  {
    id: "auto",
    title: "Auto-accept bookings",
    description: "Automatically confirm requests that match your available schedule slots.",
    icon: ShieldCheck,
  },
  {
    id: "instant",
    title: "Allow instant bookings",
    description: "Let verified seekers book open slots directly without manual confirmation.",
    icon: Zap,
  },
  {
    id: "calendar",
    title: "Sync to calendar",
    description: "Keep your primary external calendars synchronized in real-time.",
    icon: Calendar,
  },
  {
    id: "reminder",
    title: "Automated session reminders",
    description: "Send WhatsApp & email reminders 24 hours and 30 minutes prior to call.",
    icon: Bell,
  },
];

export default function BookingPreferences() {
  const [enabled, setEnabled] = useState(["auto", "instant", "reminder"]);
  const [isSaved, setIsSaved] = useState(false);

  const toggle = (id: string) =>
    setEnabled((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );

  const handleSave = () => {
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 2200);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <span className={styles.sectionIndex}>03</span>
          <h2>Booking preferences</h2>
          <p>Control client reservation rules, buffer periods, and calendar synchronization.</p>
        </div>
        <div className={styles.panelHeaderActions}>
          <button
            type="button"
            className={`${styles.panelSaveBtn} ${isSaved ? styles.savedState : ""}`}
            onClick={handleSave}
            disabled={isSaved}
            aria-label="Save preferences"
          >
            {isSaved ? (
              <>
                <Check size={13} />
                <span>Preferences saved</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save preferences</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.preferencesList}>
        {OPTIONS.map((option) => {
          const isChecked = enabled.includes(option.id);
          const Icon = option.icon;
          return (
            <label
              key={option.id}
              className={`${styles.preferenceRow} ${isChecked ? styles.preferenceRowActive : ""}`}
            >
              <div className={styles.preferenceIconBox}>
                <Icon size={16} />
              </div>
              <div className={styles.preferenceText}>
                <strong>{option.title}</strong>
                <small>{option.description}</small>
              </div>
              <div className={styles.switchWrapper}>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(option.id)}
                  aria-label={option.title}
                />
                <i className={styles.toggleSwitch} />
              </div>
            </label>
          );
        })}
      </div>

      <div className={styles.preferenceSelects}>
        <div className={styles.preferenceFieldGroup}>
          <label className={styles.preferenceFieldLabel} htmlFor="min-notice-select">
            Minimum notice period
          </label>
          <p className={styles.preferenceFieldDescription}>
            Shortest lead time required before a session begins to allow adequate preparation and prevent last-minute surprise bookings.
          </p>
          <div className={styles.selectWrapper}>
            <select id="min-notice-select" defaultValue="2" className={styles.preferenceSelect}>
              <option value="1">1 hour in advance</option>
              <option value="2">2 hours in advance (Recommended)</option>
              <option value="4">4 hours in advance</option>
              <option value="24">24 hours in advance</option>
            </select>
          </div>
        </div>

        <div className={styles.preferenceFieldGroup}>
          <label className={styles.preferenceFieldLabel} htmlFor="booking-window-select">
            Advance booking window
          </label>
          <p className={styles.preferenceFieldDescription}>
            How far into the future clients can view open schedule slots and reserve consultations on your calendar.
          </p>
          <div className={styles.selectWrapper}>
            <select id="booking-window-select" defaultValue="90" className={styles.preferenceSelect}>
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
    </section>
  );
}
