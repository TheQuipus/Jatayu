/**
 * Split shared jatayu_db data into module-specific databases.
 * Run once: node scripts/migrateToModuleDatabases.js
 */
import dotenv from 'dotenv';
import { Sequelize, QueryTypes } from 'sequelize';

dotenv.config();

const sourceDbName = process.env.DB_NAME || 'jatayu_db';
const expertDbName = process.env.EXPERT_DB_NAME || 'jatayu_expert_db';
const seekerDbName = process.env.SEEKER_DB_NAME || 'jatayu_seeker_db';
const adminDbName = process.env.ADMIN_DB_NAME || 'jatayu_admin_db';

const baseConfig = {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  logging: false,
};

const rootSequelize = new Sequelize('', process.env.DB_USER, process.env.DB_PASSWORD, baseConfig);

const modulePlans = [
  {
    label: 'expert',
    database: expertDbName,
    tables: ['Experts', 'Credentials', 'Availabilities'],
  },
  {
    label: 'seeker',
    database: seekerDbName,
    tables: ['Seekers'],
  },
  {
    label: 'admin',
    database: adminDbName,
    tables: ['Admins', 'Settings'],
  },
];

async function createDatabase(name) {
  await rootSequelize.query(
    `CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  console.log(`[Migrate] Database ready: ${name}`);
}

async function tableExists(db, tableName) {
  const rows = await db.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    { replacements: [db.config.database, tableName], type: QueryTypes.SELECT },
  );
  return rows.length > 0;
}

async function rowCount(db, tableName) {
  const [row] = await db.query(`SELECT COUNT(*) AS c FROM \`${tableName}\``, { type: QueryTypes.SELECT });
  return Number(row.c);
}

async function copyTable(sourceDb, targetDb, tableName) {
  const sourceHasTable = await tableExists(sourceDb, tableName);
  if (!sourceHasTable) {
    console.log(`[Migrate] Skip ${tableName}: not in source ${sourceDbName}`);
    return 0;
  }

  const sourceCount = await rowCount(sourceDb, tableName);
  if (sourceCount === 0) {
    console.log(`[Migrate] Skip ${tableName}: source empty`);
    return 0;
  }

  const targetHasTable = await tableExists(targetDb, tableName);
  if (!targetHasTable) {
    const [createRow] = await sourceDb.query(`SHOW CREATE TABLE \`${tableName}\``, { type: QueryTypes.SELECT });
    const createSql = createRow['Create Table'];
    await targetDb.query(createSql);
    console.log(`[Migrate] Created table ${tableName} in ${targetDb.config.database}`);
  }

  const targetCount = await rowCount(targetDb, tableName);
  if (targetCount > 0) {
    console.log(`[Migrate] Skip ${tableName}: target already has ${targetCount} rows`);
    return targetCount;
  }

  await targetDb.query(
    `INSERT INTO \`${targetDb.config.database}\`.\`${tableName}\`
     SELECT * FROM \`${sourceDbName}\`.\`${tableName}\``,
  );

  const copied = await rowCount(targetDb, tableName);
  console.log(`[Migrate] Copied ${copied} rows → ${tableName} (${targetDb.config.database})`);
  return copied;
}

async function main() {
  console.log(`[Migrate] Source: ${sourceDbName}`);
  console.log(`[Migrate] Targets: expert=${expertDbName}, seeker=${seekerDbName}, admin=${adminDbName}`);

  await rootSequelize.authenticate();

  for (const plan of modulePlans) {
    await createDatabase(plan.database);
  }

  const sourceDb = new Sequelize(sourceDbName, process.env.DB_USER, process.env.DB_PASSWORD, baseConfig);
  await sourceDb.authenticate();

  for (const plan of modulePlans) {
    const targetDb = new Sequelize(plan.database, process.env.DB_USER, process.env.DB_PASSWORD, baseConfig);
    await targetDb.authenticate();

    for (const tableName of plan.tables) {
      await copyTable(sourceDb, targetDb, tableName);
    }

    await targetDb.close();
  }

  await sourceDb.close();
  await rootSequelize.close();

  console.log('[Migrate] Done. Update .env with EXPERT_DB_NAME, SEEKER_DB_NAME, ADMIN_DB_NAME and restart backend.');
}

main().catch((err) => {
  console.error('[Migrate] Failed:', err.message);
  process.exit(1);
});
