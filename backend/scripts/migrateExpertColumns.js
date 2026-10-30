import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import expertDb from '../config/db/expert.js';

dotenv.config();

export const EXPERT_COLUMN_DEFINITIONS = [
  ['onboardingMetadata', 'JSON NULL'],
  ['applicationNumber', 'VARCHAR(255) NULL'],
  ['submittedAt', 'DATETIME NULL'],
  ['approvedAt', 'DATETIME NULL'],
  ['reviewerNote', 'TEXT NULL'],
];

async function columnExists(db, tableName, columnName) {
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    { replacements: [tableName, columnName] },
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

export async function ensureExpertColumns(db = expertDb) {
  for (const [columnName, definition] of EXPERT_COLUMN_DEFINITIONS) {
    const exists = await columnExists(db, 'Experts', columnName);
    if (!exists) {
      await db.query(`ALTER TABLE \`Experts\` ADD COLUMN \`${columnName}\` ${definition}`);
      console.log(`[Auto-Migrate] Added column Experts.${columnName}.`);
    }
  }

  // Ensure index on (approvedAt, updatedAt) so sorting wide rows does not exceed MySQL's sort_buffer_size
  const [indexRows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'Experts'
       AND INDEX_NAME = 'idx_experts_approved_updated'`,
  );
  if (Number(indexRows[0]?.count ?? 0) === 0) {
    await db.query('CREATE INDEX `idx_experts_approved_updated` ON `Experts` (`approvedAt`, `updatedAt`)');
    console.log('[Auto-Migrate] Created index idx_experts_approved_updated on Experts (approvedAt, updatedAt).');
  }
}

// When executed directly from CLI: node scripts/migrateExpertColumns.js
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  expertDb.authenticate()
    .then(() => ensureExpertColumns(expertDb))
    .then(() => {
      console.log('Migration complete.');
      return expertDb.close();
    })
    .catch(async (error) => {
      console.error('Migration failed:', error);
      await expertDb.close();
      process.exit(1);
    });
}

