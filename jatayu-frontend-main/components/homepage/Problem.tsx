"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import styles from "./Problem.module.css";
import HeroLines from "../ui/HeroLines";

// Register ScrollTrigger plugin client-side
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// EDITABLE DATA CONFIGURATION AT THE TOP
const CONFIG = {
  defaultText: {
    eyebrow: "01 Empathy",
    kicker: "(Bespoke consultation for each life stage)",
    title: "IMPORTANT DECISIONS<br /><span class=\"t-muted\">should not<br />feel lonely.</span>",
    desc: "Discover how our creative vision transforms ideas into powerful, conversion-driven brand experiences that truly stand out.",
  },
  cards: [
    {
      label: "For Students",
      title: "Student",
      quote: "I need | guidance, | but | I don't know | who to ask.",
      desc: "Career, admissions, exams, higher education, and mentorship decisions become easier.",
      image: "/assets/student.png",
    },
    {
      label: "Young Professionals",
      title: "Young Professional",
      quote: "I want to | grow, | but | I need | clarity.",
      desc: "Career, salary, finance, technology, and personal development decisions become easier.",
      image: "/assets/youngpro.png",
    },
    {
      label: "Founders",
      title: "Founder",
      quote: "I need | sharp advice | without | wasting | months.",
      desc: "Fundraising, GTM, legal, hiring, and investor readiness decisions become easier.",
      image: "/assets/legal.png",
    },
    {
      label: "SMB Owners",
      title: "Business",
      quote: "I need | trusted | help, not | confusing jargon.",
      desc: "Tax, legal, accounting, marketing, and business growth decisions become easier.",
      image: "/assets/SMB.png",
    },
    {
      label: "Creators",
      title: "Creator",
      quote: "My audience | trusts me, | but | monetization | is broken.",
      desc: "Consultations, events, tickets, memberships, and knowledge monetization decisions become easier.",
      image: "/assets/creator.png",
    },
    {
      label: "Enterprises",
      title: "Enterprise",
      quote: "Our teams | need expert | access at | scale.",
      desc: "Learning, coaching, mentorship, development, and enterprise expert access become easier.",
      image: "/assets/enterprise.png",
    },
  ],
};

function formatQuote(quote: string): string {
  let lines: string[];
  if (quote.includes("|")) {
    lines = quote.split("|");
  } else if (quote.includes("<br />")) {
    lines = quote.split("<br />");
  } else if (quote.includes("\n")) {
    lines = quote.split("\n");
  } else {
    lines = [quote];
  }

  const formattedLines = lines.map(line => line.trim().toUpperCase());
  return `“${formattedLines.join("<br />")}”`;
}

