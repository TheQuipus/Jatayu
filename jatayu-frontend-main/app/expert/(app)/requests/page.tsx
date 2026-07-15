import type { Metadata } from "next";
import ExpertRequests from "@/components/expert/requests/ExpertRequests";

export const metadata: Metadata = {
  title: "Client Requests — Jatayu Expert",
  description: "Manage incoming session and consultation requests.",
};

export default function ExpertRequestsPage() {
  return <ExpertRequests />;
}
