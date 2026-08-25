import type { Metadata } from "next";
import SeekerProfilePage from "@/components/seeker/profile/SeekerProfilePage";

export const metadata: Metadata = {
  title: "Profile — Jatayu",
  description: "Manage your user profile and account preferences.",
};

export default function SeekerProfileRoute() {
  return <SeekerProfilePage />;
}
