import { Compass } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import shared from "./onboarding.shared.module.css";

export function formatUserGreeting(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed || /^guest(\s+seeker)?$/i.test(trimmed)) {
    return "Hi";
  }

  const first = trimmed.split(/\s+/)[0];
  if (/^guest$/i.test(first)) {
    return "Hi";
  }

  return `Hi ${first}`;
}

type OnboardingStepTitleProps = {
  userName: string;
  icon?: LucideIcon;
  theme?: "dark" | "light";
};

export default function OnboardingStepTitle({
  userName,
  icon: Icon = Compass,
  theme = "dark",
}: OnboardingStepTitleProps) {
  return (
    <div
      className={`${shared.headerTitleCompact} ${
        theme === "light" ? shared.headerTitleLight : ""
      }`}
    >
      <Icon
        className={`${shared.headerIcon} ${theme === "light" ? shared.headerIconLight : ""}`}
      />
      <span>{formatUserGreeting(userName)}</span>
    </div>
  );
}
