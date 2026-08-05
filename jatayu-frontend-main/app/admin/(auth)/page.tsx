import type { Metadata } from "next";
import AdminLogin from "@/components/admin/AdminLogin";

export const metadata: Metadata = {
  title: "Admin Console — Jatayu",
  description: "Secure admin access to manage the Jatayu marketplace.",
};

export default function AdminLoginPage() {
  return <AdminLogin />;
}
