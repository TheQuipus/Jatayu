import dotenv from 'dotenv';
import sequelize from '../config/db.js';

dotenv.config();

const COLUMN_DEFINITIONS = [
  ['onboardingMetadata', 'JSON NULL'],
  ['applicationNumber', 'VARCHAR(255) NULL'],
  ['submittedAt', 'DATETIME NULL'],
  ['reviewerNote', 'TEXT NULL'],
];

async function columnExists(tableName, columnName) {
  const [rows] = await sequelize.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    { replacements: [tableName, columnName] },
  );

  return Number(rows[0]?.count ?? 0) > 0;
}

async function migrate() {
  await sequelize.authenticate();
  console.log('Connected to database.');

  for (const [columnName, definition] of COLUMN_DEFINITIONS) {
    const exists = await columnExists('Experts', columnName);
    if (exists) {
      console.log(`Column Experts.${columnName} already exists — skipping.`);
      continue;
    }

    await sequelize.query(`ALTER TABLE \`Experts\` ADD COLUMN \`${columnName}\` ${definition}`);
    console.log(`Added column Experts.${columnName}.`);
  }

  console.log('Migration complete.');
  await sequelize.close();
}

migrate().catch(async (error) => {
  console.error('Migration failed:', error);
  await sequelize.close();
  process.exit(1);
});
