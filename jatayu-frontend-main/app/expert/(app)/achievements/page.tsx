import type { Metadata } from "next";
import ExpertAchievements from "@/components/expert/achievements/ExpertAchievements";

export const metadata: Metadata = {
  title: "Achievements & Reputation — Expertjourney 2",
  description: "Track your earned badges, tier progression, reputation metrics, and platform privileges.",
};

export default function ExpertAchievementsPage() {
  return <ExpertAchievements />;
}
