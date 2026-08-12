"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  Bell,
  CalendarDays,
  DollarSign,
  Inbox,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  User,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import { ExpertShellContext } from "@/components/expert/ExpertShellContext";
import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";
import {
  EXPERT_PROFILE,
  EXPERT_DASHBOARD_HREF,
  EXPERT_PROFILE_HREF,
  MAIN_NAV,
  SETTINGS_NAV,
  type ExpertNavItem,
} from "@/lib/expertDashboard";
import { getExpertProfile } from "@/lib/expertStore";
import { fetchExpertProfileData } from "@/lib/expertProfileApi";
import { clearAuthSession } from "@/lib/expertAuth";
import styles from "./ExpertShell.module.css";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  profile: User,
  availability: CalendarDays,
  requests: Inbox,
  notifications: Bell,
  earnings: DollarSign,
  reviews: Star,
  settings: Settings,
} as const;

function isNavItemActive(id: string, pathname: string, href: string, currentHash: string): boolean {
  const parts = href.split("#");
  const baseHref = parts[0];
  const itemHash = parts[1] ? `#${parts[1]}` : "";

  if (id === "dashboard") return pathname === EXPERT_DASHBOARD_HREF && !currentHash;
  if (id === "availability") return pathname.startsWith("/expert/availability/");
  if (id === "requests") return pathname.startsWith("/expert/requests/");
  if (id === "notifications") return pathname.startsWith("/expert/notifications/");
  if (id === "profile") return pathname.startsWith(EXPERT_PROFILE_HREF);

  if (itemHash) {
    return pathname === baseHref && currentHash === itemHash;
  }

  return pathname === baseHref;
}

type ExpertShellProps = {
  children: ReactNode;
};

function NavLink({
  item,
  pathname,
  currentHash,
  isCollapsed,
}: {
  item: ExpertNavItem;
  pathname: string;
  currentHash: string;
  isCollapsed?: boolean;
}) {
  const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? LayoutDashboard;
  const isActive = isNavItemActive(item.id, pathname, item.href, currentHash);

  return (
    <Link
      href={item.href}
      className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""} ${isCollapsed ? styles.navLinkCollapsed : ""
        }`}
      title={isCollapsed ? item.label : undefined}
    >
      <Icon size={16} aria-hidden="true" />
      {!isCollapsed && <span>{item.label}</span>}
      {item.badge ? (
        <span
          className={`${styles.navBadge} ${isCollapsed ? styles.navBadgeDot : ""}`}
          title={isCollapsed ? `${item.badge} unread` : undefined}
        >
          {isCollapsed ? "" : item.badge}
        </span>
      ) : null}
    </Link>
  );
}

export default function ExpertShell({ children }: ExpertShellProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<ReactNode | null>(null);
  const [currentHash, setCurrentHash] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
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

  const [profile, setProfile] = useState({
    name: EXPERT_PROFILE.name,
    role: EXPERT_PROFILE.role,
    avatar: EXPERT_PROFILE.avatar,
  });

  useEffect(() => {
    const handleUpdate = () => {
      const saved = getExpertProfile();
      setProfile({
        name: saved.name || EXPERT_PROFILE.name,
        role: saved.role || EXPERT_PROFILE.role,
        avatar: saved.avatar || EXPERT_PROFILE.avatar,
      });
    };

    void fetchExpertProfileData()
      .then((saved) => {
        setProfile({
          name: saved.name || EXPERT_PROFILE.name,
          role: saved.role || EXPERT_PROFILE.role,
          avatar: saved.avatar || EXPERT_PROFILE.avatar,
        });
      })
      .catch(handleUpdate);

    if (typeof window !== "undefined") {
      window.addEventListener("expert-profile-updated", handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("expert-profile-updated", handleUpdate);
      }
    };
  }, []);

  return (
    <ExpertShellContext.Provider value={shellContext}>
      <div className={styles.shell}>
        <aside
          className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}
          aria-label="Expert navigation"
        >
          <div className={styles.brandRow}>
            <Link
              href={EXPERT_DASHBOARD_HREF}
              className={styles.brand}
              title="Jatayu Expert"
            >
              <span className={styles.brandMark} aria-hidden="true">
                J
              </span>
              {!isCollapsed && <span>Jatayu</span>}
            </Link>
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              className={styles.collapseToggleBtn}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          {!isCollapsed && <div className={styles.navLabel}>MAIN MENU</div>}
          <nav className={styles.navSection} aria-label="Main">
            {MAIN_NAV.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                pathname={pathname}
                currentHash={currentHash}
                isCollapsed={isCollapsed}
              />
            ))}
          </nav>

          {!isCollapsed && <div className={styles.navLabel}>Account</div>}
          <nav className={styles.navSection} aria-label="Account">
            <NavLink
              item={SETTINGS_NAV}
              pathname={pathname}
              currentHash={currentHash}
              isCollapsed={isCollapsed}
            />
          </nav>

          <div
            className={`${styles.userCard} ${isCollapsed ? styles.userCardCollapsed : ""
              }`}
          >
            {profile.avatar.startsWith("blob:") || profile.avatar.startsWith("data:") ? (
              <img
                src={profile.avatar}
                alt={profile.name}
                className={styles.userAvatar}
                style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
              />
            ) : (
              <Image
                src={profile.avatar}
                alt={profile.name}
                width={36}
                height={36}
                className={styles.userAvatar}
              />
            )}
            {!isCollapsed && (
              <div className={styles.userMeta}>
                <span className={styles.userName}>{profile.name}</span>
                <span className={styles.userRole}>{profile.role}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                window.location.assign(EXPERT_LOGIN_HREF);
              }}
              className={styles.userMenuBtn}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={20} aria-hidden="true" />
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
    </ExpertShellContext.Provider>
  );
}
