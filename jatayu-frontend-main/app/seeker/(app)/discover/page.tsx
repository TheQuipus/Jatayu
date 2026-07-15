import type { Metadata } from "next";
import Expert from "@/components/expert/Expert";

export const metadata: Metadata = {
  title: "Discover Experts — Jatayu",
  description: "Browse verified experts across India.",
};

export default function SeekerDiscoverPage() {
  return <Expert seeker />;
}
