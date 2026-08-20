"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Eye, Zap } from "lucide-react";
import ExpertDetail from "@/components/expert/ExpertDetail";
import { mapApplicationToExpert } from "@/lib/adminApplicationMappers";
import { useExpertApplication } from "@/hooks/useExpertApplications";
import styles from "./AdminExpertProfile.module.css";

type AdminExpertProfileProps = {
  appId: string;
};

export default function AdminExpertProfile({ appId }: AdminExpertProfileProps) {
  const { ready, application } = useExpertApplication(appId);
  const expert = useMemo(
    () => (application ? mapApplicationToExpert(application) : null),
    [application],
  );

  if (!ready) {
    return null;
  }

  if (!expert || !application) {
    return (
      <div className={styles.page}>
        <div className={styles.notFound}>
          <h1 className={styles.notFoundTitle}>Expert profile not found</h1>
          <Link href="/admin/applications" className={styles.backLink}>
            Back to Applications
          </Link>
        </div>
      </div>
    );
  }

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
        <Link href={`/admin/review/${application.appId}`} className={styles.breadcrumbLink}>
          {application.appId} Review
        </Link>
        <span className={styles.breadcrumbSep}>/</span>
        <span className={styles.breadcrumbCurrent}>Expert Profile</span>
      </nav>

      <header className={styles.pageHeader}>
        <div>
          <div className={styles.titleRow}>
            <h1 className={styles.pageTitle}>Expert Profile Preview</h1>
            <span className={styles.statusTag}>Seeker View</span>
          </div>
          <p className={styles.pageSubtitle}>
            {application.name} · {application.categoryLabel} · {application.appId} · Submitted{" "}
            {new Date(application.submittedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link href={`/admin/review/${application.appId}`} className={styles.outlineBtn}>
            <Eye size={14} />
            Application Review
          </Link>
          <Link href={`/admin/rejection-hold/${application.appId}`} className={styles.outlineBtn}>
            Reject / Hold
          </Link>
          <Link href={`/admin/approval/${application.appId}`} className={styles.primaryBtn}>
            <Zap size={14} />
            Make Decision
          </Link>
        </div>
      </header>

      <div className={styles.profilePreview}>
        <ExpertDetail expert={expert} />
      </div>
    </div>
  );
}
