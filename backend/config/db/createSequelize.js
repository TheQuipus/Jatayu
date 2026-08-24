import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sharedOptions = {
  // Prefer IPv4 loopback — Windows "localhost" can fail with ECONNREFUSED on ::1.
  host: process.env.DB_HOST === 'localhost' ? '127.0.0.1' : (process.env.DB_HOST || '127.0.0.1'),
  dialect: 'mysql',
  dialectOptions: {
    connectTimeout: Number.parseInt(process.env.DB_CONNECT_TIMEOUT_MS || '10000', 10),
    enableKeepAlive: true,
    keepAliveInitialDelay: Number.parseInt(process.env.DB_KEEP_ALIVE_DELAY_MS || '0', 10),
  },
  logging: false,
  pool: {
    max: Number.parseInt(process.env.DB_POOL_MAX || '5', 10),
    min: Number.parseInt(process.env.DB_POOL_MIN || '0', 10),
    acquire: Number.parseInt(process.env.DB_POOL_ACQUIRE_MS || '30000', 10),
    idle: Number.parseInt(process.env.DB_POOL_IDLE_MS || '10000', 10),
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
