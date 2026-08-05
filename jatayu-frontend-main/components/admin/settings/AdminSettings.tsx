"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CheckCircle2,
  Save,
  Send,
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
  type AdminSettings,
  type MessageTemplate,
  type MessageTemplateRecipient,
  type SettingsSection,
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
  onChange,
}: {
  draft: AdminSettings["sms"];
  onChange: (sms: AdminSettings["sms"]) => void;
}) {
  return (
    <div className={styles.panelGrid}>
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

      <div className={styles.fieldRow}>
        <Field label="API Key" hint="Stored securely in your environment configuration.">
          <input
            className={styles.input}
            type="password"
            value={draft.apiKey}
            onChange={(event) => onChange({ ...draft, apiKey: event.target.value })}
            placeholder="Enter API key"
            autoComplete="off"
          />
        </Field>
        <Field label="API Secret">
          <input
            className={styles.input}
            type="password"
            value={draft.apiSecret}
            onChange={(event) => onChange({ ...draft, apiSecret: event.target.value })}
            placeholder="Enter API secret"
            autoComplete="off"
          />
        </Field>
      </div>

      <div className={styles.fieldRow}>
        <Field label="Sender ID" hint="6-character alphanumeric sender ID approved by your provider.">
          <input
            className={styles.input}
            value={draft.senderId}
            onChange={(event) => onChange({ ...draft, senderId: event.target.value })}
            placeholder="JATAYU"
            maxLength={6}
          />
        </Field>
        <Field label="Default Country Code">
          <input
            className={styles.input}
            value={draft.defaultCountryCode}
            onChange={(event) => onChange({ ...draft, defaultCountryCode: event.target.value })}
            placeholder="+91"
          />
        </Field>
      </div>
    </div>
  );
}

function EmailSettingsPanel({
  draft,
  onChange,
}: {
  draft: AdminSettings["email"];
  onChange: (email: AdminSettings["email"]) => void;
}) {
  return (
    <div className={styles.panelGrid}>
      <div className={styles.fieldRow}>
        <Field label="From Name">
          <input
            className={styles.input}
            value={draft.fromName}
            onChange={(event) => onChange({ ...draft, fromName: event.target.value })}
            placeholder="Jatayu"
          />
        </Field>
        <Field label="From Email">
          <input
            className={styles.input}
            type="email"
            value={draft.fromEmail}
            onChange={(event) => onChange({ ...draft, fromEmail: event.target.value })}
            placeholder="noreply@jatayu.com"
          />
        </Field>
      </div>

      <Field label="Reply-To Email">
        <input
          className={styles.input}
          type="email"
          value={draft.replyToEmail}
          onChange={(event) => onChange({ ...draft, replyToEmail: event.target.value })}
          placeholder="support@jatayu.com"
        />
      </Field>

      <Field label="Email Footer" hint="Appended to all outgoing email templates.">
        <textarea
          className={styles.textarea}
          value={draft.footerText}
          onChange={(event) => onChange({ ...draft, footerText: event.target.value })}
          rows={3}
        />
      </Field>
    </div>
  );
}

