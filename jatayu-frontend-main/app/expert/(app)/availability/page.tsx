import type { Metadata } from "next";
import ExpertAvailabilityPage from "@/components/expert/availability/ExpertAvailabilityPage";

export const metadata: Metadata = {
  title: "Availability — Jatayu Expert",
  description: "Set your weekly availability for expert consultations.",
};

export default function ExpertAvailabilityRoute() {
  return <ExpertAvailabilityPage />;
}
