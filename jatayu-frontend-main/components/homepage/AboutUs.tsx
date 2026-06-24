import styles from "./AboutUs.module.css";
import PrimaryButton from "../ui/PrimaryButton";

const features = [
  {
    title: "₹49 Micro-Consultations",
    desc: "Make expert advice affordable for students, professionals, founders, and SMB owners."
  },
  {
    title: "10-Language Support",
    desc: "Serve Bharat, not just metro India."
  },
  {
    title: "Expert Verification Pipeline",
    desc: "Build confidence before users spend time or money."
  },
  {
    title: "WhatsApp-Native UX",
    desc: "Easy onboarding and communication through a familiar channel."
  },
  {
    title: "Quality Assurance System",
    desc: "Improve trust, accountability, and repeat usage."
  },
  {
    title: "India-First Payments",
    desc: "Support local payment behavior and affordable pricing."
  },
  {
    title: "Integrated Ticket Marketplace",
    desc: "Enable events, workshops, paid access, and creator-led experiences."
  },
  {
    title: "Startup & Investor Ecosystem",
    desc: "Help founders connect with high-value startup, GTM, legal, and investor expertise."
  }
];

export default function AboutUs() {
  return (
    <>

      <section className={`${styles.aboutUs} dark`} data-nav-surface="dark">
        <div className="container">
          <div className={styles.aboutUsTop}>
            <h2 className={`display ${styles.aboutUsTitle}`}>
              <span className={styles.titleIndia}>Built for India.</span>
              <br />
              <span className="t-white">Built for trust.</span>
              <br />
              <span className={styles.titleAccess}>Built for access.</span>
            </h2>

            <div className={styles.aboutUsCta}>
              <PrimaryButton
                label="Talk with an expert"
                variant="light"
                href="#contact"
                fullWidth
              />
            </div>

            <div className={styles.aboutUsMeta}>
              <span className="eyebrow eyebrow--dark">
                <i className="dot"></i>about us
              </span>
            </div>
          </div>

          <div className={styles.aboutUsDescRow}>
            <p className={styles.aboutUsDesc}>
              Multilingual expert marketplace with affordable micro-consultations, verified professionals, WhatsApp-native onboarding, and integrated knowledge commerce.
            </p>
          </div>

          <div className={styles.aboutUsRuleRow}>
            <div className={styles.aboutUsRule}></div>
          </div>

          <ul className={styles.featureGrid}>
            {features.map((item) => (
              <li key={item.title} className={styles.featureCard}>
                <h3 className={styles.featureTitle}>{item.title}</h3>
                <p className={styles.featureDesc}>{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
