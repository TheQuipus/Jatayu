"use client";

import { PAYMENT_PROVIDER_OPTIONS, type AdminSettings } from "@/lib/adminSettings";
import Field from "./Field";
import styles from "./PaymentSettingsPanel.module.css";

type PaymentSettingsPanelProps = {
  draft: AdminSettings["payment"];
  onChange: (payment: AdminSettings["payment"]) => void;
};

export default function PaymentSettingsPanel({
  draft,
  onChange,
}: PaymentSettingsPanelProps) {
  return (
    <div className={styles.panelGrid}>
      <Field label="Payment Provider">
        <select
          className={styles.select}
          value={draft.provider}
          onChange={(event) =>
            onChange({
              ...draft,
              provider: event.target.value as AdminSettings["payment"]["provider"],
            })
          }
        >
          {PAYMENT_PROVIDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>

      <div className={styles.fieldRow}>
        <Field label="Key ID / Publishable Key">
          <input
            className={styles.input}
            value={draft.keyId}
            onChange={(event) => onChange({ ...draft, keyId: event.target.value })}
            placeholder="rzp_live_xxxxxxxx"
            autoComplete="off"
          />
        </Field>
        <Field label="Secret Key">
          <input
            className={styles.input}
            type="password"
            value={draft.secretKey}
            onChange={(event) => onChange({ ...draft, secretKey: event.target.value })}
            placeholder="Enter secret key"
            autoComplete="off"
          />
        </Field>
      </div>

      <div className={styles.fieldRow}>
        <Field label="Webhook Secret" hint="Used to verify payment webhook signatures.">
          <input
            className={styles.input}
            type="password"
            value={draft.webhookSecret}
            onChange={(event) => onChange({ ...draft, webhookSecret: event.target.value })}
            placeholder="Enter webhook secret"
            autoComplete="off"
          />
        </Field>
        <Field label="Default Currency">
          <input
            className={styles.input}
            value={draft.currency}
            onChange={(event) => onChange({ ...draft, currency: event.target.value.toUpperCase() })}
            placeholder="INR"
            maxLength={3}
          />
        </Field>
      </div>

      <label className={styles.toggleField}>
        <span className={styles.toggleCopy}>
          <span className={styles.toggleLabel}>Test mode</span>
          <span className={styles.toggleDesc}>
            Route checkout and payouts through the provider sandbox until you go live.
          </span>
        </span>
        <input
          type="checkbox"
          className={styles.toggle}
          checked={draft.testMode}
          onChange={(event) => onChange({ ...draft, testMode: event.target.checked })}
        />
      </label>
    </div>
  );
}
