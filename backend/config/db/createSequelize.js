import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sharedOptions = {
  // Prefer IPv4 loopback — Windows "localhost" can fail with ECONNREFUSED on ::1.
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST || '127.0.0.1'),
  dialect: 'mysql',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

/**
 * Resolve database name: module-specific env var → DB_NAME fallback → default.
 */
export function resolveDbName(moduleEnvVar, defaultName) {
  return process.env[moduleEnvVar] || process.env.DB_NAME || defaultName;
}

export function createSequelize(databaseName) {
  // Empty DB_PASSWORD must be null so mysql2 does not send "using password: YES".
  const password = process.env.DB_PASSWORD ? process.env.DB_PASSWORD : null;
  return new Sequelize(
    databaseName,
    process.env.DB_USER,
    password,
    sharedOptions,
  );
}
