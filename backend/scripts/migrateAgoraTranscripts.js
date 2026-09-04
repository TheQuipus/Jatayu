import {
  BookingTranscriptSegment,
  BookingTranscriptSession,
  seekerDb,
} from '../models/index.js';

async function migrate() {
  await seekerDb.authenticate();
  await BookingTranscriptSession.sync();
  await BookingTranscriptSegment.sync();
  console.log('Agora transcript tables migrated successfully.');
}

migrate()
  .catch((error) => {
    console.error('Agora transcript migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => seekerDb.close());
