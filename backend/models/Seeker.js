import { DataTypes } from 'sequelize';
import seekerDb from '../config/db/seeker.js';

function readJsonField(instance, fieldName) {
  const value = instance.getDataValue(fieldName);
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

const Seeker = seekerDb.define('Seeker', {
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
  credits: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  topics: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      return readJsonField(this, 'topics');
    },
  },
  needsText: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  selectedNeedChips: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      return readJsonField(this, 'selectedNeedChips');
    },
  },
  selectedFormats: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      return readJsonField(this, 'selectedFormats');
    },
  },
  selectedBudget: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  selectedLanguages: {
    type: DataTypes.JSON,
    allowNull: true,
    get() {
      return readJsonField(this, 'selectedLanguages');
    },
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
    get() {
      return readJsonField(this, 'onboardingMetadata');
    },
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
