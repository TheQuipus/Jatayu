"use client";

import styles from "./ConferenceLanding.module.css";
import { useEffect, useRef } from "react";

const AVATARS = [
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958ab03c92db0829d26ed_1.avif",
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958ab23bab49830b3423f_2.avif",
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958ab4ab329c4fcfccea8_3.avif",
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958f55e3a1a63d1bd0ef0_4.avif",
];

export default function ConferenceLanding() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const bottomBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const scrollWrap = scrollWrapRef.current;
    const bottomBox = bottomBoxRef.current;
    if (!section || !scrollWrap || !bottomBox) return;

    const items = Array.from(scrollWrap.querySelectorAll<HTMLElement>(`.${styles.animationItem}`));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateRotation = () => {
      // Crowdix advances the ring by 90 degrees over one viewport of scroll.
      // The motion is intentionally clamped so the carousel settles after the
      // hero has passed, instead of continuing to spin through the page.
      const progress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      const sharedRotation = reduceMotion.matches ? 0 : 77.65 + progress * 102.35;

      items.forEach((item, index) => {
        if (index === 0) return;
        item.style.transform = `translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(${sharedRotation + index * 30}deg) rotateZ(0deg) skew(0deg, 0deg)`;
      });
    };

    scrollWrap.style.opacity = "1";
    bottomBox.style.opacity = "1";
    updateRotation();
    window.addEventListener("scroll", updateRotation, { passive: true });
    window.addEventListener("resize", updateRotation);

    return () => {
      window.removeEventListener("scroll", updateRotation);
      window.removeEventListener("resize", updateRotation);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} data-nav-surface="dark">
      {/* Decorative vertical lines */}
      <div className={styles.linesBox} aria-hidden="true">
        <div />
        <div className={styles.line} />
        <div className={styles.line} />
        <div className={styles.line} />
        <div className={styles.line} />
        <div />
      </div>

      {/* Hero text */}
      <div className={styles.heroContent}>
        <p className={styles.heroSubtitle}>You are Invited To Our Annual</p>
        <h1 className={styles.heroTitle}>Expert Conference</h1>
      </div>

      {/* scroll-wrap — exact reference structure */}
      <div ref={scrollWrapRef} className={styles.scrollWrap} style={{ opacity: 0 }}>
        <div className={styles.rotationCircleWrap}>
          <div className={styles.rotationCircleBox}>
            {/* animation-box is the perspective + rotation hub */}
            <div className={styles.animationBox}>

              {/* Item 0 — 0° (default, no extra class) */}
              <div className={styles.animationItem}>
                <div className={`${styles.animationImageBox} ${styles.imageBoxLeft}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a561d3b0a89c5a9a425121_Skyscraper%20in%20the%20Clouds.avif"
                    loading="lazy"
                    alt="Modern skyscraper rising above thick clouds under a clear blue sky."
                    className={styles.animationItemImage}
                  />
                </div>
                <div className={`${styles.animationImageBox} ${styles.imageBoxRight}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a5625b1fb7b91637559bd7_Ergonomic%20Office%20Setup.avif"
                    loading="lazy"
                    alt="Black ergonomic office chair positioned next to a white desk with a closed notebook and pen."
                    className={styles.animationItemImage}
                  />
                </div>
              </div>

              {/* Item _01 — 30° */}
              <div className={`${styles.animationItem} ${styles.item01}`}>
                <div className={`${styles.animationImageBox} ${styles.imageBoxLeft}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c8a1123eacc95153428_11.avif"
                    loading="lazy"
                    alt="Smiling man and woman in business attire looking at a display wall in a modern conference or exhibition hall."
                    className={styles.animationItemImage}
                  />
                </div>
                <div className={`${styles.animationImageBox} ${styles.imageBoxRight}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69aa7e65c9f811f0c751fcb0_large-group-people-sitting-listening-speaker-business-conference-modern_660230-114846.avif"
                    loading="lazy"
                    alt="Speaker on stage presenting to a large audience in a modern conference room with blue and purple lighting."
                    className={styles.animationItemImage}
                  />
                </div>
              </div>

              {/* Item _02 — 60° */}
              <div className={`${styles.animationItem} ${styles.item02}`}>
                <div className={`${styles.animationImageBox} ${styles.imageBoxLeft}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c8ad08db77f527b5071_10.avif"
                    loading="lazy"
                    alt="Diverse group of business professionals seated in an audience at a conference."
                    className={styles.animationItemImage}
                  />
                </div>
                <div className={`${styles.animationImageBox} ${styles.imageBoxRight}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c89d9211cd16f2bac36_5.avif"
                    loading="lazy"
                    alt="Focused young man with a beard working on a laptop at a crowded tech event."
                    className={styles.animationItemImage}
                  />
                </div>
              </div>

              {/* Item _03 — 90° */}
              <div className={`${styles.animationItem} ${styles.item03}`}>
                <div className={`${styles.animationImageBox} ${styles.imageBoxLeft}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c8aac31045842a5779f_9.avif"
                    loading="lazy"
                    alt="Man in a suit seen from behind giving a presentation in a dimly lit conference room."
                    className={styles.animationItemImage}
                  />
                </div>
                <div className={`${styles.animationImageBox} ${styles.imageBoxRight}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c864553329dee4647b0_3.avif"
                    loading="lazy"
                    alt="Business professional speaking with a microphone in front of a seated audience."
                    className={styles.animationItemImage}
                  />
                </div>
              </div>

              {/* Item _04 — 120° */}
              <div className={`${styles.animationItem} ${styles.item04}`}>
                <div className={`${styles.animationImageBox} ${styles.imageBoxLeft}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c8afb8ff0d0084231d2_8.avif"
                    loading="lazy"
                    alt="Group of business professionals networking at a conference."
                    className={styles.animationItemImage}
                  />
                </div>
                <div className={`${styles.animationImageBox} ${styles.imageBoxRight}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c8673c2575fb161d76b_2.avif"
                    loading="lazy"
                    alt="Man in a gray suit speaking on stage to a seated audience at a seminar."
                    className={styles.animationItemImage}
                  />
                </div>
              </div>

              {/* Item _05 — 150° */}
              <div className={`${styles.animationItem} ${styles.item05}`}>
                <div className={`${styles.animationImageBox} ${styles.imageBoxLeft}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c8a659a4a4dfabff4a3_7.avif"
                    loading="lazy"
                    alt="Businessman standing with a laptop leading a meeting with colleagues around a table."
                    className={styles.animationItemImage}
                  />
                </div>
                <div className={`${styles.animationImageBox} ${styles.imageBoxRight}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c86a55cbce419df0a1c_1.avif"
                    loading="lazy"
                    alt="Diverse group of professionals seated and taking notes during a conference or seminar."
                    className={styles.animationItemImage}
                  />
                </div>
              </div>

              {/* Item _06 — 180° */}
              <div className={`${styles.animationItem} ${styles.item06}`}>
                <div className={`${styles.animationImageBox} ${styles.imageBoxLeft}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a69c89a80bfede8cefad9d_6.avif"
                    loading="lazy"
                    alt="Young woman in a blue blazer smiling and clapping while seated in an audience."
                    className={styles.animationItemImage}
                  />
                </div>
                <div className={`${styles.animationImageBox} ${styles.imageBoxRight}`}>
                  <img
                    src="https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/69a56370d53bea1444372e7e_Team%20Collaboration%20Meeting.avif"
                    loading="lazy"
                    alt="Seven diverse professionals collaborating around a white table with a laptop in a modern office setting."
                    className={styles.animationItemImage}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom info bar */}
      <div ref={bottomBoxRef} className={`container ${styles.heroBottomBox}`} style={{ opacity: 0 }}>
        <div className={styles.heroInfoBox}>
          <div className={styles.heroInfo}>
            <p className={styles.infoTitle}>When?</p>
            <p className={styles.infoText}>
              Dec 24 2026
              <br />
              08:00 AM
            </p>
          </div>
          <div className={styles.heroInfo}>
            <p className={styles.infoTitle}>Where?</p>
            <p className={styles.infoText}>
              Mumbai, India
              <br />
              Bandra Kurla Complex
            </p>
          </div>
        </div>

        <div className={styles.heroBtnBox}>
          <a href="#Event-Section" className={styles.primaryBtn}>
            <span>View Agenda</span>
            <span className={styles.btnArrow}>→</span>
          </a>
        </div>

        <div className={styles.heroAuthorWrap}>
          <div className={styles.heroAuthorBox}>
            {AVATARS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="Conference participant"
                className={styles.authorImg}
                loading="lazy"
              />
            ))}
          </div>
          <p className={styles.authorText}>More than 5,000 participants</p>
        </div>
      </div>
    </section>
  );
}
