import { DigilockerDocument, DigilockerVerification, expertDb } from '../models/index.js';

async function migrate() {
  await expertDb.authenticate();
  await DigilockerVerification.sync();
  await DigilockerDocument.sync();
  console.log('DigiLocker verification and private document tables migrated successfully.');
}

migrate()
  .catch((error) => {
    console.error('DigiLocker verification migration failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await expertDb.close();
  });
