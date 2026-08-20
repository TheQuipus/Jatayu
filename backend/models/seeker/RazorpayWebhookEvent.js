import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const RazorpayWebhookEvent = seekerDb.define('RazorpayWebhookEvent', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  eventId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  eventType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  payload: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'received',
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  indexes: [
    {
      name: 'razorpay_webhook_events_event_id_unique',
      unique: true,
      fields: ['eventId'],
    },
    {
      name: 'razorpay_webhook_events_type_created_at',
      fields: ['eventType', 'createdAt'],
    },
    {
      name: 'razorpay_webhook_events_status_created_at',
      fields: ['status', 'createdAt'],
    },
  ],
});

export default RazorpayWebhookEvent;
