/**
 * Admin-facing read/write access to expert-module data (expert database).
 * Keeps admin controllers decoupled from which Sequelize connection experts use.
 */
import { Op } from 'sequelize';
import { Expert, Credential, Availability } from '../models/index.js';
import { expertDb } from '../config/db/index.js';

const EXPERT_INCLUDES = [
  { model: Credential, as: 'credentials' },
  { model: Availability, as: 'availabilities' },
];

export function getExpertDatabaseName() {
  return expertDb.config.database;
}

export async function findExpertsForAdmin(where, options = {}) {
  return Expert.findAll({
    where,
    include: EXPERT_INCLUDES,
    order: options.order || [['submittedAt', 'DESC'], ['updatedAt', 'DESC']],
    attributes: options.attributes,
  });
}

export async function findExpertForAdmin(where) {
  return Expert.findOne({
    where,
    include: EXPERT_INCLUDES,
  });
}

export async function findExpertByIdForAdmin(id) {
  return Expert.findByPk(id, { include: EXPERT_INCLUDES });
}

export async function countExpertsForAdmin(where) {
  return Expert.count({ where });
}

export async function saveExpertForAdmin(expert) {
  return expert.save();
}

export { Op };
