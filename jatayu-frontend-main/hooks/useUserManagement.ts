"use client";

import { useCallback, useEffect, useState } from "react";
import {
  MOCK_EXPERTS,
  type ExpertUser,
  type SeekerUser,
  type UserStatus,
} from "@/lib/adminUserManagement";
import { getAdminSeekers, updateAdminSeekerStatus } from "@/lib/adminSeekerApi";

export function useUserManagement() {
  const [ready, setReady] = useState(false);
  const [experts, setExperts] = useState<ExpertUser[]>(MOCK_EXPERTS);
  const [seekers, setSeekers] = useState<SeekerUser[]>([]);
  const [seekerCounts, setSeekerCounts] = useState<Record<string, number>>({});

  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    loadSeekers().then(({ items, counts }) => {
      if (active) { setSeekers(items); setSeekerCounts(counts); }
    }).catch((failure) => {
      if (active) setError(failure instanceof Error ? failure.message : "Unable to load seeker records");
    }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [loadSeekers]);

  const updateExpertStatus = (id: string, status: UserStatus) => {
    setExperts((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const updateSeekerStatus = async (id: string, status: UserStatus) => {
    if (updatingId) return;
    setUpdatingId(id); setError("");
    try {
      const result = await updateAdminSeekerStatus(id, status);
      const oldStatus = seekers.find((item) => item.id === id)?.status;
      setSeekers((current) => current.map((seeker) => seeker.id === id ? { ...seeker, status: result.seeker.status } : seeker));
      if (oldStatus && oldStatus !== result.seeker.status) {
        setSeekerCounts((counts) => ({ ...counts,
          [oldStatus]: Math.max(0, (counts[oldStatus] || 0) - 1),
          [result.seeker.status]: (counts[result.seeker.status] || 0) + 1,
        }));
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to update seeker status");
    } finally { setUpdatingId(null); }
  };

  return { ready, experts, seekers, seekerCounts, error, updatingId, updateExpertStatus, updateSeekerStatus };
}
