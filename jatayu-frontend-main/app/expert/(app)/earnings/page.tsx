import type { Metadata } from "next";
import ExpertEarnings from "@/components/expert/earnings/ExpertEarnings";

export const metadata: Metadata = {
  title: "Earnings — Expertjourney 2",
  description: "Financial overview, payouts, and invoices for expert sessions.",
};

export default function ExpertEarningsPage() {
  return <ExpertEarnings />;
}
