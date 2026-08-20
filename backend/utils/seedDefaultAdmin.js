import bcrypt from 'bcryptjs';
import { Admin } from '../models/index.js';

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@thequipus.com';
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@theQuipus';
const DEFAULT_ADMIN_NAME = process.env.ADMIN_NAME || 'Quipus Admin';

export async function seedDefaultAdmin() {
  const email = DEFAULT_ADMIN_EMAIL.toLowerCase();
  const existing = await Admin.findOne({ where: { email } });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, salt);

  if (existing) {
    const passwordMatches = await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, existing.password);
    if (!passwordMatches) {
      existing.password = hashedPassword;
      await existing.save();
      console.log(`[Admin Seed] Default admin password updated: ${email}`);
    } else {
      console.log(`[Admin Seed] Default admin already exists: ${email}`);
    }
    return existing;
  }

  const admin = await Admin.create({
    email,
    password: hashedPassword,
    fullName: DEFAULT_ADMIN_NAME,
    role: 'admin',
  });

  console.log(`[Admin Seed] Default admin created: ${email}`);
  return admin;
}

export { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD };
