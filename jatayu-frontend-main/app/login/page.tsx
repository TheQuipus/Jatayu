"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LoginStep from "@/components/expert/onboarding/LoginStep";
import styles from "@/app/expert/expert-onboarding/page.module.css";

function LoginPageContent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "expert" ? "expert" : "user";

  const handleContinue = ({ email, fullName, onboardingStep }: { email: string; fullName: string; onboardingStep: string }) => {
    const nameFromEmail = fullName || email.split("@")[0]?.replace(/[._-]+/g, " ") || "Expert";

    if (role === "expert") {
      // Auto-resume at the server-stored step, default to category
      const resumableSteps = [
        "category", "skills", "experience", "identity",
        "credentials", "preferences", "audience", "availability", "review",
      ];
      const resumeStep = resumableSteps.includes(onboardingStep) ? onboardingStep : "category";
      window.location.assign(
        `/expert/expert-onboarding?resume=${resumeStep}&name=${encodeURIComponent(nameFromEmail)}`,
      );
      return;
    }

    window.location.assign("/");
  };

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

      <LoginStep
        onContinue={handleContinue}
        registerHref={role === "expert" ? "/expert/expert-onboarding" : "/seeker/seeker-onboarding"}
      />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
