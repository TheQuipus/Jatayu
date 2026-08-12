"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { useSeekerBreadcrumbs } from "@/components/seeker/SeekerShellContext";
import type { BookingDetail } from "@/lib/seekerDashboard";
import ActiveRoom from "./ActiveRoom";
import ReviewScreen from "./ReviewScreen";
import BookingDetailInfo from "./BookingDetailInfo";

type BookingDetailViewProps = {
  booking: BookingDetail;
};

export default function BookingDetailView({ booking }: BookingDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const from = searchParams.get("from");

  // Session states: 'detail' | 'active' | 'review' | 'completed'
  const [sessionState, setSessionState] = useState<'detail' | 'active' | 'review' | 'completed'>(
    action === 'join' ? 'active' : (action === 'review' ? 'review' : (booking.status === 'completed' ? 'completed' : 'detail'))
  );

  useEffect(() => {
    if (action === 'join') {
      setSessionState('active');
    } else if (action === 'review') {
      setSessionState('review');
    }
  }, [action]);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    sender: 'seeker' | 'expert';
    text: string;
    timestamp: string;
  }>>([
    {
      id: "msg-1",
      sender: "expert",
      text: `Hello! Thanks for scheduling our session. I've reviewed your question: "${booking.subject}". Let's get started.`,
      timestamp: "12:00 PM"
    },
    {
      id: "msg-2",
      sender: "seeker",
      text: "Hi, yes! I'm ready. I want to dive into the specifics.",
      timestamp: "12:01 PM"
    }
  ]);

  const [newMessage, setNewMessage] = useState("");

  // Notes tab state
  const [notes, setNotes] = useState("");
  const [notesSavedStatus, setNotesSavedStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Submitted review details (persisted during current page mount)
  const [submittedReview, setSubmittedReview] = useState<{
    rating: number;
    comment: string;
    date: string;
  } | null>(null);

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

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const timeString = new Date().toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: "seeker" as const,
      text: newMessage.trim(),
      timestamp: timeString
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setNewMessage("");

    // Simulate expert reply after 1.5 seconds
    setTimeout(() => {
      const expertReplies = [
        "That's a very good point. Let's analyze the details here.",
        "Based on what you're saying, I suggest looking into this framework.",
        "Let me know if this solution makes sense to you, or we can look at other options.",
        "Understood. Let me draft a quick checklist for you in the call notes.",
      ];
      const randomReply = expertReplies[Math.floor(Math.random() * expertReplies.length)];

      setChatMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: "expert" as const,
          text: randomReply,
          timestamp: new Date().toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          })
        }
      ]);
    }, 1500);
  };

  const handleSubmitReview = (rating: number, comment: string) => {
    setSubmittedReview({
      rating,
      comment,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    });
    setSessionState('completed');
  };

  const breadcrumbNode = useMemo(() => {
    if (sessionState === "active") {
      return null;
    }
    if (sessionState === "review") {
      return (
        <Breadcrumbs
          items={[
            { label: "Bookings", href: "/seeker/bookings" },
            { label: booking.referenceId, href: `/seeker/bookings/${booking.id}` },
            { label: "Session Review" },
          ]}
        />
      );
    }
    return (
      <Breadcrumbs
        items={[
          { label: "Bookings", href: "/seeker/bookings" },
          { label: booking.referenceId },
        ]}
      />
    );
  }, [booking.id, booking.referenceId, sessionState]);

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
        onLeaveRoom={() => {
          if (from === "calendar") {
            router.push("/seeker/bookings");
          } else {
            setSessionState('detail');
            router.replace(`/seeker/bookings/${booking.id}`);
          }
        }}
        onFinishSession={() => {
          setSessionState('review');
          router.replace(`/seeker/bookings/${booking.id}`);
        }}
      />
    );
  }

  if (sessionState === 'review') {
    return (
      <ReviewScreen
        booking={booking}
        onSubmit={(rating, comment) => {
          handleSubmitReview(rating, comment);
        }}
        onCancel={() => router.push("/seeker/bookings")}
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
      notes={notes}
    />
  );
}

