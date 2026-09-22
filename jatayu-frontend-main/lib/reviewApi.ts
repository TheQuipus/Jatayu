import { getToken } from './api';
import { publicApiBase } from './publicApiBase';

export type SessionReview = {
  id: string; bookingId: string; rating: number; comment: string; createdAt: string;
  reply: string | null; repliedAt: string | null; clientName?: string; sessionTitle?: string;
};
export type ExpertReviewResponse = {
  items: SessionReview[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { totalReviews: number; needsReply: number; overallRating: number; responseRatePercent: number; avgReplyTimeHours: number; starDistribution: { stars: number; count: number; percent: number }[] };
  trend: { rating: number; createdAt: string }[];
};
async function request<T>(path: string, method = 'GET', body?: object): Promise<T> {
  const response = await fetch(`${publicApiBase()}/api/${path}`, {
    method, headers: { Authorization: `Bearer ${getToken() || ''}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to process review');
  return data;
}
export const getBookingReview = (id: string) => request<{ review: SessionReview | null; canReview: boolean }>(`seeker/bookings/${encodeURIComponent(id)}/review`);
export const submitBookingReview = (id: string, rating: number, comment: string) => request<{ review: SessionReview; creditsAwarded: number; creditBalance?: number }>(`seeker/bookings/${encodeURIComponent(id)}/review`, 'POST', { rating, comment });
export const getExpertReviews = (page = 1, filter = 'all', sort = 'recent') => request<ExpertReviewResponse>(`expert/reviews?page=${page}&limit=20&filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}`);
export const replyToReview = (id: string, reply: string) => request<{ review: SessionReview }>(`expert/reviews/${encodeURIComponent(id)}/reply`, 'PUT', { reply });
