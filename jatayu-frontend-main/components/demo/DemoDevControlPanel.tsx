"use client";

import React, { useState } from "react";
import { Wrench, ChevronDown, ChevronUp, RotateCcw, Zap, MessageSquare } from "lucide-react";

export type DemoDevControlPanelProps = {
  role: "seeker" | "expert";
  secondsRemaining: number;
  isSessionEnded: boolean;
  isExpertBooked?: boolean;
  onToggleExpertBooked?: (booked: boolean) => void;
  onSetNormalEnd: () => void;
  onSetExtensionEnd: (minutes: number) => void;
  onResetActiveCall: (seconds?: number) => void;
  onTriggerExtensionModal?: () => void;
};

export default function DemoDevControlPanel({
  role,
  secondsRemaining,
  isSessionEnded,
  isExpertBooked = false,
  onToggleExpertBooked,
  onSetNormalEnd,
  onSetExtensionEnd,
  onResetActiveCall,
  onTriggerExtensionModal,
}: DemoDevControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      aria-label="Developer control panel"
      style={{
        position: "fixed",
        bottom: "16px",
        right: "16px",
        zIndex: 9999,
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "12px",
      }}
    >
      {!isExpanded ? (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          style={{
            background: "rgba(11, 13, 20, 0.92)",
            color: "#38bdf8",
            border: "1px solid rgba(56, 189, 248, 0.35)",
            borderRadius: "6px",
            padding: "6px 12px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
            backdropFilter: "blur(8px)",
            fontWeight: 600,
            transition: "all 0.15s ease",
          }}
          title="Open Developer Control Panel to simulate screen states"
        >
          <Wrench size={13} />
          <span>⚡ Dev Panel ({role})</span>
          <ChevronUp size={13} />
        </button>
      ) : (
        <div
          style={{
            background: "rgba(11, 13, 20, 0.96)",
            color: "#ffffff",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            borderRadius: "8px",
            padding: "12px 14px",
            width: "240px",
            boxShadow: "0 12px 35px rgba(0,0,0,0.6)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "6px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#38bdf8", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
              <Wrench size={12} />
              <span>Dev Simulator ({role})</span>
            </div>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "2px",
                display: "flex",
                alignItems: "center",
              }}
              title="Minimize panel"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Quick Simulation Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <button
              type="button"
              onClick={onSetNormalEnd}
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px dashed rgba(255, 255, 255, 0.25)",
                color: "#f1f5f9",
                padding: "6px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Zap size={12} color="#94a3b8" />
              <span>End Call (Normal 00:00)</span>
            </button>

            <button
              type="button"
              onClick={() => onSetExtensionEnd(15)}
              style={{
                background: "rgba(229, 59, 23, 0.18)",
                border: "1px solid rgba(229, 59, 23, 0.4)",
                color: "#ff8a75",
                padding: "6px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
              }}
            >
              <Zap size={12} color="#ea4335" />
              <span>End Call (+15m Ext)</span>
            </button>

            <button
              type="button"
              onClick={() => onSetExtensionEnd(30)}
              style={{
                background: "rgba(229, 59, 23, 0.24)",
                border: "1px solid rgba(229, 59, 23, 0.6)",
                color: "#ffa291",
                padding: "6px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontWeight: 600,
              }}
            >
              <Zap size={12} color="#ea4335" />
              <span>End Call (+30m Ext)</span>
            </button>

            {role === "seeker" && onTriggerExtensionModal && (
              <button
                type="button"
                onClick={onTriggerExtensionModal}
                style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.4)",
                  color: "#93c5fd",
                  padding: "6px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <MessageSquare size={12} color="#60a5fa" />
                <span>Open Extension Chat</span>
              </button>
            )}

            {/* Expert Already Booked Toggle */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: isExpertBooked ? "rgba(234, 67, 53, 0.18)" : "rgba(255, 255, 255, 0.05)",
                border: isExpertBooked ? "1px solid rgba(234, 67, 53, 0.45)" : "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "4px",
                padding: "6px 10px",
                cursor: "pointer",
                userSelect: "none",
                marginTop: "2px",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, color: isExpertBooked ? "#ff8a75" : "#e2e8f0" }}>
                  Expert Already Booked
                </span>
                <span style={{ fontSize: "9px", color: isExpertBooked ? "#fca5a5" : "#94a3b8" }}>
                  {isExpertBooked ? "Simulating busy/booked" : "Available to extend"}
                </span>
              </div>
              <input
                type="checkbox"
                checked={isExpertBooked}
                onChange={(e) => onToggleExpertBooked?.(e.target.checked)}
                style={{
                  cursor: "pointer",
                  accentColor: "#ea4335",
                  width: "15px",
                  height: "15px",
                }}
              />
            </label>

            <button
              type="button"
              onClick={() => onResetActiveCall(900)}
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.35)",
                color: "#86efac",
                padding: "6px 10px",
                borderRadius: "4px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "11px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "2px",
              }}
            >
              <RotateCcw size={12} color="#4ade80" />
              <span>Reset Active Call (15m)</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
