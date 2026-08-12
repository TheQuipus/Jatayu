"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Save,
  Send,
  Plus,
  Trash2,
  Edit2,
  X,
  Info,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import {
  SETTINGS_SECTIONS,
  SMS_PROVIDER_OPTIONS,
  SMTP_ENCRYPTION_OPTIONS,
  PAYMENT_PROVIDER_OPTIONS,
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CHANNEL_LABELS,
  TEMPLATE_RECIPIENT_LABELS,
  DEFAULT_ADMIN_SETTINGS,
  type AdminSettings,
  type MessageTemplate,
  type MessageTemplateRecipient,
  type SettingsSection,
  type MessageTemplateChannel,
  type MessageTemplateCategory,
  type ProviderAuthCredentials,
} from "@/lib/adminSettings";
import styles from "./AdminSettings.module.css";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {children}
      {hint ? <p className={styles.fieldHint}>{hint}</p> : null}
    </div>
  );
}

function SmsSettingsPanel({
  draft,
  saved,
  onChange,
}: {
  draft: AdminSettings["sms"];
  saved: AdminSettings["sms"];
  onChange: (sms: AdminSettings["sms"]) => void;
}) {
  return (
    <>
      <div className={styles.panelGrid}>
        <div className={styles.fieldRow}>
          <Field label="SMS Provider">
            <select
              className={styles.select}
              value={draft.provider}
              onChange={(event) =>
                onChange({ ...draft, provider: event.target.value as AdminSettings["sms"]["provider"] })
              }
            >
              {SMS_PROVIDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
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



function SmtpSettingsPanel({
  draft,
  saved,
  onChange,
}: {
  draft: AdminSettings["smtp"];
  saved: AdminSettings["smtp"];
  onChange: (smtp: AdminSettings["smtp"]) => void;
}) {
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

function PaymentSettingsPanel({
  draft,
  onChange,
}: {
  draft: AdminSettings["payment"];
  onChange: (payment: AdminSettings["payment"]) => void;
}) {
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

          <Field
            label="Authorized Domains"
            hint={`Domains authorized system-wide for ${label} sign-in.`}
          >
            <input
              className={styles.input}
              value={draft.authorizedDomains || "jatayu.com, localhost"}
              readOnly
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

function AuthCredentialsPanel({
  draft,
  saved,
  onChange,
}: {
  draft: AdminSettings["auth"];
  saved: AdminSettings["auth"];
  onChange: (auth: AdminSettings["auth"]) => void;
}) {
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

function AiSettingsPanel({
  draft,
  saved,
  onChange,
}: {
  draft: AdminSettings["ai"];
  saved: AdminSettings["ai"];
  onChange: (ai: AdminSettings["ai"]) => void;
}) {
  const [showKey, setShowKey] = useState(false);

  return (
    <>
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

      <div className={styles.statusCallout}>
        <Info size={16} className={styles.statusCalloutIcon} />
        <div>
          <strong>AI Config Status:</strong> {saved?.name || "OpenAI GPT-4"}{" "}
          {saved?.apiKey ? "(API Key Configured)" : "(No API Key Provided)"}
        </div>
      </div>
    </>
  );
}

function normalizeTemplateVariable(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("{{") && trimmed.endsWith("}}")) {
    return trimmed;
  }

  const slug = trimmed
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

  return slug ? `{{${slug}}}` : "";
}

function TemplateEditor({
  template,
  onChange,
}: {
  template: MessageTemplate;
  onChange: (updates: Partial<MessageTemplate>) => void;
}) {
  const [newVariable, setNewVariable] = useState("");

  const insertVariable = (variable: string) => {
    onChange({ body: `${template.body}${template.body ? " " : ""}${variable}` });
  };

  const handleAddVariable = () => {
    const variable = normalizeTemplateVariable(newVariable);
    if (!variable) return;

    if (!template.variables.includes(variable)) {
      onChange({ variables: [...template.variables, variable] });
    }

    insertVariable(variable);
    setNewVariable("");
  };

  return (
    <div className={styles.templateEditor}>
      <div className={styles.templateEditorHeader}>
        <div>
          <h3 className={styles.templateEditorTitle}>{template.name}</h3>
          <p className={styles.templateEditorMeta}>
            {TEMPLATE_RECIPIENT_LABELS[template.recipient]} ·{" "}
            {TEMPLATE_CHANNEL_LABELS[template.channel]} ·{" "}
            {TEMPLATE_CATEGORY_LABELS[template.category]}
          </p>
        </div>
      </div>

      {template.channel === "email" ? (
        <Field label="Email Subject">
          <input
            className={styles.input}
            value={template.subject ?? ""}
            onChange={(event) => onChange({ subject: event.target.value })}
          />
        </Field>
      ) : null}

      <Field label="Message Body">
        <textarea
          className={`${styles.textarea} ${styles.textareaLarge}`}
          value={template.body}
          onChange={(event) => onChange({ body: event.target.value })}
          rows={8}
        />
      </Field>

      <div className={styles.variableList}>
        <div className={styles.variableLabel}>Template Variables</div>
        <div className={styles.variableTags}>
          {template.variables.map((variable) => (
            <button
              key={variable}
              type="button"
              className={styles.variableTag}
              onClick={() => insertVariable(variable)}
            >
              {variable}
            </button>
          ))}
        </div>
        <div className={styles.variableAddRow}>
          <input
            className={styles.input}
            value={newVariable}
            onChange={(event) => setNewVariable(event.target.value)}
            placeholder="e.g. expert_name or {{expert_name}}"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddVariable();
              }
            }}
          />
          <button type="button" className={styles.variableAddBtn} onClick={handleAddVariable}>
            Add Variable
          </button>
        </div>
        <p className={styles.fieldHint}>
          Click a variable to insert it into the message body, or add a new one above.
        </p>
      </div>

      <div className={styles.previewBox}>
        <div className={styles.previewLabel}>Preview</div>
        <div className={styles.previewBubble}>
          {template.channel === "email" && template.subject ? (
            <>
              <strong>Subject:</strong> {template.subject}
              <br />
              <br />
            </>
          ) : null}
          {template.body}
        </div>
      </div>
    </div>
  );
}

function AddTemplateModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (template: MessageTemplate) => void;
}) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<MessageTemplateChannel>("sms");
  const [recipient, setRecipient] = useState<MessageTemplateRecipient>("expert");
  const [category, setCategory] = useState<MessageTemplateCategory>("application_approved");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !name || !body) return;

    onAdd({
      id: id.startsWith("tpl-") ? id : `tpl-${id}`,
      name,
      channel,
      recipient,
      category,
      subject: channel === "email" ? subject : undefined,
      body,
      variables: body.match(/\{\{[a-zA-Z0-9_]+\}\}/g) || [],
      status: "active",
    });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <form onSubmit={handleSubmit} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create New Message Template</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.modalBody} style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Template ID (prefixed with tpl-)</label>
            <input
              required
              className={styles.input}
              placeholder="e.g. otp-login"
              value={id}
              onChange={(e) => setId(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase())}
            />
            <p className={styles.fieldHint}>Will save as: tpl-{id || "..."}</p>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Template Name</label>
              <input
                required
                className={styles.input}
                placeholder="e.g. OTP Verification Code"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Category</label>
              <select
                className={styles.select}
                value={category}
                onChange={(e) => setCategory(e.target.value as MessageTemplateCategory)}
              >
                {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Channel</label>
              <select
                className={styles.select}
                value={channel}
                onChange={(e) => setChannel(e.target.value as MessageTemplateChannel)}
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Recipient</label>
              <select
                className={styles.select}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value as MessageTemplateRecipient)}
              >
                <option value="expert">Expert</option>
                <option value="seeker">Seeker</option>
              </select>
            </div>
          </div>

          {channel === "email" && (
            <div className={styles.field}>
              <label className={styles.fieldLabel}>Email Subject</label>
              <input
                required
                className={styles.input}
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Message Body</label>
            <textarea
              required
              className={styles.textarea}
              rows={5}
              placeholder="Enter template text. Use double curly braces for variables, e.g. {{otp_code}}."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={!id || !name || !body}>
            Create Template
          </button>
        </div>
      </form>
    </div>
  );
}

