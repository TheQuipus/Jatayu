"use client";

import { SMS_PROVIDER_OPTIONS, type AdminSettings } from "@/lib/adminSettings";
import Field from "./Field";
import SmartSearchSelect from "./SmartSearchSelect";
import styles from "./SmsSettingsPanel.module.css";

type SmsSettingsPanelProps = {
  draft: AdminSettings["sms"];
  saved: AdminSettings["sms"];
  onChange: (sms: AdminSettings["sms"]) => void;
};

export default function SmsSettingsPanel({
  draft,
  saved,
  onChange,
}: SmsSettingsPanelProps) {
  return (
    <>
      <div className={styles.panelGrid}>
        <div className={styles.fieldRow}>
          <Field label="SMS Provider">
            <SmartSearchSelect
              value={draft.provider}
              options={SMS_PROVIDER_OPTIONS}
              onChange={(newProvider) =>
                onChange({ ...draft, provider: newProvider as AdminSettings["sms"]["provider"] })
              }
              placeholder="Select SMS Provider"
            />
          </Field>
          <Field label="Sender ID" hint="6-character alphanumeric ID.">
            <input
              className={styles.input}
              value={draft.senderId}
              onChange={(event) => onChange({ ...draft, senderId: event.target.value })}
              placeholder="JATAYU"
              maxLength={6}
            />
          </Field>
        </div>

        <div className={styles.fieldRow}>
          <Field label="Auth Token" hint="Stored securely in your environment.">
            <input
              className={styles.input}
              type="password"
              value={draft.authToken}
              onChange={(event) => onChange({ ...draft, authToken: event.target.value })}
              placeholder="Enter Auth Token"
              autoComplete="off"
            />
          </Field>
          <Field label="Contact No.">
            <input
              className={styles.input}
              value={draft.contactNo}
              onChange={(event) => onChange({ ...draft, contactNo: event.target.value })}
              placeholder="Enter contact number"
            />
          </Field>
        </div>
      </div>

      <div className={styles.recordsSection}>
        <div className={styles.recordsHeader}>
          <h4 className={styles.recordsTitle}>Saved SMS Records</h4>
          <span className={styles.badgeActive}>Active Record</span>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Sender ID</th>
                <th>Contact No.</th>
                <th>Auth Token</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: "var(--ink)" }}>
                  {SMS_PROVIDER_OPTIONS.find((p) => p.value === saved.provider)?.label || saved.provider}
                </td>
                <td>{saved.senderId || "—"}</td>
                <td>{saved.contactNo || "—"}</td>
                <td>{saved.authToken ? "••••••••" : "Not set"}</td>
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
