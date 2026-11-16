"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SeekerLoginStep from "@/components/seeker/onboarding/LoginStep";
import SeekerOtpStep from "@/components/seeker/onboarding/OtpStep";
import ExpertLoginStep from "@/components/expert/onboarding/LoginStep";
import ExpertOtpStep from "@/components/expert/onboarding/OtpStep";
import { type AuthResponse } from "@/lib/api";
import {
  persistSeekerAuthSession,
  getSeekerPostAuthDestination,
  savePendingSeekerOtpSession,
  readPendingSeekerOtpSession,
  clearPendingSeekerOtpSession,
} from "@/lib/seekerAuth";
import {
  persistAuthSession as persistExpertAuthSession,
  getPostAuthDestination,
  isNavigationHref,
  savePendingOtpSession as savePendingExpertOtpSession,
  readPendingOtpSession as readPendingExpertOtpSession,
  clearPendingOtpSession as clearPendingExpertOtpSession,
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

function LoginPageContent({
  role,
  initialEmail = "",
}: {
  role: LoginRole;
  initialEmail?: string;
}) {
  const router = useRouter();

  const [pendingSeekerOtp, setPendingSeekerOtp] = useState<{
    seekerId: string;
    email: string;
    phone: string;
  } | null>(null);

  const [pendingExpertOtp, setPendingExpertOtp] = useState<{
    expertId: string;
    email: string;
    phone: string;
  } | null>(null);

  useEffect(() => {
    if (role === "user") {
      const pending = readPendingSeekerOtpSession();
      if (pending && pending.seekerId && pending.email) {
        setPendingSeekerOtp({
          seekerId: pending.seekerId,
          email: pending.email,
          phone: pending.phone || "",
        });
      }
    } else if (role === "expert") {
      const pending = readPendingExpertOtpSession();
      if (pending && pending.expertId && pending.email) {
        setPendingExpertOtp({
          expertId: pending.expertId,
          email: pending.email,
          phone: pending.phone || "",
        });
      }
    }
  }, [role]);

  const handleSeekerContinue = (response: AuthResponse) => {
    clearPendingSeekerOtpSession();
    setPendingSeekerOtp(null);
    const user = persistSeekerAuthSession(response);
    const destination = getSeekerPostAuthDestination(user);
    if (typeof destination === "string" && destination.startsWith("/")) {
      window.location.assign(destination);
    } else {
      window.location.assign(`/seeker/seeker-onboarding/?step=${encodeURIComponent(destination)}`);
    }
  };

  const handleExpertContinue = (response: AuthResponse) => {
    clearPendingExpertOtpSession();
    setPendingExpertOtp(null);
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

  if (role === "expert") {
    if (pendingExpertOtp) {
      return (
        <LoginShell>
          <ExpertOtpStep
            expertId={pendingExpertOtp.expertId}
            email={pendingExpertOtp.email}
            phone={pendingExpertOtp.phone}
            onBack={() => {
              clearPendingExpertOtpSession();
              setPendingExpertOtp(null);
            }}
            onContinue={handleExpertContinue}
          />
        </LoginShell>
      );
    }

    return (
      <LoginShell>
        <ExpertLoginStep
          onContinue={handleExpertContinue}
          onRequiresOtp={(data) => {
            savePendingExpertOtpSession({ ...data, flow: "login" });
            setPendingExpertOtp({
              expertId: data.expertId,
              email: data.email,
              phone: data.phone || "",
            });
          }}
          registerHref={EXPERT_SIGNUP_HREF}
          initialEmail={initialEmail}
        />
      </LoginShell>
    );
  }

  if (pendingSeekerOtp) {
    return (
      <LoginShell>
        <SeekerOtpStep
          seekerId={pendingSeekerOtp.seekerId}
          email={pendingSeekerOtp.email}
          phone={pendingSeekerOtp.phone}
          onBack={() => {
            clearPendingSeekerOtpSession();
            setPendingSeekerOtp(null);
          }}
          onContinue={handleSeekerContinue}
        />
      </LoginShell>
    );
  }

  return (
    <LoginShell>
      <SeekerLoginStep
        onContinue={handleSeekerContinue}
        onRequiresOtp={(data) => {
          savePendingSeekerOtpSession({ ...data, flow: "login" });
          setPendingSeekerOtp({
            seekerId: data.seekerId,
            email: data.email,
            phone: data.phone || "",
          });
        }}
        registerHref="/seeker/seeker-onboarding/"
        initialEmail={initialEmail}
      />
    </LoginShell>
  );
}

function LoginPageComponent() {
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "expert" ? "expert" : "user";
  const initialEmail = searchParams.get("email") || "";

  return <LoginPageContent role={role} initialEmail={initialEmail} />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginPageComponent />
    </Suspense>
  );
}
