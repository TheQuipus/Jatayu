"use client";

import styles from "./ConferenceLanding.module.css";
import Link from "next/link";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

const AVATARS = [
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958ab03c92db0829d26ed_1.avif",
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958ab23bab49830b3423f_2.avif",
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958ab4ab329c4fcfccea8_3.avif",
  "https://cdn.prod.website-files.com/6997ed9c377cb53af04778ca/699958f55e3a1a63d1bd0ef0_4.avif",
];

interface CategoryConfig {
  id: string;
  title: string;
  subtext?: string;
  imageSrc: string;
  altText: string;
  href: string;
  icon: (cls?: string) => ReactNode;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  creator: {
    id: "creator",
    title: "Creator",
    subtext: "YOUTUBE CHANNEL",
    imageSrc: "/assets/img/conference/category-creator.jpg?v=2",
    altText: "Charismatic young Indian YouTube creator presenting on stage with glowing YouTube play button screen.",
    href: "/seeker/discover?category=creator",
    icon: (cls) => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="5" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  marketing: {
    id: "marketing",
    title: "Digital Marketing",
    imageSrc: "/assets/img/conference/category-marketing.jpg?v=2",
    altText: "Confident young Indian businesswoman in beige blazer presenting digital marketing analytics on stage.",
    href: "/seeker/discover?category=marketing",
    icon: (cls) => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 11l14-5v12L3 13v-2z" />
        <path d="M11.6 16.8L14 21h3l-2.8-5.6" />
        <path d="M20 8a5 5 0 0 1 0 8" />
      </svg>
    ),
  },
  legal: {
    id: "legal",
    title: "Legal",
    imageSrc: "/assets/img/conference/category-legal.jpg?v=2",
    altText: "Distinguished Indian male lawyer in dark navy suit speaking at wooden podium with Scales of Justice backdrop.",
    href: "/seeker/discover?category=legal",
    icon: (cls) => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 3v18" />
        <path d="M5 6h14" />
        <path d="M5 6l-3 7h6l-3-7z" fill="currentColor" fillOpacity="0.1" />
        <path d="M19 6l-3 7h6l-3-7z" fill="currentColor" fillOpacity="0.1" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  immigration: {
    id: "immigration",
    title: "Immigration",
    imageSrc: "/assets/img/conference/category-immigration.jpg?v=3",
    altText: "Professional Indian immigration consultant speaking on stage with world travel and flight path graphics.",
    href: "/seeker/discover?category=immigration",
    icon: (cls) => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3.5c-.5-.5-2.5 0-4 1.5L13.5 8.5 5.3 6.7c-.8-.2-1.6.2-2 .9l-.5.9 5.8 3.5-3 3-2.1-.6c-.5-.1-1 .1-1.3.5l-.2.3 2.5 1.5 1.5 2.5.3-.2c.4-.3.6-.8.5-1.3l-.6-2.1 3-3 3.5 5.8.9-.5c.7-.4 1.1-1.2.9-2z" />
      </svg>
    ),
  },
  education: {
    id: "education",
    title: "Education",
    imageSrc: "/assets/img/conference/category-education.jpg?v=2",
    altText: "Indian female academic leader presenting at conference with graduation cap motif.",
    href: "/seeker/discover?category=education",
    icon: (cls) => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
  },
  business: {
    id: "business",
    title: "Starting a Business",
    imageSrc: "/assets/img/conference/category-business.jpg?v=3",
    altText: "Energetic Indian startup founder presenting on stage before Build Scale Grow rocket slide.",
    href: "/seeker/discover?category=business",
    icon: (cls) => (
      <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4.5c1.62-1.63 5-2.5 5-2.5" />
        <path d="M15 12v5s3.03-.55 4.5-2c1.63-1.62 2.5-5 2.5-5" />
      </svg>
    ),
  },
};

