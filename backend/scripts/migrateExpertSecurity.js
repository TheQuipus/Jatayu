import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';
import ExpertSession from '../models/ExpertSession.js';
import ExpertSecurityChallenge from '../models/ExpertSecurityChallenge.js';

async function migrate() {
  await expertDb.authenticate();
  const query = expertDb.getQueryInterface();
  const expertColumns = await query.describeTable('Experts');
  if (!expertColumns.twoFactorEnabled) {
    await query.addColumn('Experts', 'twoFactorEnabled', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
  }
  if (!expertColumns.notificationPreferences) {
    await query.addColumn('Experts', 'notificationPreferences', {
      type: DataTypes.JSON,
      allowNull: true,
    });
  }
  if (!expertColumns.deletedAt) {
    await query.addColumn('Experts', 'deletedAt', {
      type: DataTypes.DATE,
      allowNull: true,
    });
    await query.addIndex('Experts', ['deletedAt'], { name: 'experts_deleted_at' });
  }
  await ExpertSession.sync();
  await ExpertSecurityChallenge.sync();
  console.log('Expert security tables migrated successfully.');
}

migrate().catch((error) => {
  console.error('Expert security migration failed:', error);
  process.exitCode = 1;
}).finally(() => expertDb.close());
