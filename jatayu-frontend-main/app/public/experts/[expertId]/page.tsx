import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import ExpertDetail from "@/components/expert/ExpertDetail";
import RelatedExperts from "@/components/expert/RelatedExperts";
import Contact from "@/components/ui/Contact";
import Footer from "@/components/ui/Footer";
import { getPublicExpert } from "@/lib/api";
import { getExpertById } from "@/lib/experts";

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

type PublicExpertPageProps = {
  params: Promise<{ expertId: string }>;
};

export async function generateMetadata({ params }: PublicExpertPageProps) {
  const { expertId } = await params;
  const expert = (await getPublicExpert(expertId)) ?? getExpertById(expertId);

  if (!expert) {
    return {
      title: "Expert not found — Jatayu",
    };
  }

  return {
    title: `${expert.name} — Jatayu Expert Profile`,
    description: expert.desc,
  };
}

export default async function PublicExpertDetailPage({ params }: PublicExpertPageProps) {
  const { expertId } = await params;
  const expert = (await getPublicExpert(expertId)) ?? getExpertById(expertId);

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
