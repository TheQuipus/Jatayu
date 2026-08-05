import {
  Target,
  Zap,
  Brain,
  Handshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type SeekerOutcomeOption = {
  id: string;
  title: string;
  icon: LucideIcon;
  desc: string;
};

export const SEEKER_OUTCOME_OPTIONS: SeekerOutcomeOption[] = [
  {
    id: "clarity",
    title: "Clarity & Direction",
    icon: Target,
    desc: "I want to understand my options clearly and leave with a confident direction.",
  },
  {
    id: "plan",
    title: "Quick Actionable Plan",
    icon: Zap,
    desc: "I need a concrete action plan that I can start executing this week.",
  },
  {
    id: "knowledge",
    title: "Deep Knowledge",
    icon: Brain,
    desc: "I want to deeply understand this topic and make informed decisions fast.",
  },
  {
    id: "accountability",
    title: "Accountability & Support",
    icon: Handshake,
    desc: "I want ongoing support to stay consistent, focused, and accountable.",
  },
  {
    id: "resolved",
    title: "Problem Solved",
    icon: ShieldCheck,
    desc: "I have a specific problem and need a practical solution as soon as possible.",
  },
  {
    id: "transformation",
    title: "Long-term Transformation",
    icon: Sparkles,
    desc: "I want long-term transformation with lasting progress and measurable growth.",
  },
];

export const NEED_STEP_CHIPS = [
  { id: "clarity", outcomeId: "clarity", label: "Clarity & Direction" },
  { id: "plan", outcomeId: "plan", label: "Actionable Plan" },
  { id: "knowledge", outcomeId: "knowledge", label: "Deep Knowledge" },
  { id: "support", outcomeId: "accountability", label: "Help & Support" },
  { id: "solution", outcomeId: "resolved", label: "Specific Solution" },
] as const;

export function getSeekerOutcomeDescription(outcomeId: string): string {
  return SEEKER_OUTCOME_OPTIONS.find((option) => option.id === outcomeId)?.desc ?? "";
}
