"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/api";
import { clearAuthSession, isAuthenticated } from "@/lib/expertAuth";

export default function ExpertAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      if (!isAuthenticated()) {
        router.replace("/login?role=expert");
        return;
      }

      try {
        await getProfile();
        if (active) setReady(true);
      } catch {
        clearAuthSession();
        router.replace("/login?role=expert");
      }
    }

    void verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) return null;
  return children;
}
