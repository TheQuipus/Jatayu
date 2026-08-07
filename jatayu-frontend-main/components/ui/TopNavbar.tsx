"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./TopNavbar.module.css";
import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";

function isOnboardingPath(pathname: string | null) {
  return (
    pathname?.startsWith("/expert/expert-onboarding") ||
    pathname?.startsWith("/seeker/seeker-onboarding") ||
    pathname?.startsWith("/login")
  );
}

export default function TopNavbar() {
  const pathname = usePathname();
  const onboarding = isOnboardingPath(pathname);
  const [onDark, setOnDark] = useState(pathname === "/" || onboarding);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOnboardingPath(pathname)) {
      setOnDark(true);
      return;
    }

    if (pathname !== "/") {
      setOnDark(false);
      return;
    }

    const navZone =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-height")) || 84;

    const checkSurface = () => {
      const surfaces = document.querySelectorAll('[data-nav-surface="dark"]');
      if (!surfaces.length) {
        setOnDark(false);
        return;
      }

      const overDark = [...surfaces].some((el) => {
        const { top, bottom } = el.getBoundingClientRect();
        return top < navZone && bottom > 0;
      });

      setOnDark(overDark);
    };

    checkSurface();
    window.addEventListener("scroll", checkSurface, { passive: true });
    window.addEventListener("resize", checkSurface);

    return () => {
      window.removeEventListener("scroll", checkSurface);
      window.removeEventListener("resize", checkSurface);
    };
  }, [pathname]);

function isSeekerAppPath(pathname: string | null) {
  return (
    pathname?.startsWith("/seeker/dashboard") ||
    pathname?.startsWith("/seeker/discover") ||
    pathname?.startsWith("/seeker/bookings") ||
    pathname?.startsWith("/seeker/bookmark") ||
    pathname?.startsWith("/seeker/expert")
  );
}

function isExpertAppPath(pathname: string | null) {
  if (!pathname) return false;
  if (pathname.startsWith("/expert/expert-onboarding")) return false;
  return pathname.startsWith("/expert/");
}

  if (
    pathname?.startsWith("/serene-scene") ||
    pathname?.startsWith("/admin") ||
    isSeekerAppPath(pathname) ||
    isExpertAppPath(pathname)
  ) {
    return null;
  }

  return (
    <>
      <header
        className={`${styles.navbar} ${onDark ? `${styles.onDarkSurface} nav-on-dark` : ""}`}
      >
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.logo} aria-label="Go to homepage">
            JATAYU<sup className={styles.logoMark}>®</sup>
          </Link>

          <button
            className={`${styles.menuButton} ${isOpen ? styles.isOpen : ""}`}
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      {/* Slide-out Menu Drawer */}
      <div className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ""}`}>
        <div className={`container ${styles.drawerContainer}`}>
          <div className={styles.drawerContent}>
            <button
              className={styles.closeBtn}
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {/* Divider with Star 1 */}
            <div className={styles.starLine}>
              <svg className={styles.starSvg} width="14" height="14" viewBox="0 0 26 26" fill="none">
                <path d="M12.999 21.667V17.333M12.999 17.333C12.999 14.94 11.059 13 8.66603 13M12.999 17.333C12.999 14.94 14.939 13 17.332 13M8.66603 13H4.33203M8.66603 13C11.059 13 12.999 11.06 12.999 8.66701M21.666 13H17.332M17.332 13C14.939 13 12.999 11.06 12.999 8.66701M12.999 4.33301V8.66701" stroke="white" strokeWidth="2" strokeMiterlimit="10"/>
              </svg>
              <div className={styles.line}></div>
            </div>

            <div className={styles.loginLinks}>
              <Link href={EXPERT_LOGIN_HREF} onClick={() => setIsOpen(false)} className={styles.loginLink}>
                Expert Login
              </Link>
              <Link href="/login/?role=user" onClick={() => setIsOpen(false)} className={styles.loginLink}>
                User Login
              </Link>
              <Link href="/admin/" onClick={() => setIsOpen(false)} className={styles.loginLink}>
                Admin Console
              </Link>
            </div>

            {/* Divider with Star 2 */}
            <div className={styles.starLine}>
              <svg className={styles.starSvg} width="14" height="14" viewBox="0 0 26 26" fill="none">
                <path d="M12.999 21.667V17.333M12.999 17.333C12.999 14.94 11.059 13 8.66603 13M12.999 17.333C12.999 14.94 14.939 13 17.332 13M8.66603 13H4.33203M8.66603 13C11.059 13 12.999 11.06 12.999 8.66701M21.666 13H17.332M17.332 13C14.939 13 12.999 11.06 12.999 8.66701M12.999 4.33301V8.66701" stroke="white" strokeWidth="2" strokeMiterlimit="10"/>
              </svg>
              <div className={styles.line}></div>
            </div>

            <div className={styles.navLinksLarge}>
              <Link href="/expert/" onClick={() => setIsOpen(false)} className={styles.largeLink}>
                EXPERTS
              </Link>
              <a href="#about" onClick={() => setIsOpen(false)} className={styles.largeLink}>
                ABOUT
              </a>
              <a href="#contact" onClick={() => setIsOpen(false)} className={styles.largeLink}>
                CONTACT
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop overlay */}
      {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}
    </>
  );
}
