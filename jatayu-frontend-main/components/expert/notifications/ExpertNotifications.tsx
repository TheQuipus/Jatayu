"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  CreditCard,
  MessageSquare,
  Star,
  UserRound,
} from "lucide-react";
import styles from "./ExpertNotifications.module.css";
import { fetchNotifications, readAllNotifications, readNotification, type AppNotification } from "@/lib/notificationApi";

type NotificationType = "request" | "message" | "session" | "payment" | "review" | "system";

type ExpertNotification = {
  id: string | number;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  group: "New" | "Earlier";
  unread: boolean;
  action?: string;
  secondaryAction?: string;
  href?: string | null;
};

type CategoryFilter = "all" | "requests_sessions" | "message" | "payment" | "review";

const ICONS = {
  request: UserRound,
  message: MessageSquare,
  session: CalendarClock,
  payment: CreditCard,
  review: Star,
  system: Bell,
};

const SUMMARY: { id: CategoryFilter; label: string; icon: typeof Bell; toneClass: string }[] = [
  { id: "all", label: "Total Alerts", icon: Bell, toneClass: "all" },
  { id: "requests_sessions", label: "Requests & Sessions", icon: CalendarClock, toneClass: "session" },
  { id: "message", label: "Messages", icon: MessageSquare, toneClass: "message" },
  { id: "payment", label: "Payments", icon: CreditCard, toneClass: "payment" },
  { id: "review", label: "Reviews", icon: Star, toneClass: "review" },
];

function mapNotification(item: AppNotification): ExpertNotification {
  const eventType = item.eventType || "";
  const bookingId = typeof item.data?.bookingId === "string" ? item.data.bookingId : undefined;
  const type: NotificationType = /^(booking\.)/.test(eventType)
    ? "request"
    : /^(session\.)/.test(eventType)
      ? "session"
      : /^(chat\.|message\.)/.test(eventType)
        ? "message"
        : /^(payment\.|payout\.|earning\.|settlement\.|refund\.)/.test(eventType)
          ? "payment"
          : /^(review\.)/.test(eventType)
            ? "review"
            : "system";
  const href = item.href || (bookingId ? `/expert/requests/${bookingId}/` : null);

  return {
    id: item.id,
    type,
    title: item.title,
    description: item.body,
    time: new Date(item.createdAt).toLocaleString(),
    group: Date.now() - new Date(item.createdAt).getTime() < 86400000 ? "New" : "Earlier",
    unread: !item.readAt,
    action: href ? "View details" : undefined,
    href,
  };
}

