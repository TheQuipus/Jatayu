"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  ADMIN_USERS_EXPERTS_HREF,
  ADMIN_USERS_SEEKERS_HREF,
  getExpertById,
  getSeekerById,
  type ExpertUser,
  type SeekerUser,
} from "@/lib/adminUserManagement";
import ProfileHeroCard from "./profile/ProfileHeroCard";
import ProfileKpiRow from "./profile/ProfileKpiRow";
import ProfileLeftSidebar from "./profile/ProfileLeftSidebar";
import ProfileQuickActions from "./profile/ProfileQuickActions";
import ProfileRecentBookings from "./profile/ProfileRecentBookings";
import ProfileRightSidebar from "./profile/ProfileRightSidebar";
import ProfileEngagement from "./profile/ProfileEngagement";

import EditProfileView from "./editprofile/EditProfileView";
import HelpSupportView from "./help/HelpSupportView";
import NotificationsView from "./notifications/NotificationsView";
import SettingsView from "./settings/SettingsView";
import WalletView from "./wallet/WalletView";
import AdminBookingCalendar from "./bookings/AdminBookingCalendar";
import FinancialInsightsView from "./insights/FinancialInsightsView";
import styles from "./UserProfileDetail.module.css";

type UserProfileDetailProps = {
  userId: string;
  userType: "expert" | "seeker";
};

export default function UserProfileDetail({ userId, userType }: UserProfileDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const expert = userType === "expert" ? getExpertById(userId) : undefined;
  const seeker = userType === "seeker" ? getSeekerById(userId) : undefined;

  const user = expert || seeker;

  const normalizeTab = (t: string | null) => {
    if (!t) return "overview";
    if (t === "profile-management" || t === "edit") return "edit";
    if (t === "session-history" || t === "bookings" || t === "activity") return "activity";
    if (t === "wallet-credits" || t === "wallet" || t === "payments") return "payments";
    if (t === "financial-insights" || t === "insights") return "insights";
    if (t === "notifications") return "notifications";
    if (t === "settings") return "settings";
    if (t === "help-support" || t === "help") return "help";
    return t;
  };

  const activeTab = normalizeTab(searchParams.get("tab"));
  const [status, setStatus] = useState<string>(user?.status || "active");
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const handleSelectTab = (tab: string) => {
    if (tab !== "activity" && tab !== "bookings") {
      setSelectedBookingId(null);
    }
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("tab", tab);
    router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.topBar}>
          <Link href={userType === "expert" ? ADMIN_USERS_EXPERTS_HREF : ADMIN_USERS_SEEKERS_HREF} className={styles.backLink}>
            <ArrowLeft size={16} /> Back to User Management
          </Link>
        </div>
        <div style={{ padding: "60px 20px", textAlign: "center", background: "var(--white)", borderRadius: "16px", border: "1px solid var(--mercury)" }}>
          <h2 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: 700 }}>User Record Not Found</h2>
          <p style={{ color: "var(--dove-gray)", fontSize: "14px", margin: "0 0 20px" }}>The requested user profile record ID &quot;{userId}&quot; does not exist or has been removed.</p>
          <Link href={userType === "expert" ? ADMIN_USERS_EXPERTS_HREF : ADMIN_USERS_SEEKERS_HREF} className={styles.btnPrimary} style={{ textDecoration: "none" }}>
            Return to User Management
          </Link>
        </div>
      </div>
    );
  }

  const isExpert = userType === "expert";
  const expertUser = user as ExpertUser;
  const seekerUser = user as SeekerUser;

  const userLocation = isExpert ? (expertUser.location || "Mumbai, India") : (seekerUser.location || `${seekerUser.city || "Mumbai"}, India`);
  const joinedDate = user.joinedDate || "Jan 2025";
  const lastActive = user.lastActive || "Recently active";

  const totalSessionsCount = isExpert ? expertUser.totalSessions : seekerUser.totalBookings;
  const moneyValue = isExpert ? expertUser.totalEarnings : seekerUser.totalSpent;
  const categoryName = isExpert ? expertUser.category : (seekerUser.category || seekerUser.preferredCategory);

  const handleToggleStatus = () => {
    setStatus((prev) => (prev === "active" ? "suspended" : "active"));
  };

  const isWidePageTab =
    activeTab === "bookings" ||
    activeTab === "activity" ||
    activeTab === "wallet" ||
    activeTab === "payments" ||
    activeTab === "insights" ||
    activeTab === "notifications" ||
    activeTab === "help" ||
    activeTab === "settings" ||
    activeTab === "edit";

  return (
    <div className={styles.container}>
      {/* Top Header / Breadcrumb */}
      <div className={styles.topBar}>
        <Link href={isExpert ? ADMIN_USERS_EXPERTS_HREF : ADMIN_USERS_SEEKERS_HREF} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {isExpert ? "Experts" : "Seekers"} List
        </Link>
      </div>

      {/* Main Layout Grid — Left Sidebar ALWAYS stays visible */}
      <div className={`${styles.layoutGrid} ${isWidePageTab ? styles.layoutGridWallet : ""}`}>
        {/* Left Navigation Sidebar — Persistent Across All Tabs */}
        <ProfileLeftSidebar
          activeTab={activeTab}
          setActiveTab={handleSelectTab}
          totalSessionsCount={totalSessionsCount}
          isExpert={isExpert}
          status={status}
          handleToggleStatus={handleToggleStatus}
        />

        {/* Tab Content Area */}
        {activeTab === "bookings" || activeTab === "activity" ? (
          <div className={styles.walletContentArea}>
            <AdminBookingCalendar
              selectedBookingId={selectedBookingId}
              onSelectBooking={setSelectedBookingId}
              user={user}
              isExpert={isExpert}
            />
          </div>
        ) : activeTab === "wallet" || activeTab === "payments" ? (
          <div className={styles.walletContentArea}>
            <WalletView />
          </div>
        ) : activeTab === "insights" ? (
          <div className={styles.walletContentArea}>
            <FinancialInsightsView userId={userId} />
          </div>
        ) : activeTab === "notifications" ? (
          <div className={styles.walletContentArea}>
            <NotificationsView />
          </div>
        ) : activeTab === "help" ? (
          <div className={styles.walletContentArea}>
            <HelpSupportView />
          </div>
        ) : activeTab === "settings" ? (
          <div className={styles.walletContentArea}>
            <SettingsView />
          </div>
        ) : activeTab === "edit" ? (
          <div className={styles.walletContentArea}>
            <EditProfileView user={user} isExpert={isExpert} />
          </div>
        ) : (
          <>
            {/* Center Column */}
            <main className={styles.mainContent}>
              <ProfileHeroCard
                user={user}
                isExpert={isExpert}
                userLocation={userLocation}
                joinedDate={joinedDate}
                lastActive={lastActive}
                categoryName={categoryName}
                status={status}
                handleToggleStatus={handleToggleStatus}
              />

              <ProfileKpiRow
                user={user}
                isExpert={isExpert}
                totalSessionsCount={totalSessionsCount}
                moneyValue={moneyValue}
              />

              <ProfileRecentBookings
                isExpert={isExpert}
                setActiveTab={handleSelectTab}
                onSelectBooking={setSelectedBookingId}
              />

              {!isExpert && <ProfileEngagement />}
            </main>

            {/* Right Sidebar */}
            <ProfileRightSidebar
              user={user}
              status={status}
              setActiveTab={handleSelectTab}
              handleToggleStatus={handleToggleStatus}
            />
          </>
        )}
      </div>
    </div>
  );
}
