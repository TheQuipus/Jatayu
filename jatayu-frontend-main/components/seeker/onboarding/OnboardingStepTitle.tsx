import { Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import shared from "./onboarding.shared.module.css";

export function formatUserGreeting(fullName: string): string {
  const first = fullName.trim().split(/\s+/)[0];
  return first ? `Hi ${first}` : "Hi there";
}

type OnboardingStepTitleProps = {
  userName: string;
  icon?: LucideIcon;
};

export default function OnboardingStepTitle({
  userName,
  icon: Icon = Compass,
}: OnboardingStepTitleProps) {
  return (
    <div className={shared.headerTitleCompact}>
      <Icon className={shared.headerIcon} />
      <span>{formatUserGreeting(userName)}</span>
    </div>
  );
}
