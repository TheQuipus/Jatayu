"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { mapToApprovalConfirmation } from "@/lib/adminApplicationMappers";
import {
  type ApprovalChecklistItem,
  type ChecklistStatus,
} from "@/lib/adminApproval";
import { useExpertApplication } from "@/hooks/useExpertApplications";
import { updateExpertApplicationStatus } from "@/lib/expertApplicationsApi";
import styles from "./ApprovalConfirmation.module.css";

type ApprovalConfirmationProps = {
  appId: string;
};

const CHECKLIST_ICON = {
  passed: CheckCircle2,
  excellent: Sparkles,
  pending: Clock,
} as const;

const CHECKLIST_ICON_CLASS = {
  passed: styles.checklistIconPassed,
  excellent: styles.checklistIconExcellent,
  pending: styles.checklistIconPending,
} as const;

const STATUS_PILL_CLASS: Record<ChecklistStatus, string> = {
  passed: styles.pillPassed,
  excellent: styles.pillExcellent,
  pending: styles.pillPending,
};

const STATUS_LABEL: Record<ChecklistStatus, string> = {
  passed: "Passed",
  excellent: "Excellent",
  pending: "Pending",
};

function ChecklistRow({ item }: { item: ApprovalChecklistItem }) {
  const Icon = CHECKLIST_ICON[item.status];
  return (
    <div className={styles.checklistItem}>
      <span className={`${styles.checklistIcon} ${CHECKLIST_ICON_CLASS[item.status]}`}>
        <Icon size={16} />
      </span>
      <div className={styles.checklistBody}>
        <div className={styles.checklistTitle}>{item.title}</div>
        <div className={styles.checklistDesc}>{item.description}</div>
      </div>
      <span className={`${styles.statusPill} ${STATUS_PILL_CLASS[item.status]}`}>
        {STATUS_LABEL[item.status]}
      </span>
    </div>
  );
}

