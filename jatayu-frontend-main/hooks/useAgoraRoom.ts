"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { completeAgoraSession, fetchAgoraSession } from "@/lib/agoraSessionApi";
import { getToken } from "@/lib/api";
import { connectSocket } from "@/lib/socket";
import { getBookingMessages, markBookingMessagesRead, saveBookingMessage } from '@/lib/bookingChatApi';
import { decodeAgoraTranscript } from '@/lib/agoraTranscriptCodec';
import {
  saveAgoraTranscriptSegment,
  startAgoraTranscription,
  stopAgoraTranscription,
  type TranscriptSegment,
} from '@/lib/agoraTranscriptApi';

export type AgoraTextMessage = { id?: string; sender: "seeker" | "expert"; text: string; timestamp: string };

type Options = {
  bookingId: string;
  role: "seeker" | "expert";
  enabled: boolean;
  requestVideo: boolean;
  onMessage: (message: AgoraTextMessage) => void;
  onTranscript?: (segment: TranscriptSegment) => void;
};

export function useAgoraRoom({ bookingId, role, enabled, requestVideo, onMessage, onTranscript }: Options) {
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const microphoneRef = useRef<IMicrophoneAudioTrack | null>(null);
  const cameraRef = useRef<ICameraVideoTrack | null>(null);
  const remoteVideoRef = useRef<IRemoteVideoTrack | null>(null);
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [error, setError] = useState("");
  const [chatError, setChatError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [remoteVideoVersion, setRemoteVideoVersion] = useState(0);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [scheduledEndAt, setScheduledEndAt] = useState<string | null>(null);
  const [extensionOfferBeforeMinutes, setExtensionOfferBeforeMinutes] = useState(5);
  const [hasEnded, setHasEnded] = useState(false);
  const seenMessageIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || !bookingId) return;
    let disposed = false;
    let client: IAgoraRTCClient | null = null;
    const connect = async () => {
      try {
        setStatus("connecting");
        const session = await fetchAgoraSession(bookingId, role);
        setScheduledEndAt(session.scheduledEndAt);
        setExtensionOfferBeforeMinutes(session.extensionOfferBeforeMinutes || 5);
        const history = await getBookingMessages(bookingId, role).catch(() => []);
        history.forEach((message) => {
          if (seenMessageIdsRef.current.has(message.id)) return;
          seenMessageIdsRef.current.add(message.id);
          onMessage(message);
        });
        void markBookingMessagesRead(bookingId, role).catch(() => undefined);
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
            if (decoded.id && seenMessageIdsRef.current.has(decoded.id)) return;
            if (decoded.id) seenMessageIdsRef.current.add(decoded.id);
            onMessage(decoded);
            return;
          } catch { /* The payload may be an Agora STT protobuf message. */ }
          const transcript = decodeAgoraTranscript(payload);
          if (!transcript) return;
          setTranscriptSegments((current) => {
            const index = current.findIndex((item) =>
              item.speakerUid === transcript.speakerUid && item.sequence === transcript.sequence);
            if (index < 0) return [...current, transcript].sort((a, b) => a.startMs - b.startMs || a.sequence - b.sequence);
            const next = [...current];
            next[index] = transcript;
            return next;
          });
          onTranscript?.(transcript);
          if (transcript.isFinal) {
            void saveAgoraTranscriptSegment(bookingId, role, transcript).catch(() => undefined);
          }
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
        await startAgoraTranscription(bookingId, role).catch((reason) => {
          console.warn('Agora live transcription was not started:', reason);
        });
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
  }, [bookingId, enabled, onMessage, onTranscript, requestVideo, role]);

  useEffect(() => {
    if (!enabled || !scheduledEndAt) return;
    const finish = () => {
      microphoneRef.current?.stop(); microphoneRef.current?.close(); microphoneRef.current = null;
      cameraRef.current?.stop(); cameraRef.current?.close(); cameraRef.current = null;
      void clientRef.current?.leave().catch(() => undefined);
      clientRef.current = null;
      setHasEnded(true);
      void stopAgoraTranscription(bookingId, role).catch(() => undefined);
      void completeAgoraSession(bookingId, role).catch(() => undefined);
    };
    const remaining = new Date(scheduledEndAt).getTime() - Date.now();
    if (remaining <= 0) { finish(); return; }
    const timeout = window.setTimeout(finish, remaining);
    return () => window.clearTimeout(timeout);
  }, [bookingId, enabled, role, scheduledEndAt]);

  useEffect(() => {
    const token = getToken();
    if (!enabled || !token) return;
    const socket = connectSocket(token);
    const activate = (payload: { bookingId?: string; extendedEndAt?: string }) => {
      if (payload.bookingId === bookingId && payload.extendedEndAt) {
        setScheduledEndAt(payload.extendedEndAt);
        setHasEnded(false);
      }
    };
    const receiveChatMessage = (message: AgoraTextMessage & { bookingId?: string }) => {
      if (message.bookingId !== bookingId || !message.id || seenMessageIdsRef.current.has(message.id)) return;
      seenMessageIdsRef.current.add(message.id);
      onMessage(message);
      void markBookingMessagesRead(bookingId, role).catch(() => undefined);
    };
    socket.on("session:extension:activated", activate);
    socket.on("chat:message", receiveChatMessage);
    return () => {
      socket.off("session:extension:activated", activate);
      socket.off("chat:message", receiveChatMessage);
    };
  }, [bookingId, enabled, onMessage, role]);

  const sendMessage = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return false;
    setChatError("");
    try {
      const clientMessageId = crypto.randomUUID();
      const saved = await saveBookingMessage(bookingId, role, clean.slice(0, 2000), clientMessageId);
      const message: AgoraTextMessage = { ...saved };
      seenMessageIdsRef.current.add(saved.id);
      onMessage(message);
      if (clientRef.current && status === "connected") {
        const dataClient = clientRef.current as IAgoraRTCClient & {
          sendStreamMessage: (payload: Uint8Array, needRetry?: boolean) => Promise<void>;
        };
        await dataClient.sendStreamMessage(new TextEncoder().encode(JSON.stringify(message)), true)
          .catch((reason: unknown) => console.warn("Agora message delivery used socket fallback:", reason));
      }
      return true;
    } catch (reason) {
      setChatError(reason instanceof Error ? reason.message : "Unable to send message");
      return false;
    }
  }, [bookingId, onMessage, role, status]);

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
  const stopTranscription = useCallback(
    () => stopAgoraTranscription(bookingId, role),
    [bookingId, role],
  );
  const applyExtendedEndAt = useCallback((value: string) => {
    if (value) { setScheduledEndAt(value); setHasEnded(false); }
  }, []);

  return { status, error, chatError, sendMessage, toggleMute, toggleVideo, isMuted, isVideoOff,
    playLocalVideo, playRemoteVideo, remoteVideoVersion, transcriptSegments, stopTranscription,
    scheduledEndAt, extensionOfferBeforeMinutes, hasEnded, applyExtendedEndAt };
}

export type AgoraRoomState = ReturnType<typeof useAgoraRoom>;
