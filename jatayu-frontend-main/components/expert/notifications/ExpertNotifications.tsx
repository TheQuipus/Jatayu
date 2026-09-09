"use client";

import { useMemo, useState } from "react";
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

type NotificationType = "request" | "message" | "session" | "payment" | "review" | "system";

type ExpertNotification = {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  time: string;
  group: "New" | "Earlier";
  unread: boolean;
  action?: string;
  secondaryAction?: string;
};

type CategoryFilter = "all" | "requests_sessions" | "message" | "payment" | "review";

const INITIAL_NOTIFICATIONS: ExpertNotification[] = [
  { id: 1, type: "request", title: "New Session Request", description: "Riya Mehta has requested a 45-minute product strategy consultation for Tuesday morning.", time: "2 min ago", group: "New", unread: true, action: "Accept", secondaryAction: "View details" },
  { id: 2, type: "message", title: "New Message from Aarav Malhotra", description: "I’ve shared the revised brief. Could you take a quick look before our call?", time: "18 min ago", group: "New", unread: true, action: "Reply", secondaryAction: "Open chat" },
  { id: 3, type: "payment", title: "Payout Processed", description: "Your payout of ₹4,800 for Session #JT-2048 has been processed successfully.", time: "42 min ago", group: "New", unread: true, action: "View earnings" },
  { id: 4, type: "session", title: "Session Starts Soon", description: "Your session with Kabir Shah begins today at 4:30 PM. Join a few minutes early.", time: "1 hr ago", group: "New", unread: true, action: "View session" },
  { id: 5, type: "request", title: "Request Rescheduled", description: "Ananya Bose moved the career coaching session to Friday, 11:00 AM.", time: "2 hrs ago", group: "New", unread: true, action: "Review change" },
  { id: 6, type: "message", title: "New Message from Sneha Iyer", description: "Thank you for the resource list—it was exactly what I needed.", time: "Yesterday", group: "Earlier", unread: false },
  { id: 7, type: "review", title: "New 5-star Review", description: "Devika left a review: “Clear, practical advice and a very thoughtful session.”", time: "Yesterday", group: "Earlier", unread: false, action: "View review" },
  { id: 8, type: "system", title: "Complete Your Expert Profile", description: "Add a short introduction video to improve your profile visibility and trust score.", time: "2 days ago", group: "Earlier", unread: false, action: "Update profile" },
  { id: 9, type: "session", title: "Session Completed", description: "Your mentorship session with Neel Kapoor is now marked complete.", time: "3 days ago", group: "Earlier", unread: false },
  { id: 10, type: "payment", title: "Invoice Available", description: "Your invoice for the July payout cycle is ready to download.", time: "5 days ago", group: "Earlier", unread: false, action: "View invoice" },
  { id: 11, type: "message", title: "Follow-up from Ishaan", description: "Would you be available for another session next week?", time: "6 days ago", group: "Earlier", unread: false },
  { id: 12, type: "system", title: "Availability Reminder", description: "Your calendar has no open slots next week. Add availability to keep receiving requests.", time: "1 week ago", group: "Earlier", unread: false, action: "Add availability" },
];

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

export default function ExpertNotifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushUpdates, setPushUpdates] = useState(true);

  const unreadCount = notifications.filter((notification) => notification.unread).length;
  const readCount = notifications.length - unreadCount;

  const getCategoryCount = (id: CategoryFilter) => {
    if (id === "all") return notifications.length;
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

  const markRead = (id: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, unread: false } : notification
      )
    );
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
              onClick={() =>
                setNotifications((current) =>
                  current.map((notification) => ({ ...notification, unread: false }))
                )
              }
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
                All ({notifications.length})
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
                                      markRead(notification.id);
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
                                      markRead(notification.id);
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
