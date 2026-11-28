"use client";

import {
  ADMIN_IDLE_TIMEOUT_OPTIONS,
  ADMIN_IDLE_WARNING_OPTIONS,
  type AdminSettings,
} from "@/lib/adminSettings";
import { getEffectiveAdminWarningSeconds } from "@/lib/adminIdleSession";
import Field from "./Field";
import panelStyles from "./PaymentSettingsPanel.module.css";
import styles from "./SecuritySettingsPanel.module.css";

type Props = {
  draft: AdminSettings["security"];
  onChange: (security: AdminSettings["security"]) => void;
};

function formatDurationSummary(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins} min`;
  return `${mins}m ${secs}s`;
}

export default function SecuritySettingsPanel({ draft, onChange }: Props) {
  const timeoutMinutes = draft.adminIdleTimeoutMinutes;
  const isDisabled = timeoutMinutes === 0;
  const effectiveWarningSeconds = getEffectiveAdminWarningSeconds(
    timeoutMinutes,
    draft.adminIdleWarningSeconds,
  );
  const warnAfterSeconds = Math.max(0, timeoutMinutes * 60 - effectiveWarningSeconds);

  return (
    <div className={panelStyles.panelGrid}>
      <div className={panelStyles.fieldRow}>
        <Field
          label="Idle Wait Timeout"
          hint="Automatically signs out inactive admin sessions across all /admin pages. Choose Disabled to turn off idle timeouts."
        >
          <select
            id="admin-idle-wait-timeout"
            className={panelStyles.select}
            value={String(draft.adminIdleTimeoutMinutes)}
            onChange={(event) => {
              const nextMinutes = Number(event.target.value);
              onChange({
                ...draft,
                adminIdleTimeoutMinutes: Number.isInteger(nextMinutes) ? nextMinutes : 5,
              });
            }}
          >
            {ADMIN_IDLE_TIMEOUT_OPTIONS.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Pre-Logout Warning Window"
          hint={
            isDisabled
              ? "Warning modal is inactive while Idle Wait Timeout is Disabled."
              : "Countdown modal shown before automatic sign-out (clamped automatically for 1 min testing)."
          }
        >
          <select
            id="admin-idle-warning-seconds"
            className={panelStyles.select}
            disabled={isDisabled}
            value={String(draft.adminIdleWarningSeconds)}
            onChange={(event) => {
              const nextSeconds = Number(event.target.value);
              onChange({
                ...draft,
                adminIdleWarningSeconds: Number.isInteger(nextSeconds) ? nextSeconds : 60,
              });
            }}
          >
            {ADMIN_IDLE_WARNING_OPTIONS.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className={styles.summaryCard} role="status" aria-live="polite">
        <div className={styles.summaryHeader}>
          <span className={styles.summaryTitle}>Effective Admin Session Policy</span>
          <span className={`${styles.summaryBadge} ${isDisabled ? styles.summaryBadgeMuted : ""}`}>
            {isDisabled ? "DISABLED" : `${timeoutMinutes} MIN ACTIVE`}
          </span>
        </div>
        <p className={styles.summaryText}>
          {isDisabled
            ? "Admin sessions will remain active until manual logout or 7-day JWT expiration."
            : `Admins will see a ${effectiveWarningSeconds}-second warning countdown after ${formatDurationSummary(warnAfterSeconds)} of inactivity and be signed out at ${timeoutMinutes} min across all open admin tabs.`}
        </p>
      </div>
    </div>
  );
}

