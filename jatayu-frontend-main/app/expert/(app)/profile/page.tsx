import type { Metadata } from "next";
import ExpertProfilePage from "@/components/expert/profile/ExpertProfilePage";

export const metadata: Metadata = {
  title: "Profile — Jatayu Expert",
  description: "View and manage your Jatayu expert profile.",
};

export default function ExpertProfileRoute() {
  return <ExpertProfilePage />;
}
