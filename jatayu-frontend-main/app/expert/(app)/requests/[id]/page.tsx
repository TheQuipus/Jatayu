import type { Metadata } from "next";
import ExpertRequestDetail from "@/components/expert/requests/ExpertRequestDetail";

export const metadata: Metadata = {
  title: "Request Details — Jatayu Expert",
  description: "View and respond to client session requests.",
};

export default function RequestDynamicDetailPage() {
  return <ExpertRequestDetail />;
}
