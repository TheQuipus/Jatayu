"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Shield } from "lucide-react";
import styles from "@/components/seeker/bookings/ActiveRoom.module.css";

export type ExtendSessionChatOverlayProps = {
  role: "seeker" | "expert";
  isOpen?: boolean;
  expertName?: string;
  expertImage?: string;
  clientName?: string;
  clientImage?: string;
  onExtendSessionAdded?: (secondsToAdd: number) => void;
  channelName?: string;
};

const DEFAULT_CHANNEL_NAME = "jatayu_demo_sync_v1";

export default function ExtendSessionChatOverlay({
  role,
  isOpen = false,
  expertName = "Dr. Ananya Sharma",
  expertImage = "/assets/img/team1.png",
  clientName = "Rahul Sharma",
  clientImage = "/assets/img/manportrait.png",
  onExtendSessionAdded,
  channelName = DEFAULT_CHANNEL_NAME,
}: ExtendSessionChatOverlayProps) {
  // Seeker states
  const [selectedExtension, setSelectedExtension] = useState<number | null>(null);
  const [extensionChatStatus, setExtensionChatStatus] = useState<
    "idle" | "requesting" | "confirmed" | "reduced" | "declined"
  >("idle");
  const [seekerReceivedReplyMins, setSeekerReceivedReplyMins] = useState<number>(30);
  const [seekerPaymentMethod, setSeekerPaymentMethod] = useState<"credits" | "gateway" | null>(null);

  // Expert states
  const [expertHasRequest, setExpertHasRequest] = useState(false);
  const [expertRequestedMins, setExpertRequestedMins] = useState<number>(30);
  const [expertDecisionStatus, setExpertDecisionStatus] = useState<
    "pending" | "confirmed" | "declined" | "reduced"
  >("pending");
  const [expertConfirmedMins, setExpertConfirmedMins] = useState<number>(30);
  const [selectedExpertChoice, setSelectedExpertChoice] = useState<string | null>(null);

  // Auto-hide states
  const [isDismissed, setIsDismissed] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  // Reset seeker state when closed/reopened
  useEffect(() => {
    if (!isOpen && role === "seeker") {
      setSelectedExtension(null);
      setExtensionChatStatus("idle");
      setSeekerPaymentMethod(null);
      setIsDismissed(false);
      setIsFadingOut(false);
    } else if (isOpen && role === "seeker") {
      setIsDismissed(false);
      setIsFadingOut(false);
    }
  }, [isOpen, role]);

  // Seeker auto-hide after communication finishes (payment chosen or declined)
  useEffect(() => {
    if (role === "seeker") {
      const isFinished = seekerPaymentMethod !== null || extensionChatStatus === "declined";
      if (isFinished) {
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
        }, 10000);
        const hideTimer = setTimeout(() => {
          setIsDismissed(true);
        }, 10500);
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, [role, seekerPaymentMethod, extensionChatStatus]);

  // Expert auto-hide after communication finishes (decision made)
  useEffect(() => {
    if (role === "expert" && expertHasRequest) {
      const isFinished = expertDecisionStatus !== "pending";
      if (isFinished) {
        const fadeTimer = setTimeout(() => {
          setIsFadingOut(true);
        }, 10000);
        const hideTimer = setTimeout(() => {
          setIsDismissed(true);
        }, 10500);
        return () => {
          clearTimeout(fadeTimer);
          clearTimeout(hideTimer);
        };
      }
    }
  }, [role, expertHasRequest, expertDecisionStatus]);

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

      if (role === "expert") {
        if (data.type === "SEEKER_REQUEST_EXTENSION") {
          const reqMins = data.mins || 30;
          setExpertRequestedMins(reqMins);
          setExpertConfirmedMins(reqMins);
          setExpertHasRequest(true);
          setExpertDecisionStatus("pending");
          setSelectedExpertChoice(null);
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
            onExtendSessionAdded?.(finalMins * 60);
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

  const handleSelectExtension = (mins: number) => {
    setSelectedExtension(mins);
    setExtensionChatStatus("requesting");

    // Broadcast live to Expert tab
    broadcastSync({
      type: "SEEKER_REQUEST_EXTENSION",
      mins,
    });
  };

  const handleExpertDecision = (choiceId: string, mins: number) => {
    setSelectedExpertChoice(choiceId);
    let status: "confirmed" | "reduced" | "declined" = "confirmed";
    let finalMins = mins;

    if (choiceId === "confirmed") {
      status = "confirmed";
      finalMins = expertRequestedMins;
      onExtendSessionAdded?.(finalMins * 60);
    } else if (choiceId.startsWith("reduced")) {
      status = "reduced";
      finalMins = mins;
      onExtendSessionAdded?.(finalMins * 60);
    } else if (choiceId === "declined") {
      status = "declined";
      finalMins = 0;
    }

    setExpertDecisionStatus(status);
    setExpertConfirmedMins(finalMins);

    // Broadcast live to Seeker tab
    broadcastSync({
      type: "EXPERT_DECISION",
      decision: status,
      mins: finalMins,
    });
  };

  // --- SEEKER VIEW RENDERING ---
  if (role === "seeker") {
    if (!isOpen || isDismissed) return null;

    return (
      <div className={`${styles.extendChatOverlay} ${isFadingOut ? styles.extendChatOverlayFadingOut : ""}`}>
        <div className={styles.extendChatLog}>
          {/* In-Chat Interactive Radio Duration Selector (Shown when not yet selected) */}
          {!selectedExtension ? (
            <div className={styles.extendChatRadioCard}>
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
                ].map((option) => (
                  <div
                    key={option.mins}
                    className={styles.extendChatRadioItem}
                    onClick={() => handleSelectExtension(option.mins)}
                    role="radio"
                    aria-checked={false}
                    tabIndex={0}
                  >
                    <div className={styles.extendChatRadioLeft}>
                      <div className={styles.extendChatRadioCustomCircle} />
                      <span className={styles.extendChatRadioLabel}>
                        {option.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Converted Seeker Message Bubble upon selection with smooth morph animation */
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

          {/* Jatayu System Payment Method Selector & Confirmation */}
          {(extensionChatStatus === "confirmed" || extensionChatStatus === "reduced") && (
            <>
              {seekerPaymentMethod === null ? (
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
                    {(() => {
                      const cost = seekerReceivedReplyMins === 15 ? 500 : seekerReceivedReplyMins === 30 ? 1000 : seekerReceivedReplyMins === 45 ? 1500 : seekerReceivedReplyMins === 60 ? 2000 : seekerReceivedReplyMins * 35;
                      return (
                        <div className={styles.extendChatRadioCard}>
                          <div className={styles.extendChatSummaryNote}>
                            {extensionChatStatus === "reduced" && (
                              <div style={{ marginBottom: "5px", color: "var(--pomegranate, #ea4335)", fontWeight: 600 }}>
                                Note: The expert has reduced your extension request to {seekerReceivedReplyMins} minutes.
                              </div>
                            )}
                            Your session will be extended for {seekerReceivedReplyMins} min and you’ll be charged ₹{cost.toLocaleString()} amount of money. Make sure you have enough money in your account.
                          </div>
                          <div className={styles.extendChatRadioTitle}>
                            Choose Payment Method:
                          </div>
                          <div
                            className={styles.extendChatRadioList}
                            role="radiogroup"
                            aria-label="Payment method options"
                          >
                            <div
                              className={styles.extendChatRadioItem}
                              onClick={() => setSeekerPaymentMethod("credits")}
                              role="radio"
                              aria-checked={false}
                              tabIndex={0}
                            >
                              <div className={styles.extendChatRadioLeft}>
                                <div className={styles.extendChatRadioCustomCircle} />
                                <span className={styles.extendChatRadioLabel}>
                                  Use Jatayu Credits
                                </span>
                              </div>
                              <span className={styles.extendChatRadioPrice}>
                                {cost.toLocaleString()} Credits
                              </span>
                            </div>

                            <div
                              className={styles.extendChatRadioItem}
                              onClick={() => setSeekerPaymentMethod("gateway")}
                              role="radio"
                              aria-checked={false}
                              tabIndex={0}
                            >
                              <div className={styles.extendChatRadioLeft}>
                                <div className={styles.extendChatRadioCustomCircle} />
                                <span className={styles.extendChatRadioLabel}>
                                  Pay via Payment Gateway
                                </span>
                              </div>
                              <span className={styles.extendChatRadioPrice}>
                                ₹{cost.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className={`${styles.extendChatMsgRow} ${styles.extendChatMsgRowExpert} ${styles.extendChatMsgRowAnimated}`}>
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
                      {(() => {
                        const cost = seekerReceivedReplyMins === 15 ? 500 : seekerReceivedReplyMins === 30 ? 1000 : seekerReceivedReplyMins === 45 ? 1500 : seekerReceivedReplyMins === 60 ? 2000 : seekerReceivedReplyMins * 35;
                        return seekerPaymentMethod === "gateway"
                          ? `You'll be redirected to payment gateway after call ends (₹${cost.toLocaleString()}).`
                          : `${cost.toLocaleString()} Credits will be automatically deducted from your Jatayu Credits after call ends.`;
                      })()}
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
      <div className={styles.extendChatLog}>
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

        {/* In-Chat Interactive Radio Decision Card (Shown when pending) */}
        {expertDecisionStatus === "pending" ? (
          <div className={`${styles.extendChatRadioCard} ${styles.extendChatRadioCardRight}`}>
            <div className={styles.extendChatRadioTitle}>
              Respond to Extension Request ({expertRequestedMins === 60 ? "1 Hour" : `${expertRequestedMins} Mins`}):
            </div>
            <div
              className={styles.extendChatRadioList}
              role="radiogroup"
              aria-label="Expert decision options"
            >
              {[
                {
                  id: "confirmed",
                  label: `Accept (${expertRequestedMins === 60 ? "1 Hour" : `${expertRequestedMins} Mins`})`,
                  mins: expertRequestedMins,
                },
                {
                  id: "reduced-15",
                  label: expertRequestedMins > 15 ? "Reduce to 15 Mins" : "Reduce to 5 Mins",
                  mins: expertRequestedMins > 15 ? 15 : 5,
                },
                { id: "declined", label: "Decline Request", mins: 0 },
              ].map((opt) => (
                <div
                  key={opt.id}
                  className={styles.extendChatRadioItem}
                  onClick={() => handleExpertDecision(opt.id, opt.mins)}
                  role="radio"
                  aria-checked={false}
                  tabIndex={0}
                >
                  <div className={styles.extendChatRadioLeft}>
                    <div className={styles.extendChatRadioCustomCircle} />
                    <span className={styles.extendChatRadioLabel}>
                      {opt.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Converted Expert Response Message Bubble upon selection with smooth morph animation */}
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
          </>
        )}
      </div>
    </div>
  );
}
