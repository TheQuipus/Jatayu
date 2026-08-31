"use client";

import ActiveVideoRoom from "./ActiveVideoRoom";
import ActiveChatRoom from "./ActiveChatRoom";
import type { BookingDetail } from "@/lib/seekerDashboard";
import type { AgoraRoomState } from "@/hooks/useAgoraRoom";

export type ChatMessage = {
  id: string;
  sender: "seeker" | "expert";
  text: string;
  timestamp: string;
};

export type ActiveRoomProps = {
  booking: BookingDetail;
  notes: string;
  setNotes: (notes: string) => void;
  notesSavedStatus: "idle" | "saving" | "saved";
  chatMessages: ChatMessage[];
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onLeaveRoom: () => void;
  onFinishSession: () => void;
  agora: AgoraRoomState;
};

export default function ActiveRoom(props: ActiveRoomProps) {
  if (["video", "audio", "shoutout"].includes(props.booking.consultationType)) {
    return <ActiveVideoRoom {...props} />;
  }

  return <ActiveChatRoom {...props} />;
}
