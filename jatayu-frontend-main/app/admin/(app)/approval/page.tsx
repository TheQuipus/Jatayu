import type { Metadata } from "next";
import AdminExpertRouteRedirect from "@/components/admin/AdminExpertRouteRedirect";

export const metadata: Metadata = {
  title: "Approval Confirmation — Jatayu Admin",
};

export default function ApprovalConfirmationIndexPage() {
  return <AdminExpertRouteRedirect basePath="/admin/approval" />;
}
