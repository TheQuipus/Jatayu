import { createSequelize, resolveDbName } from './createSequelize.js';

const expertDb = createSequelize(
  resolveDbName('EXPERT_DB_NAME', 'jatayu_expert_db'),
);

export default expertDb;
