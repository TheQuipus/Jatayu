"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken, setExpertId } from "@/lib/api";
import { EXPERT_DASHBOARD_HREF } from "@/lib/expertDashboard";

function LoginSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const expertId = searchParams.get("expertId");

    if (token) {
      setToken(token);
    }
    if (expertId) {
      setExpertId(expertId);
    }

    router.replace(EXPERT_DASHBOARD_HREF);
  }, [router, searchParams]);

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0b0d",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <p>Logging in... Redirecting to Expert Dashboard...</p>
    </div>
  );
}

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={null}>
      <LoginSuccessContent />
    </Suspense>
  );
}
