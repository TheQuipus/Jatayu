import ContactActionButton from "../ui/ContactActionButton";
import styles from "./Trust.module.css";
import HeroLines from "../ui/HeroLines";
import { JOIN_AS_EXPERT_HREF } from "@/lib/joinAsExpertNav";

const trustItems = [
  {
    num: "001",
    title: "Verified Expert Profiles",
    desc: "Credentials, experience, expertise areas, languages, and consultation formats are clearly visible."
  },
  {
    num: "002",
    title: "Ratings and Reviews",
    desc: "Users can evaluate experts based on real consultation experiences."
  },
  {
    num: "003",
    title: "Quality Assurance",
    desc: "Jatayu monitors quality signals to protect users and maintain marketplace trust."
  },
  {
    num: "004",
    title: "Transparent Pricing",
    desc: "You know what you are paying before booking every element for consistency, coherence, and lasting impact."
  },
  {
    num: "005",
    title: "India-First Support",
    desc: "Built around local languages, payment behavior, affordability, and mobile-first usage."
  }
];

export default function Trust() {
  return (
    <>    <HeroLines />
      <section className={styles.trust}>
        <div className={`container ${styles.trustInner}`}>
          <div className={styles.trustLeft}>
            <span className="eyebrow eyebrow--light">
              <i className="dot"></i>Join Us Now
            </span>

            <h2 className={`display ${styles.trustTitle}`}>
              <span className="t-dark">Trust is not a feature.</span>
              <br />
              <span className="t-muted">It is the foundation.</span>
            </h2>

            <div className={styles.trustCtaWrap}>
              <ContactActionButton
                wrapperClassName={styles.trustActionBtnWrap}
                className={styles.trustCtaBtn}
                label="FIND AN EXPERT"
                avatarSrc="/assets/seekerbutton.svg"
                avatarAlt="Seeker"
                variant="dark"
                type="button"
                fullWidth
              />
            </div>

            <div className={styles.trustJoinCta}>
              <ContactActionButton
                wrapperClassName={styles.trustActionBtnWrap}
                className={styles.trustJoinBtn}
                label="JOIN AS EXPERT"
                avatarSrc="/assets/expertbutton.svg"
                avatarAlt="Expert"
                href={JOIN_AS_EXPERT_HREF}
                fullWidth
              />
            </div>
          </div>

          <ul className={styles.trustList}>
            {trustItems.map((item) => (
              <li key={item.num} className={styles.trustCard}>
                <div className={styles.cardTop}>
                  <span className={styles.cardNum}>
                    <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
                    {item.num}
                  </span>
                  <span className={styles.cardRule}></span>
                </div>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardDesc}>{item.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
