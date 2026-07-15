import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExpertDetail from "@/components/expert/ExpertDetail";
import RelatedExperts from "@/components/expert/RelatedExperts";
import {
  expertSlug,
  featuredExperts,
  getExpertBySlug,
} from "@/lib/experts";

type SeekerExpertPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return featuredExperts.map((expert) => ({
    slug: expertSlug(expert.name),
  }));
}

export async function generateMetadata({ params }: SeekerExpertPageProps) {
  const { slug } = await params;
  const expert = getExpertBySlug(slug);

  if (!expert) {
    return {
      title: "Expert not found — Jatayu",
    };
  }

  return {
    title: `${expert.name} — Jatayu`,
    description: expert.desc,
  };
}

export default async function SeekerExpertPage({ params }: SeekerExpertPageProps) {
  const { slug } = await params;
  const expert = getExpertBySlug(slug);

  if (!expert) {
    notFound();
  }

  return (
    <>
      <ExpertDetail expert={expert} seeker />
      <RelatedExperts expert={expert} seeker />
    </>
  );
}
