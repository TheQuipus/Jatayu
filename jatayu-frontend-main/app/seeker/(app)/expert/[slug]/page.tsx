import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ExpertDetail from "@/components/expert/ExpertDetail";
import RelatedExperts from "@/components/expert/RelatedExperts";
import { getPublicExpert } from "@/lib/api";
import {
  expertSlug,
  featuredExperts,
  getExpertBySlug,
} from "@/lib/experts";

type SectionWithGridProps = {
  color: string;
  bg?: string;
  children: ReactNode;
};

function SectionWithGrid({ color, children }: SectionWithGridProps) {
  const sectionStyle = { "--section-grid-line-color": color } as CSSProperties;

  return (
    <div className="section-grid-wrap" style={sectionStyle}>
      <div className="section-grid-lines" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      {children}
    </div>
  );
}

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
  const expert = (await getPublicExpert(slug)) ?? getExpertBySlug(slug);

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
  const expert = (await getPublicExpert(slug)) ?? getExpertBySlug(slug);

  if (!expert) {
    notFound();
  }

  return (
    <main id="expert-detail-seeker">
      <SectionWithGrid color="#fff">
        <ExpertDetail expert={expert} seeker />
      </SectionWithGrid>
      <SectionWithGrid color="#17191E">
        <RelatedExperts expert={expert} seeker />
      </SectionWithGrid>
    </main>
  );
}
