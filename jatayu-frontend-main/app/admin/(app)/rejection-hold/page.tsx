import type { Metadata } from "next";
import AdminExpertRouteRedirect from "@/components/admin/AdminExpertRouteRedirect";

export const metadata: Metadata = {
  title: "Rejection & Hold — Jatayu Admin",
};

export default function RejectionHoldIndexPage() {
  return <AdminExpertRouteRedirect basePath="/admin/rejection-hold" />;
}
