"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCheck,
  Clock,
  CreditCard,
  IndianRupee,
  MessageSquare,
  PhoneCall,
  RotateCcw,
  Sparkles,
  Trash2,
  UserCheck,
  Video,
} from "lucide-react";
import styles from "./NotificationsView.module.css";

type NotificationItem = {
  id: string;
  dotColor: string;
  icon?: any;
  avatar?: string;
  iconBg: string;
  iconColor: string;
  title: string;
  subtext: string;
  time: string;
  category: "bookings" | "messages" | "payments" | "expert_updates" | "system";
  tagLabel: string;
  actionText: string;
  isUnread: boolean;
};

export default function NotificationsView() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all_time");

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "notif-1",
      dotColor: "#8b5cf6",
      icon: Calendar,
      iconBg: "rgba(34, 197, 94, 0.12)",
      iconColor: "#16a34a",
      title: "Booking Confirmed — Live Call with Arvind Kumar",
      subtext: "Your live call session has been confirmed for June 20, 2025 at 4:00 PM. Join on time to avoid session delay. Booking ID: #JT-5012",
      time: "2 hours ago",
      category: "bookings",
      tagLabel: "Booking",
      actionText: "View Booking →",
      isUnread: true,
    },
    {
      id: "notif-2",
      dotColor: "#f59e0b",
      icon: MessageSquare,
      iconBg: "rgba(234, 179, 8, 0.12)",
      iconColor: "#b45309",
      title: "New Response from Rajan Mehta",
      subtext: 'Rajan has responded to your text consultation on "Business Growth Strategies for D2C Brands". Tap to read the full answer.',
      time: "4 hours ago",
      category: "messages",
      tagLabel: "Message",
      actionText: "View Response →",
      isUnread: true,
    },
    {
      id: "notif-3",
      dotColor: "#8b5cf6",
      icon: IndianRupee,
      iconBg: "rgba(139, 92, 246, 0.12)",
      iconColor: "#7c3aed",
      title: "Payment Successful — ₹499 Debited",
      subtext: "Your payment of ₹499 for Video Message consultation with Sunita Rao was successful. Wallet balance updated to ₹2,450.",
      time: "Yesterday",
      category: "payments",
      tagLabel: "Payment",
      actionText: "View Invoice →",
      isUnread: true,
    },
    {
      id: "notif-4",
      dotColor: "var(--tango)",
      avatar: "/assets/img/manportrait.png",
      iconBg: "color-mix(in srgb, var(--tango) 12%, var(--white))",
      iconColor: "var(--tango)",
      title: "Sunita Rao is now available for Live Calls",
      subtext: "You saved this expert earlier. Sunita Rao (Finance Expert) has just opened new live call slots for June 21–25. Book before slots fill up!",
      time: "Yesterday",
      category: "expert_updates",
      tagLabel: "Expert Update",
      actionText: "View Expert →",
      isUnread: true,
    },
    {
      id: "notif-5",
      dotColor: "var(--tango)",
      icon: Clock,
      iconBg: "color-mix(in srgb, var(--tango) 12%, var(--white))",
      iconColor: "var(--tango)",
      title: "Reminder: Live Call in 1 Hour",
      subtext: "Your live call with Arvind Kumar starts at 4:00 PM today. Please check your internet connection and join on time.",
      time: "1 hour ago",
      category: "bookings",
      tagLabel: "Reminder",
      actionText: "Join Call →",
      isUnread: true,
    },
    {
      id: "notif-6",
      dotColor: "#f59e0b",
      icon: Video,
      iconBg: "rgba(234, 179, 8, 0.12)",
      iconColor: "#b45309",
      title: "Video Response Ready — Sunita Rao",
      subtext: 'Your requested video message from Sunita Rao on "Investment Strategies for 2025" is ready to watch. 8 min 42 sec response.',
      time: "2 days ago",
      category: "messages",
      tagLabel: "Message",
      actionText: "Watch Video →",
      isUnread: true,
    },
    {
      id: "notif-7",
      dotColor: "#22c55e",
      icon: RotateCcw,
      iconBg: "rgba(34, 197, 94, 0.12)",
      iconColor: "#16a34a",
      title: "Refund Credit Added — ₹150 to Wallet",
      subtext: "A refund credit of ₹150 has been added to your Jatayu wallet for the cancelled session (Case #RC-1124). Valid for 90 days.",
      time: "3 days ago",
      category: "payments",
      tagLabel: "Refund",
      actionText: "View Wallet →",
      isUnread: true,
    },
    {
      id: "notif-8",
      dotColor: "var(--tango)",
      avatar: "/assets/img/manportrait.png",
      iconBg: "color-mix(in srgb, var(--tango) 12%, var(--white))",
      iconColor: "var(--tango)",
      title: "Rajan Mehta Published a New Event",
      subtext: 'Rajan Mehta is hosting a live webinar on "Scaling D2C Brands in 2025" on June 28. Early bird tickets at ₹299. Limited seats available!',
      time: "4 days ago",
      category: "expert_updates",
      tagLabel: "Expert Update",
      actionText: "View Event →",
      isUnread: true,
    },
  ]);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeCategory === "all") return true;
    return n.category === activeCategory;
  });

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return (
    <div className={styles.notifView}>
      {/* Top Header Row */}
      <div className={styles.notifHeaderRow}>
        <div>
          <div className={styles.breadcrumb}>My Account &gt; Notifications</div>
          <h2 className={styles.notifPageTitle}>Notifications</h2>
          <p className={styles.notifPageSubtitle}>Stay updated on bookings, messages, payments, and expert activity</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button type="button" className={styles.btnMarkRead} onClick={handleMarkAllRead}>
            <CheckCheck size={15} /> Mark All Read
          </button>
          <button type="button" className={styles.btnClearAll} onClick={handleClearAll}>
            <Trash2 size={15} /> Clear All
          </button>
        </div>
      </div>

      {/* 4 Mini Stat KPI Cards */}
      <div className={styles.notifKpiGrid}>
        <div className={styles.notifKpiCard}>
          <div className={styles.notifKpiIcon} style={{ background: "rgba(99, 102, 241, 0.1)", color: "#6366f1" }}>
            <Bell size={18} />
          </div>
          <div>
            <h3 className={styles.notifKpiVal}>{unreadCount}</h3>
            <span className={styles.notifKpiLabel}>Unread</span>
          </div>
        </div>

        <div className={styles.notifKpiCard}>
          <div className={styles.notifKpiIcon} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#16a34a" }}>
            <Calendar size={18} />
          </div>
          <div>
            <h3 className={styles.notifKpiVal}>3</h3>
            <span className={styles.notifKpiLabel}>Booking Alerts</span>
          </div>
        </div>

        <div className={styles.notifKpiCard}>
          <div className={styles.notifKpiIcon} style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}>
            <IndianRupee size={18} />
          </div>
          <div>
            <h3 className={styles.notifKpiVal}>2</h3>
            <span className={styles.notifKpiLabel}>Payment Alerts</span>
          </div>
        </div>

        <div className={styles.notifKpiCard}>
          <div className={styles.notifKpiIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#d97706" }}>
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className={styles.notifKpiVal}>3</h3>
            <span className={styles.notifKpiLabel}>Messages</span>
          </div>
        </div>
      </div>

      {/* Notifications Filter & List Card */}
      <div className={styles.notifMainCard}>
        <div className={styles.notifFilterBar}>
          <div className={styles.notifTabs}>
            {[
              { id: "all", label: "All" },
              { id: "bookings", label: "Bookings" },
              { id: "messages", label: "Messages" },
              { id: "payments", label: "Payments" },
              { id: "expert_updates", label: "Expert Updates" },
              { id: "system", label: "System" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.notifTab} ${activeCategory === tab.id ? styles.notifTabActive : ""}`}
                onClick={() => setActiveCategory(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--dove-gray)" }}>
            <span>Show:</span>
            <select
              className={styles.notifSelect}
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="all_time">All time</option>
              <option value="today">Today</option>
              <option value="this_week">This Week</option>
              <option value="unread">Unread Only</option>
            </select>
          </div>
        </div>

        <div className={styles.unreadsSectionHeader}>
          <span>UNREAD</span>
          <span className={styles.unreadCountBadge}>{unreadCount}</span>
        </div>

        {/* Notifications List */}
        <div className={styles.notifList}>
          {filteredNotifs.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--dove-gray)", fontSize: "14px" }}>
              No notifications found in this category.
            </div>
          ) : (
            filteredNotifs.map((notif) => {
              const Icon = notif.icon;
              return (
                <div key={notif.id} className={`${styles.notifItem} ${notif.isUnread ? styles.notifItemUnread : ""}`}>
                  <div className={styles.notifDot} style={{ background: notif.isUnread ? notif.dotColor : "transparent" }} />

                  {notif.avatar ? (
                    <div className={styles.notifAvatarWrapper}>
                      <Image
                        src={notif.avatar}
                        alt="Expert Avatar"
                        width={40}
                        height={40}
                        className={styles.notifAvatar}
                      />
                    </div>
                  ) : (
                    <div className={styles.notifIconBox} style={{ background: notif.iconBg, color: notif.iconColor }}>
                      {Icon && <Icon size={18} />}
                    </div>
                  )}

                  <div className={styles.notifContent}>
                    <h4 className={styles.notifTitle}>{notif.title}</h4>
                    <p className={styles.notifSubtext}>{notif.subtext}</p>
                    <div className={styles.notifFooter}>
                      <span className={styles.notifTime}>
                        <Clock size={12} style={{ display: "inline", verticalAlign: "middle" }} /> {notif.time}
                      </span>
                      <span className={styles.notifTag}>{notif.tagLabel}</span>
                      <button type="button" className={styles.notifActionBtn}>
                        {notif.actionText}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
