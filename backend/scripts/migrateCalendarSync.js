import { BookingCalendarEvent, ExpertCalendarConnection, expertDb, seekerDb } from '../models/index.js';

try {
  await ExpertCalendarConnection.sync();
  await BookingCalendarEvent.sync();
  console.log('External calendar synchronization tables migrated successfully.');
} catch (error) {
  console.error('External calendar migration failed:', error);
  process.exitCode = 1;
} finally {
  await Promise.all([expertDb.close(), seekerDb.close()]);
}
