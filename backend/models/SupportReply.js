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
  authorType: {
    type: DataTypes.ENUM('admin', 'seeker', 'expert'),
    allowNull: false,
    defaultValue: 'admin',
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  authorName: {
    type: DataTypes.STRING(180),
    allowNull: true,
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
    allowNull: true,
  },
  toEmail: {
    type: DataTypes.STRING(254),
    allowNull: true,
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