export default function ApprovalConfirmation({ appId }: ApprovalConfirmationProps) {
  const router = useRouter();
  const { ready, application } = useExpertApplication(appId);
  const data = useMemo(
    () => (application ? mapToApprovalConfirmation(application) : null),
    [application],
  );
  const [confirmed, setConfirmed] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  if (!ready) {
    return null;
  }

  if (!data) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h1 className={styles.notFoundTitle}>Approval data not found</h1>
          <Link href="/admin/applications" className={styles.backLink}>
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

  const canActivate =
    confirmed && data.recommendation === "approve" && application?.status !== "approved";

  const recommendationLabel =
    data.recommendation === "approve"
      ? "Recommended: Approve"
      : data.recommendation === "reject"
        ? "Recommended: Reject"
        : "Pending Admin Review";

  return (
    <div className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/admin/dashboard" className={styles.breadcrumbLink}>
          Admin Console
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link href="/admin/applications" className={styles.breadcrumbLink}>
          Expert Applications
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <Link href={`/admin/expert-profile/${data.appId}`} className={styles.breadcrumbLink}>
          {data.appId}
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Approval Confirmation</span>
      </nav>

      <header className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Approval Confirmation</h1>
            <span className={styles.readyTag}>
              {data.recommendation === "approve" ? "Ready to Activate" : "Awaiting Verification"}
            </span>
            <span className={styles.finalTag}>Review Step</span>
          </div>
          <p className={styles.pageSubtitle}>
            {data.name} · {data.category} · {data.appId}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link
            href={`/admin/expert-profile/${data.appId}`}
            className={styles.outlineBtn}
          >
            <ChevronLeft size={14} />
            Back to Profile
          </Link>
          <Link
            href={`/admin/rejection-hold/${data.appId}`}
            className={`${styles.outlineBtn} ${styles.rejectBtn}`}
          >
            <XCircle size={14} />
            Reject Instead
          </Link>
        </div>
      </header>

      <div className={styles.contentGrid}>
        <div className={styles.leftCol}>
          <article className={styles.card}>
            <div className={styles.cardHeaderGreen}>
              <span className={styles.cardHeaderTitle}>Decision Summary</span>
              <span className={styles.recommendTag}>{recommendationLabel}</span>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.profileRow}>
                <Image
                  src={data.avatar}
                  alt={data.name}
                  width={56}
                  height={56}
                  className={styles.profileAvatar}
                />
                <div>
                  <div className={styles.profileName}>{data.name}</div>
                  <div className={styles.profileCategory}>{data.category}</div>
                  <div className={styles.profileMeta}>
                    {data.location} · {data.experience}
                  </div>
                </div>
              </div>

              <div className={styles.trustRow}>
                <span className={styles.trustLabel}>Trust Score</span>
                <span className={styles.trustScore}>
                  {data.trustScore}/{data.trustMax}
                </span>
              </div>

              <div className={styles.quickStats}>
                {data.quickStats.map((stat) => (
                  <div
                    key={stat.label}
                    className={`${styles.quickStat} ${stat.done ? styles.quickStatDone : ""}`}
                  >
                    <div className={styles.quickStatLabel}>{stat.label}</div>
                    <div className={styles.quickStatValue}>{stat.value}</div>
                  </div>
                ))}
              </div>

              <div className={styles.reviewerNote}>
                <div className={styles.noteAuthor}>
                  {data.reviewerNote.author}
                  <span className={styles.noteTime}>{data.reviewerNote.timestamp}</span>
                </div>
                <p className={styles.noteText}>{data.reviewerNote.text}</p>
              </div>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardHeaderDark}>Approval Checklist</div>
            <div className={styles.checklist}>
              {data.checklist.map((item) => (
                <ChecklistRow key={item.id} item={item} />
              ))}
            </div>
          </article>
        </div>

        <div className={styles.rightCol}>
          <article className={styles.card}>
            <div className={styles.cardHeaderDark}>Credential Verification</div>
            <div className={styles.cardBody}>
              <div className={styles.credentialList}>
                {data.credentials.map((cred) => (
                  <div key={cred.id} className={styles.credentialItem}>
                    <span className={styles.credentialLabel}>{cred.label}</span>
                    <span
                      className={
                        cred.status === "pass"
                          ? styles.credentialPass
                          : styles.credentialPending
                      }
                    >
                      {cred.status === "pass"
                        ? "Pass"
                        : cred.status === "missing"
                          ? "Missing"
                          : "Pending"}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.riskSection}>
                <div className={styles.riskTitle}>Risk Engine Results</div>
                <div className={styles.riskList}>
                  {data.riskResults.map((risk) => (
                    <div key={risk.id} className={styles.riskItem}>
                      <span>{risk.label}</span>
                      <span className={risk.clear ? styles.riskClear : ""}>{risk.result}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <article className={`${styles.card} ${styles.activateCard}`}>
            <div className={styles.activateHeader}>Activate Expert Account</div>
            <div className={styles.cardBody}>
              <p className={styles.activateSummary}>
                <span>
                  {data.checklistPassed} of {data.checklistTotal}
                </span>{" "}
                checklist items verified — complete KYC and document review before activation.
              </p>

              <label className={styles.confirmRow}>
                <input
                  type="checkbox"
                  className={styles.confirmCheckbox}
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span className={styles.confirmText}>
                  I, {data.adminName}, confirm that I have reviewed the application, verified
                  all credentials, and approve activation of this expert account on the Jatayu
                  platform.
                </span>
              </label>

              <button
                type="button"
                className={styles.activateBtn}
                disabled={!canActivate || isActivating}
                onClick={async () => {
                  setIsActivating(true);
                  setActivateError(null);
                  try {
                    await updateExpertApplicationStatus(
                      data.appId,
                      "approved",
                      data.reviewerNote.text,
                    );
                    router.push("/admin/applications");
                  } catch (error) {
                    setActivateError(
                      error instanceof Error ? error.message : "Could not activate account.",
                    );
                  } finally {
                    setIsActivating(false);
                  }
                }}
              >
                <Zap size={18} />
                {isActivating ? "Activating..." : "Activate Account"}
              </button>
              {activateError ? <p className={styles.activateSummary}>{activateError}</p> : null}
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
