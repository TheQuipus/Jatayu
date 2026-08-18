"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DEFAULT_ADMIN_SETTINGS,
  type AdminSettings,
  type ProviderAuthCredentials,
} from "@/lib/adminSettings";
import Field from "./Field";
import styles from "./AuthCredentialsPanel.module.css";

type ProviderKey = "google" | "meta" | "linkedin";

const PROVIDER_CONFIGS: {
  key: ProviderKey;
  label: string;
  defaultPlaceholder: string;
  defaultRedirect: string;
}[] = [
  {
    key: "google",
    label: "Google",
    defaultPlaceholder: "xxxxxxxx.apps.googleusercontent.com",
    defaultRedirect: "https://jatayu.com/api/auth/google/callback",
  },
  {
    key: "meta",
    label: "Meta",
    defaultPlaceholder: "123456789012345",
    defaultRedirect: "https://jatayu.com/api/auth/meta/callback",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    defaultPlaceholder: "78xxxxxxxxxxxxxx",
    defaultRedirect: "https://jatayu.com/api/auth/linkedin/callback",
  },
];

function AuthProviderAccordion({
  providerKey,
  label,
  defaultPlaceholder,
  defaultRedirect,
  draft,
  onChange,
  isOpen,
  onToggle,
}: {
  providerKey: ProviderKey;
  label: string;
  defaultPlaceholder: string;
  defaultRedirect: string;
  draft: ProviderAuthCredentials;
  onChange: (updated: ProviderAuthCredentials) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.accordion}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={styles.accordionTitle}>{label} Credentials</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className={draft.enableSignIn ? styles.badgeActive : styles.badgeDisabled}>
            {draft.enableSignIn ? "Sign-In Active" : "Disabled"}
          </span>
          <ChevronDown
            size={18}
            className={`${styles.accordionChevron} ${isOpen ? styles.accordionChevronOpen : ""}`}
          />
        </div>
      </button>

      {isOpen ? (
        <div className={styles.accordionBody}>
          <Field label={`${label} Client ID / App ID`}>
            <input
              className={styles.input}
              value={draft.clientId}
              onChange={(event) => onChange({ ...draft, clientId: event.target.value })}
              placeholder={defaultPlaceholder}
              autoComplete="off"
            />
          </Field>

          <Field label="Redirect URI" hint={`Must match an authorized redirect URI in ${label} Developer Portal.`}>
            <input
              className={styles.input}
              value={draft.redirectUri || defaultRedirect}
              onChange={(event) => onChange({ ...draft, redirectUri: event.target.value })}
              placeholder={defaultRedirect}
            />
          </Field>

          {providerKey === "google" ? (
            <div className={styles.fieldRow}>
              <label className={styles.toggleField}>
                <span className={styles.toggleCopy}>
                  <span className={styles.toggleLabel}>Google Sign-In</span>
                  <span className={styles.toggleDesc}>
                    Allow seekers and experts to sign in with Google.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className={styles.toggle}
                  checked={draft.enableSignIn}
                  onChange={(event) => onChange({ ...draft, enableSignIn: event.target.checked })}
                />
              </label>

              <label className={styles.toggleField}>
                <span className={styles.toggleCopy}>
                  <span className={styles.toggleLabel}>Google Calendar</span>
                  <span className={styles.toggleDesc}>
                    Sync expert availability and session bookings with Google Calendar.
                  </span>
                </span>
                <input
                  type="checkbox"
                  className={styles.toggle}
                  checked={draft.enableCalendar}
                  onChange={(event) => onChange({ ...draft, enableCalendar: event.target.checked })}
                />
              </label>
            </div>
          ) : (
            <label className={styles.toggleField}>
              <span className={styles.toggleCopy}>
                <span className={styles.toggleLabel}>{label} Sign-In</span>
                <span className={styles.toggleDesc}>
                  Allow seekers and experts to sign in with {label}.
                </span>
              </span>
              <input
                type="checkbox"
                className={styles.toggle}
                checked={draft.enableSignIn}
                onChange={(event) => onChange({ ...draft, enableSignIn: event.target.checked })}
              />
            </label>
          )}
        </div>
      ) : null}
    </div>
  );
}

type AuthCredentialsPanelProps = {
  draft: AdminSettings["auth"];
  saved: AdminSettings["auth"];
  onChange: (auth: AdminSettings["auth"]) => void;
};

export default function AuthCredentialsPanel({
  draft,
  saved,
  onChange,
}: AuthCredentialsPanelProps) {
  const [openProvider, setOpenProvider] = useState<ProviderKey | null>("google");

  return (
    <>
      <div className={styles.panelGrid} style={{ gap: "12px" }}>
        {PROVIDER_CONFIGS.map((config) => (
          <AuthProviderAccordion
            key={config.key}
            providerKey={config.key}
            label={config.label}
            defaultPlaceholder={config.defaultPlaceholder}
            defaultRedirect={config.defaultRedirect}
            draft={draft[config.key] || DEFAULT_ADMIN_SETTINGS.auth[config.key]}
            onChange={(updated) =>
              onChange({
                ...draft,
                [config.key]: updated,
              })
            }
            isOpen={openProvider === config.key}
            onToggle={() =>
              setOpenProvider((current) => (current === config.key ? null : config.key))
            }
          />
        ))}
      </div>

      <div className={styles.recordsSection}>
        <div className={styles.recordsHeader}>
          <h4 className={styles.recordsTitle}>Saved Auth Provider Records</h4>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Client / App ID</th>
                <th>Redirect URI</th>
                <th>Sign-In</th>
                <th>Calendar Sync</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDER_CONFIGS.map((config) => {
                const item = saved[config.key];
                return (
                  <tr key={config.key}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{config.label}</td>
                    <td>{item?.clientId ? `${item.clientId.slice(0, 16)}...` : "—"}</td>
                    <td style={{ fontSize: "12px", color: "var(--dove-gray)" }}>
                      {item?.redirectUri || config.defaultRedirect}
                    </td>
                    <td>
                      <span className={item?.enableSignIn ? styles.badgeActive : styles.badgeDisabled}>
                        {item?.enableSignIn ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      {config.key === "google" ? (
                        <span className={item?.enableCalendar ? styles.badgeActive : styles.badgeDisabled}>
                          {item?.enableCalendar ? "Active" : "Disabled"}
                        </span>
                      ) : (
                        <span style={{ color: "var(--silver-chalice)", fontSize: "12px" }}>N/A</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
