import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';

const ExpertSession = expertDb.define('ExpertSession', {
  id: { type: DataTypes.UUID, primaryKey: true },
  expertId: { type: DataTypes.UUID, allowNull: false },
  device: { type: DataTypes.STRING, allowNull: false },
  ipAddress: { type: DataTypes.STRING, allowNull: true },
  loginMethod: { type: DataTypes.STRING, allowNull: false, defaultValue: 'password' },
  lastSeenAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true, indexes: [{ fields: ['expertId', 'createdAt'] }] });

export default ExpertSession;
