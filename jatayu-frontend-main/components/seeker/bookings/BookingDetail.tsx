"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useSeekerBreadcrumbs } from "@/components/seeker/SeekerShellContext";
import type { BookingDetail } from "@/lib/seekerDashboard";
import ActiveRoom from "./ActiveRoom";
import ReviewScreen from "./ReviewScreen";
import { getBookingReview, submitBookingReview } from '@/lib/reviewApi';
import BookingDetailInfo from "./BookingDetailInfo";
import { useAgoraRoom, type AgoraTextMessage } from "@/hooks/useAgoraRoom";

type BookingDetailViewProps = {
  booking: BookingDetail;
};

export default function BookingDetailView({ booking }: BookingDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const from = searchParams.get("from");

  // Session states: 'detail' | 'active' | 'completed'
  const [sessionState, setSessionState] = useState<'detail' | 'active' | 'completed'>(
    action === 'join' && booking.sessionAccess?.canJoin
      ? 'active'
      : (booking.status === 'completed' ? 'completed' : 'detail')
  );

  useEffect(() => {
    if (action === 'join' && booking.sessionAccess?.canJoin) {
      setSessionState('active');
    }
  }, [action, booking.sessionAccess?.canJoin]);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'seeker' | 'expert';
    text: string;
    timestamp: string;
  }>>([]);

  const [newMessage, setNewMessage] = useState("");
  const handleAgoraMessage = useCallback((message: AgoraTextMessage) => {
    setChatMessages((previous) => [...previous, {
      ...message,
      id: message.id || `agora-${Date.now()}-${Math.random()}`,
      timestamp: new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }]);
  }, []);
  const agora = useAgoraRoom({
    bookingId: booking.id,
    role: "seeker",
    enabled: sessionState === "active",
    requestVideo: booking.consultationType === "video",
    requestAudio: booking.consultationType !== "text",
    onMessage: handleAgoraMessage,
  });

  // Notes tab state
  const [notes, setNotes] = useState("");
  const [notesSavedStatus, setNotesSavedStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Submitted review details (persisted during current page mount)
  const [submittedReview, setSubmittedReview] = useState<{
    rating: number;
    comment: string;
    date: string;
    reply?: string | null;
  } | null>(null);
  const [canReview, setCanReview] = useState(false);

  // Notes autosave simulation
  useEffect(() => {
    if (!notes) return;
    const savingTimeout = setTimeout(() => {
      setNotesSavedStatus("saving");
    }, 0);
    const savedTimeout = setTimeout(() => {
      setNotesSavedStatus("saved");
    }, 800);
    return () => {
      clearTimeout(savingTimeout);
      clearTimeout(savedTimeout);
    };
  }, [notes]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const sent = await agora.sendMessage(newMessage);
    if (sent) setNewMessage("");
  };

  useEffect(() => {
    let active = true;
    setSubmittedReview(null);
    setCanReview(false);
    getBookingReview(booking.id).then(({ review, canReview }) => {
      if (active) setCanReview(canReview);
      if (active && review) setSubmittedReview({ rating: review.rating, comment: review.comment, date: new Date(review.createdAt).toLocaleDateString('en-IN'), reply: review.reply });
    }).catch((error) => console.error('Unable to load review:', error.message));
    return () => { active = false; };
  }, [booking.id, sessionState]);

  const handleSubmitReview = async (rating: number, comment: string) => {
    const { review, creditsAwarded } = await submitBookingReview(booking.id, rating, comment);
    setCanReview(false);
    setSubmittedReview({
      rating: review.rating,
      comment: review.comment,
      date: new Date(review.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    });
    setSessionState('completed');
    return creditsAwarded;
  };

  const breadcrumbNode = useMemo(() => {
    if (sessionState === "active") {
      return null;
    }
    return (
      <Breadcrumbs
        items={[
          { label: "Bookings", href: "/seeker/bookings" },
          { label: booking.referenceId },
        ]}
      />
    );
  }, [booking.referenceId, sessionState]);

  useSeekerBreadcrumbs(breadcrumbNode);

  if (sessionState === 'active') {
    return (
      <ActiveRoom
        booking={booking}
        notes={notes}
        setNotes={setNotes}
        notesSavedStatus={notesSavedStatus}
        chatMessages={chatMessages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
        agora={agora}
        onLeaveRoom={() => {
          if (from === "calendar") {
            router.push("/seeker/bookings");
          } else {
            setSessionState('detail');
            router.replace(`/seeker/bookings/${booking.id}`);
          }
        }}
        onFinishSession={() => {
          setSessionState('completed');
          router.replace(`/seeker/bookings/${booking.id}/?action=review`);
        }}
      />
    );
  }

  return (
    <BookingDetailInfo
      booking={booking}
      sessionState={sessionState}
      onJoinSession={() => setSessionState('active')}
      onSubmitReview={handleSubmitReview}
      submittedReview={submittedReview}
      canReview={canReview}
      notes={notes}
    />
  );
}
