import type { Metadata } from "next";
import UserManagement from "@/components/admin/users/UserManagement";

export const metadata: Metadata = {
  title: "Expert User Management — Jatayu Admin",
  description: "Manage expert profiles, account statuses, and platform access.",
};

export default function AdminUsersExpertsPage() {
  return <UserManagement subSection="experts" />;
}
