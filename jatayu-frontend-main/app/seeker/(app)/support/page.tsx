import { Suspense } from "react";
import type { Metadata } from "next";
import MySupportTickets from "@/components/support/MySupportTickets";

export const metadata: Metadata = {
  title: "Support Tickets — Jatayu",
  description: "Track your support requests, issues, and replies.",
};

export default function SeekerSupportPage() {
  return (
    <Suspense
      fallback={
        <section style={{ padding: "25px 0 80px", width: "100%" }}>
          <div className="container">
            <div
              style={{
                width: "100%",
                height: 120,
                background: "var(--mercury, #e2e8f0)",
                borderRadius: 12,
              }}
            />
          </div>
        </section>
      }
    >
      <MySupportTickets />
    </Suspense>
  );
}
