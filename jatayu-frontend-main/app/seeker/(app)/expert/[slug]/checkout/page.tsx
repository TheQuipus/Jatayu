import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Checkout from "@/components/checkout/Checkout";
import {
  expertSlug,
  featuredExperts,
  getExpertBySlug,
} from "@/lib/experts";

type SeekerCheckoutPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return featuredExperts.map((expert) => ({
    slug: expertSlug(expert.name),
  }));
}

export async function generateMetadata({ params }: SeekerCheckoutPageProps) {
  const { slug } = await params;
  const expert = getExpertBySlug(slug);

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

export default async function SeekerCheckoutPage({ params }: SeekerCheckoutPageProps) {
  const { slug } = await params;
  const expert = getExpertBySlug(slug);

  if (!expert) {
    notFound();
  }

  return <Checkout expert={expert} seeker />;
}
