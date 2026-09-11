import { getToken } from '@/lib/api';
import { publicApiBase } from '@/lib/publicApiBase';

export type BookingChatMessage = { id: string; bookingId: string; sender: 'seeker' | 'expert'; text: string; timestamp: string; deliveredAt?: string; readAt?: string };
function root(role: 'seeker' | 'expert') { return role === 'expert' ? 'expert/requests' : 'seeker/bookings'; }
async function call<T>(bookingId: string, role: 'seeker' | 'expert', suffix = '', init?: RequestInit): Promise<T> {
  const response = await fetch(`${publicApiBase()}/api/${root(role)}/${encodeURIComponent(bookingId)}/messages${suffix}`, {
    ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken() || ''}`, ...(init?.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Chat request failed');
  return data as T;
}
export async function getBookingMessages(bookingId: string, role: 'seeker' | 'expert') {
  return (await call<{ messages: BookingChatMessage[] }>(bookingId, role)).messages;
}
export async function saveBookingMessage(bookingId: string, role: 'seeker' | 'expert', message: string, clientMessageId: string) {
  return (await call<{ message: BookingChatMessage }>(bookingId, role, '', { method: 'POST', body: JSON.stringify({ message, clientMessageId }) })).message;
}
export async function markBookingMessagesRead(bookingId: string, role: 'seeker' | 'expert') {
  return call(bookingId, role, '/read', { method: 'PATCH' });
}
