import { BookingMessage, seekerDb } from '../models/index.js';
BookingMessage.sync().then(() => console.log('Booking messages table migrated successfully.'))
  .catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => seekerDb.close());
