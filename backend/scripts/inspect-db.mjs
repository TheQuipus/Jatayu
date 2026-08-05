import { sequelize } from '../models/index.js';
import { QueryTypes } from 'sequelize';

async function main() {
  try {
    await sequelize.authenticate();
    const dbName = process.env.DB_NAME || 'jatayu_db';

    const tables = await sequelize.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
      { replacements: [dbName], type: QueryTypes.SELECT }
    );

    const expertColumns = await sequelize.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Experts'
       ORDER BY ORDINAL_POSITION`,
      { replacements: [dbName], type: QueryTypes.SELECT }
    );

    const indexCount = await sequelize.query(
      `SELECT COUNT(DISTINCT INDEX_NAME) AS indexCount
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Experts'`,
      { replacements: [dbName], type: QueryTypes.SELECT }
    );

    const indexList = await sequelize.query(
      `SELECT INDEX_NAME, NON_UNIQUE, GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
       FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Experts'
       GROUP BY INDEX_NAME, NON_UNIQUE
       ORDER BY INDEX_NAME`,
      { replacements: [dbName], type: QueryTypes.SELECT }
    );

    const countTables = ['Experts', 'Seekers', 'Admins', 'Settings', 'Credentials', 'Availabilities'];
    const rowCounts = {};
    for (const t of countTables) {
      const [r] = await sequelize.query(`SELECT COUNT(*) AS c FROM \`${t}\``, { type: QueryTypes.SELECT });
      rowCounts[t] = Number(r.c);
    }

    const recentExperts = await sequelize.query(
      `SELECT id, email, phone, fullName, onboardingStep, status, isEmailVerified, isPhoneVerified, applicationNumber, createdAt
       FROM Experts ORDER BY createdAt DESC LIMIT 20`,
      { type: QueryTypes.SELECT }
    );

    const otpStuck = await sequelize.query(
      `SELECT id, email, phone, fullName, onboardingStep, status, isEmailVerified, isPhoneVerified, applicationNumber, createdAt
       FROM Experts WHERE onboardingStep = 'otp' ORDER BY createdAt DESC`,
      { type: QueryTypes.SELECT }
    );

    const admins = await sequelize.query(
      `SELECT id, email, fullName, role, createdAt, updatedAt FROM Admins ORDER BY createdAt DESC`,
      { type: QueryTypes.SELECT }
    );

    console.log(JSON.stringify({
      database: dbName,
      host: process.env.DB_HOST,
      tables: tables.map(t => t.TABLE_NAME),
      expertsColumns: expertColumns,
      expertsIndexCount: Number(indexCount[0]?.indexCount ?? 0),
      expertsIndexes: indexList,
      rowCounts,
      recentExperts,
      expertsStuckOnOtp: otpStuck,
      admins,
    }, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.parent) console.error('SQL:', err.parent.sqlMessage || err.parent);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

main();
