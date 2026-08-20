import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import ExpertDetail from "@/components/expert/ExpertDetail";
import RelatedExperts from "@/components/expert/RelatedExperts";
import Contact from "@/components/ui/Contact";
import Footer from "@/components/ui/Footer";
import { getPublicExpert } from "@/lib/api";
import {
  expertSlug,
  featuredExperts,
  getExpertBySlug,
} from "@/lib/experts";

type SectionWithGridProps = {
  color: string;
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

type ExpertDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return featuredExperts.map((expert) => ({
    slug: expertSlug(expert.name),
  }));
}

export async function generateMetadata({ params }: ExpertDetailPageProps) {
  const { slug } = await params;
  const expert = (await getPublicExpert(slug)) ?? getExpertBySlug(slug);

  if (!expert) {
    return {
      title: "Expert not found — Jatayu",
    };
  }

  return {
    title: `${expert.name} — Jatayu Expert`,
    description: expert.desc,
  };
}

export default async function ExpertDetailPage({ params }: ExpertDetailPageProps) {
  const { slug } = await params;
  const expert = (await getPublicExpert(slug)) ?? getExpertBySlug(slug);

  if (!expert) {
    notFound();
  }

  return (
    <main id="expert-detail">
      <SectionWithGrid color="#fff">
        <ExpertDetail expert={expert} />
      </SectionWithGrid>
      <SectionWithGrid color="#17191E">
        <RelatedExperts expert={expert} />
      </SectionWithGrid>
      <SectionWithGrid color="#FF551D">
        <Contact />
      </SectionWithGrid>
      <SectionWithGrid color="#17191E">
        <Footer />
      </SectionWithGrid>
    </main>
  );
}
