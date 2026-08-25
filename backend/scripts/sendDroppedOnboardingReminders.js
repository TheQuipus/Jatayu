import { sequelize, Expert, Seeker, Op } from '../models/index.js';
import { triggerNotification } from '../utils/templateNotificationService.js';
import { getSetting } from '../utils/settingsHelper.js';

async function processDroppedOnboarding() {
  console.log('Connecting to database...');
  await sequelize.authenticate();
  console.log('Database connected.');

  const frontendUrl = (await getSetting('FRONTEND_URL', 'http://localhost:3000')).replace(/\/$/, '');
  const cutOffTime = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  // 1. Process Experts who dropped onboarding
  const droppedExperts = await Expert.findAll({
    where: {
      status: 'draft',
      createdAt: { [Op.lte]: cutOffTime },
    },
  });

  console.log(`Found ${droppedExperts.length} expert(s) with dropped onboarding.`);

  for (const expert of droppedExperts) {
    try {
      await triggerNotification('EXPERT_ONBOARDING_DROPPED', {
        email: expert.email,
        phone: expert.phone,
        name: expert.fullName || 'Expert',
        data: {
          resume_link: `${frontendUrl}/onboarding`,
        },
      });
      console.log(`[Reminder Sent] Expert: ${expert.email}`);
    } catch (err) {
      console.error(`[Reminder Failed] Expert: ${expert.email}:`, err.message);
    }
  }

  // 2. Process Seekers who dropped onboarding
  const droppedSeekers = await Seeker.findAll({
    where: {
      isEmailVerified: false,
      createdAt: { [Op.lte]: cutOffTime },
    },
  });

  console.log(`Found ${droppedSeekers.length} seeker(s) with dropped onboarding.`);

  for (const seeker of droppedSeekers) {
    try {
      await triggerNotification('SEEKER_ONBOARDING_DROPPED', {
        email: seeker.email,
        phone: seeker.phone,
        name: seeker.fullName || 'Seeker',
        data: {
          resume_link: `${frontendUrl}/seeker/signup`,
        },
      });
      console.log(`[Reminder Sent] Seeker: ${seeker.email}`);
    } catch (err) {
      console.error(`[Reminder Failed] Seeker: ${seeker.email}:`, err.message);
    }
  }

  console.log('Done processing dropped onboarding reminders.');
  process.exit(0);
}

processDroppedOnboarding().catch((err) => {
  console.error('Dropped Onboarding Reminders Error:', err);
  process.exit(1);
});
