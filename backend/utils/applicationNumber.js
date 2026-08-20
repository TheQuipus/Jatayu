import { Op } from 'sequelize';
import { Expert } from '../models/index.js';

export async function generateApplicationNumber() {
  const latest = await Expert.findOne({
    where: {
      applicationNumber: {
        [Op.like]: 'APP-%',
      },
    },
    order: [['applicationNumber', 'DESC']],
  });

  if (!latest?.applicationNumber) {
    return 'APP-1000';
  }

  const match = latest.applicationNumber.match(/^APP-(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1000;
  return `APP-${nextNumber}`;
}