function SmtpSettingsPanel({
  draft,
  onChange,
}: {
  draft: AdminSettings["smtp"];
  onChange: (smtp: AdminSettings["smtp"]) => void;
}) {
  return (
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
          <input
            className={styles.input}
            type="password"
            value={draft.password}
            onChange={(event) => onChange({ ...draft, password: event.target.value })}
            placeholder="Enter SMTP password"
            autoComplete="off"
          />
        </Field>
      </div>
    </div>
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

function GoogleCredentialsPanel({
  draft,
  onChange,
}: {
  draft: AdminSettings["google"];
  onChange: (google: AdminSettings["google"]) => void;
}) {
  return (
    <div className={styles.panelGrid}>
      <div className={styles.fieldRow}>
        <Field label="Client ID">
          <input
            className={styles.input}
            value={draft.clientId}
            onChange={(event) => onChange({ ...draft, clientId: event.target.value })}
            placeholder="xxxxxxxx.apps.googleusercontent.com"
            autoComplete="off"
          />
        </Field>
        <Field label="Client Secret">
          <input
            className={styles.input}
            type="password"
            value={draft.clientSecret}
            onChange={(event) => onChange({ ...draft, clientSecret: event.target.value })}
            placeholder="Enter client secret"
            autoComplete="off"
          />
        </Field>
      </div>

      <Field label="Redirect URI" hint="Must match an authorized redirect URI in Google Cloud Console.">
        <input
          className={styles.input}
          value={draft.redirectUri}
          onChange={(event) => onChange({ ...draft, redirectUri: event.target.value })}
          placeholder="https://jatayu.com/api/auth/google/callback"
        />
      </Field>

      <Field
        label="Authorized Domains"
        hint="Comma-separated domains allowed for Google sign-in (e.g. jatayu.com, localhost)."
      >
        <input
          className={styles.input}
          value={draft.authorizedDomains}
          onChange={(event) => onChange({ ...draft, authorizedDomains: event.target.value })}
          placeholder="jatayu.com, localhost"
        />
      </Field>

      <label className={styles.toggleField}>
        <span className={styles.toggleCopy}>
          <span className={styles.toggleLabel}>Google Sign-In</span>
          <span className={styles.toggleDesc}>Allow seekers and experts to sign in with Google.</span>
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
  );
}

function LinkedinCredentialsPanel({
  draft,
  onChange,
}: {
  draft: AdminSettings["linkedin"];
  onChange: (linkedin: AdminSettings["linkedin"]) => void;
}) {
  return (
    <div className={styles.panelGrid}>
      <div className={styles.fieldRow}>
        <Field label="Client ID">
          <input
            className={styles.input}
            value={draft.clientId}
            onChange={(event) => onChange({ ...draft, clientId: event.target.value })}
            placeholder="Enter LinkedIn client ID"
            autoComplete="off"
          />
        </Field>
        <Field label="Client Secret">
          <input
            className={styles.input}
            type="password"
            value={draft.clientSecret}
            onChange={(event) => onChange({ ...draft, clientSecret: event.target.value })}
            placeholder="Enter client secret"
            autoComplete="off"
          />
        </Field>
      </div>

      <Field
        label="Redirect URI"
        hint="Must match an authorized redirect URI in your LinkedIn developer app."
      >
        <input
          className={styles.input}
          value={draft.redirectUri}
          onChange={(event) => onChange({ ...draft, redirectUri: event.target.value })}
          placeholder="http://localhost:3000/expert/expert-onboarding/"
        />
      </Field>

      <label className={styles.toggleField}>
        <span className={styles.toggleCopy}>
          <span className={styles.toggleLabel}>LinkedIn Sign-In</span>
          <span className={styles.toggleDesc}>Allow experts to sign in with LinkedIn.</span>
        </span>
        <input
          type="checkbox"
          className={styles.toggle}
          checked={draft.enableSignIn}
          onChange={(event) => onChange({ ...draft, enableSignIn: event.target.checked })}
        />
      </label>
    </div>
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

function TemplatesPanel({
  templates,
  onUpdateTemplate,
}: {
  templates: MessageTemplate[];
  onUpdateTemplate: (templateId: string, updates: Partial<MessageTemplate>) => void;
}) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const [recipientFilter, setRecipientFilter] = useState<MessageTemplateRecipient>("expert");
  const [channelFilter, setChannelFilter] = useState<MessageTemplate["channel"]>("sms");

  const filteredTemplates = useMemo(() => {
    return templates.filter(
      (template) => template.recipient === recipientFilter && template.channel === channelFilter,
    );
  }, [recipientFilter, channelFilter, templates]);

  const selectedTemplate = templates.find((template) => template.id === selectedId) ?? filteredTemplates[0];

  useEffect(() => {
    if (!filteredTemplates.some((template) => template.id === selectedId)) {
      setSelectedId(filteredTemplates[0]?.id ?? "");
    }
  }, [filteredTemplates, selectedId]);

  return (
    <div className={styles.templatesLayout}>
      <aside className={styles.templateList}>
        <div className={styles.templateFilterBar}>
          <div className={styles.templateFilterGroup} role="tablist" aria-label="Filter by recipient">
            {(["expert", "seeker"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={recipientFilter === filter}
                className={`${styles.templateFilterBtn} ${
                  recipientFilter === filter ? styles.templateFilterBtnActive : ""
                }`}
                onClick={() => setRecipientFilter(filter)}
              >
                {TEMPLATE_RECIPIENT_LABELS[filter]}
              </button>
            ))}
          </div>
          <div className={styles.templateFilterDivider} aria-hidden="true" />
          <div
            className={`${styles.templateFilterGroup} ${styles.templateFilterGroupChannel}`}
            role="tablist"
            aria-label="Filter by channel"
          >
            {(["sms", "email"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                role="tab"
                aria-selected={channelFilter === filter}
                className={`${styles.templateFilterBtn} ${styles.templateFilterBtnChannel} ${
                  channelFilter === filter ? styles.templateFilterBtnChannelActive : ""
                }`}
                onClick={() => setChannelFilter(filter)}
              >
                {TEMPLATE_CHANNEL_LABELS[filter]}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.templateItems}>
          {filteredTemplates.map((template) => (
            <button
              key={template.id}
              type="button"
              className={`${styles.templateItem} ${
                selectedTemplate?.id === template.id ? styles.templateItemActive : ""
              }`}
              onClick={() => setSelectedId(template.id)}
            >
              <span className={styles.templateItemName}>{template.name}</span>
              <span className={styles.templateItemMeta}>
                {TEMPLATE_RECIPIENT_LABELS[template.recipient]} · {TEMPLATE_CHANNEL_LABELS[template.channel]}
              </span>
            </button>
          ))}
        </div>
      </aside>

      {selectedTemplate ? (
        <TemplateEditor
          template={selectedTemplate}
          onChange={(updates) => onUpdateTemplate(selectedTemplate.id, updates)}
        />
      ) : (
        <div className={styles.templateEmpty}>No templates match this filter.</div>
      )}
    </div>
  );
}

export default function AdminSettings({ section }: { section: SettingsSection }) {
  const { ready, settings, savedAt, isSaving, error, save } = useAdminSettings();
  const activeSection = section;
  const [draft, setDraft] = useState(settings);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [showSavedBanner, setShowSavedBanner] = useState(false);

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

  if (!ready) {
    return null;
  }

  const handleSave = async () => {
    try {
      await save(draft);
      setTestStatus(null);
    } catch {
      // Error state is handled by the hook.
    }
  };

  const handleTest = () => {
    const sectionLabel = sectionMeta.label;
    setTestStatus(`Test ${sectionLabel.toLowerCase()} request queued successfully.`);
    window.setTimeout(() => setTestStatus(null), 4000);
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
              disabled={!isDirty || isSaving}
            >
              <Save size={14} />
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        {showSavedBanner ? (
          <div className={styles.savedBanner} role="status">
            <CheckCircle2 size={16} />
            Settings saved successfully.
          </div>
        ) : null}

        {error ? (
          <div className={styles.testBanner} role="alert">
            {error}
          </div>
        ) : null}

        {testStatus ? (
          <div className={styles.testBanner} role="status">
            <Send size={16} />
            {testStatus}
          </div>
        ) : null}

        <article className={styles.settingsPanel}>
          <div
            className={`${styles.panelBody} ${
              activeSection === "templates" ? styles.panelBodyFlush : ""
            }`}
          >
            {activeSection === "sms" ? (
              <SmsSettingsPanel
                draft={draft.sms}
                onChange={(sms) => setDraft((current) => ({ ...current, sms }))}
              />
            ) : null}

            {activeSection === "email" ? (
              <EmailSettingsPanel
                draft={draft.email}
                onChange={(email) => setDraft((current) => ({ ...current, email }))}
              />
            ) : null}

            {activeSection === "smtp" ? (
              <SmtpSettingsPanel
                draft={draft.smtp}
                onChange={(smtp) => setDraft((current) => ({ ...current, smtp }))}
              />
            ) : null}

            {activeSection === "payment" ? (
              <PaymentSettingsPanel
                draft={draft.payment}
                onChange={(payment) => setDraft((current) => ({ ...current, payment }))}
              />
            ) : null}

            {activeSection === "google" ? (
              <GoogleCredentialsPanel
                draft={draft.google}
                onChange={(google) => setDraft((current) => ({ ...current, google }))}
              />
            ) : null}

            {activeSection === "linkedin" ? (
              <LinkedinCredentialsPanel
                draft={draft.linkedin}
                onChange={(linkedin) => setDraft((current) => ({ ...current, linkedin }))}
              />
            ) : null}

            {activeSection === "templates" ? (
              <TemplatesPanel
                templates={draft.templates}
                onUpdateTemplate={(templateId, updates) =>
                  setDraft((current) => ({
                    ...current,
                    templates: current.templates.map((template) =>
                      template.id === templateId ? { ...template, ...updates } : template,
                    ),
                  }))
                }
              />
            ) : null}
          </div>
        </article>
      </div>
    </section>
  );
}
