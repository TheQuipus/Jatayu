import { sequelize } from '../models/index.js';
import { triggerNotification, DEFAULT_TEMPLATES } from '../utils/templateNotificationService.js';

async function testTriggers() {
  console.log('Connecting to database...');
  await sequelize.authenticate();

  const recipientEmail = process.argv[2] || 'adityakane2688@gmail.com';
  console.log(`Testing all notification triggers for email: ${recipientEmail}\n`);

  for (const triggerKey of Object.keys(DEFAULT_TEMPLATES)) {
    console.log(`--- Testing trigger: ${triggerKey} ---`);
    await triggerNotification(triggerKey, {
      email: recipientEmail,
      phone: '+919876543210',
      name: 'Test User',
      data: {
        otp: '123456',
        application_number: 'APP-9999',
        dashboard_link: 'http://localhost:3000/expert/dashboard',
        resume_link: 'http://localhost:3000/onboarding',
        reason: 'Please upload a clearer profile image.',
        credits: 25,
        explore_link: 'http://localhost:3000/experts',
      },
    });
    console.log(`✓ Trigger ${triggerKey} dispatched successfully.\n`);
  }

  console.log('All trigger notifications tested successfully.');
  process.exit(0);
}

testTriggers().catch((err) => {
  console.error('Trigger Test Error:', err);
  process.exit(1);
});
