"use client";

import React from "react";
import ExpertActiveVideoRoom from "./ExpertActiveVideoRoom";
import ExpertActiveChatRoom from "./ExpertActiveChatRoom";

export type ExpertActiveRoomProps = {
  requestId?: string;
  clientName: string;
  clientAvatar: string;
  clientRole?: string;
  title: string;
  proposedPrice?: string;
  formatLabel?: string;
  onLeaveRoom: () => void;
  onFinishSession: () => void;
};

export default function ExpertActiveRoom(props: ExpertActiveRoomProps) {
  const formatStr = (props.formatLabel || "").toLowerCase();
  const isVideoCall =
    formatStr.includes("video") ||
    formatStr.includes("call") ||
    (!formatStr.includes("text") && !formatStr.includes("async") && !formatStr.includes("chat"));

  if (isVideoCall) {
    return <ExpertActiveVideoRoom {...props} />;
  }

  return <ExpertActiveChatRoom {...props} />;
}
