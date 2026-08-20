"use client";

import { useEffect, useState } from "react";
import {
  MOCK_EXPERTS,
  MOCK_SEEKERS,
  type ExpertUser,
  type SeekerUser,
  type UserStatus,
} from "@/lib/adminUserManagement";

export function useUserManagement() {
  const [ready, setReady] = useState(false);
  const [experts, setExperts] = useState<ExpertUser[]>([]);
  const [seekers, setSeekers] = useState<SeekerUser[]>([]);

  useEffect(() => {
    setExperts(MOCK_EXPERTS);
    setSeekers(MOCK_SEEKERS);
    setReady(true);
  }, []);

  const updateExpertStatus = (id: string, status: UserStatus) => {
    setExperts((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status } : e))
    );
  };

  const updateSeekerStatus = (id: string, status: UserStatus) => {
    setSeekers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  return {
    ready,
    experts,
    seekers,
    updateExpertStatus,
    updateSeekerStatus,
  };
}
