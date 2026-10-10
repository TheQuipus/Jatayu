"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Calendar, Clock, IndianRupee, MessageSquare, UserCheck } from "lucide-react";
import type { AdminSeekerNotification } from "@/lib/adminSeekerApi";
import { getAdminSeekerNotifications, markAdminSeekerNotificationRead } from "@/lib/adminSeekerApi";
import styles from "./NotificationsView.module.css";

type NotificationsViewProps = { seekerId?: string; onNotificationsChanged?: () => Promise<void> | void };
type Category = "all" | AdminSeekerNotification["category"];

function relativeTime(value: string, now: number) { const diff = Math.max(0, now - new Date(value).getTime()); const hours = Math.floor(diff / 3600000); if (hours < 1) return "Just now"; if (hours < 24) return hours + " hour" + (hours === 1 ? "" : "s") + " ago"; const days = Math.floor(hours / 24); return days === 1 ? "Yesterday" : days + " days ago"; }
function notificationIcon(category: AdminSeekerNotification["category"]) { if (category === "bookings") return Calendar; if (category === "payments") return IndianRupee; if (category === "messages") return MessageSquare; if (category === "expert_updates") return UserCheck; return Bell; }
function notificationColor(category: AdminSeekerNotification["category"]) { if (category === "bookings") return "#16a34a"; if (category === "payments") return "#7c3aed"; if (category === "messages") return "#b45309"; if (category === "expert_updates") return "var(--tango)"; return "#6366f1"; }

export default function NotificationsView({ seekerId, onNotificationsChanged }: NotificationsViewProps) {
  const [now] = useState(() => Date.now());
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [timeFilter, setTimeFilter] = useState("all_time");
  const [notifications, setNotifications] = useState<AdminSeekerNotification[]>([]);
  const [loading, setLoading] = useState(Boolean(seekerId));

  useEffect(() => {
    if (!seekerId) return;
    let active = true;
    getAdminSeekerNotifications(seekerId)
      .then((result) => { if (active) setNotifications(result.items); })
      .catch((failure) => { if (active) setError(failure instanceof Error ? failure.message : "Unable to load notifications"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [seekerId]);
  const handleOpen = async (notification: AdminSeekerNotification) => {
    setError("");
    try {
      if (seekerId && !notification.readAt) {
        const result = await markAdminSeekerNotificationRead(seekerId, notification.id);
        setNotifications((items) => items.map((item) => item.id === notification.id ? result.notification : item));
        await onNotificationsChanged?.();
      }
      if (notification.href) {
        const target = new URL(notification.href, window.location.origin);
        if (target.origin === window.location.origin) window.open(target.href, "_blank", "noopener,noreferrer");
      }
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Unable to update notification"); }
  };
  const filtered = useMemo(() => notifications.filter((item) => { if (activeCategory !== "all" && item.category !== activeCategory) return false; if (timeFilter === "unread" && item.readAt) return false; const age = now - new Date(item.createdAt).getTime(); if (timeFilter === "today") return age < 86400000; if (timeFilter === "this_week") return age < 604800000; return true; }), [notifications, activeCategory, timeFilter, now]);
  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const countFor = (category: AdminSeekerNotification["category"]) => notifications.filter((item) => item.category === category).length;

  return <div className={styles.notifView}>
    {error && <p role="alert">{error}</p>}
    <div className={styles.notifHeaderRow}><div><h2 className={styles.notifPageTitle}>Notifications</h2><p className={styles.notifPageSubtitle}>Persisted booking, message, payment, and system notifications for this seeker</p></div></div>
    <div className={styles.notifKpiGrid}><div className={styles.notifKpiCard}><div className={styles.notifKpiIcon} style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}><Bell size={18} /></div><div><h3 className={styles.notifKpiVal}>{unreadCount}</h3><span className={styles.notifKpiLabel}>Unread</span></div></div><div className={styles.notifKpiCard}><div className={styles.notifKpiIcon} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}><Calendar size={18} /></div><div><h3 className={styles.notifKpiVal}>{countFor("bookings")}</h3><span className={styles.notifKpiLabel}>Booking Alerts</span></div></div><div className={styles.notifKpiCard}><div className={styles.notifKpiIcon} style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}><IndianRupee size={18} /></div><div><h3 className={styles.notifKpiVal}>{countFor("payments")}</h3><span className={styles.notifKpiLabel}>Payment Alerts</span></div></div><div className={styles.notifKpiCard}><div className={styles.notifKpiIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}><MessageSquare size={18} /></div><div><h3 className={styles.notifKpiVal}>{countFor("messages")}</h3><span className={styles.notifKpiLabel}>Messages</span></div></div></div>
    <div className={styles.notifMainCard}><div className={styles.notifFilterBar}><div className={styles.notifTabs}>{([{ id: "all", label: "All" }, { id: "bookings", label: "Bookings" }, { id: "messages", label: "Messages" }, { id: "payments", label: "Payments" }, { id: "expert_updates", label: "Expert Updates" }, { id: "system", label: "System" }] as const).map((tab) => <button key={tab.id} type="button" className={styles.notifTab + " " + (activeCategory === tab.id ? styles.notifTabActive : "")} onClick={() => setActiveCategory(tab.id)}>{tab.label}</button>)}</div><div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--dove-gray)" }}><span>Show:</span><select className={styles.notifSelect} value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)}><option value="all_time">All time</option><option value="today">Today</option><option value="this_week">This Week</option><option value="unread">Unread Only</option></select></div></div><div className={styles.unreadsSectionHeader}><span>UNREAD</span><span className={styles.unreadCountBadge}>{unreadCount}</span></div><div className={styles.notifList}>{loading ? <div style={{ padding: "40px", textAlign: "center", color: "var(--dove-gray)", fontSize: "14px" }}>Loading notifications…</div> : filtered.length === 0 ? <div style={{ padding: "40px", textAlign: "center", color: "var(--dove-gray)", fontSize: "14px" }}>No notifications found in this category.</div> : filtered.map((notification) => { const Icon = notificationIcon(notification.category); const color = notificationColor(notification.category); return <div key={notification.id} className={styles.notifItem + " " + (!notification.readAt ? styles.notifItemUnread : "")}><div className={styles.notifDot} style={{ background: !notification.readAt ? color : "transparent" }} /><div className={styles.notifIconBox} style={{ background: color + "1f", color }}><Icon size={18} /></div><div className={styles.notifContent}><h4 className={styles.notifTitle}>{notification.title}</h4><p className={styles.notifSubtext}>{notification.body}</p><div className={styles.notifFooter}><span className={styles.notifTime}><Clock size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {relativeTime(notification.createdAt, now)}</span><span className={styles.notifTag}>{notification.category.replace("_", " ")}</span><button type="button" className={styles.notifActionBtn} onClick={() => void handleOpen(notification)}>{notification.href ? "View Details →" : "Mark Read"}</button></div></div></div>; })}</div></div>
  </div>;
}
