import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Expert = sequelize.define('Expert', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  linkedinId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPhoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  onboardingStep: {
    type: DataTypes.STRING,
    defaultValue: 'category'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft' // 'draft', 'pending_review', 'approved'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  skills: {
    type: DataTypes.JSON,
    allowNull: true
  },
  experienceLevel: {
    type: DataTypes.STRING,
    allowNull: true
  },
  professionalTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  tagLine: {
    type: DataTypes.STRING,
    allowNull: true
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  profilePhotoSrc: {
    type: DataTypes.STRING,
    allowNull: true
  },
  targetAudience: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  focusAreas: {
    type: DataTypes.JSON,
    allowNull: true
  },
  timezone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  selectedFormats: {
    type: DataTypes.JSON,
    allowNull: true
  },
  selectedLengths: {
    type: DataTypes.JSON,
    allowNull: true
  },
  formatPrices: {
    type: DataTypes.JSON,
    allowNull: true
  },
  onboardingMetadata: {
    type: DataTypes.JSON,
    allowNull: true
  },
  applicationNumber: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewerNote: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

export default Expert;
