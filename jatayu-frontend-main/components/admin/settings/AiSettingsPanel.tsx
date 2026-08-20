"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { AdminSettings } from "@/lib/adminSettings";
import Field from "./Field";
import styles from "./AiSettingsPanel.module.css";

type AiSettingsPanelProps = {
  draft: AdminSettings["ai"];
  saved: AdminSettings["ai"];
  onChange: (ai: AdminSettings["ai"]) => void;
};

export default function AiSettingsPanel({
  draft,
  saved,
  onChange,
}: AiSettingsPanelProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className={styles.panelGrid}>
      <div className={styles.fieldRow}>
        <Field label="AI Model / Provider Name" hint="Specify model name or provider (e.g. OpenAI GPT-4, Claude 3.5, Gemini Pro).">
          <input
            className={styles.input}
            value={draft?.name || ""}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="OpenAI GPT-4"
          />
        </Field>

        <Field label="API Key" hint="Secret key used for AI service authentication.">
          <div className={styles.passwordWrapper}>
            <input
              className={styles.input}
              type={showKey ? "text" : "password"}
              value={draft?.apiKey || ""}
              onChange={(event) => onChange({ ...draft, apiKey: event.target.value })}
              placeholder="sk-..."
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={() => setShowKey((prev) => !prev)}
              title={showKey ? "Hide API key" : "Show API key"}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>
      </div>
    </div>
  );
}
