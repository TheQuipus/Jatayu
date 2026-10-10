import { createSequelize, resolveDbName } from './createSequelize.js';

const adminDb = createSequelize(
  resolveDbName('ADMIN_DB_NAME', 'jatayu_admin_db'),
  'ADMIN',
);

export default adminDb;
