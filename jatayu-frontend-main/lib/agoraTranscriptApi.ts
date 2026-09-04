import { getToken } from '@/lib/api';
import { publicApiBase } from '@/lib/publicApiBase';

export type TranscriptSegment = {
  id?: string;
  speakerUid: string;
  speakerRole?: 'seeker' | 'expert' | null;
  sequence: number;
  startMs: number;
  durationMs: number;
  language?: string | null;
  text: string;
  confidence?: number | null;
  isFinal: boolean;
  providerTimestamp?: number | null;
};

function pathFor(bookingId: string, role: 'seeker' | 'expert', suffix: string) {
  const root = role === 'seeker' ? 'seeker/bookings' : 'expert/requests';
  return `${publicApiBase()}/api/${root}/${encodeURIComponent(bookingId)}/${suffix}`;
}

async function request(bookingId: string, role: 'seeker' | 'expert', suffix: string, init?: RequestInit) {
  const token = getToken();
  if (!token) throw new Error('Authentication is required');
  const response = await fetch(pathFor(bookingId, role, suffix), {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Transcript request failed');
  return data;
}

export const startAgoraTranscription = (bookingId: string, role: 'seeker' | 'expert') =>
  request(bookingId, role, 'transcription/start', { method: 'POST' });

export const stopAgoraTranscription = (bookingId: string, role: 'seeker' | 'expert') =>
  request(bookingId, role, 'transcription/stop', { method: 'POST' });

export const saveAgoraTranscriptSegment = (bookingId: string, role: 'seeker' | 'expert', segment: TranscriptSegment) =>
  request(bookingId, role, 'transcription/segments', { method: 'POST', body: JSON.stringify(segment) });

export const fetchBookingTranscript = (bookingId: string, role: 'seeker' | 'expert') =>
  request(bookingId, role, 'transcript');
