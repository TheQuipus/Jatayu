"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getAdminMe, getAdminToken } from "@/lib/api";

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      const token = getAdminToken();
      if (!token) {
        router.replace("/admin");
        return;
      }

      try {
        await getAdminMe();
        if (active) setReady(true);
      } catch {
        router.replace("/admin");
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
