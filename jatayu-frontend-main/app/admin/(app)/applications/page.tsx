import type { Metadata } from "next";
import ExpertApplications from "@/components/admin/applications/ExpertApplications";

export const metadata: Metadata = {
  title: "Expert Applications — Jatayu Admin",
  description: "Review and manage submitted expert applications.",
};

export default function ExpertApplicationsPage() {
  return <ExpertApplications />;
}
