
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./TopNavbar.module.css";

import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";

function isAdminLoginPage(pathname: string | null) {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/$/, "");
  return normalized === "/admin";
}

function isOnboardingPath(pathname: string | null) {
  return (
    pathname?.startsWith("/expert/expert-onboarding") ||
    pathname?.startsWith("/seeker/seeker-onboarding") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/forgot-password") ||
    pathname?.startsWith("/reset-password") ||
    isAdminLoginPage(pathname)
  );
}

function StarDivider({ light = false }: { light?: boolean }) {
  return (
    <svg
      className={`${styles.starLine} ${light ? styles.starLineLight : ""}`}
      width="100%"
      height="11"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5.5 0L6.6 4.4L11 5.5L6.6 6.6L5.5 11L4.4 6.6L0 5.5L4.4 4.4Z"
        fill="currentColor"
      />
      <line
        x1="10"
        y1="5.5"
        x2="100%"
        y2="5.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeOpacity="0.85"
      />
    </svg>
  );
}

export default function TopNavbar() {
  const pathname = usePathname();

  const onboarding = isOnboardingPath(pathname);
  const isAdminLogin = isAdminLoginPage(pathname);

  const [onDark, setOnDark] = useState(
    pathname === "/" || onboarding
  );

  const [isOpen, setIsOpen] = useState(false);

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Navbar surface detection for dark/light sections
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
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--nav-height"
        )
      ) || 84;

    const checkSurface = () => {
      const surfaces = document.querySelectorAll(
        '[data-nav-surface="dark"]'
      );

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

    window.addEventListener("scroll", checkSurface, {
      passive: true,
    });

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

  function isExpertPortalPath(pathname: string | null) {
    if (!pathname) return false;

    const expertPortalRoutes = [
      "/expert/dashboard",
      "/expert/availability",
      "/expert/earnings",
      "/expert/notifications",
      "/expert/profile",
      "/expert/report",
      "/expert/requests",
      "/expert/reviews",
      "/expert/achievements",
    ];

    return expertPortalRoutes.some((route) =>
      pathname.startsWith(route)
    );
  }

  // Hide navbar on application-specific pages
  if (
    pathname?.startsWith("/serene-scene") ||
    (pathname?.startsWith("/admin") && !isAdminLogin) ||
    pathname?.includes("/report") ||
    pathname?.includes("video-demo") ||
    pathname?.startsWith("/demo") ||
    isSeekerAppPath(pathname) ||
    isExpertPortalPath(pathname)
  ) {
    return null;
  }

  return (
    <>
      {/* Main Top Navigation Header */}
      <header
        className={`${styles.navbar} ${
          onDark ? `${styles.onDarkSurface} nav-on-dark` : ""
        }`}
      >
        <div className={`container ${styles.inner}`}>
          <Link
            href="/"
            className={styles.logo}
            aria-label="Go to homepage"
          >
            JATAYU
            <sup className={styles.logoMark}>®</sup>
          </Link>

          <button
            className={`${styles.menuButton} ${
              isOpen ? styles.isOpen : ""
            }`}
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
            aria-expanded={isOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Dimmed Backdrop Overlay */}
      <div
        className={`${styles.overlay} ${
          isOpen ? styles.overlayVisible : ""
        }`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Slide-out Menu Drawer */}
      <div
        className={`${styles.drawer} ${
          isOpen ? styles.drawerOpen : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Site Navigation Menu"
      >
        <div className={`container ${styles.drawerContainer}`}>
          <div className={styles.drawerContent}>

            {/* Giant Brand Wordmark (JATAYU) from Figma Specifications */}
            <div
              className={styles.watermarkWrapper}
              aria-hidden="true"
            >
              <div className={styles.watermark}>
                JATAYU
              </div>
            </div>

            {/* Drawer Header */}
            <div className={styles.drawerHeader}>
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className={styles.brandLink}
                aria-label="Jatayu Home"
              >
                <Image
                  src="/assets/img/jatayu-logo-black.png"
                  alt="JATAYU"
                  width={220}
                  height={48}
                  className={styles.brandImg}
                  priority
                />
              </Link>

              {/* <button
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button> */}
            </div>

            {/* Expert and Seeker Login */}
            <div className={styles.loginGrid}>
              <div className={styles.loginCol}>
                <Link
                  href={EXPERT_LOGIN_HREF}
                  onClick={() => setIsOpen(false)}
                  className={styles.loginButton}
                >
                  <span className={styles.loginRole}>Expert</span>
                  <span className={styles.loginAction}>LOGIN</span>
                </Link>
                <div className={styles.loginDivider}>
                  <StarDivider />
                </div>
              </div>

              <div className={styles.loginCol}>
                <Link
                  href="/login?role=user"
                  onClick={() => setIsOpen(false)}
                  className={styles.loginButton}
                >
                  <span className={styles.loginRole}>Seeker</span>
                  <span className={styles.loginAction}>LOGIN</span>
                </Link>
                <div className={styles.loginDivider}>
                  <StarDivider />
                </div>
              </div>
            </div>

            {/* Main Navigation Links */}
            <nav
              className={styles.navLinks}
              aria-label="Primary menu"
            >
              <div className={styles.navItem}>
                <a
                  href="#about"
                  onClick={() => setIsOpen(false)}
                  className={styles.mainLink}
                >
                  <span className={styles.mainLinkText}>ABOUT</span>
                </a>
                <div className={styles.navDivider}>
                  <StarDivider />
                </div>
              </div>

              <div className={styles.navItem}>
                <a
                  href="#contact"
                  onClick={() => setIsOpen(false)}
                  className={styles.mainLink}
                >
                  <span className={styles.mainLinkText}>CONTACT</span>
                </a>
                <div className={styles.navDivider}>
                  <StarDivider />
                </div>
              </div>

              <div className={styles.navItem}>
                <a
                  href="#faq"
                  onClick={() => setIsOpen(false)}
                  className={styles.mainLink}
                >
                  <span className={styles.mainLinkText}>FAQ</span>
                </a>
                <div className={styles.navDivider}>
                  <StarDivider />
                </div>
              </div>
            </nav>

            {/* Solid Black Footer Container at Bottom */}
            <div className={styles.blackCard}>
              <h3 className={styles.joinHeading}>JOIN US</h3>

              <div className={styles.joinDivider}>
                <StarDivider light />
              </div>

              <div className={styles.joinLinks}>
                <Link
                  href="/expert/expert-onboarding"
                  onClick={() => setIsOpen(false)}
                  className={styles.joinSubLink}
                >
                  Become Expert
                </Link>
                <Link
                  href="/seeker/seeker-onboarding"
                  onClick={() => setIsOpen(false)}
                  className={styles.joinSubLink}
                >
                  Join as Seeker
                </Link>
              </div>

              <div className={styles.socialRow}>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label="Instagram"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label="X (formerly Twitter)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label="Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.704 0-1.229.17-1.57.51-.341.341-.512.894-.512 1.66v1.81h3.765l-.544 3.667h-3.221v7.98H9.101z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialIcon}
                  aria-label="LinkedIn"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
                  </svg>
                </a>
              </div>

              <div className={styles.tricolorBar}>
                <span className={styles.barSaffron} />
                <span className={styles.barWhite} />
                <span className={styles.barGreen} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
