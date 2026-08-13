import type { Metadata } from "next";
import ExpertNotifications from "@/components/expert/notifications/ExpertNotifications";

export const metadata: Metadata = {
  title: "Notifications — Jatayu Expert",
  description: "Stay informed about your sessions, clients, payments, and account.",
};

export default function ExpertNotificationsPage() {
  return <ExpertNotifications />;
}
