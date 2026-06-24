import Image from "next/image";
import styles from "./Benefits.module.css";
import HeroLines from "../ui/HeroLines";

const partnerLogos = [
  "◈ Startup & Fundraising",
  "▣ Career & Jobs",
  "◳ Legal & Compliance",
  "◩ Tax & Finance",
  "▢ Education & Admissions",
  "◈ SMB Growth",
  "▣ Creator Access",
  "◳ Enterprise Learning",
];

export default function Benefits() {
  return (
    <>
      <section className={styles.benefits}>
        <div className="container">
          <div className={styles.benefitsHead}>
            <span className="eyebrow eyebrow--light">
              <i className="dot"></i>07&nbsp;&nbsp;benefits
            </span>
            <h2 className={`display ${styles.benefitsTitle}`}>
              <span className="t-dark">
                <span className={styles.titleLeadNoWrap}>Expert advice</span>
                <br />
                <span className={styles.titleLineNoWrap}>should not be</span>
                <br />
                <span className="t-muted">a luxury.</span>
              </span>
            </h2>
            <div className={styles.benefitsLines} aria-hidden="true">
              <Image
                src="/assets/whitelines.svg"
                alt=""
                width={26}
                height={146}
              />
            </div>
            <div className={styles.benefitsRuleRow}>
              <span className={styles.benefitsRule}></span>
            </div>
            <p className={styles.benefitsDesc}>
              Jatayu makes professional guidance accessible
              through <br />
              affordable micro-consultations, while allowing users to <br />
              upgrade into deeper expert relationships when needed.
            </p>
          </div>

          <div className={styles.benefitsGrid}>
            <div className={styles.bcard}>
              <div className={styles.bcardPortrait}>
                <div className={styles.bcardOffer}>
                  <div className={styles.bcardOfferHead}>
                    <p className={styles.bcardOfferPrice}>From ₹49</p>
                    <p className={styles.bcardOfferType}>Micro-Consultation</p>
                  </div>
                  <p className={styles.bcardOfferDesc}>
                    Best for quick questions and first-time guidance.
                  </p>
                </div>
                <div className={`${styles.bcardImg} ${styles.bcardImgTall}`}>
                  <Image
                    src="/assets/img/benefits-woman.png"
                    alt="Woman using app"
                    width={440}
                    height={560}
                    className={styles.bcardImgEl}
                    sizes="(max-width: 1024px) 100vw, 25vw"
                  />
                </div>
              </div>
            </div>
            <div className={styles.benefitsRightCol}>
              <div className={styles.bcard}>
                <div className={styles.bcardBrands}>
                  <h3>Premium Expert Access</h3>
                  <p>For founders, SMBs, and high-value <br />professional needs.</p>
                </div>
                <div className={styles.bcardImg}>
                  <Image
                    src="/assets/img/benefits-ai.png"
                    alt="Creative AI visuals"
                    width={457}
                    height={349}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
              </div>
              <div className={styles.bcard}>
                <div className={styles.bcardMotion}>
                  <h3>Standard Consultation</h3>
                  <p>Flexible pricing for detailed advice, planning, and decision support.</p>
                  <div className={`${styles.bcardImg} ${styles.bcardImgWide}`}>
                    <Image
                      src="/assets/img/benefits-gallery.png"
                      alt="Branding gallery assets"
                      width={512}
                      height={286}
                      style={{ width: "100%", height: "auto" }}
                    />
                  </div>
                </div>
                <div className={styles.bcardBeyond}>
                  <h3>Enterprise Access</h3>
                  <p>For HR, L&D, and organizations.</p>
                </div>
              </div>
              <div className={styles.benefitsFoot}>
                <div className={styles.benefitsFootMain}>
                  <div className={styles.avatars}>
                    <Image src="/assets/img/avatar1.png" alt="Avatar 1" width={38} height={38} />
                    <Image src="/assets/img/avatar2.png" alt="Avatar 2" width={38} height={38} />
                    <Image src="/assets/img/avatar3.png" alt="Avatar 3" width={38} height={38} />
                  </div>
                  <div className={styles.benefitsFootRating}>
                    <span className={styles.stars}>★★★★★</span>
                    <span className={styles.benefitsClients}>200+ Satisfied clients</span>
                  </div>
                </div>
                <div className={styles.logos} aria-hidden="true">
                  <div className={styles.logosTrack}>
                    {[...partnerLogos, ...partnerLogos].map((logo, index) => (
                      <span key={`${logo}-${index}`}>{logo}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <HeroLines rotate180 />
    </>
  );
}
