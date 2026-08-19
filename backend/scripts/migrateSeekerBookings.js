import { DataTypes } from 'sequelize';
import { Booking, BookingPayment, seekerDb } from '../models/index.js';

async function indexNames(queryInterface, tableName) {
  try {
    return new Set((await queryInterface.showIndex(tableName)).map((index) => index.name));
  } catch {
    return new Set();
  }
}

async function migrate() {
  const queryInterface = seekerDb.getQueryInterface();
  await seekerDb.authenticate();

  let bookingColumns = {};
  try { bookingColumns = await queryInterface.describeTable('Bookings'); } catch { /* created below */ }

  if (Object.keys(bookingColumns).length > 0 && !bookingColumns.activeSlotKey) {
    await queryInterface.addColumn('Bookings', 'activeSlotKey', {
      type: DataTypes.STRING(100),
      allowNull: true,
    });
  }

  const bookingAdditions = {
    expertRequestedAt: { type: DataTypes.DATE, allowNull: true },
    expertRespondedAt: { type: DataTypes.DATE, allowNull: true },
    declineReasonCode: { type: DataTypes.STRING(50), allowNull: true },
    declineReasonNotes: { type: DataTypes.TEXT, allowNull: true },
  };
  for (const [column, definition] of Object.entries(bookingAdditions)) {
    if (Object.keys(bookingColumns).length > 0 && !bookingColumns[column]) {
      await queryInterface.addColumn('Bookings', column, definition);
    }
  }

  let paymentColumns = {};
  try { paymentColumns = await queryInterface.describeTable('BookingPayments'); } catch { /* created below */ }
  const paymentAdditions = {
    razorpayRefundId: { type: DataTypes.STRING, allowNull: true, unique: true },
    refundStatus: { type: DataTypes.STRING, allowNull: true },
    refundedAmount: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    refundRequestedAt: { type: DataTypes.DATE, allowNull: true },
    refundedAt: { type: DataTypes.DATE, allowNull: true },
    refundFailureCode: { type: DataTypes.STRING, allowNull: true },
    refundFailureDescription: { type: DataTypes.TEXT, allowNull: true },
  };
  for (const [column, definition] of Object.entries(paymentAdditions)) {
    if (Object.keys(paymentColumns).length > 0 && !paymentColumns[column]) {
      await queryInterface.addColumn('BookingPayments', column, definition);
    }
  }

  const indexes = await indexNames(queryInterface, 'Bookings');
  if (indexes.has('bookings_unique_expert_start_time')) {
    await queryInterface.removeIndex('Bookings', 'bookings_unique_expert_start_time');
  }

  await Booking.sync();
  await BookingPayment.sync();
  await Booking.update({
    status: 'awaiting_expert',
    expertRequestedAt: seekerDb.literal('COALESCE(`confirmedAt`, `createdAt`)'),
    confirmedAt: null,
  }, {
    where: { status: 'confirmed', expertRespondedAt: null },
  });
  console.log('Seeker booking tables migrated successfully.');
}

migrate()
  .catch((error) => {
    console.error('Seeker booking migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await seekerDb.close();
  });
