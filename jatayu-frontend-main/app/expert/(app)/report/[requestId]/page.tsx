import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExpertReportForm from "./ExpertReportForm";
import ExpertRequestDetail from "@/components/expert/requests/ExpertRequestDetail";
import { getRequestDetailById } from "@/lib/expertRequestDetailStore";
import styles from "./page.module.css";

type ExpertReportPageProps = {
  params: Promise<{ requestId: string }>;
};

export async function generateMetadata({ params }: ExpertReportPageProps): Promise<Metadata> {
  const { requestId } = await params;
  const request = getRequestDetailById(requestId);

  if (!request) {
    return { title: "Report Client — Jatayu Expert" };
  }

  return {
    title: `Report Client ${request.client.name} — Jatayu Expert`,
    description: `File a report regarding client ${request.client.name}.`,
  };
}

export default async function ExpertReportPage({ params }: ExpertReportPageProps) {
  const { requestId } = await params;
  const request = getRequestDetailById(requestId);

  if (!request) {
    notFound();
  }

  return (
    <div style={{ position: "relative" }}>
      <ExpertRequestDetail requestId={requestId} />
      <div className={styles.page}>
        <ExpertReportForm request={request} />
      </div>
    </div>
  );
}
