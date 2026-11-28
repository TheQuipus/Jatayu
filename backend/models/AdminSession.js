import { DataTypes } from 'sequelize';
import adminDb from '../config/db/admin.js';

const AdminSession = adminDb.define('AdminSession', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
  },
  adminId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  device: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lastActivityAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    { fields: ['adminId', 'createdAt'] },
    { fields: ['adminId', 'revokedAt'] },
  ],
});

export default AdminSession;

