import Image from "next/image";
import PrimaryButton from "../ui/PrimaryButton";
import styles from "./Insights.module.css";
import HeroLines from "../ui/HeroLines";

const posts = [
  { date: "NOVEMBER 18, 2025", title: "The Rules of Modern Branding", img: "/assets/img/blog1.png", tall: false },
  { date: "NOVEMBER 12, 2025", title: "Branding Is a System, Not just a Logo", img: "/assets/img/blog2.png", tall: true },
  { date: "OCT 24, 2025", title: "Clarity Is the New Advantage", img: "/assets/img/blog3.png", tall: false },
  { date: "OCTOBER 11, 2025", title: "From Aesthetic to Experience", img: "/assets/img/blog4.png", tall: false }
];

export default function Insights() {
  return (
    <>
      <section className={styles.blog}>
        <div className="container">
          <div className={styles.blogHead}>
            <div>
              <span className="eyebrow eyebrow--light">
                <i className="dot"></i>insights
              </span>
              <h2 className="display">
                <span className="t-dark">Latest From<br /></span>
                <span className="t-dark">Our Studio.</span>
              </h2>
            </div>
            <div className={styles.blogRight}>
              <p>
                Ideas, strategies, and innovative creative explorations shaping the future of design, emerging technology, and digital experiences.
              </p>
              <PrimaryButton
                href="#"
                label="All articles"
                variant="dark"
                fullWidth
                iconSrc="/assets/buttonsvg-white-red.svg"
              />
            </div>
          </div>
          <div className={styles.blogGrid}>
            {posts.map((post, idx) => (
              <article
                key={idx}
                className={`${styles.bpost} ${post.tall ? styles.bpostTall : ""}`}
              >
                <div className={styles.bpostBar}>
                  <img src="/assets/box.svg" alt="" className="mark mark--sq" aria-hidden="true" />
                  {post.date}
                </div>
                <div className={styles.bpostImg}>
                  <Image
                    src={post.img}
                    alt={post.title}
                    width={564}
                    height={post.tall ? 780 : 680}
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
                <h3>{post.title}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>
      <HeroLines rotate180 color="#D63614" />
    </>
  );
}
