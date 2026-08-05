"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ExpertLoginStep from "@/components/expert/onboarding/LoginStep";
import SeekerLoginStep from "@/components/seeker/onboarding/LoginStep";
import {
  getPostAuthDestination,
  isNavigationHref,
  persistAuthSession,
  savePendingOtpSession,
  clearExpertAuthOnly,
} from "@/lib/expertAuth";
import type { AuthResponse } from "@/lib/api";
import styles from "@/app/expert/expert-onboarding/page.module.css";

type LoginRole = "expert" | "user";

function LoginShell({ children }: { children?: React.ReactNode }) {
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

function LoginPageContent({ role }: { role: LoginRole }) {
  const handleExpertContinue = (response: AuthResponse) => {
    const user = persistAuthSession(response);
    const destination = getPostAuthDestination(user);

    if (isNavigationHref(destination)) {
      window.location.assign(destination);
      return;
    }

    window.location.assign(`/expert/expert-onboarding/?resume=${destination}`);
  };

  const handleSeekerContinue = ({ email: _email }: { email: string }) => {
    window.location.assign("/seeker/dashboard/");
  };

  const handleExpertRequiresOtp = ({
    expertId,
    email,
    phone,
  }: {
    expertId: string;
    email: string;
    phone: string;
  }) => {
    clearExpertAuthOnly();
    savePendingOtpSession({ expertId, email, phone });
    window.location.assign("/expert/expert-onboarding/?resume=otp");
  };

  return (
    <LoginShell>
      {role === "expert" ? (
        <ExpertLoginStep
          onContinue={handleExpertContinue}
          onRequiresOtp={handleExpertRequiresOtp}
          registerHref="/expert/expert-onboarding/"
        />
      ) : (
        <SeekerLoginStep
          onContinue={handleSeekerContinue}
          registerHref="/seeker/seeker-onboarding/"
        />
      )}
    </LoginShell>
  );
}

function LoginPageComponent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "expert" ? "expert" : "user";

  return <LoginPageContent role={role} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginPageComponent />
    </Suspense>
  );
}
