"use client";

import type { AdminSettings } from "@/lib/adminSettings";
import Field from "./Field";
import styles from "./PaymentSettingsPanel.module.css";

type Props = {
  draft: AdminSettings["communication"];
  onChange: (value: AdminSettings["communication"]) => void;
};

export default function CommunicationSettingsPanel({ draft, onChange }: Props) {
  const number = (key: keyof typeof draft, value: string) =>
    onChange({ ...draft, [key]: Math.max(1, Number(value) || 1) });
  return (
    <div className={styles.panelGrid}>
      <label className={styles.toggleField}>
        <span className={styles.toggleCopy}>
          <span className={styles.toggleLabel}>Enable Agora sessions</span>
          <span className={styles.toggleDesc}>Allow confirmed bookings to open voice, video, and live chat rooms.</span>
        </span>
        <input type="checkbox" className={styles.toggle} checked={draft.agoraEnabled}
          onChange={(event) => onChange({ ...draft, agoraEnabled: event.target.checked })} />
      </label>
      <div className={styles.fieldRow}>
        <Field label="Agora App ID">
          <input className={styles.input} value={draft.agoraAppId}
            onChange={(event) => onChange({ ...draft, agoraAppId: event.target.value })} />
        </Field>
        <Field label="Agora App Certificate" hint="Stored only on the backend and never returned to clients.">
          <input className={styles.input} type="password" autoComplete="off" value={draft.agoraAppCertificate}
            onChange={(event) => onChange({ ...draft, agoraAppCertificate: event.target.value })} />
        </Field>
      </div>
      <div className={styles.fieldRow}>
        <Field label="Token lifetime (seconds)">
          <input className={styles.input} type="number" min="60" value={draft.tokenTtlSeconds}
            onChange={(event) => number("tokenTtlSeconds", event.target.value)} />
        </Field>
        <Field label="Join before session (minutes)">
          <input className={styles.input} type="number" min="1" value={draft.joinBeforeMinutes}
            onChange={(event) => number("joinBeforeMinutes", event.target.value)} />
        </Field>
      </div>
      <Field label="Keep room open after session (minutes)">
        <input className={styles.input} type="number" min="1" value={draft.joinAfterMinutes}
          onChange={(event) => number("joinAfterMinutes", event.target.value)} />
      </Field>
    </div>
  );
}
