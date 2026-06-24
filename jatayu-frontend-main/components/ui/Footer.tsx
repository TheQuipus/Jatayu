import { ArrowUp } from "lucide-react";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <div className={styles.stickyShell}>
      <div className={styles.stickyTrack}>
        <footer className={styles.footer} data-nav-surface="dark">
          <div className={`container ${styles.footerInner}`}>
            <div className={styles.mainGrid}>
              <div className={styles.contactBlock}>
                <span className={styles.linkHeading}>Contact</span>
                <a href="tel:+919900876676" className={styles.phoneLink}>
                  (+91) 99008 76676
                </a>
                <a href="mailto:hello@jatayu.in" className={styles.emailLink}>
                  hello@jatayu.in
                </a>
              </div>

              <nav
                className={`${styles.linkGroup} ${styles.navGroup}`}
                aria-label="Footer navigation"
              >
                <span className={styles.linkHeading}>Navigation</span>
                <a href="#top">Home</a>
                <a href="#">About</a>
                <a href="/expert">Expert</a>
                <a href="#">Blog</a>
                <a href="#">Terms of Service</a>
              </nav>

              <div className={`${styles.linkGroup} ${styles.socialGroup}`}>
                <div className={styles.backTopWrap}>
                  <a href="#top">
                    Back to top <ArrowUp size={20} />
                  </a>
                </div>
                <span className={styles.linkHeading}>Social</span>
                <a href="#">Instagram ↗</a>
                <a href="#">Dribbble ↗</a>
                <a href="#">Twitter ↗</a>
                <a href="#">Privacy Policy</a>
              </div>
            </div>

            <div className={styles.brandWord} aria-hidden="true">
              JATAYU
            </div>

            <div className={styles.footerMeta}>
              <span>© 2026 Jatayu Studio | All Rights Reserved</span>
              <span>Created by Jatayu</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
