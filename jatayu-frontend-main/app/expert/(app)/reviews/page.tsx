import type { Metadata } from "next";
import ExpertReviews from "@/components/expert/reviews/ExpertReviews";

export const metadata: Metadata = {
  title: "Reviews & Reputation — Expertjourney 2",
  description: "Client feedback, category scores, reputation badges, and performance insights.",
};

export default function ExpertReviewsPage() {
  return <ExpertReviews />;
}
