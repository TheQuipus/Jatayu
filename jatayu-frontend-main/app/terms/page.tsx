import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/ui/Footer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Terms of Service — Jatayu",
  description: "Read the Terms of Service for using the Jatayu platform.",
};

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

export default function TermsPage() {
  return (
    <main id="terms-page">
      <SectionWithGrid color="#FFFFFF">
        <section className={styles.sectionContainer} data-nav-surface="light">
          <div className="container">
            <div className={styles.contentWrapper}>
              <header className={styles.header}>
                <span className={styles.badge}>Legal</span>
                <h1 className={styles.title}>Terms of Service</h1>
                <p className={styles.updated}>Last updated: January 2026</p>
              </header>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Introduction & Agreement</h2>
                <p className={styles.paragraph}>
                  Welcome to Jatayu. By accessing or using our platform, mobile applications, or related services (collectively, &quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). Please read them carefully before creating an account or booking consultations.
                </p>
                <p className={styles.paragraph}>
                  If you do not agree to these Terms, you may not access or use Jatayu.
                </p>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Account Registration & Responsibilities</h2>
                <p className={styles.paragraph}>
                  To access certain features of Jatayu (as a Seeker or Expert), you must register for an account. You agree to provide accurate, complete, and updated information during registration and maintain the confidentiality of your account credentials.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>You are responsible for all activities that occur under your account.</li>
                  <li className={styles.listItem}>You must notify Jatayu immediately of any unauthorized use or security breach.</li>
                  <li className={styles.listItem}>Accounts are non-transferable and may not be shared across individuals.</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>3. Consultations & Services</h2>
                <p className={styles.paragraph}>
                  Jatayu acts as a platform connecting Seekers with verified Experts for 1:1 Video Calls, Text Messaging, Video Shoutouts, and Live Chat sessions.
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}><strong>Expert Guidance:</strong> Opinions and recommendations provided by Experts are their own and do not constitute formal legal, medical, or financial advice unless explicitly governed by professional regulations.</li>
                  <li className={styles.listItem}><strong>Pricing & Payments:</strong> Consultation rates are specified on the Expert’s profile or at checkout. All payments are processed securely via verified payment gateways (e.g. Razorpay).</li>
                  <li className={styles.listItem}><strong>Cancellations & Refunds:</strong> Cancellation and refund policies apply based on session scheduling and format guidelines.</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>4. User Code of Conduct</h2>
                <p className={styles.paragraph}>
                  Users (both Seekers and Experts) agree to interact respectfully and professionally at all times. The following behaviors are strictly prohibited:
                </p>
                <ul className={styles.list}>
                  <li className={styles.listItem}>Harassment, abusive language, discrimination, or hate speech.</li>
                  <li className={styles.listItem}>Sharing illegal, fraudulent, or offensive content.</li>
                  <li className={styles.listItem}>Attempting to bypass Jatayu’s payment or booking system to conduct off-platform transactions.</li>
                </ul>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>5. Intellectual Property</h2>
                <p className={styles.paragraph}>
                  All trademarks, logos, content, software, and design elements on Jatayu are the exclusive property of Jatayu or its licensors. You may not copy, modify, distribute, or reverse engineer any part of our platform without prior written consent.
                </p>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>6. Limitation of Liability</h2>
                <p className={styles.paragraph}>
                  To the maximum extent permitted by applicable law, Jatayu shall not be liable for any indirect, incidental, special, or consequential damages resulting from your use or inability to use our Services, or from any interactions between Seekers and Experts.
                </p>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>7. Modifications & Termination</h2>
                <p className={styles.paragraph}>
                  We reserve the right to modify these Terms at any time. Material changes will be posted on this page with an updated revision date. Continued use of Jatayu following changes constitutes acceptance of the updated Terms.
                </p>
              </section>

              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>8. Contact & Support</h2>
                <p className={styles.paragraph}>
                  If you have questions or concerns regarding these Terms, please reach out to our legal and support team at{" "}
                  <a href="mailto:support@jatayu.in" className={styles.link}>
                    support@jatayu.in
                  </a>.
                </p>
              </section>

              <footer className={styles.footerNote}>
                <p>
                  Also review our{" "}
                  <Link href="/privacy" className={styles.link}>
                    Privacy Policy
                  </Link>{" "}
                  to understand how we collect and safeguard your personal data.
                </p>
              </footer>
            </div>
          </div>
        </section>
      </SectionWithGrid>
      <SectionWithGrid color="#17191E">
        <Footer />
      </SectionWithGrid>
    </main>
  );
}
