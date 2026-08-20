"use client";

import { useMemo, useState } from "react";
import { Edit2, Plus, Trash2, X } from "lucide-react";
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CHANNEL_LABELS,
  TEMPLATE_RECIPIENT_LABELS,
  type MessageTemplate,
  type MessageTemplateCategory,
  type MessageTemplateChannel,
  type MessageTemplateRecipient,
} from "@/lib/adminSettings";
import Field from "./Field";
import styles from "./TemplatesPanel.module.css";

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

type TemplatesPanelProps = {
  templates: MessageTemplate[];
  onUpdateTemplate: (templateId: string, updates: Partial<MessageTemplate>) => void;
  onDeleteTemplate: (templateId: string) => void;
  onAddTemplate: (template: MessageTemplate) => void;
};

export default function TemplatesPanel({
  templates,
  onUpdateTemplate,
  onDeleteTemplate,
  onAddTemplate,
}: TemplatesPanelProps) {
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
