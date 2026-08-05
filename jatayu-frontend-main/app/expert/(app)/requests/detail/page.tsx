import type { Metadata } from "next";
import ExpertRequestDetail from "@/components/expert/requests/ExpertRequestDetail";

export const metadata: Metadata = {
  title: "Request Details — Product Strategy Workshop — Jatayu Expert",
  description: "View and respond to client session requests.",
};

export default function RequestDetailPage() {
  return <ExpertRequestDetail />;
}
