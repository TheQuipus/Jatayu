import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';

const DigilockerDocument = expertDb.define('DigilockerDocument', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expertId: { type: DataTypes.UUID, allowNull: false },
  verificationId: { type: DataTypes.UUID, allowNull: false },
  documentKey: { type: DataTypes.STRING(64), allowNull: false, unique: true },
  documentUri: { type: DataTypes.TEXT, allowNull: false },
  documentType: { type: DataTypes.STRING(50), allowNull: true },
  documentName: { type: DataTypes.STRING, allowNull: true },
  issuerId: { type: DataTypes.STRING, allowNull: true },
  issuerName: { type: DataTypes.STRING, allowNull: true },
  mimeType: { type: DataTypes.STRING(100), allowNull: true },
  storagePath: { type: DataTypes.STRING, allowNull: true },
  fileSize: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  sha256: { type: DataTypes.STRING(64), allowNull: true },
  downloadStatus: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'pending' },
  failureDescription: { type: DataTypes.TEXT, allowNull: true },
  fetchedAt: { type: DataTypes.DATE, allowNull: true },
}, { timestamps: true });

export default DigilockerDocument;
