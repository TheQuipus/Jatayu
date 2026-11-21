import { DataTypes } from 'sequelize';
import adminDb from '../config/db/admin.js';

const SupportReply = adminDb.define('SupportReply', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  adminName: {
    type: DataTypes.STRING(180),
    allowNull: true,
  },
  fromEmail: {
    type: DataTypes.STRING(254),
    allowNull: false,
  },
  toEmail: {
    type: DataTypes.STRING(254),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'support_replies_ticket_created',
      fields: ['ticketId', 'createdAt'],
    },
  ],
});

export default SupportReply;
