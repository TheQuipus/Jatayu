import type { Metadata } from "next";
import ApplicationReview from "@/components/admin/review/ApplicationReview";
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
    title: `${appId} Review — Jatayu Admin`,
    description: "Review expert application details and documents.",
  };
}

export default async function ApplicationReviewPage({ params }: PageProps) {
  const { appId } = await params;
  return <ApplicationReview appId={appId} />;
}
