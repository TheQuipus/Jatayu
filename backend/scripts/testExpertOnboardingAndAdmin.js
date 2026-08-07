/**
 * End-to-end test: expert onboarding + admin applications from expert DB.
 * Run: node scripts/testExpertOnboardingAndAdmin.js
 */
import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@thequipus.com';
const ADMIN_PASSWORD = 'Admin@theQuipus';
const ADMIN_OTP = '123456';

const ts = Date.now();
const TEST_EMAIL = `e2e.expert.${ts}@test.local`;
const TEST_PHONE = `9${String(ts).slice(-9)}`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = `E2E Expert ${ts}`;

function log(section, msg, data) {
  console.log(`\n[${section}] ${msg}`);
  if (data !== undefined) console.log(JSON.stringify(data, null, 2));
}

async function api(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  const results = { passed: [], failed: [] };
  const pass = (name) => results.passed.push(name);
  const fail = (name, reason) => results.failed.push({ name, reason });

  log('Setup', `API base: ${BASE}`);
  log('Setup', `Test expert: ${TEST_EMAIL}`);

  // --- Health ---
  const health = await api('GET', '/health');
  if (health.status !== 200) {
    fail('Backend health', `status ${health.status}`);
    printSummary(results);
    process.exit(1);
  }
  pass('Backend health');

  // --- Register (may 503 on delivery but expert + OTP stored in DB) ---
  const reg = await api('POST', '/api/auth/register', {
    fullName: TEST_NAME,
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    phone: TEST_PHONE,
  });

  let expertId = reg.data.expertId;
  if (!expertId && (reg.status === 503 || reg.status === 500)) {
    const { Expert } = await import('../models/index.js');
    const expert = await Expert.findOne({ where: { email: TEST_EMAIL } });
    expertId = expert?.id;
    log('Register', `Delivery failed (${reg.status}); loaded expert from expert DB`, {
      expertId,
      pendingOtp: expert?.onboardingMetadata?.pendingOtp?.code ? '***' : null,
    });
  }

  if (!expertId) {
    fail('Expert register', `No expertId — status ${reg.status}: ${reg.data.message}`);
    printSummary(results);
    process.exit(1);
  }
  pass('Expert register (expert created in expert DB)');

  // --- Read OTP from expert DB metadata ---
  const { Expert } = await import('../models/index.js');
  const { getExpertDatabaseName } = await import('../services/expertDataService.js');
  const { adminDb } = await import('../config/db/index.js');

  const expertDbName = getExpertDatabaseName();
  const adminDbName = adminDb.config.database;

  log('Database', `Expert DB: ${expertDbName}, Admin DB: ${adminDbName}`);

  if (expertDbName === adminDbName) {
    fail('Separate databases', 'Expert and admin use the same database name');
  } else {
    pass('Separate expert/admin databases');
  }

  const expertRow = await Expert.findByPk(expertId);
  const otpCode = expertRow?.onboardingMetadata?.pendingOtp?.code;
  if (!otpCode) {
    fail('OTP in expert DB', 'No pendingOtp in onboardingMetadata');
    printSummary(results);
    process.exit(1);
  }
  pass('OTP persisted in expert DB (onboardingMetadata.pendingOtp)');

  // --- Verify OTP ---
  const verify = await api('POST', '/api/auth/verify-otp', { expertId, code: otpCode });
  if (verify.status !== 200 || !verify.data.token) {
    fail('OTP verify', `${verify.status}: ${verify.data.message}`);
    printSummary(results);
    process.exit(1);
  }
  pass('OTP verify → JWT issued');
  const expertToken = verify.data.token;

  if (verify.data.user?.onboardingStep !== 'category') {
    fail('Post-verify step', `Expected category, got ${verify.data.user?.onboardingStep}`);
  } else {
    pass('Post-verify onboarding step = category');
  }

  // --- Onboarding profile steps ---
  const categoryUpdate = await api(
    'PUT',
    '/api/expert/profile',
    { step: 'skills', category: 'Technology' },
    expertToken,
  );
  if (categoryUpdate.status !== 200) {
    fail('Profile category step', `${categoryUpdate.status}: ${categoryUpdate.data.message}`);
  } else {
    pass('Profile update: category → skills');
  }

  const skillsUpdate = await api(
    'PUT',
    '/api/expert/profile',
    { step: 'experience', category: 'Technology', skills: ['JavaScript', 'Node.js'] },
    expertToken,
  );
  if (skillsUpdate.status !== 200) {
    fail('Profile skills step', `${skillsUpdate.status}: ${skillsUpdate.data.message}`);
  } else {
    pass('Profile update: skills saved to expert DB');
  }

  // --- Admin login ---
  const adminLogin = await api('POST', '/api/admin/auth/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    otp: ADMIN_OTP,
  });
  if (adminLogin.status !== 200 || !adminLogin.data.token) {
    fail('Admin login', `${adminLogin.status}: ${adminLogin.data.message}`);
    printSummary(results);
    process.exit(1);
  }
  pass('Admin login');
  const adminToken = adminLogin.data.token;

  // --- Admin applications list (must include our test expert from expert DB) ---
  const apps = await api('GET', '/api/admin/applications?status=pending', null, adminToken);
  if (apps.status !== 200 || !Array.isArray(apps.data)) {
    fail('Admin list applications', `${apps.status}: ${apps.data.message}`);
    printSummary(results);
    process.exit(1);
  }
  pass(`Admin list applications (${apps.data.length} total)`);

  const foundInList = apps.data.find((e) => e.id === expertId || e.email === TEST_EMAIL);
  if (!foundInList) {
    fail('Expert in admin queue', `Test expert ${expertId} not in pending list`);
  } else {
    pass('Test expert visible in admin pending applications');
    log('Admin list match', 'Expert from expert DB', {
      id: foundInList.id,
      email: foundInList.email,
      fullName: foundInList.fullName,
      category: foundInList.category,
      skills: foundInList.skills,
      frontendStatus: foundInList.frontendStatus,
      isEmailVerified: foundInList.isEmailVerified,
    });
  }

  // --- Admin application detail ---
  const detail = await api('GET', `/api/admin/applications/${expertId}`, null, adminToken);
  if (detail.status !== 200) {
    fail('Admin application detail', `${detail.status}: ${detail.data.message}`);
  } else {
    pass('Admin application detail by expert ID');
    if (detail.data.category !== 'Technology') {
      fail('Detail data sync', `Expected category Technology, got ${detail.data.category}`);
    } else {
      pass('Admin detail reflects expert DB profile data (category)');
    }
    if (!Array.isArray(detail.data.skills) || !detail.data.skills.includes('JavaScript')) {
      fail('Detail skills sync', `Skills mismatch: ${JSON.stringify(detail.data.skills)}`);
    } else {
      pass('Admin detail reflects expert DB profile data (skills)');
    }
  }

  // --- Confirm admin DB has no Experts table with our row (experts only in expert DB) ---
  try {
    const [adminExpertTables] = await adminDb.query("SHOW TABLES LIKE 'Experts'");
    if (adminExpertTables.length > 0) {
      const [adminRows] = await adminDb.query('SELECT id FROM Experts WHERE email = ?', {
        replacements: [TEST_EMAIL],
      });
      if (adminRows.length > 0) {
        fail('Expert isolation', 'Test expert found in admin database Experts table');
      } else {
        pass('Test expert NOT duplicated in admin DB');
      }
    } else {
      pass('Admin DB has no Experts table (correct isolation)');
    }
  } catch (err) {
    log('Database', `Admin Experts table check skipped: ${err.message}`);
  }

  // --- Confirm row exists in expert DB ---
  const [expertRows] = await import('../config/db/index.js').then(({ expertDb }) =>
    expertDb.query('SELECT id, email, category, skills FROM Experts WHERE email = ?', {
      replacements: [TEST_EMAIL],
    }),
  );
  if (!expertRows.length) {
    fail('Expert DB row', 'Test expert not found in jatayu_expert_db.Experts');
  } else {
    pass('Test expert row confirmed in jatayu_expert_db.Experts');
    log('Expert DB row', null, expertRows[0]);
  }

  printSummary(results);
  await import('../config/db/index.js').then(({ closeAllDatabases }) => closeAllDatabases());
  process.exit(results.failed.length ? 1 : 0);
}

function printSummary(results) {
  console.log('\n========== TEST SUMMARY ==========');
  console.log(`PASSED (${results.passed.length}):`);
  results.passed.forEach((p) => console.log(`  ✓ ${p}`));
  if (results.failed.length) {
    console.log(`\nFAILED (${results.failed.length}):`);
    results.failed.forEach((f) => console.log(`  ✗ ${f.name}: ${f.reason}`));
  } else {
    console.log('\nAll tests passed.');
  }
  console.log('==================================\n');
}

main().catch((err) => {
  console.error('Test script error:', err);
  process.exit(1);
});
