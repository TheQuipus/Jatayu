import { Op, fn, col } from 'sequelize';
import { SupportTicket } from '../models/index.js';

export async function generateSupportTicketNumber({ transaction } = {}) {
  const latest = await SupportTicket.findOne({
    where: {
      ticketNumber: {
        [Op.like]: 'SUP-%',
      },
    },
    order: [
      [fn('LENGTH', col('ticketNumber')), 'DESC'],
      ['ticketNumber', 'DESC'],
    ],
    ...(transaction ? { transaction } : {}),
  });

  if (!latest?.ticketNumber) {
    return 'SUP-1000';
  }

  const match = latest.ticketNumber.match(/^SUP-(\d+)$/);
  const nextNumber = match ? Number(match[1]) + 1 : 1000;
  return `SUP-${nextNumber}`;
}
