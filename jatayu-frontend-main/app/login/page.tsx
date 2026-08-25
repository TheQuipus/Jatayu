"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SeekerLoginStep from "@/components/seeker/onboarding/LoginStep";
import ExpertLoginStep from "@/components/expert/onboarding/LoginStep";
import { type AuthResponse } from "@/lib/api";
import {
  persistSeekerAuthSession,
  getSeekerPostAuthDestination,
} from "@/lib/seekerAuth";
import {
  persistAuthSession as persistExpertAuthSession,
  getPostAuthDestination,
  isNavigationHref,
} from "@/lib/expertAuth";
import { EXPERT_DASHBOARD_HREF, EXPERT_ONBOARDING_HREF } from "@/lib/expertDashboard";
import { EXPERT_SIGNUP_HREF } from "@/lib/joinAsExpertNav";
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
  const router = useRouter();

  const handleSeekerContinue = (response: AuthResponse) => {
    const user = persistSeekerAuthSession(response);
    const destination = getSeekerPostAuthDestination(user);
    if (typeof destination === "string" && destination.startsWith("/")) {
      window.location.assign(destination);
    } else {
      window.location.assign("/seeker/seeker-onboarding/");
    }
  };

  const handleExpertContinue = (response: AuthResponse) => {
    const user = persistExpertAuthSession(response);
    const destination = getPostAuthDestination(user);
    if (isNavigationHref(destination)) {
      window.location.assign(destination);
    } else if (destination === "success") {
      window.location.assign(EXPERT_DASHBOARD_HREF);
    } else {
      window.location.assign(EXPERT_ONBOARDING_HREF);
    }
  };

  const handleExpertRequiresOtp = () => {
    router.push("/expert/expert-onboarding/?resume=otp");
  };

  if (role === "expert") {
    return (
      <LoginShell>
        <ExpertLoginStep
          onContinue={handleExpertContinue}
          onRequiresOtp={handleExpertRequiresOtp}
          registerHref={EXPERT_SIGNUP_HREF}
        />
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <SeekerLoginStep
        onContinue={handleSeekerContinue}
        registerHref="/seeker/seeker-onboarding/"
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
