import {
  beginCalendarConnection,
  calendarFrontendReturn,
  completeCalendarConnection,
  disconnectCalendar,
  listCalendarConnections,
  syncConfirmedBookings,
} from '../services/expertCalendarService.js';

const providerOf = (req) => String(req.params.provider || '').toLowerCase();

export async function getCalendarConnections(req, res) {
  try { res.json({ connections: await listCalendarConnections(req.user.id) }); }
  catch (error) { console.error('Calendar connections error:', error.message); res.status(500).json({ message: 'Unable to load calendar connections' }); }
}

export async function connectCalendar(req, res) {
  try { res.json({ authorizationUrl: await beginCalendarConnection(req.user.id, providerOf(req)) }); }
  catch (error) {
    const status = ['CALENDAR_PROVIDER_INVALID', 'CALENDAR_PROVIDER_NOT_CONFIGURED'].includes(error.message) ? 422 : 500;
    res.status(status).json({ message: error.message === 'CALENDAR_PROVIDER_NOT_CONFIGURED' ? 'Calendar provider is not configured by the administrator' : 'Unable to start calendar connection', code: error.message });
  }
}

export async function calendarCallback(req, res) {
  const provider = providerOf(req);
  try {
    if (req.query.error) throw new Error(String(req.query.error_description || req.query.error));
    await completeCalendarConnection(provider, String(req.query.state || ''), String(req.query.code || ''));
    res.redirect(await calendarFrontendReturn(provider, 'connected'));
  } catch (error) {
    console.error(`${provider} calendar callback error:`, error.message);
    res.redirect(await calendarFrontendReturn(provider, 'error', error.message));
  }
}

export async function removeCalendarConnection(req, res) {
  try { await disconnectCalendar(req.user.id, providerOf(req)); res.json({ message: 'Calendar disconnected' }); }
  catch (error) { res.status(500).json({ message: 'Unable to disconnect calendar' }); }
}

export async function syncCalendarNow(req, res) {
  try { const syncedBookings = await syncConfirmedBookings(req.user.id, providerOf(req)); res.json({ message: 'Calendar synchronized', syncedBookings }); }
  catch (error) { res.status(error.message === 'CALENDAR_NOT_CONNECTED' ? 409 : 500).json({ message: error.message === 'CALENDAR_NOT_CONNECTED' ? 'Calendar is not connected' : 'Unable to synchronize calendar', code: error.message }); }
}
