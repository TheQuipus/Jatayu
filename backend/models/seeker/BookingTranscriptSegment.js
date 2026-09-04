import { DataTypes } from 'sequelize';
import seekerDb from '../../config/db/seeker.js';

const BookingTranscriptSegment = seekerDb.define('BookingTranscriptSegment', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookingId: { type: DataTypes.UUID, allowNull: false },
  providerSegmentKey: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  speakerUid: { type: DataTypes.STRING(64), allowNull: false },
  speakerRole: { type: DataTypes.STRING(20), allowNull: true },
  sequence: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  startMs: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  durationMs: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
  language: { type: DataTypes.STRING(20), allowNull: true },
  text: { type: DataTypes.TEXT, allowNull: false },
  confidence: { type: DataTypes.DECIMAL(6, 5), allowNull: true },
  isFinal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  providerTimestamp: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
}, {
  timestamps: true,
  indexes: [
    { name: 'transcript_segments_booking_sequence', fields: ['bookingId', 'sequence'] },
  ],
});

export default BookingTranscriptSegment;
