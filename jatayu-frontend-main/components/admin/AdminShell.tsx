"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Settings,
  UserCheck,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import { useExpertApplications } from "@/hooks/useExpertApplications";
import {
  ADMIN_DASHBOARD_HREF,
  ADMIN_EXPERT_PATH_PREFIXES,
  ADMIN_NAV,
  ADMIN_PROFILE,
  ADMIN_SETTINGS_HREF,
  type AdminNavItem,
} from "@/lib/adminDashboard";
import {
  SETTINGS_SECTIONS,
  getSettingsSectionHref,
} from "@/lib/adminSettings";
import styles from "./AdminShell.module.css";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  expert: UserCheck,
} as const;

type AdminShellProps = {
  children: ReactNode;
};

function normalizeAdminPath(path: string): string {
  const trimmed = path.replace(/\/$/, "");
  return trimmed || "/";
}

function isNavActive(pathname: string, itemId: string, href: string): boolean {
  const path = normalizeAdminPath(pathname);
  const normalizedHref = normalizeAdminPath(href);

  if (itemId === "dashboard") {
    return path === normalizeAdminPath(ADMIN_DASHBOARD_HREF);
  }

  if (itemId === "expert") {
    return ADMIN_EXPERT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
  }

  return path.startsWith(normalizedHref);
}

function NavLink({ item, pathname }: { item: AdminNavItem; pathname: string }) {
  const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? LayoutDashboard;
  const active = isNavActive(pathname, item.id, item.href);
  const badgeClass =
    item.badgeVariant === "red"
      ? styles.navBadgeRed
      : "";

  return (
    <Link
      href={item.href}
      className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
    >
      <Icon size={16} aria-hidden="true" />
      {item.label}
      {item.badge ? (
        <span className={`${styles.navBadge} ${badgeClass}`}>{item.badge}</span>
      ) : item.badgeLabel ? (
        <span className={`${styles.navBadge} ${badgeClass}`}>{item.badgeLabel}</span>
      ) : null}
    </Link>
  );
}

function SettingsNavGroup({ pathname }: { pathname: string }) {
  const path = normalizeAdminPath(pathname);
  const settingsActive = path.startsWith(normalizeAdminPath(ADMIN_SETTINGS_HREF));
  const [expanded, setExpanded] = useState(settingsActive);

  useEffect(() => {
    setExpanded(settingsActive);
  }, [settingsActive]);

  return (
    <div className={styles.navGroup}>
      <button
        type="button"
        className={`${styles.navLink} ${styles.navLinkToggle} ${
          settingsActive || expanded ? styles.navLinkParentActive : ""
        }`}
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls="admin-settings-subnav"
      >
        <Settings size={16} aria-hidden="true" />
        Settings
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`${styles.navChevron} ${expanded ? styles.navChevronOpen : ""}`}
        />
      </button>
      {expanded ? (
        <div
          id="admin-settings-subnav"
          className={styles.navSubList}
          role="group"
          aria-label="Settings sections"
        >
          {SETTINGS_SECTIONS.map((section) => {
            const href = getSettingsSectionHref(section.id);
            const subActive = path === normalizeAdminPath(href);

            return (
              <Link
                key={section.id}
                href={href}
                className={`${styles.navSubLink} ${subActive ? styles.navSubLinkActive : ""}`}
                aria-current={subActive ? "page" : undefined}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const { ready, pendingCount } = useExpertApplications();

  const navItems = ADMIN_NAV.map((item) =>
    item.id === "expert" && ready && pendingCount > 0
      ? { ...item, badge: pendingCount, badgeVariant: "red" as const }
      : item,
  );

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar} aria-label="Admin navigation">
        <Link href={ADMIN_DASHBOARD_HREF} className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            J
          </span>
          Jatayu
        </Link>

        <nav className={styles.navSection} aria-label="Admin">
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} pathname={pathname} />
          ))}
          <SettingsNavGroup pathname={pathname} />
        </nav>

        <div className={styles.userCard}>
          <Image
            src={ADMIN_PROFILE.avatar}
            alt={ADMIN_PROFILE.name}
            width={36}
            height={36}
            className={styles.userAvatar}
          />
          <div className={styles.userMeta}>
            <span className={styles.userName}>{ADMIN_PROFILE.shortName}</span>
            <span className={styles.userRole}>{ADMIN_PROFILE.role}</span>
          </div>
          <button type="button" className={styles.userMenuBtn} aria-label="Account menu">
            <ChevronRight size={14} aria-hidden="true" />
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
                <div className={styles.breadcrumbsSlot} />
                <NotificationPanel />
              </div>
            </div>
          </div>

          <div className={styles.content}>{children}</div>
        </div>
      </div>
    </div>
  );
}
