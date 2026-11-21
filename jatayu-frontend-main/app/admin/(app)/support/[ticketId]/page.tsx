import type { Metadata } from "next";
import AdminSupportDetail from "@/components/admin/support/AdminSupportDetail";
import { getAdminSupportTicketStaticParams } from "@/lib/adminStaticParams";

type PageProps = {
  params: Promise<{ ticketId: string }>;
};

export function generateStaticParams() {
  return getAdminSupportTicketStaticParams();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ticketId } = await params;
  return {
    title: `${ticketId} — Support — Jatayu Admin`,
    description: "View support ticket details and reply to the requester.",
  };
}

export default async function AdminSupportDetailPage({ params }: PageProps) {
  const { ticketId } = await params;
  return <AdminSupportDetail ticketId={ticketId} />;
}
