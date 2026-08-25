"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { getProfile } from "@/lib/api";
import { clearAuthSession, isAuthenticated } from "@/lib/expertAuth";
import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";

export default function ExpertAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    function verifySession() {
      if (!isAuthenticated()) {
        router.replace(EXPERT_LOGIN_HREF);
        return;
      }
      if (active) setReady(true);
    }

    verifySession();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) return null;
  return children;
}
