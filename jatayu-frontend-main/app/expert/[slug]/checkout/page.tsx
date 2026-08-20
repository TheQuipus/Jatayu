import type { CSSProperties, ReactNode } from "react";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import Checkout from "@/components/checkout/Checkout";
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

type CheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return featuredExperts.map((expert) => ({
    slug: expertSlug(expert.name),
  }));
}

export async function generateMetadata({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const expert = (await getPublicExpert(slug)) ?? getExpertBySlug(slug);

  if (!expert) {
    return {
      title: "Checkout — Jatayu",
    };
  }

  return {
    title: `Checkout — ${expert.name} — Jatayu`,
    description: `Book a consultation with ${expert.name}`,
  };
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { slug } = await params;
  const expert = (await getPublicExpert(slug)) ?? getExpertBySlug(slug);

  if (!expert) {
    notFound();
  }

  return (
    <main id="checkout">
      <SectionWithGrid color="#fff">
        <Suspense>
          <Checkout expert={expert} />
        </Suspense>
      </SectionWithGrid>
      <SectionWithGrid color="#17191E">
        <Footer />
      </SectionWithGrid>
    </main>
  );
}
