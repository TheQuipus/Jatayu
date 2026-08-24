import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Jatayu",
  description: "Learn how Jatayu collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <main className={styles.contentWrapper}>
        <header className={styles.header}>
          <span className={styles.badge}>Privacy</span>
          <h1 className={styles.title}>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: January 2026</p>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>1. Introduction</h2>
          <p className={styles.paragraph}>
            At Jatayu, protecting your privacy and personal data is a foundational commitment. This Privacy Policy outlines how we collect, process, store, and safeguard information when you visit or interact with our platform and services.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>2. Information We Collect</h2>
          <p className={styles.paragraph}>
            We collect information necessary to provide seamless, secure consultation experiences:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>
              <strong>Account Information:</strong> Name, email address, phone number, profile photo, and role preference.
            </li>
            <li className={styles.listItem}>
              <strong>Expert Profile Data:</strong> Qualifications, employment background, skills, certifications, government ID for verification, and payout preferences.
            </li>
            <li className={styles.listItem}>
              <strong>Session Data:</strong> Booking requests, consultation schedules, message logs, and feedback ratings.
            </li>
            <li className={styles.listItem}>
              <strong>Technical & Usage Data:</strong> IP address, device type, browser, and analytical metrics.
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>3. How We Use Your Information</h2>
          <p className={styles.paragraph}>
            We process your personal data for legitimate business purposes, including:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}>Facilitating bookings, communication, and session delivery between Seekers and Experts.</li>
            <li className={styles.listItem}>Verifying Expert credentials and maintaining quality standards.</li>
            <li className={styles.listItem}>Processing payments and payouts through secure financial gateway partners.</li>
            <li className={styles.listItem}>Improving platform features, security monitoring, and customer support.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>4. Data Sharing & Third Parties</h2>
          <p className={styles.paragraph}>
            We do not sell your personal information to third parties. We share data only in the following necessary contexts:
          </p>
          <ul className={styles.list}>
            <li className={styles.listItem}><strong>With Experts / Seekers:</strong> Relevant profile and session context is shared to facilitate scheduled consultations.</li>
            <li className={styles.listItem}><strong>Service Providers:</strong> Trusted third-party vendors for payment processing (e.g. Razorpay), identity verification, and hosting infrastructure.</li>
            <li className={styles.listItem}><strong>Legal Compliance:</strong> When required by applicable Indian laws, judicial proceedings, or court orders.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>5. Security & Data Retention</h2>
          <p className={styles.paragraph}>
            We implement industry-standard technical and organizational security measures (including SSL encryption and access controls) to protect your personal data from unauthorized access or disclosure.
          </p>
          <p className={styles.paragraph}>
            We retain your data for as long as your account remains active or as required to fulfill legal and accounting obligations.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>6. Your Rights & Choices</h2>
          <p className={styles.paragraph}>
            Depending on your jurisdiction, you have the right to access, update, or request deletion of your personal information. You can manage your profile settings directly or contact our support team to exercise these rights.
          </p>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>7. Contact Us</h2>
          <p className={styles.paragraph}>
            If you have questions about this Privacy Policy or how your data is handled, please contact our Data Protection team at{" "}
            <a href="mailto:privacy@jatayu.in" className={styles.link}>
              privacy@jatayu.in
            </a>.
          </p>
        </section>

        <footer className={styles.footerNote}>
          <p>
            Please also review our{" "}
            <Link href="/terms" className={styles.link}>
              Terms of Service
            </Link>{" "}
            governing your use of Jatayu.
          </p>
        </footer>
      </main>
    </div>
  );
}
