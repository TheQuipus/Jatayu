import type { Metadata } from "next";
import ExpertMessages from "@/components/expert/messages/ExpertMessages";

export const metadata: Metadata = {
  title: "Messages — Expertjourney 2",
  description: "Postlogin expert messages dashboard for client conversations and active session details.",
};

export default function ExpertMessagesPage() {
  return <ExpertMessages />;
}