function TemplatesPanel({
  templates,
  onUpdateTemplate,
  onDeleteTemplate,
  onAddTemplate,
}: {
  templates: MessageTemplate[];
  onUpdateTemplate: (templateId: string, updates: Partial<MessageTemplate>) => void;
  onDeleteTemplate: (templateId: string) => void;
  onAddTemplate: (template: MessageTemplate) => void;
}) {
  const [recipientFilter, setRecipientFilter] = useState<MessageTemplateRecipient | "all">("all");
  const [channelFilter, setChannelFilter] = useState<MessageTemplate["channel"] | "all">("all");
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchRecipient = recipientFilter === "all" || template.recipient === recipientFilter;
      const matchChannel = channelFilter === "all" || template.channel === channelFilter;
      return matchRecipient && matchChannel;
    });
  }, [recipientFilter, channelFilter, templates]);

  return (
    <div style={{ width: "100%" }}>
      <div className={styles.templateHeaderRow}>
        <h2 className={styles.templateTitle}>All Communication Templates</h2>
        <button
          type="button"
          className={styles.addTemplateBtn}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={14} />
          Add Template
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        <div className={styles.templateFilterBar} style={{ display: "flex", gap: "20px", marginBottom: "20px", borderBottom: "1px solid var(--mercury)", paddingBottom: "16px" }}>
          <div>
            <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--dove-gray)", display: "block", marginBottom: "8px" }}>Recipient</span>
            <div className={styles.templateFilterGroup} role="tablist">
              {(["all", "expert", "seeker"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`${styles.templateFilterBtn} ${
                    recipientFilter === filter ? styles.templateFilterBtnActive : ""
                  }`}
                  onClick={() => setRecipientFilter(filter)}
                >
                  {filter === "all" ? "All" : TEMPLATE_RECIPIENT_LABELS[filter]}
                </button>
              ))}
            </div>
          </div>
          <div style={{ width: "1px", background: "var(--mercury)" }} />
          <div>
            <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", color: "var(--dove-gray)", display: "block", marginBottom: "8px" }}>Channel</span>
            <div className={styles.templateFilterGroup} role="tablist">
              {(["all", "sms", "email"] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`${styles.templateFilterBtn} ${styles.templateFilterBtnChannel} ${
                    channelFilter === filter ? styles.templateFilterBtnChannelActive : ""
                  }`}
                  onClick={() => setChannelFilter(filter)}
                >
                  {filter === "all" ? "All" : TEMPLATE_CHANNEL_LABELS[filter]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Recipient / Channel</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTemplates.map((template) => {
                const isActive = template.status !== "disabled";
                return (
                  <tr key={template.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{template.id}</td>
                    <td>{template.name}</td>
                    <td>
                      {TEMPLATE_RECIPIENT_LABELS[template.recipient]} · {TEMPLATE_CHANNEL_LABELS[template.channel]}
                    </td>
                    <td>
                      <code style={{ fontSize: "12px", background: "var(--seashell)", padding: "2px 4px" }}>
                        {template.category}
                      </code>
                    </td>
                    <td>
                      <span className={isActive ? styles.badgeActive : styles.badgeDisabled}>
                        {isActive ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionCell}>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => onUpdateTemplate(template.id, { status: isActive ? "disabled" : "active" })}
                        >
                          {isActive ? "Disable" : "Activate"}
                        </button>
                        <button
                          type="button"
                          className={styles.actionBtn}
                          onClick={() => setEditingTemplate(template)}
                        >
                          <Edit2 size={12} />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                          onClick={() => onDeleteTemplate(template.id)}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTemplates.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--dove-gray)" }}>
                    No templates found matching the active filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingTemplate && (
        <div className={styles.modalOverlay} onClick={() => setEditingTemplate(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Template: {editingTemplate.id}</h3>
              <button type="button" className={styles.modalClose} onClick={() => setEditingTemplate(null)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ maxHeight: "70vh", overflowY: "auto" }}>
              <TemplateEditor
                template={editingTemplate}
                onChange={(updates) => {
                  onUpdateTemplate(editingTemplate.id, updates);
                  setEditingTemplate((prev) => (prev ? { ...prev, ...updates } : null));
                }}
              />
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnPrimary} onClick={() => setEditingTemplate(null)}>
                Close Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <AddTemplateModal
          onClose={() => setShowAddModal(false)}
          onAdd={(newTpl) => {
            onAddTemplate(newTpl);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

export default function AdminSettings({ section }: { section: SettingsSection }) {
  const { ready, settings, savedAt, save } = useAdminSettings();
  const activeSection = section;
  const [draft, setDraft] = useState(settings);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [showTestSmsModal, setShowTestSmsModal] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState("");
  const [testTemplateId, setTestTemplateId] = useState("");

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  useEffect(() => {
    if (!savedAt) return;
    setShowSavedBanner(true);
    const timer = window.setTimeout(() => setShowSavedBanner(false), 3000);
    return () => window.clearTimeout(timer);
  }, [savedAt]);

  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings],
  );

  const sectionMeta = useMemo(
    () => SETTINGS_SECTIONS.find((item) => item.id === activeSection)!,
    [activeSection],
  );

  const activeSmsTemplates = useMemo(() => {
    return draft.templates?.filter(t => t.channel === "sms" && t.status !== "disabled") || [];
  }, [draft.templates]);

  useEffect(() => {
    if (activeSmsTemplates.length > 0 && !testTemplateId) {
      setTestTemplateId(activeSmsTemplates[0].id);
    }
  }, [activeSmsTemplates, testTemplateId]);

  if (!ready) {
    return null;
  }

  const handleSave = () => {
    save(draft);
    setTestStatus(null);
  };

  const handleTest = () => {
    if (activeSection === "sms") {
      setShowTestSmsModal(true);
    } else {
      const sectionLabel = sectionMeta.label;
      setTestStatus(`Test ${sectionLabel.toLowerCase()} request queued successfully.`);
      window.setTimeout(() => setTestStatus(null), 4000);
    }
  };

  const handleSendTestSms = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber || !testTemplateId) return;

    const selectedTpl = draft.templates.find(t => t.id === testTemplateId);
    if (!selectedTpl) return;

    setTestStatus(`Test SMS using template "${selectedTpl.name}" sent to ${testPhoneNumber}.`);
    setShowTestSmsModal(false);
    setTestPhoneNumber("");
    window.setTimeout(() => setTestStatus(null), 5000);
  };

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              {sectionMeta.label}{" "}
              <span className={styles.accentWord}>Settings</span>
            </h1>
            <p className={styles.pageSubtitle}>{sectionMeta.description}</p>
          </div>
          <div className={styles.headerActions}>
            {activeSection !== "templates" ? (
              <button type="button" className={styles.outlineBtn} onClick={handleTest}>
                <Send size={14} />
                Send Test
              </button>
            ) : null}
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!isDirty}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </header>

        {showSavedBanner ? (
          <div
            className={`${styles.savedBanner} ${
              activeSection !== "templates" ? styles.bannerForm : ""
            }`}
            role="status"
          >
            <CheckCircle2 size={16} />
            Settings saved successfully.
          </div>
        ) : null}

        {testStatus ? (
          <div
            className={`${styles.testBanner} ${
              activeSection !== "templates" ? styles.bannerForm : ""
            }`}
            role="status"
          >
            <Send size={16} />
            {testStatus}
          </div>
        ) : null}

        <article
          className={`${styles.settingsPanel} ${
            activeSection !== "templates" ? styles.settingsPanelForm : ""
          }`}
        >
          <div
            className={`${styles.panelBody} ${
              activeSection === "templates" ? styles.panelBodyFlush : ""
            }`}
          >
            {activeSection === "sms" ? (
              <SmsSettingsPanel
                draft={draft.sms}
                saved={settings.sms}
                onChange={(sms) => setDraft((current) => ({ ...current, sms }))}
              />
            ) : null}

            {activeSection === "smtp" ? (
              <SmtpSettingsPanel
                draft={draft.smtp}
                saved={settings.smtp}
                onChange={(smtp) => setDraft((current) => ({ ...current, smtp }))}
              />
            ) : null}

            {activeSection === "auth" ? (
              <AuthCredentialsPanel
                draft={draft.auth}
                saved={settings.auth}
                onChange={(auth) => setDraft((current) => ({ ...current, auth }))}
              />
            ) : null}

            {activeSection === "payment" ? (
              <PaymentSettingsPanel
                draft={draft.payment}
                onChange={(payment) => setDraft((current) => ({ ...current, payment }))}
              />
            ) : null}

            {activeSection === "ai" ? (
              <AiSettingsPanel
                draft={draft.ai}
                saved={settings.ai}
                onChange={(ai) => setDraft((current) => ({ ...current, ai }))}
              />
            ) : null}

            {activeSection === "templates" ? (
              <TemplatesPanel
                templates={draft.templates}
                onUpdateTemplate={(templateId, updates) => {
                  const next = {
                    ...draft,
                    templates: draft.templates.map((template) =>
                      template.id === templateId ? { ...template, ...updates } : template,
                    ),
                  };
                  setDraft(next);
                  save(next);
                }}
                onDeleteTemplate={(templateId) => {
                  const next = {
                    ...draft,
                    templates: draft.templates.filter((template) => template.id !== templateId),
                  };
                  setDraft(next);
                  save(next);
                }}
                onAddTemplate={(newTpl) => {
                  const next = {
                    ...draft,
                    templates: [...draft.templates, newTpl],
                  };
                  setDraft(next);
                  save(next);
                }}
              />
            ) : null}
          </div>
        </article>
      </div>

      {showTestSmsModal && (
        <div className={styles.modalOverlay} onClick={() => setShowTestSmsModal(false)}>
          <form onSubmit={handleSendTestSms} className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Test SMS Dispatch</h3>
              <button type="button" className={styles.modalClose} onClick={() => setShowTestSmsModal(false)}>
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalEducate}>
                <p><strong>💡 Important Setup Reminder:</strong></p>
                <p>Before dispatching a test message, please educate yourself on filling template texts: each active template text must be fully configured with body text and correct placeholder variables in double curly braces (e.g. <code>{"{{otp_code}}"}</code> or <code>{"{{expert_name}}"}</code>).</p>
                <p>You can manage and edit your message templates under the <strong>Templates</strong> section.</p>
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Test Recipient Phone Number</label>
                <input
                  required
                  className={styles.input}
                  placeholder="e.g. +919999988888"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.fieldLabel}>Choose Template to Test</label>
                <select
                  required
                  className={styles.select}
                  value={testTemplateId}
                  onChange={(e) => setTestTemplateId(e.target.value)}
                >
                  {activeSmsTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      [{t.id}] {t.name}
                    </option>
                  ))}
                  {activeSmsTemplates.length === 0 && (
                    <option value="">No active SMS templates found</option>
                  )}
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button type="button" className={styles.btnSecondary} onClick={() => setShowTestSmsModal(false)}>
                Cancel
              </button>
              <button type="submit" className={styles.btnPrimary} disabled={!testPhoneNumber || !testTemplateId}>
                Dispatch Test
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
