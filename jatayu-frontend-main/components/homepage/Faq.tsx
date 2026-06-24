"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./Faq.module.css";
import HeroLines from "../ui/HeroLines";

const faqItems = [
  {
    num: "001",
    title: "How do ₹49 consultations work?",
    answer: "You can ask a quick question and get matched with a verified expert who will provide a direct 10-minute audio or text consultation in your preferred language."
  },
  {
    num: "002",
    title: "How are the experts verified?",
    answer: "Every expert goes through a strict verification pipeline, including professional credential verification, identity checks, and peer reviews before joining the platform."
  },
  {
    num: "003",
    title: "What languages are supported?",
    answer: "We support 10 Indian languages including Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Odia, and English."
  },
  {
    num: "004",
    title: "Is the onboarding native to WhatsApp?",
    answer: "Yes, you don't need to download any complex apps. You can complete your onboarding, match with experts, and receive direct consultation transcripts right within WhatsApp."
  },
  {
    num: "005",
    title: "How are payments handled?",
    answer: "We support secure India-first payments including UPI, Net Banking, and major cards, ensuring low-friction regional checkouts."
  }
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <>
      <HeroLines />
      <section className={styles.faq}>
        <div className={`container ${styles.faqInner}`}>
          <div className={styles.faqLeft}>
            <span className="eyebrow eyebrow--light">
              <i className="dot"></i>11&nbsp;&nbsp;faq
            </span>
            <h2 className="display">
              <span className="t-dark">Before You</span>
              <br />
              <span className="t-muted">Start.</span>
            </h2>
          </div>
          <ul className={styles.accLight}>
            {faqItems.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <li key={idx} className={`${styles.accItem} ${isOpen ? styles.isOpen : ""}`}>
                  <button className={styles.accBtn} onClick={() => toggleAccordion(idx)}>
                    <div className={styles.accTop}>
                      <span className={styles.accNum}>
                        <img src="/assets/box.svg" alt="" className="mark" aria-hidden="true" />
                        {item.num}
                      </span>
                      <span className={styles.accDots}></span>
                      <span className={styles.accPlus}>
                        <Image
                          src="/assets/plusicon.svg"
                          alt=""
                          width={34}
                          height={34}
                        />
                      </span>
                    </div>
                    <span className={styles.accTitle}>{item.title}</span>
                  </button>
                  <div className={styles.accPanel}>
                    <p>{item.answer}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </>
  );
}
