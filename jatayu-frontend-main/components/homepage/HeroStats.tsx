"use client";

import Counter from "../ui/Counter";
import styles from "./Hero.module.css";

const stats = [
  { id: "professionals", value: 79, label: <>verified<br />professionals</> },
  { id: "consultation", value: 49, prefix: "₹", label: <>micro<br />consultation</> },
  { id: "language", value: 10, label: <>indian<br />language</> },
  { id: "onboarding", value: 49, prefix: "₹", label: <>whatsapp<br />onboarding</> },
] as const;

export default function HeroStats() {
  return (
    <div className={styles.heroStats}>
      {stats.map((stat, index) => (
        <div key={stat.id} className={styles.stat}>
          <Counter
            value={stat.value}
            prefix={"prefix" in stat ? stat.prefix : undefined}
            className={styles.statNum}
            delay={index * 0.12}
          />
          <span className={styles.statLabel}>{stat.label}</span>
        </div>
      ))}
    </div>
  );
}
