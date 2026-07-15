"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, type CSSProperties, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronRight,
  DollarSign,
  Inbox,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Star,
  User,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import { ExpertShellContext } from "@/components/expert/ExpertShellContext";
import {
  EXPERT_PROFILE,
  EXPERT_DASHBOARD_HREF,
  EXPERT_PROFILE_HREF,
  MAIN_NAV,
  SETTINGS_NAV,
  type ExpertNavItem,
} from "@/lib/expertDashboard";
import { getExpertProfile } from "@/lib/expertStore";
import styles from "./ExpertShell.module.css";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  profile: User,
  availability: CalendarDays,
  requests: Inbox,
  messages: MessageSquare,
  earnings: DollarSign,
  reviews: Star,
  settings: Settings,
} as const;

function isNavItemActive(id: string, pathname: string, href: string): boolean {
  const baseHref = href.split("#")[0];

  if (id === "dashboard") return pathname === EXPERT_DASHBOARD_HREF;
  if (id === "availability") return pathname.startsWith("/expert/availability");
  if (id === "requests") return pathname.startsWith("/expert/requests");
  if (id === "profile") return pathname.startsWith(EXPERT_PROFILE_HREF);
  return pathname === baseHref;
}

type ExpertShellProps = {
  children: ReactNode;
};

function NavLink({ item, pathname }: { item: ExpertNavItem; pathname: string }) {
  const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? LayoutDashboard;
  const isActive = isNavItemActive(item.id, pathname, item.href);

  return (
    <Link
      href={item.href}
      className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
    >
      <Icon size={16} aria-hidden="true" />
      {item.label}
      {item.badge ? <span className={styles.navBadge}>{item.badge}</span> : null}
    </Link>
  );
}

export default function ExpertShell({ children }: ExpertShellProps) {
  const pathname = usePathname();
  const [breadcrumbs, setBreadcrumbs] = useState<ReactNode | null>(null);
  const shellContext = useMemo(() => ({ setBreadcrumbs }), []);

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

    handleUpdate();

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
        <aside className={styles.sidebar} aria-label="Expert navigation">
          <Link href={EXPERT_DASHBOARD_HREF} className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">
              J
            </span>
            Jatayu
          </Link>
 
          <nav className={styles.navSection} aria-label="Main">
            {MAIN_NAV.map((item) => (
              <NavLink key={item.id} item={item} pathname={pathname} />
            ))}
          </nav>
 
          <div className={styles.navLabel}>Account</div>
          <nav className={styles.navSection} aria-label="Account">
            <NavLink item={SETTINGS_NAV} pathname={pathname} />
          </nav>
 
          <div className={styles.userCard}>
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
            <div className={styles.userMeta}>
              <span className={styles.userName}>{profile.name}</span>
              <span className={styles.userRole}>{profile.role}</span>
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
