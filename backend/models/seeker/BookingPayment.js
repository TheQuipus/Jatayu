import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const BookingPayment = seekerDb.define('BookingPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: { type: DataTypes.UUID, allowNull: false },
  provider: { type: DataTypes.STRING, allowNull: false, defaultValue: 'razorpay' },
  razorpayOrderId: { type: DataTypes.STRING, allowNull: true, unique: true },
  razorpayPaymentId: { type: DataTypes.STRING, allowNull: true, unique: true },
  amount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'created' },
  failureCode: { type: DataTypes.STRING, allowNull: true },
  failureDescription: { type: DataTypes.TEXT, allowNull: true },
  providerPayload: { type: DataTypes.JSON, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  razorpayRefundId: { type: DataTypes.STRING, allowNull: true, unique: true },
  refundStatus: { type: DataTypes.STRING, allowNull: true },
  refundedAmount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  refundRequestedAt: { type: DataTypes.DATE, allowNull: true },
  refundedAt: { type: DataTypes.DATE, allowNull: true },
  refundFailureCode: { type: DataTypes.STRING, allowNull: true },
  refundFailureDescription: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { name: 'booking_payments_booking_status', fields: ['bookingId', 'status'] },
  ],
});

export default BookingPayment;
