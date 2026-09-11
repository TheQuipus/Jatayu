import { createBookingMessage, listBookingMessages, markBookingMessagesRead } from '../services/bookingChatService.js';
import { emitRealtime, sendNotification } from '../services/notificationService.js';

const errors = { BOOKING_NOT_FOUND: [404, 'Booking not found'], CHAT_NOT_ACTIVE: [409, 'Chat is not active'], CHAT_CLOSED: [410, 'Chat session has ended'], INVALID_MESSAGE: [422, 'Message and clientMessageId are required'] };
function fail(error, res) { const [status, message] = errors[error.message] || [500, 'Unable to process chat']; return res.status(status).json({ message, code: error.message }); }
const handlers = (role) => ({
  list: async (req, res) => { try { return res.json({ messages: await listBookingMessages(role, req.user.id, req.params.bookingId, req.query) }); } catch (e) { return fail(e, res); } },
  send: async (req, res) => { try {
    const result = await createBookingMessage(role, req.user.id, req.params.bookingId, req.body || {});
    const recipientType = role === 'seeker' ? 'expert' : 'seeker';
    const recipientId = role === 'seeker' ? result.booking.expertId : result.booking.seekerId;
    emitRealtime(recipientType, recipientId, 'chat:message', result.message);
    void sendNotification({ recipientType, recipientId, eventType: 'chat.message', title: 'New session message',
      body: result.message.text.slice(0, 140), href: role === 'seeker' ? `/expert/requests/${result.booking.id}/?action=join` : `/seeker/bookings/${result.booking.id}/?action=join`,
      data: { bookingId: result.booking.id, messageId: result.message.id } }).catch(console.error);
    return res.status(201).json({ message: result.message });
  } catch (e) { return fail(e, res); } },
  read: async (req, res) => { try { return res.json(await markBookingMessagesRead(role, req.user.id, req.params.bookingId)); } catch (e) { return fail(e, res); } },
});
export const seekerChat = handlers('seeker');
export const expertChat = handlers('expert');
