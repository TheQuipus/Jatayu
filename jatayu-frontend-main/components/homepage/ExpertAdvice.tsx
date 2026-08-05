"use client";

import { useState } from "react";
import Image from "next/image";
import PrimaryButton from "../ui/PrimaryButton";
import styles from "./ExpertAdvice.module.css";


const steps = [
  {
    num: "001",
    title: "Choose your need",
    image: "/assets/img/team3.png",
    desc: "Select career, finance, legal, startup, business, education, or mentorship.",
  },
  {
    num: "002",
    title: "Discover verified experts",
    image: "/assets/img/team4.png",
    desc: "Compare experts by language, price, rating, availability, and expertise.",
  },
  {
    num: "003",
    title: "Start small",
    image: "/assets/img/team1.png",
    desc: "Book a micro-consultation from ₹49 or choose a deeper session.",
  },
  {
    num: "004",
    title: "Get human guidance",
    image: "/assets/img/team2.png",
    desc: "Talk through chat, call, video, or scheduled consultation.",
  },
  {
    num: "005",
    title: "Continue the relationship",
    image: "/assets/img/consultant.png",
    desc: "Follow experts, join events, buy tickets, or book future sessions.",
  },
] as const;

export default function ExpertAdvice() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const toggleStep = (index: number) => {
    setExpandedIndex((current) => (current === index ? null : index));
  };

  const updatePos = (clientX: number, clientY: number) => {
    setPos({ x: clientX, y: clientY });
  };

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    updatePos(event.clientX, event.clientY);
  };

  const handleStepEnter = (index: number, event: React.MouseEvent<HTMLLIElement>) => {
    setActiveStep(index);
    updatePos(event.clientX, event.clientY);
  };

  return (
    <>
      <section className={`${styles.expertAdvice} dark`} data-nav-surface="dark">
        <div className="container">
          <div className={styles.expertInner}>
            <div className={styles.top}>
              <span className={`eyebrow eyebrow--dark ${styles.topEyebrow}`}>
                <i className="dot"></i>its quick &amp; simple
              </span>
              <h2 className={styles.title}>
                <span className={styles.titleLead}>Expert advice</span>
                <br />
                <span className="t-muted">
                  <span className={styles.titleMid}>in minutes, </span>
                  <span className={styles.titleTail}>not in weeks.</span>
                </span>
              </h2>
              <div className={styles.topLines} aria-hidden="true">
                <Image
                  src="/assets/darklines.svg"
                  alt=""
                  width={44}
                  height={98}
                />
              </div>
              <div className={styles.topRight}>
                <PrimaryButton
                  label={
                    <>
                      START WITH
                      <span className={styles.ctaPrice}>₹49</span>
                    </>
                  }
                  variant="light"
                  className={styles.topCtaBtn}
                  type="button"
                />
              </div>
            </div>

            <div className={styles.subcopyRow}>
              <span className={styles.subcopyRule}></span>
              <p className={styles.subcopy}>Build your connections with like minded people</p>
            </div>

            <div
              className={styles.stepsWrap}
              onMouseMove={handleMove}
              onMouseLeave={() => setActiveStep(null)}
            >
              <ul className={styles.steps}>
                {steps.map((step, index) => {
                  const isExpanded = expandedIndex === index;

                  return (
                    <li
                      key={step.num}
                      className={`${styles.stepItem} ${isExpanded ? styles.stepItemExpanded : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Close ${step.title}` : `Open ${step.title}`}
                      onMouseEnter={(event) => handleStepEnter(index, event)}
                      onClick={() => toggleStep(index)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleStep(index);
                        }
                      }}
                    >
                      <div className={styles.stepHeader}>
                        <div className={styles.stepMain}>
                          <div className={styles.stepRail}>
                            <span className={styles.stepNum}>
                              <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
                              {step.num}
                            </span>
                            <span className={styles.stepRule}></span>
                          </div>
                          <span className={styles.stepTitle}>{step.title}</span>
                          <span className={styles.stepPlus} aria-hidden="true">
                            <Image
                              src="/assets/plusicon-light.svg"
                              alt=""
                              width={40}
                              height={40}
                            />
                          </span>
                          <div className={styles.stepPanel}>
                            <p className={styles.stepDesc}>{step.desc}</p>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div
                className={`${styles.hoverPreview} ${activeStep !== null ? styles.hoverPreviewActive : ""}`}
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
                aria-hidden="true"
              >
                <div
                  className={styles.hoverPreviewTrack}
                  style={{ transform: `translateY(-${(activeStep ?? 0) * 100}%)` }}
                >
                  {steps.map((step) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={step.num}
                      src={step.image}
                      alt=""
                      className={styles.hoverPreviewImg}
                      loading={step.image === "/assets/img/team1.png" || step.image === "/assets/img/team2.png" ? "eager" : undefined}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
