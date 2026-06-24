"use client";

import Image from "next/image";
import { handleJoinAsExpertClick, JOIN_AS_EXPERT_HREF } from "@/lib/joinAsExpertNav";
import { ArrowLeft, ArrowRight } from "lucide-react";
import styles from "./Workflow.module.css";
import PrimaryButton from "../ui/PrimaryButton";

const carouselOne = [
  "/assets/img/team3.png",
  "/assets/img/team1.png",
  "/assets/img/team2.png",
  "/assets/img/team4.png",
];

const carouselTwo = [
  "/images/uZoBg8iHrnM8hSPmjt5zorl84Ea08c.png",
  "/assets/img/benefits-woman.png",
  "/assets/img/team2.png",
  "/assets/img/team1.png",
];

export default function Workflow() {
  return (
    <>
      <section className={`${styles.workflow} dark`} data-nav-surface="dark">
        <div className="container">
          <div className={styles.workflowTop}>
            <span className="eyebrow eyebrow--dark">
              <i className="dot"></i>10&nbsp;&nbsp;become a verified expert
            </span>
            <h2 className="display">
              <span className="t-white">Your knowledge</span>
              <br />
              <span className="t-muted">deserves a<br />business model.</span>
            </h2>
            <div className={styles.workflowLines} aria-hidden="true">
              <Image
                src="/assets/darklines.svg"
                alt=""
                width={44}
                height={98}
              />
            </div>
          </div>

          <div className={styles.workflowBottom}>
            <div className={styles.workflowLeft}>
              <p className={styles.workflowDesc}>
                Your audience already trusts you. Jatayu helps you convert that trust into structured income without depending only on social media algorithms
              </p>
              <div className={styles.workflowRule}></div>
              <PrimaryButton
                label="Join as expert"
                href={JOIN_AS_EXPERT_HREF}
                onClick={handleJoinAsExpertClick}
                variant="light"
                className={styles.workflowCta}
              />
            </div>

            <div className={styles.workflowShowcase}>
              <div className={`${styles.carouselViewport} ${styles.cutCardSmall}`}>
                <div className={`${styles.carouselTrack} ${styles.carouselLtr}`}>
                  {[...carouselOne, ...carouselOne].map((src, i) => (
                    <figure key={`c1-${i}`} className={`${styles.cutCard} ${styles.cutCardSlide}`}>
                      <Image
                        src={src}
                        alt="Expert portrait"
                        width={169}
                        height={204}
                      />
                    </figure>
                  ))}
                </div>
              </div>

              <figure className={`${styles.cutCard} ${styles.cutCardLarge}`}>
                <Image
                  src="/assets/img/manportrait.png"
                  alt="Featured expert"
                  width={340}
                  height={394}
                />
                <div className={styles.cutCardBottomArea}>
                  <figcaption className={styles.showcaseCaption}>
                    <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
                    <span>you could be next</span>
                    <small>Millions are waiting for you</small>
                  </figcaption>
                  <div className={styles.cutCardHover}>
                    <PrimaryButton
                      label="Join US"
                      href={JOIN_AS_EXPERT_HREF}
                      onClick={handleJoinAsExpertClick}
                      variant="light"
                      fullWidth
                      className={styles.cutCardHoverBtn}
                    />
                  </div>
                </div>
              </figure>

              <div className={`${styles.carouselViewport} ${styles.cutCardSmall}`}>
                <div className={`${styles.carouselTrack} ${styles.carouselRtl}`}>
                  {[...carouselTwo, ...carouselTwo].map((src, i) => (
                    <figure key={`c3-${i}`} className={`${styles.cutCard} ${styles.cutCardSlide}`}>
                      <Image
                        src={src}
                        alt="Expert portrait"
                        width={169}
                        height={204}
                      />
                    </figure>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* <div className={styles.showcaseNav}>
          <button aria-label="Previous expert">
            <ArrowLeft size={24} strokeWidth={2.8} />
          </button>
          <button aria-label="Next expert">
            <ArrowRight size={24} strokeWidth={2.8} />
          </button>
        </div> */}
        </div>
      </section>
    </>
  );
}
