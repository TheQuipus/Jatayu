import type { Metadata } from "next";
import ExpertSettings from "@/components/expert/settings/ExpertSettings";

export const metadata: Metadata = {
  title: "Account Settings — Jatayu Expert",
  description: "Manage your privacy, security, notification preferences, and regional settings.",
};

export default function ExpertSettingsPage() {
  return <ExpertSettings />;
}
