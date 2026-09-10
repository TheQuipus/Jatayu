"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";
import { getToken } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import styles from "@/components/seeker/bookings/ActiveRoom.module.css";

export type ExtendSessionChatOverlayProps = {
  role: "seeker" | "expert";
  isOpen?: boolean;
  expertName?: string;
  expertImage?: string;
  clientName?: string;
  clientImage?: string;
  isExpertBooked?: boolean;
  onExtendSessionAdded?: (secondsToAdd: number) => void;
  onExtensionConfirmed?: (mins: number, amount: number) => void;
  onPaymentRequired?: (order: { id: string; amount: number; currency: string }) => void;
  onExtensionActivated?: (extendedEndAt: string) => void;
  channelName?: string;
  bookingId?: string;
};

const DEFAULT_CHANNEL_NAME = "jatayu_demo_sync_v1";

export default function ExtendSessionChatOverlay({
  role,
  isOpen = false,
  expertName = "Dr. Ananya Sharma",
  expertImage = "/assets/img/team1.png",
  clientName = "Rahul Sharma",
  clientImage = "/assets/img/manportrait.png",
  isExpertBooked = false,
  onExtendSessionAdded,
  onExtensionConfirmed,
  onPaymentRequired,
  onExtensionActivated,
  channelName = DEFAULT_CHANNEL_NAME,
  bookingId,
}: ExtendSessionChatOverlayProps) {
  const chatLogRef = useRef<HTMLDivElement>(null);

  // Seeker states
  const [selectedExtension, setSelectedExtension] = useState<number | null>(null);
  const [extensionChatStatus, setExtensionChatStatus] = useState<
    "idle" | "requesting" | "confirmed" | "reduced" | "declined" | "expert_booked"
  >("idle");
  const [seekerReceivedReplyMins, setSeekerReceivedReplyMins] = useState<number>(30);

  // Expert states
  const [expertHasRequest, setExpertHasRequest] = useState(false);
  const [expertRequestedMins, setExpertRequestedMins] = useState<number>(30);
  const [expertDecisionStatus, setExpertDecisionStatus] = useState<
    "pending" | "confirmed" | "declined" | "reduced"
  >("pending");
  const [expertConfirmedMins, setExpertConfirmedMins] = useState<number>(30);
  const [selectedExpertChoice, setSelectedExpertChoice] = useState<string | null>(null);
  const [customMinutesInput, setCustomMinutesInput] = useState<string>("");
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(false);

  // Auto-hide states
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Auto-scroll chat history to latest event
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [
    isOpen,
    selectedExtension,
    extensionChatStatus,
    expertHasRequest,
    expertDecisionStatus,
  ]);

  // Reset seeker state when closed/reopened
  useEffect(() => {
    if (!isOpen && role === "seeker") {
      setSelectedExtension(null);
      setExtensionChatStatus("idle");
      setIsDismissed(false);
      setIsFadingOut(false);
    } else if (isOpen && role === "seeker") {
      setIsDismissed(false);
      setIsFadingOut(false);
    }
  }, [isOpen, role]);

  // Chat overlay stays visible in chat history without auto-dismissing


  const broadcastSync = (event: Record<string, any>) => {
    if (typeof window === "undefined") return;
    try {
      if ("BroadcastChannel" in window) {
        const bc = new BroadcastChannel(channelName);
        bc.postMessage(event);
        bc.close();
      }
      localStorage.setItem(channelName, JSON.stringify({ ...event, _t: Date.now() }));
    } catch (e) {
      console.error("Broadcast error:", e);
    }
  };

  // Cross-tab Synchronization listener
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleIncomingSync = (data: any) => {
      if (!data || !data.type) return;

      if (data.type === "EXTENDED_SESSION_STARTED") {
        setIsDismissed(true);
        setIsFadingOut(false);
        setExpertHasRequest(false);
        setSelectedExtension(null);
        setExtensionChatStatus("idle");
        return;
      }

      if (role === "expert") {
        if (data.type === "SEEKER_REQUEST_EXTENSION") {
          const reqMins = data.mins || 30;
          setExpertRequestedMins(reqMins);
          setExpertConfirmedMins(reqMins);
          setExpertHasRequest(true);
          setExpertDecisionStatus("pending");
          setSelectedExpertChoice(null);
          setIsCustomEditing(false);
          setCustomMinutesInput("");
          setIsDismissed(false);
          setIsFadingOut(false);
        }
      } else if (role === "seeker") {
        if (data.type === "EXPERT_DECISION") {
          const decision = data.decision as "confirmed" | "reduced" | "declined";
          const finalMins = data.mins || 0;
          setExtensionChatStatus(decision);
          setSeekerReceivedReplyMins(finalMins);
          if (decision === "confirmed" || decision === "reduced") {
            const cost = finalMins === 15 ? 500 : finalMins === 30 ? 1000 : finalMins === 45 ? 1500 : finalMins === 60 ? 2000 : finalMins * 35;
            onExtensionConfirmed?.(finalMins, cost);
          }
        }
      }
    };

    let bc: BroadcastChannel | null = null;
    if ("BroadcastChannel" in window) {
      bc = new BroadcastChannel(channelName);
      bc.onmessage = (e) => handleIncomingSync(e.data);
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === channelName && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingSync(parsed);
        } catch (err) { }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      if (bc) bc.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [role, channelName, onExtendSessionAdded]);

  useEffect(() => {
    const token = getToken();
    if (!token || !bookingId) return;
    const socket = connectSocket(token);
    const onRequest = (data: { bookingId?: string; minutes?: number }) => {
      if (role !== "expert" || data.bookingId !== bookingId) return;
      const reqMins = Number(data.minutes) || 30;
      setExpertRequestedMins(reqMins);
      setExpertConfirmedMins(reqMins);
      setExpertHasRequest(true);
      setExpertDecisionStatus("pending");
      setSelectedExpertChoice(null);
      setIsDismissed(false);
    };
    const onDecision = (data: { bookingId?: string; decision?: "confirmed" | "reduced" | "declined"; minutes?: number; order?: { id: string; amount: number; currency: string } }) => {
      if (role !== "seeker" || data.bookingId !== bookingId || !data.decision) return;
      setExtensionChatStatus(data.decision);
      setSeekerReceivedReplyMins(Number(data.minutes) || 0);
      if (data.order && data.decision !== "declined") onPaymentRequired?.(data.order);
    };
    socket.on("session:extension:request", onRequest);
    socket.on("session:extension:decision", onDecision);
    const onActivated = (data: { bookingId?: string; extendedEndAt?: string }) => {
      if (data.bookingId === bookingId && data.extendedEndAt) onExtensionActivated?.(data.extendedEndAt);
    };
    socket.on("session:extension:activated", onActivated);
    socket.emit("session:extension:subscribe", { bookingId });
    return () => {
      socket.off("session:extension:request", onRequest);
      socket.off("session:extension:decision", onDecision);
      socket.off("session:extension:activated", onActivated);
    };
  }, [bookingId, onExtensionActivated, onPaymentRequired, role]);

  const handleSelectExtension = (mins: number) => {
    setSelectedExtension(mins);
    if (isExpertBooked) {
      setExtensionChatStatus("expert_booked");
      return;
    }
    setExtensionChatStatus("requesting");

    // Broadcast live to Expert tab
    broadcastSync({
      type: "SEEKER_REQUEST_EXTENSION",
      mins,
    });
    if (bookingId) connectSocket(getToken() || undefined).emit("session:extension:request", { bookingId, minutes: mins });
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, "");
    if (!raw) {
      setCustomMinutesInput("");
      return;
    }
    const val = parseInt(raw, 10);
    if (val > expertRequestedMins) {
      setCustomMinutesInput(String(expertRequestedMins));
    } else {
      setCustomMinutesInput(String(val));
    }
  };

  const handleCustomSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleConfirmDecision();
  };

  const handleConfirmDecision = () => {
    if (expertDecisionStatus !== "pending" || !selectedExpertChoice) return;

    if (selectedExpertChoice === "confirmed") {
      handleExpertDecision("confirmed", expertRequestedMins);
    } else if (selectedExpertChoice === "reduced-15") {
      handleExpertDecision("reduced-15", 15);
    } else if (selectedExpertChoice === "custom") {
      const val = parseInt(customMinutesInput, 10);
      if (!val || val <= 0) return;
      const finalVal = Math.min(val, expertRequestedMins);
      setIsCustomEditing(false);
      handleExpertDecision("custom", finalVal);
    } else if (selectedExpertChoice === "declined") {
      handleExpertDecision("declined", 0);
    }
  };

  const getSubmitButtonLabel = () => {
    if (selectedExpertChoice === "confirmed") {
      return `Select Extension (${expertRequestedMins === 60 ? "1 Hour" : `${expertRequestedMins} Mins`})`;
    }
    if (selectedExpertChoice === "reduced-15") {
      return "Select Extension (15 Mins)";
    }
    if (selectedExpertChoice === "custom") {
      const mins = parseInt(customMinutesInput, 10);
      return mins > 0 ? `Select Extension (${mins} Mins)` : "Enter Duration";
    }
    if (selectedExpertChoice === "declined") {
      return "Decline Request";
    }
    return "Select Extension";
  };

  const handleExpertDecision = (choiceId: string, mins: number) => {
    setSelectedExpertChoice(choiceId);
    let status: "confirmed" | "reduced" | "declined" = "confirmed";
    let finalMins = mins;

    if (choiceId === "confirmed") {
      status = "confirmed";
      finalMins = expertRequestedMins;
    } else if (choiceId.startsWith("reduced") || choiceId === "custom") {
      if (mins >= expertRequestedMins) {
        status = "confirmed";
        finalMins = expertRequestedMins;
      } else {
        status = "reduced";
        finalMins = mins;
      }
    } else if (choiceId === "declined") {
      status = "declined";
      finalMins = 0;
    }

    if (status === "confirmed" || status === "reduced") {
      const cost = finalMins === 15 ? 500 : finalMins === 30 ? 1000 : finalMins === 45 ? 1500 : finalMins === 60 ? 2000 : finalMins * 35;
      onExtensionConfirmed?.(finalMins, cost);
    }

    setExpertDecisionStatus(status);
    setExpertConfirmedMins(finalMins);

    // Broadcast live to Seeker tab
    broadcastSync({
      type: "EXPERT_DECISION",
      decision: status,
      mins: finalMins,
    });
    if (bookingId) {
      connectSocket(getToken() || undefined).emit("session:extension:decision", {
        bookingId,
        decision: status,
        minutes: finalMins,
      });
    }
  };

  // --- SEEKER VIEW RENDERING ---
  if (role === "seeker") {
    if (!isOpen || isDismissed) return null;

    return (
      <div className={`${styles.extendChatOverlay} ${isFadingOut ? styles.extendChatOverlayFadingOut : ""}`}>
        <div ref={chatLogRef} className={styles.extendChatLog}>
          {isExpertBooked ? (
            /* Expert Already Booked: Do not allow time selection, display compact system message */
            <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowExpert} ${styles.extendChatMsgRowReply}`}>
              <div className={styles.extendChatMsgAvatar}>
                <div className={`${styles.extendChatSystemAvatar} ${styles.extendChatSystemAvatarSmall}`}>
                  <Shield size={14} />
                </div>
              </div>
              <div className={styles.extendChatMsgContent}>
                <div className={styles.extendChatMsgMeta}>
                  <span>Jatayu System</span>
                  <span>•</span>
                  <span>Just now</span>
                </div>
                <div
                  className={`${styles.extendChatMsgBubbleSystem} ${styles.extendChatMsgBubbleSystemUnavailable}`}
                >
                  <div className={styles.extendChatSystemUnavailableTitle}>
                    Unable to extend session
                  </div>
                  {expertName} is already booked for an upcoming session right after this call and is unable to extend at this time. Please try booking a new session later.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* In-Chat Interactive Radio Duration Selector (Retained in chat history) */}
              <div className={`${styles.extendChatRadioCard} ${styles.extendChatRadioCardRight}`}>
                <div className={styles.extendChatRadioTitle}>
                  Please specify the time limit by which you want to extend the session.
                </div>
                <div
                  className={styles.extendChatRadioList}
                  role="radiogroup"
                  aria-label="Extension duration options"
                >
                  {[
                    { mins: 15, label: "15 Mins" },
                    { mins: 30, label: "30 Mins" },
                    { mins: 45, label: "45 Mins" },
                    { mins: 60, label: "1 Hour" },
                  ].map((option) => {
                    const isSelected = selectedExtension === option.mins;
                    const isLocked = selectedExtension !== null;
                    return (
                      <div
                        key={option.mins}
                        className={`${styles.extendChatRadioItem} ${isSelected ? styles.extendChatRadioItemActive : ""
                          } ${isLocked ? styles.extendChatRadioItemDisabled : ""}`}
                        onClick={() => {
                          if (!isLocked) handleSelectExtension(option.mins);
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isLocked ? -1 : 0}
                      >
                        <div className={styles.extendChatRadioLeft}>
                          <div className={styles.extendChatRadioCustomCircle}>
                            {isSelected && <div className={styles.extendChatRadioCustomDot} />}
                          </div>
                          <span className={styles.extendChatRadioLabel}>
                            {option.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seeker Message Bubble appended to history upon selection */}
              {selectedExtension !== null && (
                <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowSeeker} ${styles.extendChatMsgRowAnimated}`}>
                  <div className={styles.extendChatMsgAvatar}>
                    <Image
                      src={clientImage}
                      alt="You"
                      fill
                      sizes="32px"
                      className={styles.extendChatAvatarImg}
                    />
                  </div>
                  <div className={styles.extendChatMsgContent}>
                    <div className={styles.extendChatMsgMeta}>
                      <span>You</span>
                      <span>•</span>
                      <span>Just now</span>
                    </div>
                    <div className={styles.extendChatMsgBubbleSeeker}>
                      I'd like to extend our consultation by {selectedExtension === 60 ? "1 hour" : `${selectedExtension} minutes`}.
                    </div>
                  </div>
                </div>
              )}

              {/* Waiting for Expert Indicator */}
              {extensionChatStatus === "requesting" && (
                <div className={styles.extendChatWaitingIndicator}>
                  <div className={styles.extendChatWaitingDot} />
                  <span>Waiting for {expertName} to respond...</span>
                </div>
              )}

              {/* Expert Live Reply Message Row with smooth reply animation */}
              {(extensionChatStatus === "confirmed" ||
                extensionChatStatus === "reduced" ||
                extensionChatStatus === "declined") && (
                  <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowExpert} ${styles.extendChatMsgRowReply}`}>
                    <div className={styles.extendChatMsgAvatar}>
                      <Image
                        src={expertImage}
                        alt={expertName}
                        fill
                        sizes="32px"
                        className={styles.extendChatAvatarImg}
                      />
                    </div>
                    <div className={styles.extendChatMsgContent}>
                      <div className={styles.extendChatMsgMeta}>
                        <span>{expertName}</span>
                        <span>•</span>
                        <span>Just now</span>
                      </div>
                      <div className={styles.extendChatMsgBubbleExpert}>
                        {extensionChatStatus === "confirmed" && "Sounds great, let's keep going!"}
                        {extensionChatStatus === "reduced" && `I can extend for ${seekerReceivedReplyMins} minutes instead.`}
                        {extensionChatStatus === "declined" && "Cannot extend the session at this time."}
                      </div>
                    </div>
                  </div>
                )}

              {/* System message when expert declines */}
              {extensionChatStatus === "declined" && (
                <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowExpert} ${styles.extendChatMsgRowReply}`}>
                  <div className={styles.extendChatMsgAvatar}>
                    <div className={styles.extendChatSystemAvatar}>
                      <Shield size={16} />
                    </div>
                  </div>
                  <div className={styles.extendChatMsgContent}>
                    <div className={styles.extendChatMsgMeta}>
                      <span>Jatayu System</span>
                      <span>•</span>
                      <span>Just now</span>
                    </div>
                    <div className={styles.extendChatMsgBubbleSystem}>
                      <div className={styles.extendChatSystemUnavailableTitle}>
                        Unable to extend session
                      </div>
                      {expertName} is unable to extend the session at this time.
                    </div>
                  </div>
                </div>
              )}

              {/* Jatayu System Extension Confirmation */}
              {(extensionChatStatus === "confirmed" || extensionChatStatus === "reduced") && (
                <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowExpert} ${styles.extendChatMsgRowReply}`}>
                  <div className={styles.extendChatMsgAvatar}>
                    <div className={styles.extendChatSystemAvatar}>
                      <Shield size={16} />
                    </div>
                  </div>
                  <div className={styles.extendChatMsgContent}>
                    <div className={styles.extendChatMsgMeta}>
                      <span>Jatayu System</span>
                      <span>•</span>
                      <span>Just now</span>
                    </div>
                    <div className={styles.extendChatMsgBubbleSystem}>
                      {extensionChatStatus === "reduced" && (
                        <div style={{ color: "var(--pomegranate, #ea4335)", fontWeight: 600 }}>
                          Note: The expert has reduced extension to {seekerReceivedReplyMins} minutes.
                        </div>
                      )}
                      Session extended by +{seekerReceivedReplyMins} mins. You will be redirected to payment after the current session ends. Make sure you have enough balance in your account.
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // --- EXPERT VIEW RENDERING ---
  if (!expertHasRequest || isDismissed) return null;

  return (
    <div className={`${styles.extendChatOverlay} ${isFadingOut ? styles.extendChatOverlayFadingOut : ""}`}>
      <div ref={chatLogRef} className={styles.extendChatLog}>
        {/* Seeker Message Row */}
        <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowExpert}`}>
          <div className={styles.extendChatMsgAvatar}>
            <Image
              src={clientImage}
              alt={clientName}
              fill
              sizes="32px"
              className={styles.extendChatAvatarImg}
            />
          </div>
          <div className={styles.extendChatMsgContent}>
            <div className={styles.extendChatMsgMeta}>
              <span>{clientName} (Seeker)</span>
              <span>•</span>
              <span>Just now</span>
            </div>
            <div className={styles.extendChatMsgBubbleSeeker}>
              I'd like to extend our consultation by {expertRequestedMins === 60 ? "1 hour" : `${expertRequestedMins} minutes`}.
            </div>
          </div>
        </div>

        {/* In-Chat Interactive Radio Decision Card (Retained in chat history) */}
        <div className={`${styles.extendChatRadioCard} ${styles.extendChatRadioCardRight}`}>
          <div className={styles.extendChatRadioTitle}>
            Respond to Extension Request ({expertRequestedMins === 60 ? "1 Hour" : `${expertRequestedMins} Mins`}):
          </div>
          <div
            className={styles.extendChatRadioList}
            role="radiogroup"
            aria-label="Expert decision options"
          >
            {/* Accept Option */}
            <div
              className={`${styles.extendChatRadioItem} ${selectedExpertChoice === "confirmed" ? styles.extendChatRadioItemActive : ""
                } ${expertDecisionStatus !== "pending" && selectedExpertChoice !== "confirmed" ? styles.extendChatRadioItemDisabled : ""}`}
              onClick={() => {
                if (expertDecisionStatus === "pending") {
                  setSelectedExpertChoice("confirmed");
                  setIsCustomEditing(false);
                }
              }}
              role="radio"
              aria-checked={selectedExpertChoice === "confirmed"}
              tabIndex={expertDecisionStatus !== "pending" ? -1 : 0}
            >
              <div className={styles.extendChatRadioLeft}>
                <div className={styles.extendChatRadioCustomCircle}>
                  {selectedExpertChoice === "confirmed" && <div className={styles.extendChatRadioCustomDot} />}
                </div>
                <span className={styles.extendChatRadioLabel}>
                  Accept ({expertRequestedMins === 60 ? "1 Hour" : `${expertRequestedMins} Mins`})
                </span>
              </div>
            </div>

            {/* Quick Reduce Option (if requested > 15 mins) */}
            {expertRequestedMins > 15 && (
              <div
                className={`${styles.extendChatRadioItem} ${selectedExpertChoice === "reduced-15" ? styles.extendChatRadioItemActive : ""
                  } ${expertDecisionStatus !== "pending" && selectedExpertChoice !== "reduced-15" ? styles.extendChatRadioItemDisabled : ""}`}
                onClick={() => {
                  if (expertDecisionStatus === "pending") {
                    setSelectedExpertChoice("reduced-15");
                    setIsCustomEditing(false);
                  }
                }}
                role="radio"
                aria-checked={selectedExpertChoice === "reduced-15"}
                tabIndex={expertDecisionStatus !== "pending" ? -1 : 0}
              >
                <div className={styles.extendChatRadioLeft}>
                  <div className={styles.extendChatRadioCustomCircle}>
                    {selectedExpertChoice === "reduced-15" && <div className={styles.extendChatRadioCustomDot} />}
                  </div>
                  <span className={styles.extendChatRadioLabel}>
                    Reduce to 15 Mins
                  </span>
                </div>
              </div>
            )}

            {/* Custom Duration Option (expert can type minutes, capped at requested) */}
            <div
              className={`${styles.extendChatRadioItem} ${selectedExpertChoice === "custom" || isCustomEditing ? styles.extendChatRadioItemActive : ""
                } ${expertDecisionStatus !== "pending" && selectedExpertChoice !== "custom" ? styles.extendChatRadioItemDisabled : ""}`}
              onClick={() => {
                if (expertDecisionStatus === "pending") {
                  setSelectedExpertChoice("custom");
                  setIsCustomEditing(true);
                  if (!customMinutesInput) {
                    setCustomMinutesInput(String(Math.min(10, expertRequestedMins)));
                  }
                }
              }}
              role="radio"
              aria-checked={selectedExpertChoice === "custom"}
              tabIndex={expertDecisionStatus !== "pending" ? -1 : 0}
              style={{ cursor: expertDecisionStatus !== "pending" ? "default" : "pointer" }}
            >
              <div className={styles.extendChatCustomContainer}>
                <div className={styles.extendChatRadioLeft} style={{ justifyContent: "space-between", width: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className={styles.extendChatRadioCustomCircle}>
                      {(selectedExpertChoice === "custom" || isCustomEditing) && (
                        <div className={styles.extendChatRadioCustomDot} />
                      )}
                    </div>
                    <span className={styles.extendChatRadioLabel}>
                      {expertDecisionStatus !== "pending" && selectedExpertChoice === "custom"
                        ? `Custom: ${expertConfirmedMins} Mins`
                        : "Custom Duration"}
                    </span>
                  </div>
                  {expertDecisionStatus === "pending" && (
                    <span className={styles.extendChatCustomMaxHint}>
                      Max {expertRequestedMins}m
                    </span>
                  )}
                </div>

                {/* Inline input form when custom is selected */}
                {isCustomEditing && expertDecisionStatus === "pending" && (
                  <form
                    onSubmit={handleCustomSubmit}
                    className={styles.extendChatCustomInputRow}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoFocus
                      placeholder={`1-${expertRequestedMins}`}
                      value={customMinutesInput}
                      onChange={handleCustomInputChange}
                      className={styles.extendChatCustomInput}
                    />
                    <span className={styles.extendChatCustomUnit}>minutes</span>
                  </form>
                )}
              </div>
            </div>

            {/* Decline Option */}
            <div
              className={`${styles.extendChatRadioItem} ${selectedExpertChoice === "declined" ? styles.extendChatRadioItemActive : ""
                } ${expertDecisionStatus !== "pending" && selectedExpertChoice !== "declined" ? styles.extendChatRadioItemDisabled : ""}`}
              onClick={() => {
                if (expertDecisionStatus === "pending") {
                  setSelectedExpertChoice("declined");
                  setIsCustomEditing(false);
                }
              }}
              role="radio"
              aria-checked={selectedExpertChoice === "declined"}
              tabIndex={expertDecisionStatus !== "pending" ? -1 : 0}
            >
              <div className={styles.extendChatRadioLeft}>
                <div className={styles.extendChatRadioCustomCircle}>
                  {selectedExpertChoice === "declined" && <div className={styles.extendChatRadioCustomDot} />}
                </div>
                <span className={styles.extendChatRadioLabel}>
                  Decline Request
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Button to Select / Confirm Decision */}
          {expertDecisionStatus === "pending" && selectedExpertChoice && (
            <button
              type="button"
              className={`${styles.extendChatConfirmBtn} ${
                selectedExpertChoice === "declined" ? styles.extendChatConfirmBtnDecline : ""
              }`}
              onClick={handleConfirmDecision}
              disabled={
                selectedExpertChoice === "custom" &&
                (!customMinutesInput || parseInt(customMinutesInput, 10) <= 0)
              }
            >
              {getSubmitButtonLabel()}
            </button>
          )}
        </div>

        {/* Expert Response Message Bubble appended to history upon decision */}
        {expertDecisionStatus !== "pending" && (
          <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowSeeker} ${styles.extendChatMsgRowAnimated}`}>
            <div className={styles.extendChatMsgAvatar}>
              <Image
                src={expertImage}
                alt="You"
                fill
                sizes="32px"
                className={styles.extendChatAvatarImg}
              />
            </div>
            <div className={styles.extendChatMsgContent}>
              <div className={styles.extendChatMsgMeta}>
                <span>You (Expert)</span>
                <span>•</span>
                <span>Just now</span>
              </div>
              <div className={styles.extendChatMsgBubbleExpert}>
                {expertDecisionStatus === "confirmed" && "Sounds great, let's keep going!"}
                {expertDecisionStatus === "reduced" && `I can extend for ${expertConfirmedMins} minutes.`}
                {expertDecisionStatus === "declined" && "Cannot extend the session at this time."}
              </div>
            </div>
          </div>
        )}

        {/* Jatayu System Notice to Expert */}
        {(expertDecisionStatus === "confirmed" || expertDecisionStatus === "reduced") && (
          <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowExpert} ${styles.extendChatMsgRowReply}`}>
            <div className={styles.extendChatMsgAvatar}>
              <div className={styles.extendChatSystemAvatar}>
                <Shield size={16} />
              </div>
            </div>
            <div className={styles.extendChatMsgContent}>
              <div className={styles.extendChatMsgMeta}>
                <span>Jatayu System</span>
                <span>•</span>
                <span>Just now</span>
              </div>
              <div className={styles.extendChatMsgBubbleSystem}>
                The extended session will begin in 1-2 min after this session ends.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
