import type { CSSProperties, ReactNode } from "react";
import Bookmark from "@/components/bookmark/Bookmark";
import Contact from "@/components/ui/Contact";
import Footer from "@/components/ui/Footer";

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

export default function BookmarkPage() {
  return (
    <main id="bookmark">
      <SectionWithGrid color="#ffffff"><Bookmark /></SectionWithGrid>
      <SectionWithGrid color="#FF551D"><Contact /></SectionWithGrid>
      <SectionWithGrid color="#17191E"><Footer /></SectionWithGrid>
    </main>
  );
}
