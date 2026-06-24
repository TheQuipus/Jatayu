import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;

async function runTests() {
  console.log('=== Starting Backend API Tests ===\n');

  try {
    // 1. Health Check
    console.log('Testing Health Check...');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    console.log('Health check response:', healthData);
    if (healthRes.status !== 200) throw new Error('Health check failed');
    console.log('✓ Health check passed\n');

    // Generate unique email for this run
    const randomId = Math.floor(Math.random() * 10000);
    const email = `expert-${randomId}@example.com`;
    const password = 'Password@123';
    const phone = '9898675444';
    const fullName = 'Aryan Singh';

    // 2. Register
    console.log(`Registering new expert: ${email}...`);
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, email, password, phone })
    });
    const registerData = await registerRes.json();
    console.log('Register response:', registerData);
    if (registerRes.status !== 201) throw new Error('Registration failed');
    console.log('✓ Registration passed\n');

    const expertId = registerData.expertId;
    const otpCode = '123456';

    // 3. Verify OTP
    console.log(`Verifying OTP for expert: ${expertId}...`);
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expertId, code: otpCode })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify OTP response:', verifyData);
    if (verifyRes.status !== 200) throw new Error('OTP Verification failed');
    console.log('✓ OTP Verification passed\n');

    const token = verifyData.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 4. Test Login
    console.log('Testing normal login...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);
    if (loginRes.status !== 200) throw new Error('Login failed');
    console.log('✓ Login passed\n');

    // 5. Update Profile - Step: Category
    console.log('Saving Step: Category...');
    const catRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'category',
        category: 'software'
      })
    });
    const catData = await catRes.json();
    if (catRes.status !== 200) throw new Error('Category save failed');
    console.log('Category save database response:', {
      category: catData.expert.category,
      onboardingStep: catData.expert.onboardingStep
    });
    console.log('✓ Category save passed\n');

    // 6. Update Profile - Step: Skills
    console.log('Saving Step: Skills...');
    const skillsRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'skills',
        skills: ['Frontend Development', 'Backend Architecture', 'System Design']
      })
    });
    const skillsData = await skillsRes.json();
    if (skillsRes.status !== 200) throw new Error('Skills save failed');
    console.log('Skills save database response:', {
      skills: skillsData.expert.skills,
      onboardingStep: skillsData.expert.onboardingStep
    });
    console.log('✓ Skills save passed\n');

    // 7. Update Profile - Step: Experience
    console.log('Saving Step: Experience...');
    const expRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'experience',
        experienceLevel: 'established'
      })
    });
    const expData = await expRes.json();
    if (expRes.status !== 200) throw new Error('Experience save failed');
    console.log('Experience save database response:', {
      experienceLevel: expData.expert.experienceLevel,
      onboardingStep: expData.expert.onboardingStep
    });
    console.log('✓ Experience save passed\n');

    // 8. Update Profile - Step: Identity
    console.log('Saving Step: Identity...');
    const idRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'identity',
        professionalTitle: 'Lead Software Architect',
        tagLine: 'Helping teams scale systems from 0 to millions',
        bio: 'Senior backend developer with expertise in MySQL, Node.js, and GCP.'
      })
    });
    const idData = await idRes.json();
    if (idRes.status !== 200) throw new Error('Identity save failed');
    console.log('Identity save database response:', {
      professionalTitle: idData.expert.professionalTitle,
      tagLine: idData.expert.tagLine,
      bio: idData.expert.bio,
      onboardingStep: idData.expert.onboardingStep
    });
    console.log('✓ Identity save passed\n');

    // 9. Update Profile - Step: Credentials
    console.log('Saving Step: Credentials...');
    const credRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'credentials',
        credentials: [
          {
            type: 'education',
            title: 'Bachelor of Technology in CS',
            institution: 'IIT Delhi',
            startYear: '2014',
            endYear: '2018',
            description: 'Graduated with Honours'
          },
          {
            type: 'experience',
            title: 'Senior Engineer',
            institution: 'Google India',
            startYear: '2018',
            endYear: '2022',
            description: 'Worked in Google Cloud Platform'
          }
        ]
      })
    });
    const credData = await credRes.json();
    if (credRes.status !== 200) throw new Error('Credentials save failed');
    console.log('Credentials count saved:', credData.expert.credentials?.length);
    console.log('✓ Credentials save passed\n');

    // 10. Update Profile - Step: Preferences
    console.log('Saving Step: Preferences...');
    const prefRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'preferences',
        selectedFormats: ['video', 'audio'],
        selectedLengths: ['30 min', '60 min'],
        formatPrices: { video: '3500', audio: '2000' }
      })
    });
    const prefData = await prefRes.json();
    if (prefRes.status !== 200) throw new Error('Preferences save failed');
    console.log('Preferences save database response:', {
      selectedFormats: prefData.expert.selectedFormats,
      selectedLengths: prefData.expert.selectedLengths,
      formatPrices: prefData.expert.formatPrices,
      onboardingStep: prefData.expert.onboardingStep
    });
    console.log('✓ Preferences save passed\n');

    // 11. Update Profile - Step: Audience
    console.log('Saving Step: Audience...');
    const audRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'audience',
        targetAudience: 'Software engineers wanting to scale their backend skills',
        focusAreas: ['API Design', 'System Architecture']
      })
    });
    const audData = await audRes.json();
    if (audRes.status !== 200) throw new Error('Audience save failed');
    console.log('Audience save database response:', {
      targetAudience: audData.expert.targetAudience,
      focusAreas: audData.expert.focusAreas,
      onboardingStep: audData.expert.onboardingStep
    });
    console.log('✓ Audience save passed\n');

    // 12. Update Profile - Step: Availability
    console.log('Saving Step: Availability...');
    const availRes = await fetch(`${BASE_URL}/api/expert/profile`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        step: 'availability',
        timezone: 'Asia/Kolkata',
        availabilitySlots: [
          { days: ['Mon', 'Wed'], from: '10:00 AM', to: '12:00 PM' },
          { days: ['Sat'], from: '02:00 PM', to: '06:00 PM' }
        ]
      })
    });
    const availData = await availRes.json();
    if (availRes.status !== 200) throw new Error('Availability save failed');
    console.log('Availability save database response:', {
      timezone: availData.expert.timezone,
      slotsCount: availData.expert.availabilities?.length,
      onboardingStep: availData.expert.onboardingStep
    });
    console.log('✓ Availability save passed\n');

    // 13. Fetch current state profile (GET /me)
    console.log('Fetching expert profile to verify integration...');
    const meRes = await fetch(`${BASE_URL}/api/expert/me`, {
      headers: authHeaders
    });
    const meData = await meRes.json();
    if (meRes.status !== 200) throw new Error('Fetching profile failed');
    console.log('Verification: Saved Skills count:', meData.skills?.length);
    console.log('Verification: Saved Credentials count:', meData.credentials?.length);
    console.log('Verification: Saved Availabilities count:', meData.availabilities?.length);
    console.log('✓ GET /me validation passed\n');

    // 14. Submit onboarding review
    console.log('Submitting onboarding review...');
    const submitRes = await fetch(`${BASE_URL}/api/expert/submit`, {
      method: 'POST',
      headers: authHeaders
    });
    const submitData = await submitRes.json();
    console.log('Submit response:', submitData);
    if (submitRes.status !== 200) throw new Error('Submission failed');
    console.log('✓ Submission passed\n');

    // 15. Verify Mock Google Login
    console.log('Testing Mock Google Login/Signup...');
    const googleRes = await fetch(`${BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken: 'mock-google-token',
        email: `google-expert-${randomId}@example.com`,
        fullName: 'Google Expert Test',
        profilePhotoSrc: '/assets/img/avatar2.png',
        googleId: `google-id-${randomId}`
      })
    });
    const googleData = await googleRes.json();
    console.log('Google login response:', googleData);
    if (googleRes.status !== 200) throw new Error('Google Auth route failed');
    console.log('✓ Google login/signup passed\n');

    console.log('=======================================');
    console.log('🎉 ALL BACKEND API TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('=======================================');
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

runTests();