function CategoryPanel({
  category,
  sideClass,
}: {
  category: CategoryConfig;
  sideClass: string;
}) {
  return (
    <div className={`${styles.animationImageBox} ${sideClass}`}>
      <img
        src={category.imageSrc}
        loading="lazy"
        alt={category.altText}
        className={styles.animationItemImage}
      />
      <div className={styles.categoryOverlay}>
        <Link
          href={category.href}
          className={styles.categoryTertiaryBtn}
          aria-label={`${category.title} Category`}
        >
          <div className={styles.categoryIconWrap} aria-hidden="true">
            {category.icon(styles.categoryIcon)}
          </div>
          <span className={styles.categoryBtnText}>
            <span className={styles.categoryBtnTrack}>
              <span className={styles.categoryBtnUp}>{category.title}</span>
              <span className={styles.categoryBtnUp} aria-hidden="true">
                {category.title}
              </span>
            </span>
          </span>
          {category.subtext && (
            <span className={styles.categorySubtext}>{category.subtext}</span>
          )}
          <span className={styles.categoryAccentBar} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** Set to `true` to restore the When/Where/CTA bottom bar. Carousel does not depend on this. */
const SHOW_HERO_BOTTOM_BAR = false;

export default function ConferenceLanding() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollWrapRef = useRef<HTMLDivElement>(null);
  const bottomBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const scrollWrap = scrollWrapRef.current;
    if (!section || !scrollWrap) return;

    const bottomBox = bottomBoxRef.current;
    const items = Array.from(scrollWrap.querySelectorAll<HTMLElement>(`.${styles.animationItem}`));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updateScale = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth < 1024) {
        scrollWrap.style.removeProperty("--carousel-scale");
        return;
      }
      const availW = window.innerWidth * 0.96;
      const availH = window.innerHeight - 165; // room below navbar + heading
      const scaleW = availW / 2650;
      const scaleH = availH / 960;
      const scale = Math.min(scaleW, scaleH);
      scrollWrap.style.setProperty("--carousel-scale", scale.toFixed(4));
    };

    const updateRotation = () => {
      // Crowdix advances the ring by 90 degrees over one viewport of scroll.
      // The motion is intentionally clamped so the carousel settles after the
      // hero has passed, instead of continuing to spin through the page.
      const progress = Math.min(1, Math.max(0, window.scrollY / window.innerHeight));
      const sharedRotation = reduceMotion.matches ? 0 : 77.65 + progress * 102.35;

      items.forEach((item, index) => {
        // Item 0 is an unrotated duplicate; keep hidden and non-interactive so it never blocks hover
        if (index === 0) {
          item.style.display = "none";
          item.style.pointerEvents = "none";
          return;
        }

        const rot = sharedRotation + index * 30;
        item.style.transform = `translate3d(0px, 0px, 0px) scale3d(1, 1, 1) rotateX(0deg) rotateY(${rot}deg) rotateZ(0deg) skew(0deg, 0deg)`;

        const rotRad = (rot * Math.PI) / 180;
        const sinVal = Math.sin(rotRad);

        // In the concave amphitheater carousel, cards on the back arc (facing the camera)
        // are the ones the user sees and should interact with.
        // Left card normal points towards camera when sin(rot) < 0.
        // Right card normal points towards camera when sin(rot) > 0.
        // Cards on the front arc (facing away, between camera and carousel center)
        // must have pointer-events: none and visibility: hidden so they never block
        // hover effects and clicks on the visible cards behind them.
        const isLeftFacing = sinVal < 0.05;
        const isRightFacing = sinVal > -0.05;

        const leftCard = item.children[0] as HTMLElement | undefined;
        const rightCard = item.children[1] as HTMLElement | undefined;

        if (leftCard) {
          leftCard.style.pointerEvents = isLeftFacing ? "auto" : "none";
          leftCard.style.visibility = isLeftFacing ? "visible" : "hidden";
        }
        if (rightCard) {
          rightCard.style.pointerEvents = isRightFacing ? "auto" : "none";
          rightCard.style.visibility = isRightFacing ? "visible" : "hidden";
        }
      });
    };

    scrollWrap.style.opacity = "1";
    if (bottomBox) bottomBox.style.opacity = "1";
    updateScale();
    updateRotation();

    const handleResize = () => {
      updateScale();
      updateRotation();
    };

    window.addEventListener("scroll", updateRotation, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", updateRotation);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.section} data-nav-surface="dark">
      {/* Decorative vertical grid lines — behind scroll wrap, pointer-events none */}
      <div
        className="section-grid-lines"
        aria-hidden="true"
        style={{ "--section-grid-line-color": "#17191E" } as CSSProperties}
      >
        <span /><span /><span /><span /><span />
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

              {/* Item 0 — 0° (default, legacy duplicate, hidden so it never blocks hover) */}
              <div className={styles.animationItem} style={{ display: "none", pointerEvents: "none" }}>
                <CategoryPanel category={CATEGORIES.business} sideClass={styles.imageBoxLeft} />
                <CategoryPanel category={CATEGORIES.legal} sideClass={styles.imageBoxRight} />
              </div>

              {/* Item _01 — 30° */}
              <div className={`${styles.animationItem} ${styles.item01}`}>
                <CategoryPanel category={CATEGORIES.business} sideClass={styles.imageBoxLeft} />
                <CategoryPanel category={CATEGORIES.legal} sideClass={styles.imageBoxRight} />
              </div>

              {/* Item _02 — 60° */}
              <div className={`${styles.animationItem} ${styles.item02}`}>
                <CategoryPanel category={CATEGORIES.education} sideClass={styles.imageBoxLeft} />
                <CategoryPanel category={CATEGORIES.marketing} sideClass={styles.imageBoxRight} />
              </div>

              {/* Item _03 — 90° */}
              <div className={`${styles.animationItem} ${styles.item03}`}>
                <CategoryPanel category={CATEGORIES.immigration} sideClass={styles.imageBoxLeft} />
                <CategoryPanel category={CATEGORIES.creator} sideClass={styles.imageBoxRight} />
              </div>

              {/* Item _04 — 120° */}
              <div className={`${styles.animationItem} ${styles.item04}`}>
                <CategoryPanel category={CATEGORIES.business} sideClass={styles.imageBoxLeft} />
                <CategoryPanel category={CATEGORIES.legal} sideClass={styles.imageBoxRight} />
              </div>

              {/* Item _05 — 150° */}
              <div className={`${styles.animationItem} ${styles.item05}`}>
                <CategoryPanel category={CATEGORIES.education} sideClass={styles.imageBoxLeft} />
                <CategoryPanel category={CATEGORIES.marketing} sideClass={styles.imageBoxRight} />
              </div>

              {/* Item _06 — 180° */}
              <div className={`${styles.animationItem} ${styles.item06}`}>
                <CategoryPanel category={CATEGORIES.immigration} sideClass={styles.imageBoxLeft} />
                <CategoryPanel category={CATEGORIES.creator} sideClass={styles.imageBoxRight} />
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Bottom info bar — toggle SHOW_HERO_BOTTOM_BAR above to restore */}
      {SHOW_HERO_BOTTOM_BAR && (
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
      )}
    </section>
  );
}
