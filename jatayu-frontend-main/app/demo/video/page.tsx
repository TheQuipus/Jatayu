import type { Metadata } from "next";
import DemoActiveVideoRoom from "@/components/demo/DemoActiveVideoRoom";

export const metadata: Metadata = {
  title: "Active Video Consultation Demo — Jatayu",
  description: "Interactive demo screen of 1:1 active video consultation for both Seeker and Expert.",
};

export default function GeneralVideoDemoPage() {
  return (
    <main>
      <DemoActiveVideoRoom initialRole="seeker" />
    </main>
  );
}
