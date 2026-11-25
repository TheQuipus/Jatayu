"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Award,
  Bell,
  CalendarDays,
  DollarSign,
  Headphones,
  Inbox,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Star,
  User,
  X,
} from "lucide-react";
import NotificationPanel from "@/components/seeker/NotificationPanel";
import RealtimeNotificationToast from "@/components/ui/RealtimeNotificationToast";
import ActiveSessionAttention from "@/components/expert/ActiveSessionAttention";
import { ExpertShellContext } from "@/components/expert/ExpertShellContext";
import { EXPERT_LOGIN_HREF } from "@/lib/joinAsExpertNav";
import {
  EXPERT_PROFILE,
  EXPERT_DASHBOARD_HREF,
  EXPERT_PROFILE_HREF,
  MAIN_NAV,
  SETTINGS_NAV,
  type ExpertNavItem,
  UNAPPROVED_RESTRICTION_TOOLTIP,
  isNavRestrictedForExpert,
} from "@/lib/expertDashboard";
import { getExpertProfile } from "@/lib/expertStore";
import { fetchExpertProfileData, fetchExpertProfileRecord } from "@/lib/expertProfileApi";
import { clearAuthSession, getStoredAuthUser } from "@/lib/expertAuth";
import { getStoredRequests } from "@/lib/expertRequests";
import { getExpertRequests, getExpertToken } from "@/lib/api";
import { fetchNotificationUnreadCount } from "@/lib/notificationApi";
import {
  getMySupportSummary,
  MY_SUPPORT_TICKETS_UPDATED_EVENT,
} from "@/lib/supportApi";
import styles from "./ExpertShell.module.css";

