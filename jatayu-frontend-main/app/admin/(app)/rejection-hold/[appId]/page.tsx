import type { Metadata } from "next";
import { Suspense } from "react";
import RejectionHoldHandling from "@/components/admin/rejection-hold/RejectionHoldHandling";
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
    title: `${appId} Rejection & Hold — Jatayu Admin`,
  };
}

export default async function RejectionHoldPage({ params }: PageProps) {
  const { appId } = await params;
  return (
    <Suspense>
      <RejectionHoldHandling appId={appId} />
    </Suspense>
  );
}
