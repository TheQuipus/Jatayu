"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  Clock,
  FileText,
  PauseCircle,
  Send,
} from "lucide-react";
import { mapToRejectionHold } from "@/lib/adminApplicationMappers";
import {
  REJECTION_REASONS,
  type DecisionType,
  type NotificationChannel,
} from "@/lib/adminRejectionHold";
import { useExpertApplication } from "@/hooks/useExpertApplications";
import styles from "./RejectionHoldHandling.module.css";

type RejectionHoldHandlingProps = {
  appId: string;
};

export default function RejectionHoldHandling({ appId }: RejectionHoldHandlingProps) {
  const searchParams = useSearchParams();
  const decisionParam = searchParams.get("decision");
  const initialDecision = (decisionParam === "hold" || decisionParam === "reject") ? decisionParam : undefined;
  const { ready, application } = useExpertApplication(appId);
  const data = useMemo(
    () => (application ? mapToRejectionHold(application) : null),
    [application],
  );
  const [decision, setDecision] = useState<DecisionType>("reject");
  const [selectedReason, setSelectedReason] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [decisionSummary, setDecisionSummary] = useState("");
  const [guidance, setGuidance] = useState("");
  const [escalate, setEscalate] = useState(false);
  const [notifyTab, setNotifyTab] = useState<NotificationChannel>("whatsapp");
  const [whatsappOn, setWhatsappOn] = useState(true);
  const [smsOn, setSmsOn] = useState(true);
  const [emailOn, setEmailOn] = useState(false);

  useEffect(() => {
    if (!data) return;
    setDecision(initialDecision || data.defaultDecision);
    setSelectedReason(data.defaultReasonId);
    setDecisionSummary(data.decisionSummary);
    setGuidance(data.resubmissionGuidance);
  }, [data, initialDecision]);

  if (!ready) {
    return null;
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>Application not found.</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainCol}>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
              Admin Console
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href="/admin/applications" className={styles.breadcrumbLink}>
              Expert Applications
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <Link href={`/admin/review/${data.appId}`} className={styles.breadcrumbLink}>
              Application Review
            </Link>
            <span className={styles.breadcrumbSep}>/</span>
            <span className={styles.breadcrumbCurrent}>Rejection & Hold</span>
          </nav>

          <header className={styles.pageHeader}>
            <div>
              <div className={styles.titleRow}>
                <h1 className={styles.pageTitle}>Rejection & Hold Handling</h1>
                <span className={styles.actionRequiredTag}>Action Required</span>
              </div>
            </div>
            <div className={styles.headerActions}>
              <Link href={`/admin/review/${data.appId}`} className={styles.outlineBtn}>
                <ChevronLeft size={14} />
                Back to Review
              </Link>
              <Link href={`/admin/applications`} className={styles.outlineBtn}>
                <FileText size={14} />
                Applications Queue
              </Link>
            </div>
          </header>

          <article className={styles.card}>
            <div className={styles.cardHeader}>Applicant Information</div>
            <div className={styles.cardBody}>
              <div className={styles.applicantRow}>
                <Image
                  src={data.avatar}
                  alt={data.name}
                  width={48}
                  height={48}
                  className={styles.applicantAvatar}
                />
                <div>
                  <div className={styles.applicantName}>{data.name}</div>
                  <div className={styles.applicantStatus}>{data.status}</div>
                </div>
                <div className={styles.applicantMeta}>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>App ID</div>
                    <div className={styles.metaValue}>{data.appId}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Submitted</div>
                    <div className={styles.metaValue}>{data.submittedDate}</div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Profile Score</div>
                    <div className={`${styles.metaValue} ${styles.scoreYellow}`}>
                      {data.profileScore}%
                    </div>
                  </div>
                  <div className={styles.metaItem}>
                    <div className={styles.metaLabel}>Risk Flag</div>
                    <div className={`${styles.metaValue} ${styles.riskMedium}`}>
                      {data.riskFlag}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>Decision Type</div>
            <div className={styles.cardBody}>
              <div className={styles.decisionGrid}>
                <button
                  type="button"
                  className={`${styles.decisionCard} ${decision === "reject" ? styles.decisionCardRejectActive : ""}`}
                  onClick={() => setDecision("reject")}
                >
                  <div className={styles.decisionTitle}>
                    <Ban size={16} aria-hidden="true" />
                    Reject Application
                  </div>
                  <p className={styles.decisionDesc}>
                    Permanently decline this application. Applicant receives notification and
                    must wait 20 days before reapplying.
                  </p>
                  <div className={styles.decisionBadges}>
                    <span className={styles.miniBadge}>Instant Notification</span>
                    <span className={styles.miniBadge}>Reapply after 20d</span>
                    <span className={styles.miniBadge}>Audit Logged</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`${styles.decisionCard} ${decision === "hold" ? styles.decisionCardHoldActive : ""}`}
                  onClick={() => setDecision("hold")}
                >
                  <div className={styles.decisionTitle}>
                    <PauseCircle size={16} aria-hidden="true" />
                    Place on Hold
                  </div>
                  <p className={styles.decisionDesc}>
                    Temporarily pause the application while awaiting additional information or
                    clarification from the applicant.
                  </p>
                  <div className={styles.decisionBadges}>
                    <span className={styles.miniBadge}>Temporary Pause</span>
                    <span className={styles.miniBadge}>Reactivatable</span>
                    <span className={styles.miniBadge}>Audit Logged</span>
                  </div>
                </button>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>Select Reason</div>
            <div className={styles.cardBody}>
              <div className={styles.reasonGrid}>
                {REJECTION_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    type="button"
                    className={`${styles.reasonBtn} ${selectedReason === reason.id ? styles.reasonBtnActive : ""}`}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    {reason.label}
                  </button>
                ))}
              </div>
              <div className={styles.notesLabel}>Additional Notes (Internal Only)</div>
              <textarea
                className={styles.textarea}
                placeholder="Add internal notes visible only to the admin team..."
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
              />
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>Reviewer Notes</div>
            <div className={styles.cardBody}>
              <div className={styles.notesLabel}>Decision Summary</div>
              <textarea
                className={`${styles.textarea} ${styles.textareaLarge}`}
                value={decisionSummary}
                onChange={(e) => setDecisionSummary(e.target.value)}
              />
              <div className={styles.reviewerMeta}>
                <span>
                  {data.reviewerName} · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <label className={styles.escalateRow}>
                <input
                  type="checkbox"
                  className={styles.toggle}
                  checked={escalate}
                  onChange={(e) => setEscalate(e.target.checked)}
                />
                Escalate to Super Admin for Secondary Review
              </label>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardBody}>
              <div className={styles.guidanceHeader}>
                <div className={styles.guidanceTitle}>Resubmission Guidance</div>
                <span className={styles.shownTag}>Shown to Applicant</span>
              </div>
              <textarea
                className={`${styles.textarea} ${styles.textareaLarge}`}
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
              />
            </div>
            <div className={styles.submitBar}>
              {decision === "hold" ? (
                <button type="button" className={styles.submitBtnHold}>
                  <PauseCircle size={16} />
                  Place on Hold
                </button>
              ) : (
                <button type="button" className={styles.submitBtnReject}>
                  <Ban size={16} />
                  Confirm Rejection
                </button>
              )}
            </div>
          </article>
        </div>

        <div className={styles.sideCol}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>Notification Preview</div>
            <div className={styles.cardBody}>
              <div className={styles.notifyTabs} role="tablist">
                {(["whatsapp", "sms", "email"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={notifyTab === tab}
                    className={`${styles.notifyTab} ${notifyTab === tab ? styles.notifyTabActive : ""}`}
                    onClick={() => setNotifyTab(tab)}
                  >
                    {tab === "whatsapp" ? "WhatsApp" : tab === "sms" ? "SMS" : "Email"}
                  </button>
                ))}
              </div>

              {notifyTab === "whatsapp" && (
                <div className={styles.whatsappPreview}>
                  <div className={styles.whatsappBubble}>{data.whatsappPreview}</div>
                </div>
              )}
              {notifyTab === "sms" && (
                <div className={styles.whatsappPreview}>
                  <div className={styles.whatsappBubble}>{data.whatsappPreview}</div>
                </div>
              )}
              {notifyTab === "email" && (
                <div className={styles.whatsappPreview}>
                  <div className={styles.whatsappBubble}>
                    Subject: Update on your Jatayu Expert Application
                    <br />
                    <br />
                    Dear {data.name}, we regret to inform you that your application was not
                    approved at this time.
                  </div>
                </div>
              )}

              <div className={styles.variableList}>
                <div className={styles.variableLabel}>Template Variables</div>
                <div className={styles.variableTags}>
                  {data.templateVariables.map((v) => (
                    <span key={v} className={styles.variableTag}>
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className={styles.channelRow}>
                <span>WhatsApp</span>
                <input
                  type="checkbox"
                  checked={whatsappOn}
                  onChange={(e) => setWhatsappOn(e.target.checked)}
                  aria-label="Send via WhatsApp"
                />
              </div>
              <div className={styles.channelRow}>
                <span>SMS Fallback</span>
                <input
                  type="checkbox"
                  checked={smsOn}
                  onChange={(e) => setSmsOn(e.target.checked)}
                  aria-label="Send via SMS fallback"
                />
              </div>
              <div className={styles.channelRow}>
                <span>Email</span>
                <input
                  type="checkbox"
                  checked={emailOn}
                  onChange={(e) => setEmailOn(e.target.checked)}
                  aria-label="Send via email"
                />
              </div>

              <button type="button" className={styles.testBtn}>
                <Send size={14} />
                Send Test Notification
              </button>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeader}>Review History</div>
            <div className={styles.cardBody}>
              <div className={styles.timeline}>
                {data.reviewHistory.map((event) => (
                  <div key={event.id} className={styles.timelineItem}>
                    <span
                      className={`${styles.timelineDot} ${
                        event.status === "done"
                          ? styles.timelineDotDone
                          : event.status === "current"
                            ? styles.timelineDotCurrent
                            : ""
                      }`}
                    >
                      {event.status === "done" ? (
                        <CheckCircle2 size={12} />
                      ) : event.status === "current" ? (
                        <AlertTriangle size={12} />
                      ) : (
                        <Clock size={12} />
                      )}
                    </span>
                    <div className={styles.timelineBody}>
                      <div className={styles.timelineTitle}>{event.title}</div>
                      <div className={styles.timelineDesc}>{event.description}</div>
                      <div className={styles.timelineTime}>{event.timestamp}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
