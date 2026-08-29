"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Mail,
  MessageSquare,
  Save,
  Send,
  X,
} from "lucide-react";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import { useAdminSettings } from "@/hooks/useAdminSettings";
import {
  SETTINGS_SECTIONS,
  type MessageTemplate,
  type SettingsSection,
} from "@/lib/adminSettings";
import AiSettingsPanel from "./AiSettingsPanel";
import AuthCredentialsPanel from "./AuthCredentialsPanel";
import PaymentSettingsPanel from "./PaymentSettingsPanel";
import BookingSettingsPanel from "./BookingSettingsPanel";
import SmsSettingsPanel from "./SmsSettingsPanel";
import SmtpSettingsPanel from "./SmtpSettingsPanel";
import TemplatesPanel from "./TemplatesPanel";
import styles from "./AdminSettings.module.css";

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
    return draft.templates?.filter((t) => t.channel === "sms" && t.status !== "disabled") || [];
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

    const selectedTpl = draft.templates.find((t) => t.id === testTemplateId);
    if (!selectedTpl) return;

    setTestStatus(`Test SMS using template "${selectedTpl.name}" sent to ${testPhoneNumber}.`);
    setShowTestSmsModal(false);
    setTestPhoneNumber("");
    window.setTimeout(() => setTestStatus(null), 5000);
  };

  const handleUpdateTemplate = (
    templateId: string,
    updates: Partial<MessageTemplate>,
  ) => {
    setDraft((prev) => ({
      ...prev,
      templates: prev.templates.map((tpl) =>
        tpl.id === templateId ? { ...tpl, ...updates } : tpl,
      ),
    }));
  };

  const handleDeleteTemplate = (templateId: string) => {
    setDraft((prev) => ({
      ...prev,
      templates: prev.templates.filter((tpl) => tpl.id !== templateId),
    }));
  };

  const handleAddTemplate = (newTpl: MessageTemplate) => {
    setDraft((prev) => ({
      ...prev,
      templates: [newTpl, ...prev.templates],
    }));
  };

  return (
    <section className={styles.dashboard}>
      <div className={`container ${styles.dashboardInner}`}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderText}>
            <h1 className={styles.pageTitle}>
              {sectionMeta.label}{" "}
              <span className={styles.accentWord}>SETTINGS</span>
            </h1>
            <p className={styles.pageSubtitle}>{sectionMeta.description}</p>
          </div>
          <div className={styles.headerActions}>
            {activeSection !== "templates" ? (
              <SecondaryCTA
                label="Send Test"
                showArrow={false}
                leadingIcon={<Send size={14} />}
                onClick={handleTest}
              />
            ) : null}
            {activeSection !== "templates" ? (
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={!isDirty}
              >
                <Save size={14} />
                SAVE CHANGES
              </button>
            ) : null}
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
          {activeSection !== "templates" ? (
            <div className={styles.panelHeaderBar}>
              <div className={styles.panelHeaderTitleGroup}>
                <div className={styles.panelHeaderIcon}>
                  {activeSection === "sms" && <MessageSquare size={18} />}
                  {activeSection === "smtp" && <Mail size={18} />}
                  {activeSection === "auth" && <KeyRound size={18} />}
                  {activeSection === "payment" && <CreditCard size={18} />}
                  {activeSection === "booking" && <CalendarClock size={18} />}
                  {activeSection === "ai" && <Bot size={18} />}
                </div>
                <div>
                  <h3 className={styles.panelHeaderTitle}>{sectionMeta.label} Configuration</h3>
                  <p className={styles.panelHeaderDesc}>{sectionMeta.description}</p>
                </div>
              </div>
              <span className={styles.badgeActive}>System Active</span>
            </div>
          ) : null}

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

            {activeSection === "payment" ? (
              <PaymentSettingsPanel
                draft={draft.payment}
                onChange={(payment) => setDraft((current) => ({ ...current, payment }))}
              />
            ) : null}

            {activeSection === "booking" ? (
              <BookingSettingsPanel
                draft={draft.booking}
                onChange={(booking) => setDraft((current) => ({ ...current, booking }))}
              />
            ) : null}

            {activeSection === "auth" ? (
              <AuthCredentialsPanel
                draft={draft.auth}
                saved={settings.auth}
                onChange={(auth) => setDraft((current) => ({ ...current, auth }))}
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
                onUpdateTemplate={handleUpdateTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onAddTemplate={handleAddTemplate}
                onSaveAll={handleSave}
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
                  {activeSmsTemplates.map((t) => (
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
