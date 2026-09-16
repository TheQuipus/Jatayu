import { DataTypes } from 'sequelize';
import Notification from '../models/Notification.js';
import adminDb from '../config/db/admin.js';

async function migrate() {
  await adminDb.authenticate();
  const queryInterface = adminDb.getQueryInterface();

  // sync() creates a fresh table but intentionally does not ALTER an existing
  // one. Add newer columns explicitly so this migration is safe to rerun.
  await Notification.sync();
  const columns = await queryInterface.describeTable('Notifications');

  if (!columns.dedupeKey) {
    await queryInterface.addColumn('Notifications', 'dedupeKey', {
      type: DataTypes.STRING(190),
      allowNull: true,
    });
    console.log('[Notifications] Added column: dedupeKey');
  }

  const indexes = await queryInterface.showIndex('Notifications');
  const hasDedupeKeyUniqueIndex = indexes.some((index) =>
    index.unique && index.fields?.some((field) => field.attribute === 'dedupeKey'));

  if (!hasDedupeKeyUniqueIndex) {
    await queryInterface.addIndex('Notifications', ['dedupeKey'], {
      name: 'notifications_dedupe_key_unique',
      unique: true,
    });
    console.log('[Notifications] Added unique index: notifications_dedupe_key_unique');
  }

  console.log('Notifications table migrated successfully.');
}

migrate()
  .catch((error) => {
    console.error('Notifications migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => adminDb.close());
