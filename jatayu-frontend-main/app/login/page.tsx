"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ExpertLoginStep from "@/components/expert/onboarding/LoginStep";
import SeekerLoginStep from "@/components/seeker/onboarding/LoginStep";
import { EXPERT_DASHBOARD_HREF } from "@/lib/expertDashboard";
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
  const handleContinue = ({ email: _email }: { email: string }) => {
    if (role === "expert") {
      window.location.assign(EXPERT_DASHBOARD_HREF);
      return;
    }

    window.location.assign("/seeker/dashboard/");
  };

  const LoginStep = role === "expert" ? ExpertLoginStep : SeekerLoginStep;

  return (
    <LoginShell>
      <LoginStep
        onContinue={handleContinue}
        registerHref={role === "expert" ? "/expert/expert-onboarding/" : "/seeker/seeker-onboarding/"}
      />
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
