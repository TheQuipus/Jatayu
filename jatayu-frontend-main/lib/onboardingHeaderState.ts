export const ONBOARDING_STEP_CHANGE_EVENT = "jatayu:onboarding-step-change";

const PRE_OTP_STEPS = new Set(["register", "login", "otp"]);

export function isPostOtpOnboardingHeader(
  pathname: string | null,
  search: string,
): boolean {
  if (
    !pathname?.startsWith("/seeker/seeker-onboarding") &&
    !pathname?.startsWith("/expert/expert-onboarding")
  ) {
    return false;
  }

  const params = new URLSearchParams(search);
  const step = params.get("step");
  if (step) {
    return !PRE_OTP_STEPS.has(step);
  }

  const kyc = params.get("kyc");
  if (kyc === "success" || kyc === "denied" || kyc === "error") {
    return true;
  }

  if (params.get("resume") === "category") {
    return true;
  }

  return false;
}

export function notifyOnboardingStepChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ONBOARDING_STEP_CHANGE_EVENT));
  }
}
