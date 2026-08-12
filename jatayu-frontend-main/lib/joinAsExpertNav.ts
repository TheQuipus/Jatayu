import type { MouseEvent } from "react";
import { clearAuthSession } from "@/lib/expertAuth";

export const EXPERT_SIGNUP_HREF = "/expert/expert-onboarding/?flow=signup";
export const EXPERT_LOGIN_HREF = "/expert/expert-onboarding/?auth=login";
/** @deprecated Use EXPERT_SIGNUP_HREF for new expert entry */
export const JOIN_AS_EXPERT_HREF = EXPERT_SIGNUP_HREF;

export function handleJoinAsExpertClick(event: MouseEvent<HTMLAnchorElement>) {
  clearAuthSession();
}
