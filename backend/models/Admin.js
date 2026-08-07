import { DataTypes } from 'sequelize';
import adminDb from '../config/db/admin.js';

const Admin = adminDb.define('Admin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Platform Admin',
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'admin',
  },
}, {
  timestamps: true,
});

export default Admin;
