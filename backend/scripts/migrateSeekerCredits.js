import { DataTypes } from 'sequelize';
import seekerDb from '../config/db/seeker.js';
import SeekerCreditTransaction from '../models/seeker/SeekerCreditTransaction.js';

async function addColumnIfMissing(table, columns, name, definition) {
  if (columns[name]) {
    console.log(`[Seeker Credits] Column already exists: ${name}`);
    return;
  }

  await seekerDb.getQueryInterface().addColumn(table, name, definition);
  console.log(`[Seeker Credits] Added column: ${name}`);
}

async function main() {
  await seekerDb.authenticate();
  const queryInterface = seekerDb.getQueryInterface();
  const columns = await queryInterface.describeTable('Seekers');

  await addColumnIfMissing('Seekers', columns, 'credits', {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
  });

  await SeekerCreditTransaction.sync();
  console.log('[Seeker Credits] Credit transaction table ready.');

  if (columns.rewardedOnboardingSteps) {
    const [seekers] = await seekerDb.query(
      `SELECT id, credits, rewardedOnboardingSteps
       FROM Seekers
       WHERE rewardedOnboardingSteps IS NOT NULL
         AND rewardedOnboardingSteps <> '[]'`,
    );
    const configuredAmount = Number.parseInt(process.env.SEEKER_ONBOARDING_STEP_CREDITS || '', 10);
    const amount = Number.isSafeInteger(configuredAmount) && configuredAmount >= 0
      ? configuredAmount
      : 5;

    for (const seeker of seekers) {
      let steps = seeker.rewardedOnboardingSteps;
      if (typeof steps === 'string') {
        try {
          steps = JSON.parse(steps);
        } catch {
          steps = [];
        }
      }
      if (!Array.isArray(steps)) continue;

      for (const [index, step] of steps.entries()) {
        await SeekerCreditTransaction.findOrCreate({
          where: { seekerId: seeker.id, source: 'onboarding', reference: step },
          defaults: {
            amount,
            balanceAfter: Math.min((index + 1) * amount, Number(seeker.credits || 0)),
            type: 'credit',
            description: `Completed ${step} onboarding step`,
            metadata: { step, migrated: true },
          },
        });
      }
    }
    console.log(`[Seeker Credits] Backfilled ${seekers.length} seeker reward histories.`);
    await queryInterface.removeColumn('Seekers', 'rewardedOnboardingSteps');
    console.log('[Seeker Credits] Removed legacy rewardedOnboardingSteps column.');
  }

  console.log('[Seeker Credits] Migration complete.');
}

main()
  .catch((error) => {
    console.error('[Seeker Credits] Migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await seekerDb.close();
  });
