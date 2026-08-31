"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import styles from "@/app/expert/expert-onboarding/page.module.css";

function AuthShell({ children }: { children?: React.ReactNode }) {
  return (
    <main className={styles.pageContainer}>
      <div className={styles.bgWrapper}>
        <img
          src="/assets/img/hero-bg.png"
          alt=""
          className={styles.bgImage}
          role="presentation"
        />
        <div className={styles.bgOverlay} />
      </div>
      {children}
    </main>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const rawRole = searchParams.get("role");
  const role = rawRole?.toLowerCase() === "expert" ? "expert" : (rawRole?.toLowerCase() === "admin" ? "admin" : "user");

  let loginHref = "/login?role=user";
  if (role === "expert") {
    loginHref = "/login?role=expert";
  } else if (role === "admin") {
    loginHref = "/admin";
  }

  return (
    <AuthShell>
      <ResetPasswordForm email={email} loginHref={loginHref} role={role} />
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthShell />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
