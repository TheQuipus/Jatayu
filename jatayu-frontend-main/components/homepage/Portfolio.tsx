"use client";

import Image from "next/image";
import styles from "./Portfolio.module.css";
import HeroLines from "../ui/HeroLines";
import type { ExpertiseTag } from "@/lib/experts";

const cardIdToExpertiseTag: Record<string, ExpertiseTag> = {
  forge: "Career & Jobs",
  atlas: "Startup & Fundraising",
  rivet: "Legal & Compliance",
  pulse: "Education & Admissions",
  foundry: "Tax & Finance",
  office: "SMB Growth",
  consultant: "Enterprise Learning",
  centre: "Creator Access",
};

const portfolioCards = [
  {
    id: "forge",
    name: "Career & Job",
    labelLines: ["Career", "& job"],
    tag: "/ career",
    image: {
      src: "/assets/img/carrer.png",
      alt: "Career & Job",
      width: 451,
      height: 563,
    },
    gridColumn: "1 / span 1",
    aspectRatio: "1 / 1",
  },
  {
    id: "atlas",
    name: "Startup & Fundraise",
    labelLines: ["Startup &", "Fundraise"],
    tag: "/ startup",
    image: {
      src: "/assets/img/startup.png",
      alt: "Startup & Fundraise",
      width: 613,
      height: 408,
    },
    gridColumn: "3 / span 2",
    aspectRatio: "613 / 408",
    alignSelf: "end",
  },
  {
    id: "rivet",
    name: "Legal & Compliance",
    labelLines: ["Legal &", "Compliance"],
    tag: "/ legal",
    image: {
      src: "/assets/img/legal.png",
      alt: "Legal & Compliance",
      width: 613,
      height: 344,
    },
    gridColumn: "2 / span 2",
    aspectRatio: "613 / 344",
  },
  {
    id: "pulse",
    name: "Education & Admissions",
    labelLines: ["Education &", "Admissions"],
    tag: "/ education",
    image: {
      src: "/assets/img/education.png",
      alt: "Education & Admissions",
      width: 613,
      height: 462,
    },
    gridColumn: "1 / span 2",
    aspectRatio: "613 / 462",
  },
  {
    id: "foundry",
    name: "Tax & Finance",
    labelLines: ["Tax &", "Finance"],
    tag: "/ finance",
    image: {
      src: "/assets/img/tax.png",
      alt: "Tax & Finance",
      width: 451,
      height: 676,
    },
    gridColumn: "4 / span 1",
    aspectRatio: "1 / 1",
  },
  {
    id: "office",
    name: "SMB Growth",
    labelLines: ["SMB", "Growth"],
    tag: "/ business",
    image: {
      src: "/assets/img/SMB.png",
      alt: "SMB Growth",
      width: 1000,
      height: 1000,
    },
    gridColumn: "1 / span 1",
    aspectRatio: "1 / 1",
  },
  {
    id: "consultant",
    name: "Enterprise Learning",
    labelLines: ["Enterprise", "Learning"],
    tag: "/ enterprise",
    image: {
      src: "/assets/img/entreprise.png",
      alt: "Enterprise Learning",
      width: 1200,
      height: 760,
    },
    gridColumn: "3 / span 2",
    aspectRatio: "613 / 408",
  },
  {
    id: "centre",
    name: "Creator Access",
    labelLines: ["Creator", "Access"],
    tag: "/ creator",
    image: {
      src: "/assets/img/creator.png",
      alt: "Creator Access",
      width: 1200,
      height: 760,
    },
    gridColumn: "2 / span 2",
    aspectRatio: "613 / 408",
  },
] as const;

export default function Portfolio() {
  return (
    <>
      <section className={styles.portfolio}>
        <div className="container">
          <div className={styles.portfolioHead}>
            <span className="eyebrow eyebrow--light">
              <i className="dot"></i>03&nbsp;&nbsp;Why Choose Us
            </span>
            <h2 className="display">
              <span className={`t-dark ${styles.titleFirstLine}`}>
                trusted human
                <br />
                <span className={styles.titleSecondLine}>expertise</span>
              </span>
              <br />
              <span className={`t-muted ${styles.titleThirdLine}`}>to every indian.</span>
            </h2>
            <div className={styles.portfolioLines} aria-hidden="true">
              <Image
                src="/assets/whitelines.svg"
                alt=""
                width={26}
                height={146}
              />
            </div>
            <span className={styles.descRule} aria-hidden="true"></span>
            <p>
              Jatayu makes expert access simple, affordable, multilingual, and trustworthy. Start with a 10-minute answer, move into deeper consultations, or follow experts for events and mentorship.
            </p>
          </div>
          <div className={styles.portfolioGrid}>
            {portfolioCards.map((card) => {
              const handleCardClick = () => {
                const tag = cardIdToExpertiseTag[card.id];
                if (tag) {
                  window.dispatchEvent(
                    new CustomEvent("select-expertise-tag", { detail: { tag } })
                  );
                }
              };

              return (
                <figure
                  key={card.id}
                  className={styles.pcard}
                  style={{
                    gridColumn: card.gridColumn,
                    alignSelf: "alignSelf" in card ? card.alignSelf : undefined,
                  }}
                  onClick={handleCardClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleCardClick();
                    }
                  }}
                >
                  <div
                    className={styles.pcardImg}
                    style={{ aspectRatio: card.aspectRatio }}
                  >
                    <Image
                      src={card.image.src}
                      alt={card.image.alt}
                      width={card.image.width}
                      height={card.image.height}
                      style={{ width: "100%", height: "auto" }}
                    />
                    <span className={styles.categoryLabel}>
                      <span>{card.labelLines[0]}</span>
                      <span>{card.labelLines[1]}</span>
                    </span>
                  </div>
                  <header className={styles.pcardBar}>
                    <span className={styles.pcardName}>
                      <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
                      {card.name}
                    </span>
                    <span className={styles.pcardTag}>{card.tag}</span>
                  </header>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
      <HeroLines rotate180={true} />

    </>
  );
}
