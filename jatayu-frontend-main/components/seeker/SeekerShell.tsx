"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  Bookmark,
  CalendarDays,
  Compass,
  Crown,
  Headphones,
  Home,
  LogOut,
  Ticket,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import { SeekerShellContext } from "@/components/seeker/SeekerShellContext";
import { MAIN_NAV, PROFILE_NAV, QUICK_LINKS } from "@/lib/seekerDashboard";
import styles from "./SeekerShell.module.css";

const NAV_ICONS = {
  home: Home,
  discover: Compass,
  bookings: CalendarDays,
  profile: User,
  tickets: Ticket,
  support: Headphones,
  saved: Bookmark,
} as const;

function isNavItemActive(id: string, pathname: string, href: string, currentHash: string): boolean {
  const parts = href.split("#");
  const baseHref = parts[0];
  const itemHash = parts[1] ? `#${parts[1]}` : "";
  const normalize = (p: string) => p.endsWith("/") ? p : `${p}/`;
  const normPathname = normalize(pathname);
  const normBaseHref = normalize(baseHref);

  if (id === "home") return normPathname === "/seeker/dashboard/" && (!currentHash || currentHash === "#profile");
  if (id === "discover") {
    return normPathname.startsWith("/seeker/discover/") || normPathname.startsWith("/seeker/expert/");
  }
  if (id === "bookings") return normPathname.startsWith("/seeker/bookings/");
  if (id === "profile") return normPathname.startsWith("/seeker/profile/");
  if (id === "saved") return normPathname.startsWith("/seeker/bookmark/");

  if (itemHash) {
    return normPathname === normBaseHref && currentHash === itemHash;
  }

  return normPathname === normBaseHref;
}

type SeekerShellProps = {
  children: ReactNode;
};

export default function SeekerShell({ children }: SeekerShellProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<ReactNode | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const shellContext = useMemo(() => ({ setBreadcrumbs }), []);

  useEffect(() => {
    setCurrentHash(window.location.hash);
    const handleHashChange = () => {
      setCurrentHash(window.location.hash);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  return (
    <SeekerShellContext.Provider value={shellContext}>
      <div className={`${styles.shell} ${isCollapsed ? styles.shellCollapsed : ""}`.trim()}>
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`.trim()}
        aria-label="Seeker navigation"
      >
        <div className={styles.brandContainer}>
          {!isCollapsed ? (
            <>
              <Link href="/seeker/dashboard" className={styles.brand}>
                <span className={styles.brandMark} aria-hidden="true">
                  J
                </span>
                <span className={styles.brandText}>Jatayu</span>
              </Link>
              <button
                type="button"
                className={styles.collapseBtn}
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          ) : (
            <button
              type="button"
              className={`${styles.collapseBtn} ${styles.collapseBtnCollapsed}`}
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}
        </div>

        <nav className={styles.navSection} aria-label="Main">
          {MAIN_NAV.map((item) => {
            const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? Home;
            const isActive = isNavItemActive(item.id, pathname, item.href, currentHash);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                {!isCollapsed && <span className={styles.navLabelText}>{item.label}</span>}
                {!isCollapsed && item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        {!isCollapsed && <div className={styles.navLabel}>Quick Links</div>}
        <nav className={styles.navSection} aria-label="Quick links">
          {QUICK_LINKS.map((item) => {
            const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? Bookmark;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navLink} ${
                  isNavItemActive(item.id, pathname, item.href, currentHash) ? styles.navLinkActive : ""
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={16} aria-hidden="true" />
                {!isCollapsed && <span className={styles.navLabelText}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {!isCollapsed && (
          <div className={styles.upgradeCard}>
            <Crown size={18} aria-hidden="true" />
            <p className={styles.upgradeTitle}>Upgrade to Jatayu Pro</p>
            <p className={styles.upgradeCopy}>Unlock priority booking and exclusive expert access.</p>
            <button type="button" className={styles.upgradeBtn}>
              Upgrade Now
            </button>
          </div>
        )}

        <div className={styles.sidebarFooter}>
          <Link
            href={PROFILE_NAV.href}
            className={`${styles.navLink} ${styles.profileLink} ${
              isNavItemActive(PROFILE_NAV.id, pathname, PROFILE_NAV.href, currentHash)
                ? styles.navLinkActive
                : ""
            }`}
            title={isCollapsed ? PROFILE_NAV.label : undefined}
          >
            <User size={16} aria-hidden="true" />
            {!isCollapsed && <span className={styles.navLabelText}>{PROFILE_NAV.label}</span>}
          </Link>
          <button
            type="button"
            onClick={() => window.location.assign("/login")}
            className={`${styles.navLink} ${styles.logoutLink}`}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut size={16} aria-hidden="true" />
            {!isCollapsed && <span className={styles.navLabelText}>Logout</span>}
          </button>
        </div>
      </aside>

      <div className={styles.main}>
        <div
          className={`section-grid-wrap ${styles.gridWrap}`}
          style={
            {
              "--section-grid-line-color": "color-mix(in srgb, var(--ink) 10%, transparent)",
            } as CSSProperties
          }
        >
          <div className="section-grid-lines" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>

          <div className={styles.topBar}>
            <div className="container">
              <div className={styles.topBarInner}>
                <div className={styles.breadcrumbsSlot}>{breadcrumbs}</div>
                <NotificationPanel />
              </div>
            </div>
          </div>

          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
    </SeekerShellContext.Provider>
  );
}
