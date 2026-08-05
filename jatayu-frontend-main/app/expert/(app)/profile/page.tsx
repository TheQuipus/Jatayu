import type { Metadata } from "next";
import ExpertProfilePage from "@/components/expert/profile/ExpertProfilePage";

export const metadata: Metadata = {
  title: "Profile — Jatayu Expert",
  description: "Edit your expert profile and preview how it appears to seekers.",
};

export default function ExpertProfileRoute() {
  return <ExpertProfilePage />;
}
