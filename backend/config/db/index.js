import expertDb from './expert.js';
import seekerDb from './seeker.js';
import adminDb from './admin.js';

export { expertDb, seekerDb, adminDb };

/** @deprecated Use expertDb — kept for backward compatibility with existing imports. */
export const sequelize = expertDb;

const databases = [
  { name: 'expert', db: expertDb, envVar: 'EXPERT_DB_NAME', defaultName: 'jatayu_expert_db' },
  { name: 'seeker', db: seekerDb, envVar: 'SEEKER_DB_NAME', defaultName: 'jatayu_seeker_db' },
  { name: 'admin', db: adminDb, envVar: 'ADMIN_DB_NAME', defaultName: 'jatayu_admin_db' },
];

export async function connectAllDatabases() {
  for (const { name, db, envVar, defaultName } of databases) {
    const dbName = process.env[envVar] || process.env.DB_NAME || defaultName;
    await db.authenticate();
    console.log(`MySQL ${name} database (${dbName}) connection established successfully.`);
  }
}

export async function syncAllDatabases(syncOptions = {}) {
  await expertDb.sync(syncOptions);
  console.log('Expert database tables synchronized.');

  await seekerDb.sync(syncOptions);
  console.log('Seeker database tables synchronized.');

  await adminDb.sync(syncOptions);
  console.log('Admin database tables synchronized.');
}

export async function closeAllDatabases() {
  await Promise.all([expertDb.close(), seekerDb.close(), adminDb.close()]);
}
