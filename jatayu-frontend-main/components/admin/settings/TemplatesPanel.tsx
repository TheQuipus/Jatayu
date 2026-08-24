"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  X,
  ChevronRight,
  Check,
  Info,
  ExternalLink,
  ChevronLeft,
  User,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  RemoveFormatting,
  Link,
} from "lucide-react";
import {
  TEMPLATE_CATEGORY_LABELS,
  TEMPLATE_CHANNEL_LABELS,
  type MessageTemplate,
  type MessageTemplateCategory,
  type MessageTemplateChannel,
  type MessageTemplateRecipient,
} from "@/lib/adminSettings";
import ContinueButton from "@/components/ui/ContinueButton";
import SecondaryCTA from "@/components/ui/SecondaryCTA";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SmartSearchSelect from "./SmartSearchSelect";
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

/* Basic HTML Editor Component */
function HtmlMessageEditor({
  value,
  onChange,
  placeholder = "Enter template message content...",
  editorRef,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  editorRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const localRef = useRef<HTMLDivElement | null>(null);
  const ref = editorRef || localRef;
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (ref.current && !isTypingRef.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value, ref]);

  const exec = (command: string, arg?: string) => {
    if (ref.current) {
      ref.current.focus();
      document.execCommand(command, false, arg);
      onChange(ref.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (ref.current) {
      isTypingRef.current = true;
      onChange(ref.current.innerHTML);
      setTimeout(() => {
        isTypingRef.current = false;
      }, 50);
    }
  };

  const handleLink = () => {
    const url = prompt("Enter link URL:", "https://");
    if (url) {
      exec("createLink", url);
    }
  };

  return (
    <div className={styles.htmlEditorContainer}>
      <div className={styles.htmlToolbar}>
        <div className={styles.htmlToolbarGroup}>
          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Bold"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("bold");
            }}
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Italic"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("italic");
            }}
          >
            <Italic size={14} />
          </button>

          <div className={styles.htmlToolbarDivider} />

          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Align Left"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("justifyLeft");
            }}
          >
            <AlignLeft size={14} />
          </button>
          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Align Center"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("justifyCenter");
            }}
          >
            <AlignCenter size={14} />
          </button>
          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Align Right"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("justifyRight");
            }}
          >
            <AlignRight size={14} />
          </button>

          <div className={styles.htmlToolbarDivider} />

          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Unordered List"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("insertUnorderedList");
            }}
          >
            <List size={14} />
          </button>
          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Ordered List"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("insertOrderedList");
            }}
          >
            <ListOrdered size={14} />
          </button>

          <div className={styles.htmlToolbarDivider} />

          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Clear Formatting"
            onMouseDown={(e) => {
              e.preventDefault();
              exec("removeFormat");
            }}
          >
            <RemoveFormatting size={14} />
          </button>

          <div className={styles.htmlToolbarDivider} />

          <button
            type="button"
            className={styles.htmlToolbarBtn}
            title="Insert Link"
            onMouseDown={(e) => {
              e.preventDefault();
              handleLink();
            }}
          >
            <Link size={14} />
          </button>
        </div>
      </div>

      <div
        ref={ref}
        contentEditable
        className={styles.htmlEditableArea}
        data-placeholder={placeholder}
        onInput={handleInput}
        onBlur={handleInput}
        onKeyUp={handleInput}
        suppressContentEditableWarning
      />
    </div>
  );
}

