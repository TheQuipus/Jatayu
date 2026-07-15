import type { Metadata } from "next";
import AdminExpertProfile from "@/components/admin/expert-profile/AdminExpertProfile";
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
    title: `${appId} Expert Profile — Jatayu Admin`,
    description: "Review expert profile details for admin approval.",
  };
}

export default async function AdminExpertProfilePage({ params }: PageProps) {
  const { appId } = await params;
  return <AdminExpertProfile appId={appId} />;
}
