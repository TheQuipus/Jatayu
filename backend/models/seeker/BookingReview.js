import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

export default seekerDb.define('BookingReview', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false, unique: true },
  seekerId: { type: DataTypes.UUID, allowNull: false },
  expertId: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
  reply: { type: DataTypes.TEXT, allowNull: true },
  repliedAt: { type: DataTypes.DATE, allowNull: true },
}, { indexes: [{ fields: ['expertId', 'createdAt'] }] });
