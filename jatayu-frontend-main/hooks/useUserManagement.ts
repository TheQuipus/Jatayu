"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  ExpertUser,
  SeekerUser,
  UserStatus,
} from "@/lib/adminUserManagement";
import { getAdminSeekers, updateAdminSeekerStatus } from "@/lib/adminSeekerApi";
import { getAdminExperts, updateAdminExpertStatus } from "@/lib/adminExpertApi";

export function useUserManagement() {
  const [ready, setReady] = useState(false);
  const [experts, setExperts] = useState<ExpertUser[]>([]);
  const [expertCounts, setExpertCounts] = useState<{
    all: number;
    active: number;
    on_hold: number;
    suspended: number;
  }>({ all: 0, active: 0, on_hold: 0, suspended: 0 });

  const [seekers, setSeekers] = useState<SeekerUser[]>([]);
  const [seekerCounts, setSeekerCounts] = useState<Record<string, number>>({});

  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadExperts = useCallback(async () => {
    const response = await getAdminExperts({ page: 1, limit: 100 });
    const items = [...response.items];
    for (let page = 2; page <= response.pagination.totalPages; page += 1) {
      items.push(...(await getAdminExperts({ page, limit: 100 })).items);
    }
    return { items, counts: response.counts };
  }, []);

  const loadSeekers = useCallback(async () => {
    const response = await getAdminSeekers({ page: 1, limit: 100 });
    const items = [...response.items];
    for (let page = 2; page <= response.pagination.totalPages; page += 1) {
      items.push(...(await getAdminSeekers({ page, limit: 100 })).items);
    }
    return { items, counts: response.counts };
  }, []);

  useEffect(() => {
    let active = true;

    Promise.allSettled([loadExperts(), loadSeekers()]).then(([expertsResult, seekersResult]) => {
      if (!active) return;

      if (expertsResult.status === "fulfilled") {
        setExperts(expertsResult.value.items);
        setExpertCounts(expertsResult.value.counts);
      } else {
        console.warn("Failed to load admin experts:", expertsResult.reason);
        setError("Unable to load expert records");
      }

      if (seekersResult.status === "fulfilled") {
        setSeekers(seekersResult.value.items);
        setSeekerCounts(seekersResult.value.counts);
      } else {
        console.warn("Failed to load admin seekers:", seekersResult.reason);
      }

      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [loadExperts, loadSeekers]);

  const updateExpertStatus = async (id: string, status: UserStatus) => {
    if (updatingId) return;
    setUpdatingId(id);
    setError("");
    try {
      const result = await updateAdminExpertStatus(id, status);
      const oldStatus = experts.find((item) => item.id === id)?.status;
      setExperts((current) =>
        current.map((expert) =>
          expert.id === id ? { ...expert, status: result.expert.status } : expert,
        ),
      );
      if (oldStatus && oldStatus !== result.expert.status) {
        setExpertCounts((counts) => ({
          ...counts,
          [oldStatus]: Math.max(0, (counts[oldStatus as keyof typeof counts] || 0) - 1),
          [result.expert.status]: (counts[result.expert.status as keyof typeof counts] || 0) + 1,
        }));
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update expert status");
    } finally {
      setUpdatingId(null);
    }
  };

  const updateSeekerStatus = async (id: string, status: UserStatus) => {
    if (updatingId) return;
    setUpdatingId(id);
    setError("");
    try {
      const result = await updateAdminSeekerStatus(id, status);
      const oldStatus = seekers.find((item) => item.id === id)?.status;
      setSeekers((current) =>
        current.map((seeker) =>
          seeker.id === id ? { ...seeker, status: result.seeker.status } : seeker,
        ),
      );
      if (oldStatus && oldStatus !== result.seeker.status) {
        setSeekerCounts((counts) => ({
          ...counts,
          [oldStatus]: Math.max(0, (counts[oldStatus] || 0) - 1),
          [result.seeker.status]: (counts[result.seeker.status] || 0) + 1,
        }));
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update seeker status");
    } finally {
      setUpdatingId(null);
    }
  };

  return {
    ready,
    experts,
    expertCounts,
    seekers,
    seekerCounts,
    error,
    updatingId,
    updateExpertStatus,
    updateSeekerStatus,
  };
}
