import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const BookingCalendarEvent = seekerDb.define('BookingCalendarEvent', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false },
  expertId: { type: DataTypes.UUID, allowNull: false },
  provider: { type: DataTypes.STRING(20), allowNull: false },
  externalEventId: { type: DataTypes.STRING(255), allowNull: false },
  externalCalendarId: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'primary' },
  externalEventUrl: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'synced' },
  lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
  lastError: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ name: 'booking_calendar_provider_unique', unique: true, fields: ['bookingId', 'provider'] }],
});

export default BookingCalendarEvent;
