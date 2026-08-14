import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const Booking = seekerDb.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  seekerId: { type: DataTypes.UUID, allowNull: false },
  expertId: { type: DataTypes.UUID, allowNull: false },
  activeSlotKey: { type: DataTypes.STRING(100), allowNull: true },
  idempotencyKey: { type: DataTypes.STRING(100), allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'payment_pending' },
  consultationType: { type: DataTypes.STRING, allowNull: false },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  context: { type: DataTypes.TEXT, allowNull: false },
  scheduledStartAt: { type: DataTypes.DATE, allowNull: false },
  scheduledEndAt: { type: DataTypes.DATE, allowNull: false },
  timezone: { type: DataTypes.STRING, allowNull: false },
  expertName: { type: DataTypes.STRING, allowNull: false },
  expertProfessionalTitle: { type: DataTypes.STRING, allowNull: true },
  expertProfilePhotoSrc: { type: DataTypes.STRING, allowNull: true },
  consultationFee: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  platformFee: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  gst: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  creditsUsed: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  creditAmount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  totalAmount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  payableAmount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
  paymentStatus: { type: DataTypes.STRING, allowNull: false, defaultValue: 'pending' },
  confirmedAt: { type: DataTypes.DATE, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'bookings_unique_seeker_idempotency_key',
      unique: true,
      fields: ['seekerId', 'idempotencyKey'],
    },
    {
      name: 'bookings_unique_active_slot',
      unique: true,
      fields: ['activeSlotKey'],
    },
    { name: 'bookings_seeker_created_at', fields: ['seekerId', 'createdAt'] },
    { name: 'bookings_expert_status_start', fields: ['expertId', 'status', 'scheduledStartAt'] },
  ],
});

export default Booking;
