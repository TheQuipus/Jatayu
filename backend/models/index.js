import { expertDb, seekerDb, adminDb, sequelize } from '../config/db/index.js';
import Expert from './Expert.js';
import Seeker from './seeker/Seeker.js';
import Credential from './Credential.js';
import Availability from './Availability.js';
import Setting from './Setting.js';
import Admin from './Admin.js';
import SeekerCreditTransaction from './seeker/SeekerCreditTransaction.js';
import RazorpayWebhookEvent from './seeker/RazorpayWebhookEvent.js';
import Booking from './seeker/Booking.js';
import BookingPayment from './seeker/BookingPayment.js';

// Expert-module relationships (same database connection)
Expert.hasMany(Credential, { foreignKey: 'expertId', as: 'credentials', onDelete: 'CASCADE' });
Credential.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });

Expert.hasMany(Availability, { foreignKey: 'expertId', as: 'availabilities', onDelete: 'CASCADE' });
Availability.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });

Seeker.hasMany(SeekerCreditTransaction, {
  foreignKey: 'seekerId',
  as: 'creditTransactions',
  onDelete: 'CASCADE',
});
SeekerCreditTransaction.belongsTo(Seeker, { foreignKey: 'seekerId', as: 'seeker' });

Seeker.hasMany(Booking, { foreignKey: 'seekerId', as: 'bookings', onDelete: 'CASCADE' });
Booking.belongsTo(Seeker, { foreignKey: 'seekerId', as: 'seeker' });
Booking.hasMany(BookingPayment, { foreignKey: 'bookingId', as: 'payments', onDelete: 'CASCADE' });
BookingPayment.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

export {
  expertDb,
  seekerDb,
  adminDb,
  sequelize,
  Expert,
  Seeker,
  Credential,
  Availability,
  Setting,
  Admin,
  SeekerCreditTransaction,
  RazorpayWebhookEvent,
  Booking,
  BookingPayment,
};
