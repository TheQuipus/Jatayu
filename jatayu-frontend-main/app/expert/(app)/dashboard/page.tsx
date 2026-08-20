import type { Metadata } from "next";
import ExpertDashboard from "@/components/expert/dashboard/ExpertDashboard";

export const metadata: Metadata = {
  title: "Dashboard — Jatayu Expert",
  description: "Your expert dashboard for sessions, earnings, and profile management.",
};

export default function ExpertDashboardPage() {
  return <ExpertDashboard />;
}
