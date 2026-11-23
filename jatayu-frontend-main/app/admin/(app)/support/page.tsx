import type { Metadata } from "next";
import AdminSupportList from "@/components/admin/support/AdminSupportList";

export const metadata: Metadata = {
  title: "Support Tickets — Jatayu Admin",
  description: "View and manage user support requests.",
};

export default function AdminSupportPage() {
  return <AdminSupportList />;
}
