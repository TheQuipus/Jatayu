"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { SEEKER_NOTIFICATIONS, type SeekerNotification } from "@/lib/seekerDashboard";
import styles from "./NotificationPanel.module.css";

function NotificationItem({
  notification,
  onRead,
}: {
  notification: SeekerNotification;
  onRead: (id: string) => void;
}) {
  const content = (
    <>
      {notification.expert ? (
        <Image
          src={notification.expert.image}
          alt=""
          width={36}
          height={36}
          className={styles.itemAvatar}
        />
      ) : (
        <span className={styles.itemIcon} aria-hidden="true">
          <Bell size={16} />
        </span>
      )}
      <span className={styles.itemBody}>
        <span className={styles.itemTitle}>{notification.title}</span>
        <span className={styles.itemCopy}>{notification.body}</span>
        <span className={styles.itemTime}>{notification.timeAgo}</span>
      </span>
      {notification.unread ? <span className={styles.itemUnread} aria-hidden="true" /> : null}
    </>
  );

  if (notification.href) {
    return (
      <Link
        href={notification.href}
        className={`${styles.item} ${notification.unread ? styles.itemUnreadState : ""}`}
        onClick={() => onRead(notification.id)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.item} ${notification.unread ? styles.itemUnreadState : ""}`}
      onClick={() => onRead(notification.id)}
    >
      {content}
    </button>
  );
}

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(SEEKER_NOTIFICATIONS);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markRead = (id: string) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const markAllRead = () => {
    setNotifications((current) => current.map((n) => ({ ...n, unread: false })));
  };

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={panelRef}
      className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
    >
      <button
        type="button"
        className={styles.trigger}
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-controls="seeker-notifications"
        onClick={() => setIsOpen((open) => !open)}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className={styles.triggerDot} aria-hidden="true" />
        ) : null}
      </button>

      <div
        id="seeker-notifications"
        className={styles.dropdown}
        role="region"
        aria-label="Notifications"
        aria-hidden={!isOpen}
      >
        <div className={styles.dropdownHead}>
          <h2 className={styles.dropdownTitle}>Notifications</h2>
          {unreadCount > 0 ? (
            <button type="button" className={styles.markAllBtn} onClick={markAllRead}>
              Mark all read
            </button>
          ) : null}
        </div>

        <ul className={styles.list}>
          {notifications.map((notification) => (
            <li key={notification.id}>
              <NotificationItem notification={notification} onRead={markRead} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
