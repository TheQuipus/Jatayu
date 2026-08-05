import bcrypt from 'bcryptjs';
import { Admin } from '../models/index.js';

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@thequipus.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@theQuipus';
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'Quipus Admin';

export async function seedDefaultAdmin() {
  const existing = await Admin.findOne({ where: { email: DEFAULT_ADMIN_EMAIL } });

  if (existing) {
    console.log(`[Admin Seed] Default admin already exists: ${DEFAULT_ADMIN_EMAIL}`);
    return existing;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);

  const admin = await Admin.create({
    email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
    password: hashedPassword,
    fullName: DEFAULT_ADMIN_NAME,
    role: 'admin',
  });

  console.log(`[Admin Seed] Default admin created: ${DEFAULT_ADMIN_EMAIL}`);
  return admin;
}

export { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD };
