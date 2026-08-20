import styles from "./Hero.module.css";
import ContactActionButton from "../ui/ContactActionButton";
import HeroStats from "./HeroStats";
import { JOIN_AS_EXPERT_HREF } from "@/lib/joinAsExpertNav";

export default function Hero() {
  return (
    <>
      <section className={styles.hero} data-nav-surface="dark">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroLeft}>
            <p className={styles.heroTagline}>
              <span className={styles.taglineOrange}>REAL EXPERTS.</span>
              <br />
              REAL GUIDANCE.<br />
              <span className={styles.taglineGreen}>REAL LIFE DECISIONS.</span>
            </p>

            <p className={styles.heroNote}>
              Because sometimes, you do not need <br/>another AI answer. You need a trusted <br/>human who understands your world.
            </p>
          </div>

          <h1 className={styles.heroTitle}>
            <span className="t-white">human</span>
            <span className="t-white">wisdom</span>
            <span className="t-muted">for indian</span>
            <span className="t-muted">decisions.</span>
          </h1>

          <div className={styles.heroAsideAnchor}>
            <div className={styles.heroAside}>
              <p className={styles.heroIntro}>
                From career confusion to business decisions, legal questions, startup advice, finance clarity, and mentorship, Jatayu connects you with verified experts across India in your language, starting from just ₹49.
              </p>

              <HeroStats />
            </div>
          </div>

          <div className={styles.heroJoinCta}>
            <ContactActionButton
              wrapperClassName={styles.heroActionBtnWrap}
              className={styles.heroJoinBtn}
              label="JOIN AS EXPERT"
              avatarSrc="/assets/expertbutton.svg"
              avatarAlt="Expert"
              href={JOIN_AS_EXPERT_HREF}
              fullWidth
            />
          </div>

          <div className={styles.heroCta}>
            <ContactActionButton
              wrapperClassName={styles.heroActionBtnWrap}
              className={styles.heroCtaBtn}
              label="Find an expert"
              avatarSrc="/assets/seekerbutton.svg"
              avatarAlt=""
              href="/expert/#from-home"
              variant="dark"
              fullWidth
            />
          </div>

          <span className={`${styles.heroBar} ${styles.heroBarOrange}`}></span>
          <span className={`${styles.heroBar} ${styles.heroBarGreen}`}></span>
        </div>
      </section>
    </>
  );
}
