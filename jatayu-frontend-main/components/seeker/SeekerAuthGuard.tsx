"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ApiError, getSeekerMe } from "@/lib/api";
import { clearSeekerAuthOnly } from "@/lib/seekerAuth";

export default function SeekerAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "error">("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    void getSeekerMe()
      .then(() => {
        if (active) setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;

        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          clearSeekerAuthOnly();
          router.replace("/login");
          return;
        }

        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, [attempt, router]);

  if (status !== "ready") {
    if (status === "error") {
      return (
        <main>
          <p>Unable to verify your session. Please try again.</p>
          <button
            type="button"
            onClick={() => {
              setStatus("checking");
              setAttempt((current) => current + 1);
            }}
          >
            Try again
          </button>
        </main>
      );
    }

    return null;
  }

  return children;
}
