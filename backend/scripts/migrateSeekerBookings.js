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

  const indexes = await indexNames(queryInterface, 'Bookings');
  if (indexes.has('bookings_unique_expert_start_time')) {
    await queryInterface.removeIndex('Bookings', 'bookings_unique_expert_start_time');
  }

  await Booking.sync();
  await BookingPayment.sync();
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
