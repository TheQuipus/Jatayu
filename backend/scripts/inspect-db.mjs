import { expertDb, seekerDb, adminDb, closeAllDatabases } from '../config/db/index.js';
import { QueryTypes } from 'sequelize';

async function inspectDatabase(label, db, dbName, tablesToCount = []) {
  await db.authenticate();

  const tables = await db.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
    { replacements: [dbName], type: QueryTypes.SELECT },
  );

  const rowCounts = {};
  for (const tableName of tablesToCount) {
    try {
      const [row] = await db.query(`SELECT COUNT(*) AS c FROM \`${tableName}\``, { type: QueryTypes.SELECT });
      rowCounts[tableName] = Number(row.c);
    } catch {
      rowCounts[tableName] = null;
    }
  }

  return {
    label,
    database: dbName,
    host: process.env.DB_HOST,
    tables: tables.map((t) => t.TABLE_NAME),
    rowCounts,
  };
}

async function main() {
  try {
    const expertDbName = process.env.EXPERT_DB_NAME || process.env.DB_NAME || 'jatayu_expert_db';
    const seekerDbName = process.env.SEEKER_DB_NAME || process.env.DB_NAME || 'jatayu_seeker_db';
    const adminDbName = process.env.ADMIN_DB_NAME || process.env.DB_NAME || 'jatayu_admin_db';

    const expertInfo = await inspectDatabase(
      'expert',
      expertDb,
      expertDbName,
      ['Experts', 'Credentials', 'Availabilities'],
    );

    const expertColumns = await expertDb.query(
      `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Experts'
       ORDER BY ORDINAL_POSITION`,
      { replacements: [expertDbName], type: QueryTypes.SELECT },
    );

    const recentExperts = await expertDb.query(
      `SELECT id, email, phone, fullName, onboardingStep, status, isEmailVerified, isPhoneVerified, applicationNumber, createdAt
       FROM Experts ORDER BY createdAt DESC LIMIT 20`,
      { type: QueryTypes.SELECT },
    );

    const otpStuck = await expertDb.query(
      `SELECT id, email, phone, fullName, onboardingStep, status, isEmailVerified, isPhoneVerified, applicationNumber, createdAt
       FROM Experts WHERE onboardingStep = 'otp' ORDER BY createdAt DESC`,
      { type: QueryTypes.SELECT },
    );

    const seekerInfo = await inspectDatabase('seeker', seekerDb, seekerDbName, ['Seekers']);
    const adminInfo = await inspectDatabase('admin', adminDb, adminDbName, ['Admins', 'Settings']);

    const admins = await adminDb.query(
      `SELECT id, email, fullName, role, createdAt, updatedAt FROM Admins ORDER BY createdAt DESC`,
      { type: QueryTypes.SELECT },
    );

    console.log(JSON.stringify({
      expert: {
        ...expertInfo,
        expertsColumns: expertColumns,
        recentExperts,
        expertsStuckOnOtp: otpStuck,
      },
      seeker: seekerInfo,
      admin: {
        ...adminInfo,
        admins,
      },
    }, null, 2));
  } catch (err) {
    console.error('ERROR:', err.message);
    if (err.parent) console.error('SQL:', err.parent.sqlMessage || err.parent);
    process.exit(1);
  } finally {
    await closeAllDatabases();
  }
}

main();
