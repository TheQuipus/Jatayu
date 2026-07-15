import type { Metadata } from "next";
import ApprovalConfirmation from "@/components/admin/approval/ApprovalConfirmation";
import { getAdminAppStaticParams } from "@/lib/adminStaticParams";

type PageProps = {
  params: Promise<{ appId: string }>;
};

export function generateStaticParams() {
  return getAdminAppStaticParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { appId } = await params;
  return {
    title: `${appId} Approval — Jatayu Admin`,
    description: "Final approval confirmation for expert account activation.",
  };
}

export default async function ApprovalConfirmationPage({ params }: PageProps) {
  const { appId } = await params;
  return <ApprovalConfirmation appId={appId} />;
}
