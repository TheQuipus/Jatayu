import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const SeekerCreditTransaction = seekerDb.define('SeekerCreditTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  seekerId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  balanceAfter: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  source: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  reference: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'seeker_credit_transactions_unique_source_reference',
      unique: true,
      fields: ['seekerId', 'source', 'reference'],
    },
    {
      name: 'seeker_credit_transactions_seeker_created_at',
      fields: ['seekerId', 'createdAt'],
    },
  ],
});

export default SeekerCreditTransaction;
