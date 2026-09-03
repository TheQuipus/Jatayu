import type { Metadata } from "next";
import DemoActiveVideoRoom from "@/components/demo/DemoActiveVideoRoom";

export const metadata: Metadata = {
  title: "Expert Active Video Room Demo — Jatayu",
  description: "Live interactive demo screen of 1:1 active video consultation for Experts.",
};

export default function ExpertVideoDemoPage() {
  return (
    <main>
      <DemoActiveVideoRoom initialRole="expert" />
    </main>
  );
}
