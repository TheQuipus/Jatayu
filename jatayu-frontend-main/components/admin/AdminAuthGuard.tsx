"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getAdminMe, getAdminToken, removeAdminToken } from "@/lib/api";
import {
  recordAdminActivity,
  sanitizeAdminNextPath,
  setCachedAdminIdleConfig,
} from "@/lib/adminIdleSession";

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = getAdminToken();
      if (!token) {
        const currentPath =
          typeof window !== "undefined"
            ? sanitizeAdminNextPath(`${window.location.pathname}${window.location.search}`)
            : null;
        router.replace(currentPath ? `/admin?next=${encodeURIComponent(currentPath)}` : "/admin");
        return;
      }

      try {
        const user = await getAdminMe();
        if (user?.idleConfig) {
          setCachedAdminIdleConfig(user.idleConfig);
        }
        recordAdminActivity(false);
        if (active) setReady(true);
      } catch {
        removeAdminToken();
        const currentPath =
          typeof window !== "undefined"
            ? sanitizeAdminNextPath(`${window.location.pathname}${window.location.search}`)
            : null;
        router.replace(
          currentPath
            ? `/admin?reason=session_expired&next=${encodeURIComponent(currentPath)}`
            : "/admin?reason=session_expired",
        );
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
