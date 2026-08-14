"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Settings,
  UserCheck,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import { useExpertApplications } from "@/hooks/useExpertApplications";
import {
  ADMIN_DASHBOARD_HREF,
  ADMIN_EXPERT_PATH_PREFIXES,
  ADMIN_NAV,
  ADMIN_SETTINGS_HREF,
  type AdminNavItem,
} from "@/lib/adminDashboard";
import { getAdminMe, removeAdminToken, type AdminAuthUser } from "@/lib/api";
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

function NavLink({ item, pathname, isCollapsed }: { item: AdminNavItem; pathname: string; isCollapsed?: boolean }) {
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
      title={isCollapsed ? item.label : undefined}
    >
      <Icon size={16} aria-hidden="true" />
      {!isCollapsed && <span className={styles.navLabelText}>{item.label}</span>}
      {!isCollapsed && (item.badge ? (
        <span className={`${styles.navBadge} ${badgeClass}`}>{item.badge}</span>
      ) : item.badgeLabel ? (
        <span className={`${styles.navBadge} ${badgeClass}`}>{item.badgeLabel}</span>
      ) : null)}
    </Link>
  );
}

function SettingsNavGroup({ pathname, isCollapsed }: { pathname: string; isCollapsed?: boolean }) {
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
        className={`${styles.navLink} ${styles.navLinkToggle} ${settingsActive || expanded ? styles.navLinkParentActive : ""
          }`}
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls="admin-settings-subnav"
        title={isCollapsed ? "Settings" : undefined}
      >
        <Settings size={16} aria-hidden="true" />
        {!isCollapsed && <span className={styles.navLabelText}>Settings</span>}
        {!isCollapsed && (
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={`${styles.navChevron} ${expanded ? styles.navChevronOpen : ""}`}
          />
        )}
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
                title={isCollapsed ? section.label : undefined}
              >
                {isCollapsed ? section.label.slice(0, 3) : section.label}
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
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminAuthUser | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    getAdminMe()
      .then((user) => {
        if (active) setAdminUser(user);
      })
      .catch(() => {
        if (active) setAdminUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const navItems = ADMIN_NAV.map((item) =>
    item.id === "expert" && mounted && ready && pendingCount > 0
      ? { ...item, badge: pendingCount, badgeVariant: "red" as const }
      : item,
  );

  return (
    <div className={`${styles.shell} ${isCollapsed ? styles.shellCollapsed : ""}`.trim()}>
      <aside
        className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`.trim()}
        aria-label="Admin navigation"
      >
        <div className={styles.brandContainer}>
          {!isCollapsed ? (
            <>
              <Link href={ADMIN_DASHBOARD_HREF} className={styles.brand}>
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

        <nav className={styles.navSection} aria-label="Admin">
          {navItems.map((item) => (
            <NavLink key={item.id} item={item} pathname={pathname} isCollapsed={isCollapsed} />
          ))}
          <SettingsNavGroup pathname={pathname} isCollapsed={isCollapsed} />
        </nav>

        <div
          className={`${styles.userCard} ${isCollapsed ? styles.userCardCollapsed : ""}`.trim()}
        >
          <Image
            src="/assets/img/manportrait.png"
            alt={adminUser?.fullName || "Admin"}
            width={36}
            height={36}
            className={styles.userAvatar}
          />
          {!isCollapsed && (
            <div className={styles.userMeta}>
              <span className={styles.userName}>
                {adminUser?.fullName?.split(" ")[0] || "Admin"}
              </span>
              <span className={styles.userRole}>{adminUser?.role || "Administrator"}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              removeAdminToken();
              window.location.assign("/admin");
            }}
            className={styles.userMenuBtn}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut size={isCollapsed ? 18 : 20} aria-hidden="true" />
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