export default function ExpertNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<ExpertNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushUpdates, setPushUpdates] = useState(true);

  const readCount = Math.max(0, totalCount - unreadCount);

  const getCategoryCount = (id: CategoryFilter) => {
    if (id === "all") return totalCount;
    if (id === "requests_sessions") {
      return notifications.filter((n) => n.type === "request" || n.type === "session").length;
    }
    return notifications.filter((n) => n.type === id).length;
  };

  const visibleNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // 1. Read / Unread / All Filter
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "unread"
          ? notification.unread
          : !notification.unread;
      if (!matchesStatus) return false;

      // 2. Category Filter
      if (categoryFilter === "all") return true;
      if (categoryFilter === "requests_sessions") {
        return notification.type === "request" || notification.type === "session";
      }
      return notification.type === categoryFilter;
    });
  }, [categoryFilter, notifications, statusFilter]);

  useEffect(() => {
    fetchNotifications().then((data) => {
      setNotifications(data.items.map(mapNotification));
      setUnreadCount(data.unreadCount);
      setTotalCount(data.pagination?.total ?? data.items.length);
    }).catch(() => undefined);
    const receive = (event: Event) => {
      const incoming = mapNotification((event as CustomEvent<AppNotification>).detail);
      setNotifications((current) => current.some((item) => item.id === incoming.id) ? current : [incoming, ...current]);
      setUnreadCount((count) => count + (incoming.unread ? 1 : 0));
      setTotalCount((count) => count + 1);
    };
    window.addEventListener("jatayu:notification", receive); return () => window.removeEventListener("jatayu:notification", receive);
  }, []);

  const markRead = (id: string | number) => {
    const wasUnread = notifications.some((notification) => notification.id === id && notification.unread);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
    if (wasUnread) {
      const nextCount = Math.max(0, unreadCount - 1);
      setUnreadCount(nextCount);
      window.dispatchEvent(new CustomEvent("jatayu:notifications-changed", { detail: { unreadCount: nextCount } }));
    }
    void readNotification(String(id)).catch(() => undefined);
  };

  const viewDetails = (notification: ExpertNotification) => {
    markRead(notification.id);
    if (notification.href?.startsWith("/")) router.push(notification.href);
  };

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        {/* --------------------------------------------------
            1. HEADER AREA
        -------------------------------------------------- */}
        <header className={styles.header}>
          <div className={styles.headerText}>
            <p className={styles.pageSubtitle}>Stay informed about your sessions, clients, payments and account.</p>
            <h1 className={styles.pageTitle}>
              Notification <span className={styles.accentWord}>CENTER</span>
            </h1>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.markButton}
              onClick={() => {
                setNotifications((current) =>
                  current.map((notification) => ({ ...notification, unread: false }))
                );
                setUnreadCount(0);
                window.dispatchEvent(new CustomEvent("jatayu:notifications-changed", { detail: { unreadCount: 0 } }));
                void readAllNotifications().catch(() => undefined);
              }}
              disabled={!unreadCount}
            >
              <Check size={15} aria-hidden="true" /> Mark all read
            </button>
          </div>
        </header>

        {/* --------------------------------------------------
            2. KPI SUMMARY CARDS ROW (Clickable Filters)
        -------------------------------------------------- */}
        <div className={styles.summaryGrid} aria-label="Notification summary filters">
          {SUMMARY.map((item) => {
            const Icon = item.icon;
            const isActive = categoryFilter === item.id;
            const count = getCategoryCount(item.id);

            return (
              <button
                key={item.id}
                type="button"
                className={`${styles.stat} ${styles[item.toneClass]} ${isActive ? styles.statActive : ""}`}
                onClick={() => setCategoryFilter((current) => (current === item.id ? "all" : item.id))}
                aria-pressed={isActive}
              >
                <div className={styles.statHeader}>
                  <span className={styles.statLabel}>{item.label}</span>
                  <span className={styles.statIcon}>
                    <Icon size={16} aria-hidden="true" />
                  </span>
                </div>
                <div className={styles.statVal}>{count}</div>
              </button>
            );
          })}
        </div>

        {/* --------------------------------------------------
            3. MAIN FEED & RIGHT RAIL
        -------------------------------------------------- */}
        <div className={styles.layout}>
          <main className={styles.feed}>
            <nav className={styles.filters} aria-label="Filter by read status">
              <button
                type="button"
                aria-pressed={statusFilter === "all"}
                className={`${styles.filterBtn} ${statusFilter === "all" ? styles.filterActive : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                aria-pressed={statusFilter === "unread"}
                className={`${styles.filterBtn} ${statusFilter === "unread" ? styles.filterActive : ""}`}
                onClick={() => setStatusFilter("unread")}
              >
                Unread ({unreadCount})
              </button>
              <button
                type="button"
                aria-pressed={statusFilter === "read"}
                className={`${styles.filterBtn} ${statusFilter === "read" ? styles.filterActive : ""}`}
                onClick={() => setStatusFilter("read")}
              >
                Read ({readCount})
              </button>
            </nav>

            {(["New", "Earlier"] as const).map((group) => {
              const grouped = visibleNotifications.filter((notification) => notification.group === group);
              if (!grouped.length) return null;
              return (
                <section key={group} className={styles.group}>
                  <div className={styles.groupTitleRow}>
                    <div className={styles.sectionHeader}>
                      <span className={styles.sectionDot} />
                      <h2 className={styles.sectionTitle}>{group} Notifications</h2>
                    </div>
                    {group === "New" && unreadCount > 0 ? (
                      <span className={styles.unreadBadge}>{unreadCount} unread</span>
                    ) : null}
                  </div>
                  <div className={styles.list}>
                    {grouped.map((notification) => {
                      const Icon = ICONS[notification.type];
                      return (
                        <article
                          key={notification.id}
                          className={`${styles.notificationCard} ${styles[notification.type]} ${notification.unread ? styles.unread : ""}`}
                          onClick={() => markRead(notification.id)}
                        >
                          <span className={styles.notificationIcon}>
                            <Icon size={18} aria-hidden="true" />
                          </span>
                          <div className={styles.notificationCopy}>
                            <div className={styles.notificationTitleRow}>
                              <h3>{notification.title}</h3>
                              <time>{notification.time}</time>
                            </div>
                            <p>{notification.description}</p>
                            {(notification.action || notification.secondaryAction) && (
                              <div className={styles.notificationActions}>
                                {notification.action ? (
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      viewDetails(notification);
                                    }}
                                  >
                                    {notification.action}
                                  </button>
                                ) : null}
                                {notification.secondaryAction ? (
                                  <button
                                    type="button"
                                    className={styles.secondary}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      viewDetails(notification);
                                    }}
                                  >
                                    {notification.secondaryAction}
                                  </button>
                                ) : null}
                              </div>
                            )}
                          </div>
                          {notification.unread ? <span className={styles.unreadDot} aria-label="Unread" /> : null}
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            {!visibleNotifications.length ? (
              <div className={styles.empty}>
                <CheckCircle2 size={28} />
                <strong>You’re all caught up</strong>
                <span>No notifications match your current filter.</span>
              </div>
            ) : null}
          </main>

          <aside className={styles.rail}>
            <section className={styles.sideCard}>
              <div className={styles.sideHeading}>
                <div className={styles.sectionHeader} style={{ marginBottom: 4 }}>
                  <span className={styles.sectionDot} />
                  <h2 className={styles.sectionTitle}>Preferences</h2>
                </div>
                <h2>Notification settings</h2>
                <span>Choose how you’re notified</span>
              </div>
              <label className={styles.toggleRow}>
                <span className={styles.toggleRowText}>
                  <strong>Email updates</strong>
                  <small>Important activity summaries</small>
                </span>
                <input
                  type="checkbox"
                  checked={emailUpdates}
                  onChange={(event) => setEmailUpdates(event.target.checked)}
                />
                <i />
              </label>
              <label className={styles.toggleRow}>
                <span className={styles.toggleRowText}>
                  <strong>Push notifications</strong>
                  <small>Real-time alerts</small>
                </span>
                <input
                  type="checkbox"
                  checked={pushUpdates}
                  onChange={(event) => setPushUpdates(event.target.checked)}
                />
                <i />
              </label>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