function AddTemplateModal({
  defaultRecipient,
  defaultChannel,
  onClose,
  onAdd,
}: {
  defaultRecipient: MessageTemplateRecipient;
  defaultChannel: MessageTemplateChannel;
  onClose: () => void;
  onAdd: (template: MessageTemplate) => void;
}) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [channel, setChannel] = useState<MessageTemplateChannel>(defaultChannel);
  const [recipient, setRecipient] = useState<MessageTemplateRecipient>(defaultRecipient);
  const [category, setCategory] = useState<MessageTemplateCategory>("booking_confirmed");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const triggerOptions = useMemo(() => {
    return Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !body) return;

    const generatedId = id
      ? id.startsWith("tpl-")
        ? id
        : `tpl-${id}`
      : `tpl-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

    onAdd({
      id: generatedId,
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

  const channelLabel = channel === "sms" ? "SMS" : channel === "email" ? "Email" : "Notification";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <form onSubmit={handleSubmit} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Create {channelLabel} template</h3>
          <button type="button" className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBodySplit}>
          {/* Left Side: Form Inputs */}
          <div className={styles.modalFormLeft}>
            <div className={styles.field}>
              <label className={styles.fieldLabelModal}>Template name</label>
              <input
                required
                className={styles.input}
                placeholder="example2"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!id) {
                    setId(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "-"));
                  }
                }}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.fieldLabelModal}>Trigger Point</label>
              <SmartSearchSelect
                value={category}
                options={triggerOptions}
                onChange={(newCat) => setCategory(newCat as MessageTemplateCategory)}
                placeholder="Select or search trigger point..."
              />
            </div>

            {channel === "email" && (
              <div className={styles.field}>
                <label className={styles.fieldLabelModal}>Email Subject</label>
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
              <label className={styles.fieldLabelModal}>Message</label>
              <HtmlMessageEditor
                value={body}
                onChange={setBody}
                placeholder="Hi {{first_name}}, Thanks for being part of our community! Check out our latest exclusive offers here: {{link}}. See you soon!"
              />
            </div>
          </div>

          {/* Right Side: Device Live Preview */}
          <div className={styles.modalPreviewRight}>
            <div className={styles.previewTitle}>Preview</div>
            {channel === "email" ? (
              <div className={styles.emailMockupFrame}>
                <div className={styles.emailTopBar}>
                  <div className={styles.emailWindowDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <span className={styles.emailWindowTitle}>New Message</span>
                </div>
                <div className={styles.emailHeaderArea}>
                  <div className={styles.emailHeaderRow}>
                    <span className={styles.emailHeaderLabel}>From:</span>
                    <span className={styles.emailHeaderValue}>Jatayu &lt;no-reply@jatayu.com&gt;</span>
                  </div>
                  <div className={styles.emailHeaderRow}>
                    <span className={styles.emailHeaderLabel}>To:</span>
                    <span className={styles.emailHeaderValue}>
                      {recipient === "seeker" ? "Job Seeker <seeker@example.com>" : "Expert <expert@example.com>"}
                    </span>
                  </div>
                  <div className={styles.emailHeaderRow}>
                    <span className={styles.emailHeaderLabel}>Subject:</span>
                    <span className={styles.emailSubjectValue}>{subject || "No subject specified..."}</span>
                  </div>
                </div>
                <div className={styles.emailBodyArea}>
                  <div
                    className={styles.emailMessageContent}
                    dangerouslySetInnerHTML={{
                      __html: body
                        ? body.replace(/\n/g, "<br />")
                        : "Hi [First Name], Thanks for being part of our community! Check out our latest exclusive offers here: [Link]. See you soon!",
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.phoneMockupFrame}>
                <div className={styles.phoneNotch} />
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneHeader}>
                    <ChevronLeft size={16} className={styles.phoneBackBtn} />
                    <div className={styles.phoneAvatar}>
                      <User size={16} />
                    </div>
                    <div className={styles.phoneSenderName}>Jatayu</div>
                  </div>
                  <div className={styles.phoneBodyArea}>
                    <div
                      className={styles.phoneMessageBubble}
                      dangerouslySetInnerHTML={{
                        __html: body
                          ? body.replace(/\n/g, "<br />")
                          : "Hi [First Name], Thanks for being part of our community! 🎉 Check out our latest exclusive offers here: [Link]. See you soon! [Your Company]",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <SecondaryCTA
            label="Cancel"
            showArrow={false}
            onClick={onClose}
          />
          <ContinueButton
            type="submit"
            label={`Create ${channelLabel} Template`}
            showArrow={false}
            disabled={!name || !body}
          />
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
  onSaveAll?: () => void;
};

export default function TemplatesPanel({
  templates,
  onUpdateTemplate,
  onDeleteTemplate,
  onAddTemplate,
  onSaveAll,
}: TemplatesPanelProps) {
  const [recipientTab, setRecipientTab] = useState<MessageTemplateRecipient>("seeker");
  const [selectedChannel, setSelectedChannel] = useState<MessageTemplateChannel>("sms");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVarInput, setNewVarInput] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const editorDivRef = useRef<HTMLDivElement | null>(null);

  const safeNavigate = (action: () => void) => {
    if (isDirty) {
      setPendingAction(() => action);
      setShowDiscardConfirm(true);
    } else {
      action();
    }
  };

  const channelOptions: {
    id: MessageTemplateChannel;
    label: string;
  }[] = [
      { id: "sms", label: "SMS" },
      { id: "email", label: "Email" },
      { id: "notification", label: "Notification" },
    ];

  const triggerOptions = useMemo(() => {
    return Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => ({
      value,
      label,
    }));
  }, []);

  const filteredTemplates = useMemo(() => {
    return templates.filter(
      (t) => t.recipient === recipientTab && t.channel === selectedChannel
    );
  }, [templates, recipientTab, selectedChannel]);

  // Set default active template when filter changes
  useEffect(() => {
    if (filteredTemplates.length > 0) {
      if (!selectedTemplateId || !filteredTemplates.some((t) => t.id === selectedTemplateId)) {
        setSelectedTemplateId(filteredTemplates[0].id);
      }
    } else {
      setSelectedTemplateId(null);
    }
  }, [filteredTemplates, selectedTemplateId]);

  const activeTemplate = useMemo(() => {
    if (!selectedTemplateId) return filteredTemplates[0] || null;
    return filteredTemplates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0] || null;
  }, [filteredTemplates, selectedTemplateId]);

  const handleUpdate = (templateId: string, updates: Partial<MessageTemplate>) => {
    onUpdateTemplate(templateId, updates);
    setIsDirty(true);
  };

  const handleInsertVar = (varName: string) => {
    if (!activeTemplate) return;
    const el = editorDivRef.current;
    if (el) {
      el.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && el.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(varName);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        el.innerHTML += varName;
      }
      handleUpdate(activeTemplate.id, { body: el.innerHTML });
    } else {
      const updatedBody = `${activeTemplate.body}${activeTemplate.body ? " " : ""}${varName}`;
      handleUpdate(activeTemplate.id, { body: updatedBody });
    }
  };

  const handleAddCustomVar = () => {
    if (!activeTemplate || !newVarInput.trim()) return;
    const formatted = normalizeTemplateVariable(newVarInput);
    if (!formatted) return;

    const currentVars = activeTemplate.variables || [];
    const updatedVars = currentVars.includes(formatted) ? currentVars : [...currentVars, formatted];
    const updatedBody = `${activeTemplate.body}${activeTemplate.body ? " " : ""}${formatted}`;

    handleUpdate(activeTemplate.id, {
      variables: updatedVars,
      body: updatedBody,
    });
    setNewVarInput("");
  };

  const handleSaveClick = () => {
    setIsDirty(false);
    onSaveAll?.();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className={styles.templatesContainer}>
      {/* Top Recipient Tabs Header */}
      <div className={styles.recipientTabBar} role="tablist" aria-label="Recipient navigation">
        <button
          type="button"
          role="tab"
          aria-selected={recipientTab === "seeker"}
          className={`${styles.recipientTabBtn} ${recipientTab === "seeker" ? styles.recipientTabBtnActive : ""
            }`}
          onClick={() => {
            safeNavigate(() => {
              setRecipientTab("seeker");
              setSelectedTemplateId(null);
              setIsDirty(false);
            });
          }}
        >
          Seeker
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={recipientTab === "expert"}
          className={`${styles.recipientTabBtn} ${recipientTab === "expert" ? styles.recipientTabBtnActive : ""
            }`}
          onClick={() => {
            safeNavigate(() => {
              setRecipientTab("expert");
              setSelectedTemplateId(null);
              setIsDirty(false);
            });
          }}
        >
          Expert
        </button>
      </div>

      {/* Main 3-Column Content Layout */}
      <div className={styles.columnsLayout}>
        {/* Column 1: CATEGORIES / CHANNELS */}
        <div className={styles.channelColumn}>
          <div className={styles.columnHeaderRow}>
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnTitle}>CHANNELS</span>
            </div>
          </div>

          <div className={styles.channelList}>
            {channelOptions.map((ch) => {
              const isSelected = selectedChannel === ch.id;
              const count = templates.filter(
                (t) => t.recipient === recipientTab && t.channel === ch.id
              ).length;

              return (
                <button
                  key={ch.id}
                  type="button"
                  className={`${styles.channelItem} ${isSelected ? styles.channelItemActive : ""
                    }`}
                  onClick={() => {
                    safeNavigate(() => {
                      setSelectedChannel(ch.id);
                      setSelectedTemplateId(null);
                      setIsDirty(false);
                    });
                  }}
                >
                  <div className={styles.channelItemLeft}>
                    <span>{ch.label}</span>
                  </div>
                  <div className={styles.channelItemRight}>
                    <span>{count} items</span>
                    <ChevronRight size={14} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: TEMPLATE LIST */}
        <div className={styles.templateNameColumn}>
          <div className={styles.columnHeaderRow}>
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnTitle}>
                {TEMPLATE_CHANNEL_LABELS[selectedChannel].toUpperCase()} ITEMS
              </span>
            </div>
          </div>

          <div className={styles.templateNameList}>
            {filteredTemplates.map((t) => {
              const isSelected = activeTemplate?.id === t.id;
              const varCount = (t.variables || []).length;

              return (
                <div
                  key={t.id}
                  className={`${styles.templateCard} ${isSelected ? styles.templateCardActive : ""
                    }`}
                  onClick={() => {
                    if (activeTemplate?.id !== t.id) {
                      safeNavigate(() => {
                        setSelectedTemplateId(t.id);
                        setIsDirty(false);
                      });
                    }
                  }}
                >
                  <div className={styles.cardMainInfo}>
                    <div className={styles.cardTitleRow}>
                      <span className={styles.cardTitle}>{t.name}</span>
                    </div>
                    <div className={styles.cardPreviewText}>{t.id}</div>
                    <div className={styles.cardMetaRow}>
                      <span>{varCount} variables</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTemplates.length === 0 && (
              <div className={styles.emptyTemplatesMsg}>
                No templates found for {TEMPLATE_CHANNEL_LABELS[selectedChannel]}.
              </div>
            )}

            <div className={styles.columnSeparator} />
            <button
              type="button"
              className={styles.addNewOrangeBtn}
              onClick={() => {
                safeNavigate(() => {
                  setShowAddModal(true);
                });
              }}
            >
              + Add New
            </button>
          </div>
        </div>

        {/* Column 3: TEMPLATE EDITOR CANVAS */}
        <div className={styles.editorColumn}>
          {activeTemplate ? (
            <>
              {/* Header Bar */}
              <div className={styles.editorHeaderRow}>
                <div className={styles.editorHeaderLeft}>
                  <div className={styles.editorMainTitle}>Edit Template</div>
                  <div className={styles.editorSubTitle}>{activeTemplate.name}</div>
                </div>

                <div className={styles.editorHeaderActions}>
                  <div className={styles.statusToggleContainer}>
                    <span className={styles.statusToggleLabel}>
                      {activeTemplate.status === "disabled" ? "Disabled" : "Active"}
                    </span>
                    <button
                      type="button"
                      className={`${styles.toggleSwitch} ${activeTemplate.status !== "disabled" ? styles.toggleOn : ""
                        }`}
                      onClick={() =>
                        handleUpdate(activeTemplate.id, {
                          status: activeTemplate.status === "disabled" ? "active" : "disabled",
                        })
                      }
                      title={activeTemplate.status === "disabled" ? "Enable template" : "Disable template"}
                    >
                      <div className={styles.toggleKnob} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className={styles.btnCancelOutline}
                    onClick={() => {
                      setIsDirty(false);
                      onDeleteTemplate(activeTemplate.id);
                    }}
                    title="Delete this template"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                  <button
                    type="button"
                    className={styles.btnSavePrimary}
                    onClick={handleSaveClick}
                  >
                    <Check size={14} />
                    {savedSuccess ? "Saved!" : "Save Changes"}
                  </button>
                </div>
              </div>

              {/* Main White Form Card */}
              <div className={styles.formCardBox}>
                <div className={styles.formFieldGroup}>
                  <label className={styles.fieldLabel}>
                    Template Name <span className={styles.fieldLabelRequired}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={activeTemplate.name}
                    onChange={(e) =>
                      handleUpdate(activeTemplate.id, { name: e.target.value })
                    }
                  />
                </div>

                <div className={styles.formFieldGroup}>
                  <label className={styles.fieldLabel}>
                    Trigger Point <span className={styles.fieldLabelRequired}>*</span>
                  </label>
                  <SmartSearchSelect
                    value={activeTemplate.category}
                    options={triggerOptions}
                    onChange={(newCat) =>
                      handleUpdate(activeTemplate.id, { category: newCat as MessageTemplateCategory })
                    }
                    placeholder="Select or search trigger point..."
                  />
                </div>

                {activeTemplate.channel === "email" && (
                  <div className={styles.formFieldGroup}>
                    <label className={styles.fieldLabel}>
                      Email Subject <span className={styles.fieldLabelRequired}>*</span>
                    </label>
                    <input
                      type="text"
                      className={styles.textInput}
                      value={activeTemplate.subject || ""}
                      placeholder="Subject line..."
                      onChange={(e) =>
                        handleUpdate(activeTemplate.id, { subject: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className={styles.formFieldGroup}>
                  <label className={styles.fieldLabel}>
                    Message Content <span className={styles.fieldLabelRequired}>*</span>
                  </label>
                  <HtmlMessageEditor
                    value={activeTemplate.body}
                    onChange={(newBody) => handleUpdate(activeTemplate.id, { body: newBody })}
                    editorRef={editorDivRef}
                  />
                </div>

                <div className={styles.bottomAddRow}>
                  <button
                    type="button"
                    className={styles.addNewOrangeBtn}
                    onClick={() => {
                      safeNavigate(() => {
                        setShowAddModal(true);
                      });
                    }}
                  >
                    + Add Template
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyEditorBox}>
              <p>Select a template from the list or create a new one.</p>
              <button
                type="button"
                className={styles.addNewOrangeBtn}
                onClick={() => {
                  safeNavigate(() => {
                    setShowAddModal(true);
                  });
                }}
              >
                + Add New Template
              </button>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddTemplateModal
          defaultRecipient={recipientTab}
          defaultChannel={selectedChannel}
          onClose={() => setShowAddModal(false)}
          onAdd={(newTpl) => {
            onAddTemplate(newTpl);
            setSelectedTemplateId(newTpl.id);
            setShowAddModal(false);
            setIsDirty(false);
          }}
        />
      )}

      <ConfirmModal
        isOpen={showDiscardConfirm}
        title="Discard Unsaved Changes?"
        message="You have unsaved changes in this template. Switching tabs or selecting another template will discard your edits."
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        variant="danger"
        onClose={() => {
          setShowDiscardConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          setIsDirty(false);
          setShowDiscardConfirm(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
    </div>
  );
}
