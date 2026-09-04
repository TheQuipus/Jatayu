import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const BookingTranscriptSession = seekerDb.define('BookingTranscriptSession', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false, unique: true },
  provider: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'agora' },
  providerAgentId: { type: DataTypes.STRING(255), allowNull: true, unique: true },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'starting' },
  languages: { type: DataTypes.JSON, allowNull: false },
  startedAt: { type: DataTypes.DATE, allowNull: true },
  stoppedAt: { type: DataTypes.DATE, allowNull: true },
  failureCode: { type: DataTypes.STRING(100), allowNull: true },
  failureDescription: { type: DataTypes.TEXT, allowNull: true },
}, { timestamps: true });

export default BookingTranscriptSession;
