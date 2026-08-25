"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExpertApplicationSubmission } from "@/lib/expertApplicationSubmission";
import {
  computeCompleteness,
  formatSubmittedDate,
  getCategoryColor,
  getSlaStatus,
  getSubmittedAgo,
} from "@/lib/expertApplicationsStore";
import type { ApplicationStatus } from "@/lib/expertApplicationSubmission";
import { getAdminApplications, getAdminApplicationStats } from "@/lib/api";
import {
  mapBackendExpertToApplication,
  type BackendExpertApplication,
} from "@/lib/backendApplicationMapper";

export const APPLICATIONS_UPDATED_EVENT = "expert-applications-updated";

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
  onboardingStep?: string;
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
    onboardingStep: application.onboardingStep,
  };
}

function dispatchUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(APPLICATIONS_UPDATED_EVENT));
}

export function useExpertApplications({
  page = 1,
  limit = 20,
  status = "all",
}: { page?: number; limit?: number; status?: string } = {}) {
  const [applications, setApplications] = useState<ExpertApplicationSubmission[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  });
  const [serverCounts, setServerCounts] = useState<Record<string, number>>({});

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
    dispatchUpdated();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadApplications() {
      setError(null);

      try {
        const [response, counts] = await Promise.all([
          getAdminApplications({ page, limit, status }),
          getAdminApplicationStats(),
        ]);
        if (!active) return;
        const mapped = (response.items as BackendExpertApplication[]).flatMap((record) => {
          try {
            return [mapBackendExpertToApplication(record)];
          } catch (err) {
            console.warn("Failed to map admin application record", record.id, err);
            return [];
          }
        });
        setApplications(mapped);
        setPagination(response.pagination);
        setServerCounts(counts);
      } catch (err) {
        console.warn("Failed to load applications from backend.", err);
        if (!active) return;
        setApplications([]);
        setError(err instanceof Error ? err.message : "Failed to load applications.");
      } finally {
        if (active) setReady(true);
      }
    }

    loadApplications();

    const handleRefresh = () => {
      void loadApplications();
    };

    window.addEventListener(APPLICATIONS_UPDATED_EVENT, handleRefresh);

    return () => {
      active = false;
      window.removeEventListener(APPLICATIONS_UPDATED_EVENT, handleRefresh);
    };
  }, [refreshToken, page, limit, status]);

  const getByAppId = useCallback(
    (appId: string) => applications.find((application) => application.appId === appId) ?? null,
    [applications],
  );

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
      all: serverCounts.all ?? applications.length,
      pending: 0,
      in_review: 0,
      on_hold: 0,
      approved: 0,
      rejected: 0,
    };

    for (const key of ["pending", "in_review", "on_hold", "approved", "rejected"] as const) {
      counts[key] = serverCounts[key] ?? 0;
    }

    return counts;
  }, [applications, serverCounts]);

  const kpis = useMemo(
    () => [
      {
        id: "all",
        label: "All",
        value: String(statusCounts.all).padStart(2, "0"),
        variant: "all" as const,
      },
      {
        id: "pending",
        label: "Pending",
        value: String(statusCounts.pending).padStart(2, "0"),
        variant: "pending" as const,
      },
      {
        id: "in_review",
        label: "In Review",
        value: String(statusCounts.in_review).padStart(2, "0"),
        variant: "review" as const,
      },
      {
        id: "on_hold",
        label: "On Hold",
        value: String(statusCounts.on_hold).padStart(2, "0"),
        variant: "hold" as const,
      },
      {
        id: "approved",
        label: "Approved MTD",
        value: String(statusCounts.approved).padStart(2, "0"),
        variant: "approved" as const,
      },
      {
        id: "rejected",
        label: "Rejected MTD",
        value: String(statusCounts.rejected).padStart(2, "0"),
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
    error,
    applications,
    listItems,
    statusCounts,
    kpis,
    pendingCount: statusCounts.pending,
    breachedApplications,
    getByAppId,
    refresh,
    pagination,
  };
}

export function useExpertApplication(appId: string) {
  const { ready, getByAppId, refresh, error } = useExpertApplications();
  const [application, setApplication] = useState<ExpertApplicationSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = getByAppId(appId);
    if (cached) {
      queueMicrotask(() => {
        setApplication(cached);
        setLoading(false);
      });
      return;
    }

    let active = true;

    async function loadApplication() {
      setLoading(true);
      try {
        const { getAdminApplication } = await import("@/lib/api");
        const record = await getAdminApplication(appId);
        if (!active) return;
        setApplication(mapBackendExpertToApplication(record as BackendExpertApplication));
      } catch {
        if (!active) return;
        setApplication(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadApplication();

    return () => {
      active = false;
    };
  }, [appId, getByAppId]);

  return {
    ready: ready && !loading,
    application,
    error,
    refresh,
  };
}
