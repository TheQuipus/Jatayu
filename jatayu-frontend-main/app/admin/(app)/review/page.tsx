import type { Metadata } from "next";
import AdminExpertRouteRedirect from "@/components/admin/AdminExpertRouteRedirect";

export const metadata: Metadata = {
  title: "Application Review — Jatayu Admin",
};

export default function ApplicationReviewIndexPage() {
  return <AdminExpertRouteRedirect basePath="/admin/review" />;
}
