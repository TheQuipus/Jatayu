import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';

const ExpertCalendarConnection = expertDb.define('ExpertCalendarConnection', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  expertId: { type: DataTypes.UUID, allowNull: false },
  provider: { type: DataTypes.STRING(20), allowNull: false },
  accountEmail: { type: DataTypes.STRING(255), allowNull: true },
  calendarId: { type: DataTypes.STRING(255), allowNull: false, defaultValue: 'primary' },
  accessToken: { type: DataTypes.TEXT('long'), allowNull: true },
  refreshToken: { type: DataTypes.TEXT('long'), allowNull: true },
  tokenExpiresAt: { type: DataTypes.DATE, allowNull: true },
  scopes: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
  oauthStateHash: { type: DataTypes.STRING(64), allowNull: true },
  oauthStateExpiresAt: { type: DataTypes.DATE, allowNull: true },
  lastSyncedAt: { type: DataTypes.DATE, allowNull: true },
  lastError: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { name: 'expert_calendar_provider_unique', unique: true, fields: ['expertId', 'provider'] },
    { name: 'expert_calendar_oauth_state', fields: ['oauthStateHash'] },
  ],
});

export default ExpertCalendarConnection;
