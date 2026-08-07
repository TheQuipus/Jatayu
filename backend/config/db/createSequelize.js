import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sharedOptions = {
  host: process.env.DB_HOST || 'localhost',
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
  return new Sequelize(
    databaseName,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    sharedOptions,
  );
}
