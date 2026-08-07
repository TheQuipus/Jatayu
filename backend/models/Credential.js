import { DataTypes } from 'sequelize';
import expertDb from '../config/db/expert.js';

const Credential = expertDb.define('Credential', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  expertId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING, // 'education' or 'experience'
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  institution: {
    type: DataTypes.STRING,
    allowNull: false
  },
  startYear: {
    type: DataTypes.STRING,
    allowNull: false
  },
  endYear: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

export default Credential;
