"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import {
  Bookmark,
  CalendarDays,
  Compass,
  Headphones,
  Home,
  LogOut,
  Ticket,
  User,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import RealtimeNotificationToast from "@/components/ui/RealtimeNotificationToast";
import { SeekerShellContext } from "@/components/seeker/SeekerShellContext";
import { MAIN_NAV, PROFILE_NAV, QUICK_LINKS, SEEKER_PROFILE } from "@/lib/seekerDashboard";
import {
  fetchSeekerProfileData,
  formatCategoryLabel,
  getStoredSeekerProfile,
  SEEKER_PROFILE_UPDATED_EVENT,
} from "@/lib/seekerProfileApi";
import { clearSeekerAuthSession } from "@/lib/seekerAuth";
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
  if (id === "support") return normPathname.startsWith("/seeker/support/");

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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("seeker_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [currentHash, setCurrentHash] = useState("");
  const shellContext = useMemo(() => ({ setBreadcrumbs }), []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("seeker_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const [profile, setProfile] = useState({
    name: SEEKER_PROFILE.name,
    avatar: SEEKER_PROFILE.avatar,
    category: "",
    isPro: SEEKER_PROFILE.isPro,
  });
  const [failedAvatar, setFailedAvatar] = useState<string | null>(null);

  const initials = useMemo(() => {
    const parts = (profile.name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    return parts.slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  }, [profile.name]);

  const hasValidPhoto = Boolean(
    profile.avatar &&
      profile.avatar.trim() &&
      profile.avatar !== "/assets/img/profile-placeholder.svg" &&
      failedAvatar !== profile.avatar,
  );

  useEffect(() => {
    const handleUpdate = () => {
      const stored = getStoredSeekerProfile();
      setProfile({
        name: stored.name || SEEKER_PROFILE.name,
        avatar: stored.avatar || SEEKER_PROFILE.avatar,
        category: stored.category || "",
        isPro: stored.isPro ?? SEEKER_PROFILE.isPro,
      });
    };

    handleUpdate();

    void fetchSeekerProfileData()
      .then((saved) => {
        setProfile({
          name: saved.name || SEEKER_PROFILE.name,
          avatar: saved.avatar || SEEKER_PROFILE.avatar,
          category: saved.category || "",
          isPro: saved.isPro ?? SEEKER_PROFILE.isPro,
        });
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
      window.addEventListener(SEEKER_PROFILE_UPDATED_EVENT, handleUpdate);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(SEEKER_PROFILE_UPDATED_EVENT, handleUpdate);
      }
    };
  }, []);

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

  const handleLogout = () => {
    clearSeekerAuthSession();
    window.location.assign("/login");
  };

  return (
    <SeekerShellContext.Provider value={shellContext}>
      <RealtimeNotificationToast />
      <div className={`${styles.shell} ${isCollapsed ? styles.shellCollapsed : ""}`.trim()}>
        <aside
          className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`.trim()}
          aria-label="Seeker navigation"
        >
          <div
            className={`${styles.brandContainer} ${
              isCollapsed ? styles.brandContainerCollapsed : ""
            }`}
          >
            <Link
              href="/seeker/dashboard"
              className={`${styles.brand} ${isCollapsed ? styles.brandCollapsed : ""}`}
              title="Jatayu"
            >
              <span className={styles.brandMark} aria-hidden="true">
                J
              </span>
              {!isCollapsed && <span className={styles.brandText}>Jatayu</span>}
            </Link>
            <button
              type="button"
              className={`${styles.collapseBtn} ${
                isCollapsed ? styles.collapseBtnCollapsed : ""
              }`}
              onClick={handleToggleCollapse}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
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
                  className={`${styles.navLink} ${isNavItemActive(item.id, pathname, item.href, currentHash) ? styles.navLinkActive : ""
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon size={16} aria-hidden="true" />
                  {!isCollapsed && <span className={styles.navLabelText}>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div
            className={`${styles.userCard} ${
              isCollapsed ? styles.userCardCollapsed : ""
            }`}
          >
            <Link
              href={PROFILE_NAV.href}
              className={`${styles.userAvatarLink} ${
                isCollapsed ? styles.userAvatarLinkCollapsed : ""
              }`}
              title={profile.name}
            >
              {hasValidPhoto ? (
                profile.avatar.startsWith("blob:") || profile.avatar.startsWith("data:") ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className={styles.userAvatar}
                    style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                    onError={() => setFailedAvatar(profile.avatar)}
                  />
                ) : (
                  <Image
                    src={profile.avatar}
                    alt={profile.name}
                    width={36}
                    height={36}
                    className={styles.userAvatar}
                    onError={() => setFailedAvatar(profile.avatar)}
                  />
                )
              ) : initials ? (
                <div className={styles.userAvatarInitials} aria-hidden="true">
                  {initials}
                </div>
              ) : (
                <div className={styles.userAvatarPlaceholder} aria-hidden="true">
                  <User size={18} />
                </div>
              )}
            </Link>
            {!isCollapsed && (
              <Link href={PROFILE_NAV.href} className={styles.userMeta}>
                <span className={styles.userName}>{profile.name}</span>
                <span className={styles.userRole}>
                  {formatCategoryLabel(profile.category)}
                </span>
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className={`${styles.userMenuBtn} ${
                isCollapsed ? styles.userMenuBtnCollapsed : ""
              }`}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={isCollapsed ? 18 : 20} aria-hidden="true" />
            </button>
          </div>
        </aside>

        <div className={styles.main}>
          <div className={`section-grid-wrap ${styles.gridWrap}`}>
            {(!pathname?.startsWith("/seeker/expert/") || pathname?.includes("/checkout")) && (
              <div className="section-grid-lines" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
            )}

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
