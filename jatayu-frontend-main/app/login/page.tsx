"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SeekerLoginStep from "@/components/seeker/onboarding/LoginStep";
import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";
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

  useEffect(() => {
    if (role === "expert") {
      router.replace(EXPERT_LOGIN_HREF);
    }
  }, [role, router]);

  const handleSeekerContinue = ({ email: _email }: { email: string }) => {
    window.location.assign("/seeker/dashboard/");
  };

  if (role === "expert") {
    return <LoginShell />;
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
