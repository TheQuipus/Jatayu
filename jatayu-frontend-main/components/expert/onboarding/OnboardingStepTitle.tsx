import { Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import shared from "./onboarding.shared.module.css";

function formatDisplayName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function formatUserGreeting(fullName: string): string {
  const name = formatDisplayName(fullName);
  return name ? `Hi ${name}` : "Hi there";
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
