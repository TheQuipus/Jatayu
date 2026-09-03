import type { Metadata } from "next";
import DemoActiveVideoRoom from "@/components/demo/DemoActiveVideoRoom";

export const metadata: Metadata = {
  title: "Seeker Active Video Room Demo — Jatayu",
  description: "Live interactive demo screen of 1:1 active video consultation for Seekers.",
};

export default function SeekerVideoDemoPage() {
  return (
    <main>
      <DemoActiveVideoRoom initialRole="seeker" />
    </main>
  );
}
