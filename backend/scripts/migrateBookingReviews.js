import BookingReview from '../models/seeker/BookingReview.js';
import seekerDb from '../config/db/seeker.js';

try {
  await seekerDb.authenticate();
  await BookingReview.sync();
  console.log('Booking reviews table ready.');
} catch (error) {
  console.error('Review migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await seekerDb.close();
}
