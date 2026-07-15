"use client";

import { useEffect, useMemo, useState } from "react";
import type { ExpertApplicationSubmission } from "@/lib/expertApplicationSubmission";
import {
  APPLICATIONS_UPDATED_EVENT,
  computeCompleteness,
  formatSubmittedDate,
  getAskedRate,
  getCategoryColor,
  getExpertApplicationByAppId,
  getExpertApplications,
  getSlaStatus,
  getSubmittedAgo,
  seedDemoApplicationIfEmpty,
} from "@/lib/expertApplicationsStore";
import type { ApplicationStatus } from "@/lib/expertApplicationSubmission";

export type ExpertApplicationListItem = {
  id: string;
  appId: string;
  name: string;
  city: string;
  avatar: string;
  category: string;
  categoryColor: string;
  languages: string[];
  submittedDate: string;
  submittedAgo: string;
  completeness: number;
  slaStatus: ReturnType<typeof getSlaStatus>["slaStatus"];
  slaLabel: string;
  slaLimit: string;
  status: ApplicationStatus;
  reviewer: { name: string; avatar: string } | null;
};

function toListItem(application: ExpertApplicationSubmission): ExpertApplicationListItem {
  const sla = getSlaStatus(application.submittedAt);
  const city = application.location.split(",")[0]?.trim() || application.location;

  return {
    id: application.appId,
    appId: application.appId,
    name: application.name,
    city,
    avatar: application.avatar,
    category: application.categoryLabel,
    categoryColor: getCategoryColor(application.categoryLabel),
    languages: application.languages,
    submittedDate: formatSubmittedDate(application.submittedAt),
    submittedAgo: getSubmittedAgo(application.submittedAt),
    completeness: computeCompleteness(application),
    slaStatus: sla.slaStatus,
    slaLabel: sla.slaLabel,
    slaLimit: sla.slaLimit,
    status: application.status,
    reviewer: null,
  };
}

export function useExpertApplications() {
  const [applications, setApplications] = useState<ExpertApplicationSubmission[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    seedDemoApplicationIfEmpty();
    setApplications(getExpertApplications());
    setReady(true);

    const refresh = () => setApplications(getExpertApplications());

    window.addEventListener(APPLICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener(APPLICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const listItems = useMemo(
    () =>
      [...applications]
        .sort(
          (a, b) =>
            new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
        )
        .map(toListItem),
    [applications],
  );

  const statusCounts = useMemo(() => {
    const counts = {
      all: applications.length,
      pending: 0,
      in_review: 0,
      on_hold: 0,
      approved: 0,
      rejected: 0,
    };

    for (const application of applications) {
      counts[application.status] += 1;
    }

    return counts;
  }, [applications]);

  const kpis = useMemo(
    () => [
      { id: "all", label: "All", value: statusCounts.all, variant: "all" as const },
      { id: "pending", label: "Pending", value: statusCounts.pending, variant: "pending" as const },
      { id: "in_review", label: "In Review", value: statusCounts.in_review, variant: "review" as const },
      { id: "on_hold", label: "On Hold", value: statusCounts.on_hold, variant: "hold" as const },
      {
        id: "approved",
        label: "Approved MTD",
        value: statusCounts.approved,
        variant: "approved" as const,
      },
      {
        id: "rejected",
        label: "Rejected MTD",
        value: statusCounts.rejected,
        variant: "rejected" as const,
      },
    ],
    [statusCounts],
  );

  const breachedApplications = useMemo(
    () =>
      applications.filter(
        (application) => getSlaStatus(application.submittedAt).slaStatus === "breached",
      ),
    [applications],
  );

  return {
    ready,
    applications,
    listItems,
    statusCounts,
    kpis,
    pendingCount: statusCounts.pending,
    breachedApplications,
    getByAppId: (appId: string) => getExpertApplicationByAppId(appId),
  };
}

export function useExpertApplication(appId: string) {
  const { ready, applications, getByAppId } = useExpertApplications();
  const application = useMemo(
    () => getByAppId(appId),
    [appId, applications, getByAppId],
  );

  return { ready, application };
}
