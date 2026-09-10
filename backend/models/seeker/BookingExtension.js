import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const BookingExtension = seekerDb.define('BookingExtension', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false, unique: true },
  requestedMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  approvedMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'requested' },
  consultationFee: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  gst: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  totalAmount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
  razorpayOrderId: { type: DataTypes.STRING, allowNull: true, unique: true },
  razorpayPaymentId: { type: DataTypes.STRING, allowNull: true, unique: true },
  originalEndAt: { type: DataTypes.DATE, allowNull: false },
  extendedEndAt: { type: DataTypes.DATE, allowNull: true },
  requestedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  respondedAt: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  failureCode: { type: DataTypes.STRING(100), allowNull: true },
}, { timestamps: true });

export default BookingExtension;
