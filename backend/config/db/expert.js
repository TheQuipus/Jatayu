import { createSequelize, resolveDbName } from './createSequelize.js';

const expertDb = createSequelize(
  resolveDbName('EXPERT_DB_NAME', 'jatayu_expert_db'),
  'EXPERT',
);

export default expertDb;
