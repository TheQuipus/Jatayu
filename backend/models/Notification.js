import { DataTypes } from 'sequelize';
import adminDb from '../config/db/admin.js';

const Notification = adminDb.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  recipientType: { type: DataTypes.STRING(20), allowNull: false },
  recipientId: { type: DataTypes.UUID, allowNull: false },
  eventType: { type: DataTypes.STRING(80), allowNull: false },
  dedupeKey: { type: DataTypes.STRING(190), allowNull: true, unique: true },
  title: { type: DataTypes.STRING(180), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  href: { type: DataTypes.STRING(500), allowNull: true },
  data: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
  readAt: { type: DataTypes.DATE, allowNull: true },
}, {
  timestamps: true,
  indexes: [{ name: 'notifications_recipient_created', fields: ['recipientType', 'recipientId', 'createdAt'] }],
});

export default Notification;
