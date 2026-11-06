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
  ['isBlacklisted', 'TINYINT(1) NOT NULL DEFAULT 0'],
  ['blacklistedAt', 'DATETIME NULL'],
];

async function columnExists(db, tableName, columnName) {
  try {
    const queryInterface = db.getQueryInterface();
    const tableInfo = await queryInterface.describeTable(tableName);
    if (tableInfo && (tableInfo[columnName] || tableInfo[columnName.toLowerCase()])) {
      return true;
    }
  } catch {
    // If table describe fails, fallback to INFORMATION_SCHEMA
  }

  const dbName = db.config?.database || process.env.EXPERT_DB_NAME || process.env.DB_NAME;
  const [rows] = await db.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE (TABLE_SCHEMA = ? OR TABLE_SCHEMA = DATABASE())
       AND (TABLE_NAME = ? OR LOWER(TABLE_NAME) = LOWER(?))
       AND (COLUMN_NAME = ? OR LOWER(COLUMN_NAME) = LOWER(?))`,
    { replacements: [dbName, tableName, tableName, columnName, columnName] },
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

export async function ensureExpertColumns(db = expertDb) {
  for (const [columnName, definition] of EXPERT_COLUMN_DEFINITIONS) {
    const exists = await columnExists(db, 'Experts', columnName);
    if (!exists) {
      try {
        await db.query(`ALTER TABLE \`Experts\` ADD COLUMN \`${columnName}\` ${definition}`);
        console.log(`[Auto-Migrate] Added column Experts.${columnName}.`);
      } catch (alterErr) {
        if (!alterErr.message.includes('Duplicate column')) {
          try {
            await db.query(`ALTER TABLE \`experts\` ADD COLUMN \`${columnName}\` ${definition}`);
            console.log(`[Auto-Migrate] Added column experts.${columnName}.`);
          } catch (alterErr2) {
            if (!alterErr2.message.includes('Duplicate column')) {
              console.warn(`[Auto-Migrate] Warning adding column ${columnName}:`, alterErr2.message);
            }
          }
        }
      }
    }
  }

  // Ensure index on (approvedAt, updatedAt) so sorting wide rows does not exceed MySQL's sort_buffer_size
  try {
    const [indexRows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE (TABLE_SCHEMA = DATABASE() OR TABLE_SCHEMA = ?)
         AND (TABLE_NAME = 'Experts' OR LOWER(TABLE_NAME) = 'experts')
         AND INDEX_NAME = 'idx_experts_approved_updated'`,
      { replacements: [db.config?.database] },
    );
    if (Number(indexRows[0]?.count ?? 0) === 0) {
      await db.query('CREATE INDEX `idx_experts_approved_updated` ON `Experts` (`approvedAt`, `updatedAt`)');
      console.log('[Auto-Migrate] Created index idx_experts_approved_updated on Experts (approvedAt, updatedAt).');
    }
  } catch (idxErr) {
    if (!idxErr.message.includes('Duplicate key name')) {
      console.warn('[Auto-Migrate] Index idx_experts_approved_updated warning:', idxErr.message);
    }
  }

  // Support approved expert discovery filtering and ordering.
  try {
    const [discoveryIndexRows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE (TABLE_SCHEMA = DATABASE() OR TABLE_SCHEMA = ?)
         AND (TABLE_NAME = 'Experts' OR LOWER(TABLE_NAME) = 'experts')
         AND INDEX_NAME = 'idx_experts_status_submitted_updated'`,
      { replacements: [db.config?.database] },
    );

    if (Number(discoveryIndexRows[0]?.count ?? 0) === 0) {
      await db.query(
        'CREATE INDEX `idx_experts_status_submitted_updated` ON `Experts` (`status`, `submittedAt`, `updatedAt`)',
      );
      console.log(
        '[Auto-Migrate] Created index idx_experts_status_submitted_updated on Experts (status, submittedAt, updatedAt).',
      );
    }
  } catch (idxErr) {
    if (!idxErr.message.includes('Duplicate key name')) {
      console.warn('[Auto-Migrate] Index idx_experts_status_submitted_updated warning:', idxErr.message);
    }
  }

  // Ensure index on isBlacklisted for fast lookup during login/registration
  try {
    const [blacklistIndexRows] = await db.query(
      `SELECT COUNT(*) AS count
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE (TABLE_SCHEMA = DATABASE() OR TABLE_SCHEMA = ?)
         AND (TABLE_NAME = 'Experts' OR LOWER(TABLE_NAME) = 'experts')
         AND INDEX_NAME = 'idx_experts_is_blacklisted'`,
      { replacements: [db.config?.database] },
    );
    if (Number(blacklistIndexRows[0]?.count ?? 0) === 0) {
      await db.query('CREATE INDEX `idx_experts_is_blacklisted` ON `Experts` (`isBlacklisted`)');
      console.log('[Auto-Migrate] Created index idx_experts_is_blacklisted on Experts (isBlacklisted).');
    }
  } catch (idxErr) {
    if (!idxErr.message.includes('Duplicate key name')) {
      console.warn('[Auto-Migrate] Index idx_experts_is_blacklisted warning:', idxErr.message);
    }
  }

  // Synchronize isBlacklisted column from onboardingMetadata for any existing records
  try {
    await db.query(`
      UPDATE \`Experts\`
      SET \`isBlacklisted\` = 1
      WHERE (\`isBlacklisted\` IS NULL OR \`isBlacklisted\` = 0)
        AND (
          \`onboardingMetadata\` LIKE '%"isBlacklisted":true%'
          OR \`onboardingMetadata\` LIKE '%"isBlacklisted": 1%'
          OR \`onboardingMetadata\` LIKE '%"isBlacklisted":1%'
        )
    `);
    console.log('[Auto-Migrate] Synchronized isBlacklisted flags from onboardingMetadata to Experts.');
  } catch (syncErr) {
    try {
      await db.query(`
        UPDATE \`experts\`
        SET \`isBlacklisted\` = 1
        WHERE (\`isBlacklisted\` IS NULL OR \`isBlacklisted\` = 0)
          AND (
            \`onboardingMetadata\` LIKE '%"isBlacklisted":true%'
            OR \`onboardingMetadata\` LIKE '%"isBlacklisted": 1%'
            OR \`onboardingMetadata\` LIKE '%"isBlacklisted":1%'
          )
      `);
    } catch {
      // ignore
    }
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

