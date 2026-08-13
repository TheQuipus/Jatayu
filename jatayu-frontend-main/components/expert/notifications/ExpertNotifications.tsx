"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  MessageSquare,
  Settings,
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

const FILTERS: { id: "all" | NotificationType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "request", label: "Requests" },
  { id: "message", label: "Messages" },
  { id: "session", label: "Sessions" },
  { id: "payment", label: "Payments" },
  { id: "review", label: "Reviews" },
];

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

const SUMMARY = [
  { label: "Total", value: 12, type: "request" as NotificationType },
  { label: "Requests", value: 3, type: "message" as NotificationType },
  { label: "Messages", value: 5, type: "review" as NotificationType },
  { label: "Sessions", value: 2, type: "payment" as NotificationType },
  { label: "Payments", value: 1, type: "session" as NotificationType },
  { label: "Reviews", value: 1, type: "system" as NotificationType },
];

export default function ExpertNotifications() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | NotificationType>("all");
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [pushUpdates, setPushUpdates] = useState(true);

  const visibleNotifications = useMemo(
    () => notifications.filter((notification) => filter === "all" || notification.type === filter),
    [filter, notifications],
  );

  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const markRead = (id: number) => {
    setNotifications((current) =>
      current.map((notification) => notification.id === id ? { ...notification, unread: false } : notification),
    );
  };

  return (
    <section className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <header className={styles.header}>
          <div>
            <h1>Notification Center</h1>
            <p>Stay informed about your sessions, clients, payments and account.</p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.markButton}
              onClick={() =>
                setNotifications((current) =>
                  current.map((notification) => ({ ...notification, unread: false })),
                )
              }
              disabled={!unreadCount}
            >
              <Check size={15} aria-hidden="true" /> Mark all read
            </button>
            <Link href="/expert/dashboard/#settings" className={styles.settingsButton}>
              <Settings size={15} aria-hidden="true" /> Preferences
            </Link>
          </div>
        </header>

        <div className={styles.summary} aria-label="Notification summary">
          {SUMMARY.map((item) => {
            const Icon = ICONS[item.type];
            return (
              <article key={item.label} className={`${styles.stat} ${styles[item.type]}`}>
                <span className={styles.statIcon}><Icon size={15} aria-hidden="true" /></span>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            );
          })}
        </div>

        <div className={styles.layout}>
          <main className={styles.feed}>
            <nav className={styles.filters} aria-label="Filter notifications">
              {FILTERS.map((item) => (
                <button key={item.id} type="button" aria-pressed={filter === item.id} className={filter === item.id ? styles.active : ""} onClick={() => setFilter(item.id)}>
                  {item.label}
                </button>
              ))}
            </nav>

            {(["New", "Earlier"] as const).map((group) => {
              const grouped = visibleNotifications.filter((notification) => notification.group === group);
              if (!grouped.length) return null;
              return (
                <section key={group} className={styles.group}>
                  <div className={styles.groupTitle}>
                    <h2>{group}</h2>
                    {group === "New" && unreadCount > 0 ? <span>{unreadCount} unread</span> : null}
                  </div>
                  <div className={styles.list}>
                    {grouped.map((notification) => {
                      const Icon = ICONS[notification.type];
                      return (
                        <article key={notification.id} className={`${styles.notificationCard} ${styles[notification.type]} ${notification.unread ? styles.unread : ""}`} onClick={() => markRead(notification.id)}>
                          <span className={styles.notificationIcon}><Icon size={17} aria-hidden="true" /></span>
                          <div className={styles.notificationCopy}>
                            <div className={styles.notificationTitleRow}>
                              <h3>{notification.title}</h3>
                              <time>{notification.time}</time>
                            </div>
                            <p>{notification.description}</p>
                            {(notification.action || notification.secondaryAction) && (
                              <div className={styles.notificationActions}>
                                {notification.action ? <button type="button" onClick={(event) => { event.stopPropagation(); markRead(notification.id); }}>{notification.action}</button> : null}
                                {notification.secondaryAction ? <button type="button" className={styles.secondary} onClick={(event) => { event.stopPropagation(); markRead(notification.id); }}>{notification.secondaryAction}</button> : null}
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
              <div className={styles.empty}><CheckCircle2 size={24} /><strong>You’re all caught up</strong><span>No notifications match this filter.</span></div>
            ) : null}
          </main>

          <aside className={styles.rail}>
            <section className={styles.sideCard}>
              <div className={styles.sideHeading}><h2>Quick actions</h2><span>Useful shortcuts</span></div>
              <Link href="/expert/messages/"><MessageSquare size={15} /><span><strong>Open messages</strong><small>5 recent conversations</small></span><b>›</b></Link>
              <Link href="/expert/requests/"><UserRound size={15} /><span><strong>Review requests</strong><small>3 awaiting response</small></span><b>›</b></Link>
              <Link href="/expert/availability/"><CalendarClock size={15} /><span><strong>Update availability</strong><small>Manage your calendar</small></span><b>›</b></Link>
            </section>

            <section className={styles.sideCard}>
              <div className={styles.sideHeading}><h2>Notification settings</h2><span>Choose how you’re notified</span></div>
              <label className={styles.toggleRow}><span><strong>Email updates</strong><small>Important activity summaries</small></span><input type="checkbox" checked={emailUpdates} onChange={(event) => setEmailUpdates(event.target.checked)} /><i /></label>
              <label className={styles.toggleRow}><span><strong>Push notifications</strong><small>Real-time alerts</small></span><input type="checkbox" checked={pushUpdates} onChange={(event) => setPushUpdates(event.target.checked)} /><i /></label>
              <Link href="/expert/dashboard/#settings" className={styles.manageLink}>Manage all settings <span>›</span></Link>
            </section>

            <section className={styles.tip}>
              <Clock3 size={17} aria-hidden="true" />
              <div><strong>Stay responsive</strong><p>Experts who reply within an hour are more likely to receive repeat bookings.</p></div>
            </section>
          </aside>
        </div>
      </div>
    </section>
  );
}
