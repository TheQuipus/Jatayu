import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';

const ExpertSecurityChallenge = expertDb.define('ExpertSecurityChallenge', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expertId: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('email', 'phone'), allowNull: false },
  value: { type: DataTypes.STRING, allowNull: false },
  codeHash: { type: DataTypes.STRING(64), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  usedAt: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true, indexes: [{ fields: ['expertId', 'createdAt'] }] });

export default ExpertSecurityChallenge;