export default function Problem() {
  const pathname = usePathname();
  const sectionRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const kickerRef = useRef<HTMLParagraphElement>(null);
  const descRef = useRef<HTMLParagraphElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);

  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const previewsRef = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    // Force a scroll trigger refresh when mounting to resolve dynamic layout changes
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    const section = sectionRef.current;
    const inner = innerRef.current;
    if (!section || !inner) return;

    // Filter null values from arrays
    const cards = cardsRef.current.filter((c): c is HTMLDivElement => c !== null);
    const previews = previewsRef.current.filter((p): p is HTMLImageElement => p !== null);
    const cardsContainer = cardsContainerRef.current;
    const previewWrap = previewWrapRef.current;

    if (cards.length === 0 || !cardsContainer || !previewWrap) return;

    const getNavHeight = () =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 84;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 1025px)", () => {
      // 1. Capture coordinates relative to the centered container (innerRect) to prevent horizontal centering offsets
      const startRects = cards.map((card) => card.getBoundingClientRect());
      const innerRect = inner.getBoundingClientRect();
      const titleRect = titleRef.current ? titleRef.current.getBoundingClientRect() : { bottom: 300 };

      const innerStyle = window.getComputedStyle(inner);
      const paddingLeft = parseFloat(innerStyle.paddingLeft) || 0;
      const paddingTop = parseFloat(innerStyle.paddingTop) || 0;

      // 2. Set cards to absolute positioning relative to their parent container (inner)
      cards.forEach((card, index) => {
        gsap.set(card, {
          position: "absolute",
          left: startRects[index].left - innerRect.left - paddingLeft - 1,
          top: startRects[index].top - innerRect.top - paddingTop,
          width: startRects[index].width,
          height: startRects[index].height,
          x: 0,
          y: 0,
          rotation: 0,
          rotationX: 0,
          rotationY: 0,
          force3D: false,
        });
      });

      // 3. Make cards container cover the whole layout so its coordinate context matches .problemInner
      // Reset any grid margins, paddings, or grid column constraints from the default stylesheet
      gsap.set(cardsContainer, {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        display: "block",
        margin: 0,
        padding: 0,
        transform: "none",
        gridColumn: "1 / -1", // Clear grid column spans (like grid-column: 3 / 5)
        gridRow: "1 / -1",    // Clear grid row spans
        zIndex: 6,
      });

      // 4. Set previews initial states
      previews.forEach((p, idx) => {
        if (idx === 0) {
          gsap.set(p, { opacity: 1, rotation: 0 });
        } else {
          gsap.set(p, { opacity: 0, rotation: 60 });
        }
      });

      let currentStep = -1;
      let currentActiveIndex = 0;
      const animatePreviewSwitch = (nextIndex: number, nextStep: number) => {
        if (nextIndex === currentActiveIndex) return;

        // Kill any existing/running transitions on the preview images to prevent overlapping
        gsap.killTweensOf(previews);

        const direction = nextStep > currentStep ? 1 : -1;
        const outPreview = previews[currentActiveIndex];
        const inPreview = previews[nextIndex];

        // Position others
        previews.forEach((p, idx) => {
          if (idx !== currentActiveIndex && idx !== nextIndex) {
            gsap.set(p, { opacity: 0, rotation: direction * 60 });
          }
        });

        // Outgoing preview animation
        if (outPreview) {
          gsap.to(outPreview, {
            opacity: 0,
            rotation: -direction * 60,
            duration: 0.8,
            ease: "power2.out",
          });
        }

        // Incoming preview animation
        if (inPreview) {
          gsap.set(inPreview, {
            opacity: 0,
            rotation: direction * 60,
          });

          gsap.to(inPreview, {
            opacity: 1,
            rotation: 0,
            duration: 0.8,
            ease: "power2.out",
          });
        }

        currentActiveIndex = nextIndex;
        currentStep = nextStep;
      };

      // 5. Left and Right text updater with direct DOM manipulation for smooth performance
      let textTween: gsap.core.Tween | null = null;
      const updateText = (
        eyebrowText: string,
        titleText: string,
        kickerText: string,
        descText: string,
        isQuote = false
      ) => {
        if (!eyebrowRef.current || !titleRef.current || !kickerRef.current || !descRef.current) return;

        if (textTween) textTween.kill();

        textTween = gsap.to(
          [eyebrowRef.current, titleRef.current, kickerRef.current, descRef.current],
          {
            opacity: 0,
            duration: 0.15,
            onComplete: () => {
              if (!eyebrowRef.current || !titleRef.current || !kickerRef.current || !descRef.current) return;

              eyebrowRef.current.innerHTML = `<i class="dot"></i>${eyebrowText}`;
              titleRef.current.innerHTML = titleText;
              titleRef.current.classList.toggle(styles.problemTitleQuote, isQuote);
              kickerRef.current.textContent = kickerText;
              descRef.current.textContent = descText;

              gsap.to(
                [eyebrowRef.current, titleRef.current, kickerRef.current, descRef.current],
                { opacity: 1, duration: 0.2 }
              );
            },
          }
        );
      };

      // 6. Calculate final rows bottom orbit coordinates relative to innerRect (which is centered on screen)
      const cardWidth = 232; // Target width in the bottom row

      // Settle cards near the bottom of the nav-offset viewport
      const finalY = innerRect.height - (window.innerHeight - 750) - 45;

      let lastActiveIndex = -1;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: () => `top top+=${getNavHeight()}`,
          end: "+=5000",
          pin: true,
          scrub: 1,
          anticipatePin: 1, // Prevent browser layout jitter on pin start
          invalidateOnRefresh: true,
          onEnter: () => gsap.set(section, { top: getNavHeight() }),
          onEnterBack: () => gsap.set(section, { top: getNavHeight() }),
          onRefresh: (self) => {
            if (self.isActive) {
              gsap.set(section, { top: getNavHeight() });
            }
          },
        },
        onUpdate: function () {
          const t = this.time();
          // Determine active index based on visual left-to-right order:
          // [Students (0), SMB Owners (3), Professionals (1), Creators (4), Founders (2), Enterprises (5)]
          const VISUAL_TO_ARRAY_INDEX = [0, 3, 1, 4, 2, 5];
          let activeIndex = -1;
          let step = -1;
          if (t >= 2.0) {
            step = Math.floor((t - 2.0) / 0.7);
            activeIndex = step > 5 ? VISUAL_TO_ARRAY_INDEX[5] : VISUAL_TO_ARRAY_INDEX[step];
          }

          if (activeIndex !== lastActiveIndex) {
            lastActiveIndex = activeIndex;

            // Update DOM active classes
            cards.forEach((c, idx) => {
              if (idx === activeIndex) {
                c.classList.add(styles.active);
              } else {
                c.classList.remove(styles.active);
              }
            });

            if (activeIndex === -1) {
              updateText(
                CONFIG.defaultText.eyebrow,
                CONFIG.defaultText.title,
                CONFIG.defaultText.kicker,
                CONFIG.defaultText.desc,
                false
              );
              animatePreviewSwitch(0, -1);
            } else {
              const cardData = CONFIG.cards[activeIndex];
              const formattedTitle = formatQuote(cardData.quote);
              const cleanLabel = cardData.label.toUpperCase().replace("FOR ", "");
              const formattedEyebrow = `02  ${cleanLabel}`;

              updateText(
                formattedEyebrow,
                formattedTitle,
                CONFIG.defaultText.kicker,
                cardData.desc,
                true
              );
              animatePreviewSwitch(activeIndex, step);
            }
          }
        }
      });

      // ORBIT PHASE (combining curves, rotation, and width/height resizing)
      cards.forEach((card, index) => {
        // Interleave first and second rows in the final row to prevent diagonal crossing and extra Z rotation
        const targetIndex = index < 3 ? index * 2 : (index - 3) * 2 + 1;
        const finalX = targetIndex * cardWidth - 1;
        const startX = startRects[index].left - innerRect.left - paddingLeft - 1;
        const startY = startRects[index].top - innerRect.top;

        // Calculate card's maximum tilt angle in the Z axis based on its position in the layout
        const maxRot = (targetIndex - 2.5) * 8; // outer cards tilt up to 20 degrees, inner cards tilt less

        timeline.to(
          card,
          {
            duration: 2,
            width: cardWidth,
            height: 195,
            onUpdate: function () {
              const p = this.progress();
              const orbitRadius = 240;
              const angle = Math.PI - Math.PI * p;
              const curveX = Math.cos(angle) * orbitRadius;
              const curveY = Math.sin(angle) * orbitRadius;

              // Rotate on scroll over a short scroll range (first 70% of the orbit phase)
              let rotation = 0;
              const rotRange = 0.7;
              if (p < rotRange) {
                rotation = maxRot * Math.sin((p / rotRange) * Math.PI);
              }

              gsap.set(card, {
                x: (finalX - startX) * p + curveX * 0.7 * Math.sin(Math.PI * p),
                // Plus sign (+ curveY) dips cards DOWNWARD in an arc to settle at the bottom row
                // Multiplying by Math.sin(Math.PI * p) starts and ends the vertical curve with 0 slope, preventing jumps
                y: (finalY - startY) * p + curveY * 0.8 * Math.sin(Math.PI * p),
                rotation: rotation,
                rotationX: 0,
                rotationY: 0,
                force3D: true, // Force GPU layer to ensure completely smooth translation
              });
            },
          },
          0
        );
      });

      // Image wrapper opacity transition
      timeline.to(previewWrap, {
        opacity: 1,
        duration: 0.5,
      }, 1.5);

      // CARD SELECTION / PIN ACTIVATION SPACERS (Callbacks handled by timeline.onUpdate)
      cards.forEach((card) => {
        // Reserve scroll duration/space for this card's active storytelling state
        timeline.to(card, {
          duration: 0.7,
        });
      });
    });

    return () => {
      clearTimeout(timer);
      // Revert matches and cleanup
      mm.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [pathname]);

  return (
    <>
      <HeroLines />
      <div className={styles.problemWrapper}>
        <section ref={sectionRef} className={styles.problem}>
          <div ref={innerRef} className={`container ${styles.problemInner}`}>

            {/* Original problemHead DOM tree structure completely restored */}
            <div className={styles.problemHead}>
              <span ref={eyebrowRef} className="eyebrow eyebrow--light">
                <i className="dot"></i>{CONFIG.defaultText.eyebrow}
              </span>
              <h2
                ref={titleRef}
                className={styles.problemTitle}
                dangerouslySetInnerHTML={{ __html: CONFIG.defaultText.title }}
              />
              <p ref={kickerRef} className={styles.problemKicker}>
                {CONFIG.defaultText.kicker}
              </p>
              <div className={styles.problemDescWrap}>
                <p ref={descRef} className={styles.problemDesc}>
                  {CONFIG.defaultText.desc}
                </p>
              </div>
            </div>

            <span className={styles.problemRule} aria-hidden="true"></span>

            {/* Previews (only shown on desktop/animations) */}
            <div ref={previewWrapRef} className={styles.previewWrap}>
              {CONFIG.cards.map((card, idx) => (
                <img
                  key={idx}
                  ref={(el) => { previewsRef.current[idx] = el; }}
                  className={`${styles.preview} ${idx === 0 ? styles.active : ""}`}
                  src={card.image}
                  alt={card.label}
                />
              ))}
            </div>

            {/* Stat Cards */}
            <div ref={cardsContainerRef} className={styles.statCards}>
              {CONFIG.cards.map((card, idx) => (
                <div
                  key={idx}
                  ref={(el) => { cardsRef.current[idx] = el; }}
                  className={styles.scardMini}
                >
                  <span className={styles.scardMiniLabel}>
                    <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
                    {card.label}
                  </span>
                  <p className={styles.scardMiniQuote}>
                    {card.quote.replace(/\|/g, "").replace(/<br\s*\/?>/g, " ").replace(/\s+/g, " ").trim()}
                  </p>
                  <div className={styles.scardMiniRule}></div>
                  <p className={styles.scardMiniDesc}>{card.desc}</p>
                  <p className={styles.scardMiniTitle}>{card.title || card.label}</p>
                </div>
              ))}
            </div>

          </div>
        </section>
      </div>
    </>
  );

}
