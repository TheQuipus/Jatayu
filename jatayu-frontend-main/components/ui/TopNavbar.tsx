
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter} from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./TopNavbar.module.css";
import MenuCategoryPanel from "./MenuCategoryPanel";
import PageTurnFlap from "./PageTurnFlap";
import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";
import {
  ONBOARDING_STEP_CHANGE_EVENT,
  isPostOtpOnboardingHeader,
} from "@/lib/onboardingHeaderState";
import ShinyText from "./ShinyText";

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
  const router = useRouter();

  const isExpertPage = pathname === "/expert" || pathname?.startsWith("/expert/");

  const handleOurExpertsClick = () => {
    setIsOpen(false);
    router.push("/expert/#from-home");
  };

  const onboarding = isOnboardingPath(pathname);
  const isAdminLogin = isAdminLoginPage(pathname);

  const [onDark, setOnDark] = useState(
    pathname === "/" || onboarding
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isFooterPeeled, setIsFooterPeeled] = useState(false);
  const [isWizardMinimalHeader, setIsWizardMinimalHeader] = useState(false);

  useEffect(() => {
    const syncWizardHeader = () => {
      const nextMinimal = isPostOtpOnboardingHeader(pathname, window.location.search);
      setIsWizardMinimalHeader(nextMinimal);
      if (nextMinimal) {
        setIsOpen(false);
      }
    };

    syncWizardHeader();
    window.addEventListener(ONBOARDING_STEP_CHANGE_EVENT, syncWizardHeader);
    window.addEventListener("popstate", syncWizardHeader);
    return () => {
      window.removeEventListener(ONBOARDING_STEP_CHANGE_EVENT, syncWizardHeader);
      window.removeEventListener("popstate", syncWizardHeader);
    };
  }, [pathname]);

  // Reset footer peel when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setIsFooterPeeled(false);
    }
  }, [isOpen]);

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
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
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
      pathname?.startsWith("/seeker/expert") ||
      pathname?.startsWith("/seeker/profile") ||
      pathname?.startsWith("/seeker/support")
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
      "/expert/settings",
      "/expert/support",
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
            <span className={styles.logoStack}>
              <Image
                src="/assets/img/jatayu-logo-white.svg"
                alt="JATAYU"
                fill
                priority
                className={`${styles.logoImg} ${onDark ? styles.logoImgVisible : styles.logoImgHidden}`}
              />
              <Image
                src="/assets/img/jatayu-logo-black.png"
                alt=""
                fill
                priority
                aria-hidden="true"
                className={`${styles.logoImg} ${onDark ? styles.logoImgHidden : styles.logoImgVisible}`}
              />
            </span>
            <sup className={styles.logoMark}>®</sup>
          </Link>

              {isExpertPage ? (
                <div
                  className={`${styles.ourExpertsBtn} ${styles.ourExpertsBtnStatic} ${
                    onDark ? styles.ourExpertsBtnDark : styles.ourExpertsBtnLight
                  }`}
                  aria-current="page"
                >
                  <span className={styles.ourExpertsStaticText}>
                    Our Experts
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${styles.ourExpertsBtn} ${
                    onDark ? styles.ourExpertsBtnDark : styles.ourExpertsBtnLight
                  }`}
                  onClick={handleOurExpertsClick}
                  aria-label="Our Experts"
                >
                  <ShinyText
                    text="Our Experts"
                    // icon="sparkles"
                    // iconSize={14}
                    speed={2.5}
                    color={onDark ? "#FFFFFF" : "#111111"}
                    shineColor={onDark ? "#FF5C01" : "#E53B17"}
                    className={styles.ourExpertsShinyText}
                  />
                </button>
              )}

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
          {/* Expert Conference Category View (Columns 1 to 7) - Image 1 */}
          <div className={styles.categoryPanelCol}>
            <MenuCategoryPanel onCloseMenu={() => setIsOpen(false)} />
          </div>

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

            {/* Diagonal Solid Black Wedge Background */}
            <div className={styles.blackWedge} aria-hidden="true" />

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

              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <Image
                  src="/assets/buttonsvg.svg"
                  alt=""
                  width={30}
                  height={30}
                  className={styles.closeIcon}
                  aria-hidden="true"
                />
              </button>
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
            <div
              className={`${styles.blackCard} ${
                isFooterPeeled ? styles.blackCardPeeled : styles.blackCardResting
              }`}
            >
              <h3 className={styles.joinHeading}>JOIN US</h3>

              <div className={styles.joinDivider}>
                <StarDivider light />
              </div>

              <div className={styles.joinLinks}>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/expert/expert-onboarding");
                  }}
                  className={styles.joinSubLink}
                  aria-label="Become Expert"
                >
                  Become Expert
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    router.push("/seeker/seeker-onboarding");
                  }}
                  className={styles.joinSubLink}
                  aria-label="Join as Seeker"
                >
                  Join as Seeker
                </button>
              </div>

              <div className={styles.socialRow}>
                <button
                  type="button"
                  onClick={() => window.open("https://instagram.com", "_blank", "noopener,noreferrer")}
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
                </button>
                <button
                  type="button"
                  onClick={() => window.open("https://x.com", "_blank", "noopener,noreferrer")}
                  className={styles.socialIcon}
                  aria-label="X (formerly Twitter)"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => window.open("https://facebook.com", "_blank", "noopener,noreferrer")}
                  className={styles.socialIcon}
                  aria-label="Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.704 0-1.229.17-1.57.51-.341.341-.512.894-.512 1.66v1.81h3.765l-.544 3.667h-3.221v7.98H9.101z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => window.open("https://youtube.com", "_blank", "noopener,noreferrer")}
                  className={styles.socialIcon}
                  aria-label="YouTube"
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
                    <path d="m10 15 5-3-5-3z" fill="currentColor" />
                  </svg>
                </button>
              </div>

              <div className={styles.tricolorBar}>
                <span className={styles.barSaffron} />
                <span className={styles.barWhite} />
                <span className={styles.barGreen} />
              </div>
            </div>

            {/* Interactive 3D Paper-Peel Flap (Three.js WebGL) */}
            <PageTurnFlap
              isOpen={isOpen}
              onLinkClick={() => setIsOpen(false)}
              onPeelChange={setIsFooterPeeled}
            />

          </div>
        </div>
      </div>
    </>
  );
}
