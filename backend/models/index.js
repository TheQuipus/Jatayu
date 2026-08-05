import sequelize from '../config/db.js';
import Expert from './Expert.js';
import Seeker from './Seeker.js';
import Credential from './Credential.js';
import Availability from './Availability.js';
import Setting from './Setting.js';
import Admin from './Admin.js';

// Establish relationships
Expert.hasMany(Credential, { foreignKey: 'expertId', as: 'credentials', onDelete: 'CASCADE' });
Credential.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });

Expert.hasMany(Availability, { foreignKey: 'expertId', as: 'availabilities', onDelete: 'CASCADE' });
Availability.belongsTo(Expert, { foreignKey: 'expertId', as: 'expert' });

export {
  sequelize,
  Expert,
  Seeker,
  Credential,
  Availability,
  Setting,
  Admin,
};
