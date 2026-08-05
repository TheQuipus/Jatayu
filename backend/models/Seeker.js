import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Seeker = sequelize.define('Seeker', {
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
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  googleId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  linkedinId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isPhoneVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  onboardingStep: {
    type: DataTypes.STRING,
    defaultValue: 'otp',
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'draft',
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  topics: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  needsText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  selectedNeedChips: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  selectedFormats: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  selectedBudget: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  selectedLanguages: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  additionalContext: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  profilePhotoSrc: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  onboardingMetadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  termsAcceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  onboardingCompletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default Seeker;
