"use client";

import type { AdminSettings } from "@/lib/adminSettings";
import Field from "./Field";
import styles from "./PaymentSettingsPanel.module.css";

type Props = {
  draft: AdminSettings["booking"];
  onChange: (booking: AdminSettings["booking"]) => void;
};

export default function BookingSettingsPanel({ draft, onChange }: Props) {
  const updateNumber = (key: keyof typeof draft, raw: string) => {
    const value = Math.max(1, Number(raw) || 1);
    onChange({ ...draft, [key]: value });
  };
  const updateNonNegativeNumber = (key: keyof typeof draft, raw: string) => {
    onChange({ ...draft, [key]: Math.max(0, Number(raw) || 0) });
  };

  return (
    <div className={styles.panelGrid}>
      <Field label="Minimum booking lead time (minutes)" hint="Set 0 to allow any future slot without an additional buffer.">
        <input
          className={styles.input}
          type="number"
          min="0"
          step="1"
          value={draft.minimumLeadTimeMinutes}
          onChange={(event) => updateNonNegativeNumber("minimumLeadTimeMinutes", event.target.value)}
        />
      </Field>
      <div className={styles.fieldRow}>
        <Field label="Poke initial delay (hours)" hint="How long a seeker must wait before the first poke.">
          <input
            className={styles.input}
            type="number"
            min="1"
            step="0.5"
            value={draft.pokeInitialDelayHours}
            onChange={(event) => updateNumber("pokeInitialDelayHours", event.target.value)}
          />
        </Field>
        <Field label="Poke cooldown (hours)" hint="Minimum time between two pokes for the same booking.">
          <input
            className={styles.input}
            type="number"
            min="1"
            step="0.5"
            value={draft.pokeCooldownHours}
            onChange={(event) => updateNumber("pokeCooldownHours", event.target.value)}
          />
        </Field>
      </div>
      <Field label="Maximum pokes per booking">
        <input
          className={styles.input}
          type="number"
          min="1"
          step="1"
          value={draft.pokeMaxCount}
          onChange={(event) => updateNumber("pokeMaxCount", event.target.value)}
        />
      </Field>
    </div>
  );
}
