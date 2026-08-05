import type { Metadata } from "next";
import AdminOverviewDashboard from "@/components/admin/dashboard/AdminOverviewDashboard";

export const metadata: Metadata = {
  title: "Overview Dashboard — Jatayu Admin",
  description: "Admin overview dashboard for the Jatayu marketplace.",
};

export default function AdminDashboardPage() {
  return <AdminOverviewDashboard />;
}
