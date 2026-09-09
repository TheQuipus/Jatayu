import Link from "next/link";
import { ArrowUpRight, Video } from "lucide-react";
import styles from "./ExpertAvailabilityPage.module.css";

const SESSIONS = [
  { initials: "AS", name: "Ananya Sharma", topic: "Product strategy", time: "Today · 4:30 PM", tone: "coral" },
  { initials: "RK", name: "Rohan Kapoor", topic: "Career transition", time: "Tomorrow · 11:00 AM", tone: "blueAvatar" },
  { initials: "NM", name: "Neha Mehta", topic: "Portfolio review", time: "Thu · 2:00 PM", tone: "purpleAvatar" },
];

export default function UpcomingSessions() {
  return (
    <section className={`${styles.panel} ${styles.sessionsPanel}`}>
      <div className={styles.compactPanelHeader}><div><h2>Upcoming sessions</h2><p>Your next confirmed bookings</p></div><Link href="/expert/requests/">View all</Link></div>
      <div className={styles.sessionsList}>
        {SESSIONS.map((session) => (
          <article key={session.name} className={styles.sessionCard}>
            <span className={`${styles.sessionAvatar} ${styles[session.tone]}`}>{session.initials}</span>
            <div className={styles.sessionCopy}><strong>{session.name}</strong><span>{session.topic}</span><time><Video size={11} /> {session.time}</time></div>
            <Link href="/expert/requests/"><ArrowUpRight size={14} /></Link>
          </article>
        ))}
      </div>
      <Link href="/expert/requests/" className={styles.viewSessionsButton}>View all sessions <ArrowUpRight size={14} /></Link>
    </section>
  );
}
