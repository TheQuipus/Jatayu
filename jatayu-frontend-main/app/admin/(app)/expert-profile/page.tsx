import type { Metadata } from "next";
import AdminExpertRouteRedirect from "@/components/admin/AdminExpertRouteRedirect";

export const metadata: Metadata = {
  title: "Expert Profile — Jatayu Admin",
};

export default function AdminExpertProfileIndexPage() {
  return <AdminExpertRouteRedirect basePath="/admin/expert-profile" />;
}
