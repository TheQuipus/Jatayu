import type { Metadata } from "next";
import ExpertRequestDetail from "@/components/expert/requests/ExpertRequestDetail";

export const metadata: Metadata = {
  title: "Request Details — Jatayu Expert",
  description: "View and respond to client session requests.",
};

export function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }];
}

export default async function RequestDynamicDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const resolvedParams = await params;
  return <ExpertRequestDetail requestId={resolvedParams.id} />;
}
