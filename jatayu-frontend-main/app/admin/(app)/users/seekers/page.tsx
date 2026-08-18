import type { Metadata } from "next";
import UserManagement from "@/components/admin/users/UserManagement";

export const metadata: Metadata = {
  title: "Seeker User Management — Jatayu Admin",
  description: "Manage seeker accounts, booking records, and platform activity.",
};

export default function AdminUsersSeekersPage() {
  return <UserManagement subSection="seekers" />;
}
