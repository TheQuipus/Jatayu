import adminDb from '../config/db/admin.js';
import AdminSession from '../models/AdminSession.js';

async function migrate() {
  await adminDb.authenticate();
  await AdminSession.sync();
  console.log('Admin session tables migrated successfully.');
}

migrate()
  .catch((error) => {
    console.error('Admin session migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => adminDb.close());

