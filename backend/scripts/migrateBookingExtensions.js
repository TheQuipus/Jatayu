import { BookingExtension, seekerDb } from '../models/index.js';

BookingExtension.sync()
  .then(() => console.log('Booking extension table migrated successfully.'))
  .catch((error) => { console.error('Booking extension migration failed:', error); process.exitCode = 1; })
  .finally(() => seekerDb.close());
