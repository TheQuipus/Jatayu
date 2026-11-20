
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
    <div className={`${styles.starLine} ${light ? styles.starLineLight : ""}`}>
      <svg
        className={styles.starSvg}
        width="11"
        height="11"
        viewBox="0 0 26 26"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M13 0L15.6 10.4L26 13L15.6 15.6L13 26L10.4 15.6L0 13L10.4 10.4L13 0Z" />
      </svg>

      <div className={styles.line} />
    </div>
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

          </div>
        </div>
      </div>
    </>
  );
}
