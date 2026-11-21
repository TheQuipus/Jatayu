import { DataTypes } from 'sequelize';
import adminDb from '../config/db/admin.js';

const SupportTicket = adminDb.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  ticketNumber: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
  },
  requesterType: {
    type: DataTypes.ENUM('seeker', 'expert'),
    allowNull: false,
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  requesterName: {
    type: DataTypes.STRING(180),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(254),
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING(32),
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING(180),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(160),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('open', 'replied'),
    allowNull: false,
    defaultValue: 'open',
  },
  adminNotifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastRepliedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'support_tickets_requester_created',
      fields: ['requesterType', 'requesterId', 'createdAt'],
    },
    {
      name: 'support_tickets_status_created',
      fields: ['status', 'createdAt'],
    },
  ],
});

export default SupportTicket;
