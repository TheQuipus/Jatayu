import type { Metadata } from "next";
import SeekerDashboard from "@/components/seeker/dashboard/SeekerDashboard";

export const metadata: Metadata = {
  title: "Dashboard — Jatayu",
  description: "Your seeker dashboard for bookings, experts, and consultations.",
};

export default function SeekerDashboardPage() {
  return <SeekerDashboard />;
}