const NAV_ICONS = {
  dashboard: LayoutDashboard,
  profile: User,
  availability: CalendarDays,
  requests: Inbox,
  notifications: Bell,
  support: Headphones,
  earnings: DollarSign,
  reviews: Star,
  achievements: Award,
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
  if (id === "support") return pathname.startsWith("/expert/support/");
  if (id === "profile") return pathname.startsWith(EXPERT_PROFILE_HREF);
  if (id === "achievements") return pathname.startsWith("/expert/achievements/");
  if (id === "settings") return pathname.startsWith("/expert/settings/");

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
  isApproved,
}: {
  item: ExpertNavItem;
  pathname: string;
  currentHash: string;
  isCollapsed?: boolean;
  isApproved: boolean;
}) {
  const Icon = NAV_ICONS[item.id as keyof typeof NAV_ICONS] ?? LayoutDashboard;
  const isActive = isNavItemActive(item.id, pathname, item.href, currentHash);
  const isRestricted = isNavRestrictedForExpert(item.id, isApproved);
  const itemRef = useRef<HTMLDivElement | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number } | null>(null);

  const handleMouseEnter = () => {
    if (!itemRef.current) return;
    const rect = itemRef.current.getBoundingClientRect();
    setTooltipPos({
      top: rect.top + rect.height / 2,
      left: rect.right + 12,
    });
  };

  const handleMouseLeave = () => {
    setTooltipPos(null);
  };

  if (isRestricted) {
    return (
      <div
        ref={itemRef}
        className={styles.navItemWrapper}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          disabled
          aria-disabled="true"
          className={`${styles.navLink} ${styles.navLinkRestricted} ${isCollapsed ? styles.navLinkCollapsed : ""}`}
        >
          <Icon size={16} aria-hidden="true" />
          {!isCollapsed && <span>{item.label}</span>}
        </button>
        {tooltipPos && typeof document !== "undefined"
          ? createPortal(
              <div
                className={styles.navPortalTooltip}
                role="tooltip"
                style={{ top: tooltipPos.top, left: tooltipPos.left }}
              >
                {UNAPPROVED_RESTRICTION_TOOLTIP}
              </div>,
              document.body
            )
          : null}
      </div>
    );
  }

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
          className={`${styles.navBadge} ${
            (item as ExpertNavItem & { badgeVariant?: "red" }).badgeVariant === "red"
              ? styles.navBadgeRed
              : ""
          } ${isCollapsed ? styles.navBadgeDot : ""}`}
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
  const router = useRouter();
  const [breadcrumbs, setBreadcrumbs] = useState<ReactNode | null>(null);
  const [currentHash, setCurrentHash] = useState("");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("expert_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);
  const shellContext = useMemo(() => ({ setBreadcrumbs }), []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("expert_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

  const [isApproved, setIsApproved] = useState<boolean>(() => {
    const stored = getStoredAuthUser();
    return stored?.status === "approved";
  });

  const [requestsBadgeCount, setRequestsBadgeCount] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const list = getStoredRequests();
      return list.length;
    }
    return 0;
  });
  const [notificationUnreadCount, setNotificationUnreadCount] = useState(0);
  const [supportResponseCount, setSupportResponseCount] = useState(0);

  useEffect(() => {
    let active = true;
    fetchExpertProfileRecord()
      .then((record) => {
        if (active) {
          const approved = record.status === "approved";
          setIsApproved(approved);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch expert profile record for shell:", err);
      });

    return () => {
      active = false;
    };
  }, []);

  // Route guard: if expert is unapproved and visits a restricted route, redirect with a message
  useEffect(() => {
    if (isApproved) {
      setBannerNotice(null);
      return;
    }

    const restrictedRoutePrefixes = [
      "/expert/availability",
      "/expert/requests",
      "/expert/earnings",
      "/expert/reviews",
      "/expert/achievements",
      "/expert/notifications",
      "/expert/settings",
    ];

    const isRestricted = restrictedRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
    if (isRestricted) {
      setBannerNotice(
        "You cannot access that section yet. All operational sections will become available once your profile application is approved."
      );
      router.replace(EXPERT_DASHBOARD_HREF);
    }
  }, [pathname, isApproved, router]);

  useEffect(() => {
    let isSubscribed = true;
    getExpertRequests({ status: "all", page: 1, limit: 20, sort: "newest" })
      .then((res) => {
        if (isSubscribed) {
          setRequestsBadgeCount(res.counts?.all ?? res.pagination.total);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch dynamic requests count for shell:", err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [pathname]);

  useEffect(() => {
    let isSubscribed = true;
    const refreshCount = () => {
      void fetchNotificationUnreadCount()
        .then((count) => {
          if (isSubscribed) setNotificationUnreadCount(count);
        })
        .catch((err) => console.error("Failed to fetch notification count for shell:", err));
    };
    const handleChanged = (event: Event) => {
      const count = (event as CustomEvent<{ unreadCount?: number }>).detail?.unreadCount;
      if (typeof count === "number") setNotificationUnreadCount(Math.max(0, count));
      else refreshCount();
    };
    refreshCount();
    window.addEventListener("jatayu:notification", refreshCount);
    window.addEventListener("jatayu:notifications-changed", handleChanged);
    return () => {
      isSubscribed = false;
      window.removeEventListener("jatayu:notification", refreshCount);
      window.removeEventListener("jatayu:notifications-changed", handleChanged);
    };
  }, []);

  useEffect(() => {
    if (!getExpertToken()) return;
    let isSubscribed = true;

    const refreshSupportBadge = () => {
      if (!getExpertToken()) return;
      getMySupportSummary("/expert/support/")
        .then((res) => {
          if (isSubscribed) setSupportResponseCount(res.responseReceivedCount);
        })
        .catch(() => {});
    };

    refreshSupportBadge();
    window.addEventListener("focus", refreshSupportBadge);
    window.addEventListener(MY_SUPPORT_TICKETS_UPDATED_EVENT, refreshSupportBadge);
    window.addEventListener("jatayu:notification", refreshSupportBadge);

    return () => {
      isSubscribed = false;
      window.removeEventListener("focus", refreshSupportBadge);
      window.removeEventListener(MY_SUPPORT_TICKETS_UPDATED_EVENT, refreshSupportBadge);
      window.removeEventListener("jatayu:notification", refreshSupportBadge);
    };
  }, []);

  const dynamicMainNav = useMemo(() => {
    return MAIN_NAV.map((item) => {
      if (item.id === "requests") {
        return {
          ...item,
          badge: requestsBadgeCount,
        };
      }
      if (item.id === "notifications") return { ...item, badge: notificationUnreadCount };
      if (item.id === "support" && supportResponseCount > 0) {
        return {
          ...item,
          badge: supportResponseCount > 99 ? "99+" : supportResponseCount,
          badgeVariant: "red" as const,
        };
      }
      return item;
    });
  }, [notificationUnreadCount, requestsBadgeCount, supportResponseCount]);

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
      <RealtimeNotificationToast />
      <div className={styles.shell}>
        <aside
          className={`${styles.sidebar} ${isCollapsed ? styles.sidebarCollapsed : ""}`}
          aria-label="Expert navigation"
        >
          <div
            className={`${styles.brandRow} ${
              isCollapsed ? styles.brandRowCollapsed : ""
            }`}
          >
            <Link
              href={EXPERT_DASHBOARD_HREF}
              className={`${styles.brand} ${isCollapsed ? styles.brandCollapsed : ""}`}
              title="Jatayu Expert"
            >
              <span className={styles.brandMark} aria-hidden="true">
                J
              </span>
              {!isCollapsed && <span>Jatayu</span>}
            </Link>
            <button
              type="button"
              onClick={handleToggleCollapse}
              className={`${styles.collapseToggleBtn} ${
                isCollapsed ? styles.collapseToggleBtnCollapsed : ""
              }`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
          </div>

          <nav className={styles.navSection} aria-label="Main">
            {dynamicMainNav.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                pathname={pathname}
                currentHash={currentHash}
                isCollapsed={isCollapsed}
                isApproved={isApproved}
              />
            ))}
            <NavLink
              item={SETTINGS_NAV}
              pathname={pathname}
              currentHash={currentHash}
              isCollapsed={isCollapsed}
              isApproved={isApproved}
            />
          </nav>

          <div
            className={`${styles.userCard} ${
              isCollapsed ? styles.userCardCollapsed : ""
            }`}
          >
            <Link
              href={EXPERT_PROFILE_HREF}
              className={`${styles.userAvatarLink} ${
                isCollapsed ? styles.userAvatarLinkCollapsed : ""
              }`}
              title={profile.name || "Expert Profile"}
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
              <Link href={EXPERT_PROFILE_HREF} className={styles.userMeta} title={profile.name}>
                <span className={styles.userName}>{profile.name}</span>
                <span className={styles.userRole}>{profile.role}</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                clearAuthSession();
                window.location.assign(EXPERT_LOGIN_HREF);
              }}
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

            <div className={styles.content}>
              {bannerNotice && (
                <div className={styles.restrictionBanner} role="alert">
                  <div className={styles.restrictionBannerInner}>
                    <AlertCircle size={18} aria-hidden="true" />
                    <span>{bannerNotice}</span>
                  </div>
                  <button
                    type="button"
                    className={styles.restrictionBannerClose}
                    onClick={() => setBannerNotice(null)}
                    aria-label="Dismiss notice"
                    title="Dismiss notice"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {children}
            </div>
          </div>
        </div>
        <ActiveSessionAttention />
      </div>
    </ExpertShellContext.Provider>
  );
}
