"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  Bookmark,
  CalendarDays,
  Compass,
  Crown,
  Headphones,
  Home,
  MessageSquare,
  Ticket,
  User,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import { SeekerShellContext } from "@/components/seeker/SeekerShellContext";
import { MAIN_NAV, PROFILE_NAV, QUICK_LINKS } from "@/lib/seekerDashboard";
import styles from "./SeekerShell.module.css";

const NAV_ICONS = {
  home: Home,
  discover: Compass,
  bookings: CalendarDays,
  messages: MessageSquare,
  profile: User,
  tickets: Ticket,
  support: Headphones,
  saved: Bookmark,
} as const;

function isNavItemActive(id: string, pathname: string, href: string): boolean {
  const baseHref = href.split("#")[0];

  if (id === "home") return pathname === "/seeker/dashboard";
  if (id === "discover") {
    return pathname.startsWith("/seeker/discover") || pathname.startsWith("/seeker/expert");
  }
  if (id === "bookings") return pathname.startsWith("/seeker/bookings");
  if (id === "profile") return pathname.startsWith("/seeker/profile");
  if (id === "saved") return pathname.startsWith("/seeker/bookmark");

  return pathname === baseHref;
}

type SeekerShellProps = {
  children: ReactNode;
};

export default function SeekerShell({ children }: SeekerShellProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<ReactNode | null>(null);
  const shellContext = useMemo(() => ({ setBreadcrumbs }), []);

  return (
    <SeekerShellContext.Provider value={shellContext}>
      <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Seeker navigation">
        <Link href="/seeker/dashboard" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            J
          </span>
          Jatayu
        </Link>

        <nav className={styles.navSection} aria-label="Main">
          {MAIN_NAV.map((item) => {
            const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? Home;
            const isActive = isNavItemActive(item.id, pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
                {item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
              </Link>
            );
          })}
        </nav>

        <div className={styles.navLabel}>Quick Links</div>
        <nav className={styles.navSection} aria-label="Quick links">
          {QUICK_LINKS.map((item) => {
            const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? Bookmark;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navLink} ${
                  isNavItemActive(item.id, pathname, item.href) ? styles.navLinkActive : ""
                }`}
              >
                <Icon size={16} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.upgradeCard}>
          <Crown size={18} aria-hidden="true" />
          <p className={styles.upgradeTitle}>Upgrade to Jatayu Pro</p>
          <p className={styles.upgradeCopy}>Unlock priority booking and exclusive expert access.</p>
          <button type="button" className={styles.upgradeBtn}>
            Upgrade Now
          </button>
        </div>

        <Link
          href={PROFILE_NAV.href}
          className={`${styles.navLink} ${styles.profileLink} ${
            isNavItemActive(PROFILE_NAV.id, pathname, PROFILE_NAV.href)
              ? styles.navLinkActive
              : ""
          }`}
        >
          <User size={16} aria-hidden="true" />
          {PROFILE_NAV.label}
        </Link>
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
