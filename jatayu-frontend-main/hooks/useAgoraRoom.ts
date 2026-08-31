"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { fetchAgoraSession } from "@/lib/agoraSessionApi";

export type AgoraTextMessage = { sender: "seeker" | "expert"; text: string; timestamp: string };

type Options = {
  bookingId: string;
  role: "seeker" | "expert";
  enabled: boolean;
  requestVideo: boolean;
  onMessage: (message: AgoraTextMessage) => void;
};

export function useAgoraRoom({ bookingId, role, enabled, requestVideo, onMessage }: Options) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const microphoneRef = useRef<IMicrophoneAudioTrack | null>(null);
  const cameraRef = useRef<ICameraVideoTrack | null>(null);
  const remoteVideoRef = useRef<IRemoteVideoTrack | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteVideoVersion, setRemoteVideoVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !bookingId) return;
    let disposed = false;
    let client: IAgoraRTCClient | null = null;
    const connect = async () => {
      try {
        setStatus("connecting");
        const session = await fetchAgoraSession(bookingId, role);
        if (disposed) return;
        const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
        client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
        clientRef.current = client;
        client.on("user-published", async (user, mediaType) => {
          if (!client) return;
          await client.subscribe(user, mediaType);
          if (mediaType === "audio") user.audioTrack?.play();
          if (mediaType === "video" && user.videoTrack) {
            remoteVideoRef.current = user.videoTrack;
            setRemoteVideoVersion((value) => value + 1);
          }
        });
        client.on("user-unpublished", (_user, mediaType) => {
          if (mediaType === "video") {
            remoteVideoRef.current = null;
            setRemoteVideoVersion((value) => value + 1);
          }
        });
        client.on("stream-message", (_uid, payload) => {
          try {
            const decoded = JSON.parse(new TextDecoder().decode(payload)) as AgoraTextMessage;
            onMessage(decoded);
          } catch { /* Ignore malformed channel data. */ }
        });
        await client.join(session.appId, session.channel, session.token, session.uid);
        if (session.capabilities.includes("audio")) {
          microphoneRef.current = await AgoraRTC.createMicrophoneAudioTrack();
        }
        if (requestVideo && session.capabilities.includes("video")) {
          cameraRef.current = await AgoraRTC.createCameraVideoTrack();
        }
        const tracks = [microphoneRef.current, cameraRef.current].filter(Boolean);
        if (tracks.length) await client.publish(tracks as [IMicrophoneAudioTrack, ...ICameraVideoTrack[]]);
        if (!disposed) setStatus("connected");
      } catch (reason) {
        if (!disposed) {
          setError(reason instanceof Error ? reason.message : "Unable to connect to Agora");
          setStatus("error");
        }
      }
    };
    connect();
    return () => {
      disposed = true;
      microphoneRef.current?.stop(); microphoneRef.current?.close(); microphoneRef.current = null;
      cameraRef.current?.stop(); cameraRef.current?.close(); cameraRef.current = null;
      remoteVideoRef.current = null;
      client?.leave().catch(() => undefined);
      clientRef.current = null;
    };
  }, [bookingId, enabled, onMessage, requestVideo, role]);

  const sendMessage = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean || !clientRef.current || status !== "connected") return false;
    const message: AgoraTextMessage = {
      sender: role,
      text: clean.slice(0, 900),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const dataClient = clientRef.current as IAgoraRTCClient & {
      sendStreamMessage: (payload: Uint8Array, needRetry?: boolean) => Promise<void>;
    };
    await dataClient.sendStreamMessage(new TextEncoder().encode(JSON.stringify(message)), true);
    onMessage(message);
    return true;
  }, [onMessage, role, status]);

  const toggleMute = useCallback(async () => {
    if (!microphoneRef.current) return;
    const next = !isMuted;
    await microphoneRef.current.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);
  const toggleVideo = useCallback(async () => {
    if (!cameraRef.current) return;
    const next = !isVideoOff;
    await cameraRef.current.setMuted(next);
    setIsVideoOff(next);
  }, [isVideoOff]);
  const playLocalVideo = useCallback((element: HTMLElement) => cameraRef.current?.play(element), []);
  const playRemoteVideo = useCallback((element: HTMLElement) => remoteVideoRef.current?.play(element), []);

  return { status, error, sendMessage, toggleMute, toggleVideo, isMuted, isVideoOff,
    playLocalVideo, playRemoteVideo, remoteVideoVersion };
}

export type AgoraRoomState = ReturnType<typeof useAgoraRoom>;
