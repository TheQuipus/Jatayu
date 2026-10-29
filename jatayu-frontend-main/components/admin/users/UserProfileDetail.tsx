"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  ADMIN_USERS_EXPERTS_HREF,
  ADMIN_USERS_SEEKERS_HREF,
  getExpertById,
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
import { getAdminSeeker, updateAdminSeekerStatus, type AdminSeekerDetail } from "@/lib/adminSeekerApi";
import { getAdminExpert, updateAdminExpertStatus, type AdminExpertDetail } from "@/lib/adminExpertApi";

type UserProfileDetailProps = {
  userId: string;
  userType: "expert" | "seeker";
};

export default function UserProfileDetail({ userId, userType }: UserProfileDetailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [detailState, setDetailState] = useState<{ id: string; detail: AdminSeekerDetail | null; error: string } | null>(null);
  const [expertDetailState, setExpertDetailState] = useState<{ id: string; detail: AdminExpertDetail | null; error: string } | null>(null);
  const [actionError, setActionError] = useState("");

  const seekerDetail = detailState?.id === userId ? detailState.detail : null;
  const expertDetail = expertDetailState?.id === userId ? expertDetailState.detail : null;

  const detailLoading =
    (userType === "seeker" && detailState?.id !== userId) ||
    (userType === "expert" && expertDetailState?.id !== userId);

  const setSeekerDetail = (detail: AdminSeekerDetail) => setDetailState({ id: detail.seeker.id, detail, error: "" });

  useEffect(() => {
    if (userType === "seeker") {
      let active = true;
      getAdminSeeker(userId)
        .then((detail) => { if (active) setDetailState({ id: userId, detail, error: "" }); })
        .catch((error) => { if (active) setDetailState({ id: userId, detail: null, error: error instanceof Error ? error.message : "Unable to load seeker record" }); });
      return () => { active = false; };
    }

    if (userType === "expert") {
      let active = true;
      getAdminExpert(userId)
        .then((detail) => { if (active) setExpertDetailState({ id: userId, detail, error: "" }); })
        .catch((error) => {
          const mock = getExpertById(userId);
          if (active) {
            if (mock) {
              setExpertDetailState({
                id: userId,
                detail: { expert: mock, bookings: [], credentials: [], availabilities: [] },
                error: "",
              });
            } else {
              setExpertDetailState({
                id: userId,
                detail: null,
                error: error instanceof Error ? error.message : "Unable to load expert record",
              });
            }
          }
        });
      return () => { active = false; };
    }
  }, [userId, userType]);

  const expert = userType === "expert" ? (expertDetail?.expert || getExpertById(userId)) : undefined;
  const seeker = userType === "seeker" ? seekerDetail?.seeker : undefined;
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
  const [expertStatus, setExpertStatus] = useState<string>(user?.status || "active");
  const status = userType === "expert" ? expertStatus : user?.status || "pending";
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const handleSelectTab = (tab: string) => {
    if (tab !== "activity" && tab !== "bookings") {
      setSelectedBookingId(null);
    }
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("tab", tab);
    router.replace(`${pathname}?${currentParams.toString()}`, { scroll: false });
  };

  if (detailLoading) {
    return <div className={styles.container}><div style={{ padding: "60px 20px", textAlign: "center" }}>Loading seeker record...</div></div>;
  }

  if (detailState?.id === userId && detailState.error) return <div className={styles.container}><p role="alert">{detailState.error}</p></div>;

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

  const formatDate = (value?: string) => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
    }
    return value;
  };

  const userLocation = isExpert ? (expertUser.location || "Location not provided") : (seekerUser.location || seekerUser.city || "Location not provided");
  // For experts, Member since must be the day of approval (approvedAt), not the day of submission (submittedAt)
  const joinedDate = formatDate(isExpert ? (expertUser.approvedAt || expertUser.joinedDate) : seekerUser.joinedDate);
  const lastActive = isExpert ? (expertUser.lastActive || "Recently") : formatDate(seekerUser.lastActive);

  const totalSessionsCount = isExpert ? expertUser.totalSessions : seekerUser.totalBookings;
  const moneyValue = isExpert ? expertUser.totalEarnings : seekerUser.totalSpent;
  const categoryName = isExpert ? expertUser.category : (seekerUser.category || seekerUser.preferredCategory);

  const handleToggleStatus = async () => {
    const nextStatus = status === "active" ? "suspended" : "active";
    if (isExpert) {
      try {
        const result = await updateAdminExpertStatus(userId, nextStatus as any);
        setExpertStatus(result.expert.status);
        if (expertDetailState) {
          setExpertDetailState({
            ...expertDetailState,
            detail: expertDetailState.detail
              ? { ...expertDetailState.detail, expert: result.expert }
              : null,
          });
        }
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Unable to update expert status");
      }
      return;
    }
    try {
      const result = await updateAdminSeekerStatus(userId, nextStatus);
      if (seekerDetail) setSeekerDetail({ ...seekerDetail, seeker: result.seeker });
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to update seeker status");
    }
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
      {actionError && <p role="alert">{actionError}</p>}
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
              bookings={seekerDetail?.bookings}
            />
          </div>
        ) : activeTab === "wallet" || activeTab === "payments" ? (
          <div className={styles.walletContentArea}>
            <WalletView
              key={userId}
              seekerId={isExpert ? undefined : userId}
              credits={seekerDetail?.credits}
              onCreditsAdded={async () => {
                if (!isExpert) setSeekerDetail(await getAdminSeeker(userId));
              }}
            />
          </div>
        ) : activeTab === "insights" ? (
          <div className={styles.walletContentArea}>
            <FinancialInsightsView seeker={isExpert ? undefined : seekerUser} bookings={seekerDetail?.bookings} credits={seekerDetail?.credits} />
          </div>
        ) : activeTab === "notifications" ? (
          <div className={styles.walletContentArea}>
            <NotificationsView key={userId} seekerId={isExpert ? undefined : userId} onNotificationsChanged={async () => { if (!isExpert) setSeekerDetail(await getAdminSeeker(userId)); }} />
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
                seekerMetrics={seekerDetail?.metrics}
              />

              <ProfileRecentBookings
                isExpert={isExpert}
                bookings={seekerDetail?.bookings}
                setActiveTab={handleSelectTab}
                onSelectBooking={setSelectedBookingId}
              />

              {!isExpert && <ProfileEngagement engagement={seekerDetail?.engagement} />}
            </main>

            {/* Right Sidebar */}
            <ProfileRightSidebar
              user={user}
              status={status}
              setActiveTab={handleSelectTab}
              handleToggleStatus={handleToggleStatus}
              seekerDetail={seekerDetail}
            />
          </>
        )}
      </div>
    </div>
  );
}
