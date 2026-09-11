import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const BookingMessage = seekerDb.define('BookingMessage', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false },
  senderType: { type: DataTypes.ENUM('seeker', 'expert'), allowNull: false },
  senderId: { type: DataTypes.UUID, allowNull: false },
  messageType: { type: DataTypes.ENUM('text'), allowNull: false, defaultValue: 'text' },
  message: { type: DataTypes.TEXT, allowNull: false },
  clientMessageId: { type: DataTypes.STRING(100), allowNull: false },
  deliveredAt: { type: DataTypes.DATE, allowNull: true },
  readAt: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { name: 'booking_messages_booking_created', fields: ['bookingId', 'createdAt'] },
    { name: 'booking_messages_sender_client_unique', unique: true, fields: ['senderType', 'senderId', 'clientMessageId'] },
  ],
});

export default BookingMessage;
