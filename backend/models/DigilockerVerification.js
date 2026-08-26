import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';

const DigilockerVerification = expertDb.define('DigilockerVerification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expertId: { type: DataTypes.UUID, allowNull: false, unique: true },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'not_started' },
  stateHash: { type: DataTypes.STRING(64), allowNull: true, unique: true },
  codeVerifier: { type: DataTypes.STRING(128), allowNull: true },
  authorizationExpiresAt: { type: DataTypes.DATE, allowNull: true },
  digilockerAccountId: { type: DataTypes.STRING, allowNull: true },
  consentValidTill: { type: DataTypes.DATE, allowNull: true },
  accountDetails: { type: DataTypes.JSON, allowNull: true },
  issuedDocuments: { type: DataTypes.JSON, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true },
  failureCode: { type: DataTypes.STRING, allowNull: true },
  failureDescription: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: true });

export default DigilockerVerification;
