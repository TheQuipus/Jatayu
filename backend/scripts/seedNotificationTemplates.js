import { adminDb, Setting } from '../models/index.js';
import { DEFAULT_TEMPLATES } from '../utils/templateNotificationService.js';

async function seed() {
  console.log('Connecting to admin database...');
  await adminDb.authenticate();
  await adminDb.sync();
  console.log('Admin database connected & synchronized.');

  let seededCount = 0;

  for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
    const subjectKey = `EMAIL_TEMPLATE_${key}_SUBJECT`;
    const bodyKey = `EMAIL_TEMPLATE_${key}_BODY`;
    const smsKey = `SMS_TEMPLATE_${key}`;

    const items = [
      { key: subjectKey, value: tpl.subject, description: `Email subject template for ${key}` },
      { key: bodyKey, value: tpl.emailBody, description: `Email HTML body template for ${key}` },
      { key: smsKey, value: tpl.smsBody, description: `SMS text template for ${key}` },
    ];

    for (const item of items) {
      const existing = await Setting.findByPk(item.key);
      if (!existing) {
        await Setting.create(item);
        console.log(`[Seeded] ${item.key}`);
        seededCount++;
      } else {
        console.log(`[Exists] ${item.key}`);
      }
    }
  }

  console.log(`\n======================================================`);
  console.log(`Successfully seeded ${seededCount} notification template settings!`);
  console.log(`======================================================\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed Error:', err);
  process.exit(1);
});
