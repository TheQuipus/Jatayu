"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { SMTP_ENCRYPTION_OPTIONS, type AdminSettings } from "@/lib/adminSettings";
import Field from "./Field";
import styles from "./SmtpSettingsPanel.module.css";

type SmtpSettingsPanelProps = {
  draft: AdminSettings["smtp"];
  saved: AdminSettings["smtp"];
  onChange: (smtp: AdminSettings["smtp"]) => void;
};

export default function SmtpSettingsPanel({
  draft,
  saved,
  onChange,
}: SmtpSettingsPanelProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <>
      <div className={styles.panelGrid}>
        <div className={styles.fieldRow}>
          <Field label="SMTP Host">
            <input
              className={styles.input}
              value={draft.host}
              onChange={(event) => onChange({ ...draft, host: event.target.value })}
              placeholder="smtp.gmail.com"
            />
          </Field>
          <Field label="Port">
            <input
              className={styles.input}
              value={draft.port}
              onChange={(event) => onChange({ ...draft, port: event.target.value })}
              placeholder="587"
              inputMode="numeric"
            />
          </Field>
        </div>

        <div className={styles.fieldRow}>
          <Field label="Username">
            <input
              className={styles.input}
              value={draft.username}
              onChange={(event) => onChange({ ...draft, username: event.target.value })}
              placeholder="smtp-user@example.com"
              autoComplete="off"
            />
          </Field>
          <Field label="Password">
            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                value={draft.password}
                onChange={(event) => onChange({ ...draft, password: event.target.value })}
                placeholder="Enter SMTP password"
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
        </div>

        <Field label="Encryption">
          <select
            className={styles.select}
            value={draft.encryption}
            onChange={(event) =>
              onChange({
                ...draft,
                encryption: event.target.value as AdminSettings["smtp"]["encryption"],
              })
            }
          >
            {SMTP_ENCRYPTION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className={styles.recordsSection}>
        <div className={styles.recordsHeader}>
          <h4 className={styles.recordsTitle}>Saved Email (SMTP) Records</h4>
          <span className={styles.badgeActive}>Active Record</span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Host</th>
                <th>Port</th>
                <th>Encryption</th>
                <th>Username</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: "var(--ink)" }}>{saved.host || "—"}</td>
                <td>{saved.port || "587"}</td>
                <td>
                  <code style={{ fontSize: "12px", background: "var(--seashell)", padding: "2px 4px" }}>
                    {saved.encryption.toUpperCase()}
                  </code>
                </td>
                <td>{saved.username || "—"}</td>
                <td>
                  <span className={styles.badgeActive}>Active</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
