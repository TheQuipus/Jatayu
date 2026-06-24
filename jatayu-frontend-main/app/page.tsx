import type { CSSProperties, ReactNode } from "react";
import Hero from "@/components/homepage/Hero";
import Problem from "@/components/homepage/Problem";
import Portfolio from "@/components/homepage/Portfolio";
import Services from "@/components/homepage/Services";
import ExpertAdvice from "@/components/homepage/ExpertAdvice";
import AboutUs from "@/components/homepage/AboutUs";
import Workflow from "@/components/homepage/Workflow";
import Benefits from "@/components/homepage/Benefits";
import Pricing from "@/components/homepage/Pricing";
import Trust from "@/components/homepage/Trust";
import Faq from "@/components/homepage/Faq";
import Insights from "@/components/homepage/Insights";
import Contact from "@/components/ui/Contact";
import Footer from "@/components/ui/Footer";

type SectionWithGridProps = {
  color: string;
  children: ReactNode;
  fadeLines?: boolean;
};

function SectionWithGrid({ color, children, fadeLines = false }: SectionWithGridProps) {
  const sectionStyle = { "--section-grid-line-color": color } as CSSProperties;

  return (
    <div
      className="section-grid-wrap"
      style={sectionStyle}
      data-grid-fade-lines={fadeLines ? "true" : undefined}
    >
      <div className="section-grid-lines" aria-hidden="true">
        <span></span><span></span><span></span><span></span><span></span>
      </div>
      {children}
    </div>
  );
}

export default function Home() {
  return (
    <main id="top">
      <SectionWithGrid color="#17191E" fadeLines><Hero /></SectionWithGrid>
      <SectionWithGrid color="#fff"><Problem /></SectionWithGrid>
      <SectionWithGrid color="#fff"><Portfolio /></SectionWithGrid>
      <SectionWithGrid color="#17191E"><Services /></SectionWithGrid>
      <SectionWithGrid color="#17191E"><ExpertAdvice /></SectionWithGrid>
      <SectionWithGrid color="#fff"><Trust /></SectionWithGrid>
      <SectionWithGrid color="#fff"><Benefits /></SectionWithGrid>
      <SectionWithGrid color="#17191E"><AboutUs /></SectionWithGrid>
      <SectionWithGrid color="#fff"><Pricing /></SectionWithGrid>
      <SectionWithGrid color="#17191E"><Workflow /></SectionWithGrid>
      <SectionWithGrid color="#fff"><Faq /></SectionWithGrid>
      <SectionWithGrid color="#fff"><Insights /></SectionWithGrid>
      <SectionWithGrid color="#FF551D"><Contact /></SectionWithGrid>
      <SectionWithGrid color="#17191E"><Footer /></SectionWithGrid>
    </main>
  );
}
