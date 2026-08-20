import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';

const Availability = expertDb.define('Availability', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  expertId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  days: {
    type: DataTypes.JSON, // Array of days, e.g. ["Mon", "Tue"]
    allowNull: false
  },
  fromTime: {
    type: DataTypes.STRING, // e.g. "10:00 AM"
    allowNull: false
  },
  toTime: {
    type: DataTypes.STRING, // e.g. "05:00 PM"
    allowNull: false
  }
}, {
  timestamps: true
});

export default Availability;
