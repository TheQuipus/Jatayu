import { createSequelize, resolveDbName } from './createSequelize.js';

const seekerDb = createSequelize(
  resolveDbName('SEEKER_DB_NAME', 'jatayu_seeker_db'),
);

export default seekerDb;
