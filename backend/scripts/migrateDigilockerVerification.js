import { DigilockerVerification, expertDb } from '../models/index.js';

async function migrate() {
  await expertDb.authenticate();
  await DigilockerVerification.sync();
  console.log('DigiLocker verification table migrated successfully.');
}

migrate()
  .catch((error) => {
    console.error('DigiLocker verification migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await expertDb.close();
  });
