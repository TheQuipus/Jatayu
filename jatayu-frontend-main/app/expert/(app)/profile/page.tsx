import type { Metadata } from "next";
import ExpertProfilePage from "@/components/expert/profile/ExpertProfilePage";

export const metadata: Metadata = {
  title: "Profile — Jatayu Expert",
  description: "View and manage your Jatayu expert profile.",
};

type ExpertProfileRouteProps = {
  searchParams: Promise<{ mode?: string | string[] }>;
};

export default async function ExpertProfileRoute({ searchParams }: ExpertProfileRouteProps) {
  const { mode } = await searchParams;
  return <ExpertProfilePage isEditing={mode === "edit"} />;
}
