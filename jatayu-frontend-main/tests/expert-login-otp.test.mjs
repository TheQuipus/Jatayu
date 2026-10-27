import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

function loadModule(file, mocks, globals = {}) {
  const source = fs.readFileSync(path.join(import.meta.dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    require: (name) => {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    ...globals,
  });
  return loaded.exports;
}

test('expert login requiring OTP navigates to the verification entry flow', () => {
  let pushed;
  const jsx = (type, props) => ({ type, props });
  const page = loadModule('app/login/page.tsx', {
    react: { Suspense: 'Suspense' },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'next/navigation': {
      useRouter: () => ({ push: (href) => { pushed = href; } }),
      useSearchParams: () => new URLSearchParams('role=expert'),
    },
    '@/components/seeker/onboarding/LoginStep': { default: 'SeekerLoginStep' },
    '@/components/expert/onboarding/LoginStep': { default: 'ExpertLoginStep' },
    '@/lib/seekerAuth': {},
    '@/lib/expertAuth': {},
    '@/lib/expertDashboard': {},
    '@/lib/joinAsExpertNav': {},
    '@/app/expert/expert-onboarding/page.module.css': {
      default: {
        pageContainer: 'page',
        bgWrapper: 'background',
        bgImage: 'image',
        bgOverlay: 'overlay',
      },
    },
  }, { window: { location: { assign() {} } } });

  const suspense = page.default();
  const roleContent = suspense.props.children.type(suspense.props.children.props);
  const loginShell = roleContent.type(roleContent.props);
  const login = loginShell.props.children;
  login.props.onRequiresOtp();

  assert.equal(pushed, '/expert/expert-onboarding/?resume=otp');
});

test('only an explicit OTP-required login response starts verification', async () => {
  const apiMocks = {
    '@/lib/experts': {},
    '@/lib/expertRequests': {},
    '@/lib/expertIdentitySuggest': {},
    '@/lib/publicApiBase': { publicApiBase: () => 'https://api.example.test' },
    '@/lib/dateTimeUtils': {},
  };
  const otpApi = loadModule('lib/api.ts', apiMocks, {
    fetch: async () => ({
      status: 403,
      ok: false,
      json: async () => ({
        message: 'Please verify your account.',
        requiresOtp: true,
        expertId: 'existing-expert',
        email: 'expert@example.com',
        phone: '+919999999999',
      }),
    }),
  });
  await assert.rejects(
    otpApi.login({ email: 'expert@example.com', password: 'valid-password' }),
    (error) => error.name === 'OtpRequiredError' && error.expertId === 'existing-expert',
  );

  const invalidApi = loadModule('lib/api.ts', apiMocks, {
    fetch: async () => ({
      status: 401,
      ok: false,
      json: async () => ({ message: 'incorrect credentials' }),
    }),
  });
  await assert.rejects(
    invalidApi.login({ email: 'expert@example.com', password: 'wrong-password' }),
    (error) => error.name === 'ApiError' && error.message === 'Invalid email or password',
  );
});

test('resumed OTP sessions preserve login versus signup origin', () => {
  const auth = loadModule('lib/expertAuth.ts', {
    '@/lib/api': {
      getToken: () => null,
      setToken: () => {},
      setExpertId: () => {},
      removeToken: () => {},
      removeExpertId: () => {},
    },
    '@/lib/expertDashboard': { EXPERT_DASHBOARD_HREF: '/expert/dashboard' },
    '@/lib/uuid': { generateUUID: () => 'test-id' },
    '@/lib/expertApplicationsStore': { clearExpertApplicationDraft: () => {} },
  });

  assert.equal(auth.isSignupOtpSession({ expertId: 'existing', email: 'expert@example.com', phone: '', flow: 'login' }), false);
  assert.equal(auth.isSignupOtpSession({ expertId: 'new', email: 'new@example.com', phone: '', flow: 'signup' }), true);
  assert.equal(auth.isSignupOtpSession({ expertId: 'legacy', email: 'legacy@example.com', phone: '' }), true);

  const page = fs.readFileSync(
    new URL('../app/expert/expert-onboarding/page.tsx', import.meta.url),
    'utf8',
  );
  assert.match(page, /signupFlowRef\.current = isSignupOtpSession\(pending\)/);
  assert.match(page, /onBack=\{handleBackFromOtp\}/);
});

test('the onboarding URL is not synchronized from the default register step before resume routing', () => {
  const onboardingPage = fs.readFileSync(
    new URL('../app/expert/expert-onboarding/page.tsx', import.meta.url),
    'utf8',
  );
  const routeInitEffect = onboardingPage.indexOf('setRouteInitialized(true)');
  const effectStart = onboardingPage.indexOf('useEffect(() => {', routeInitEffect);
  const effectEnd = onboardingPage.indexOf('}, [routeInitialized, step]);', effectStart);
  assert.notEqual(routeInitEffect, -1);
  assert.notEqual(effectStart, -1, 'the URL synchronization effect should be present');
  assert.notEqual(effectEnd, -1);
  const effectSource = onboardingPage.slice(effectStart, effectEnd + '}, [routeInitialized, step]);'.length);
  const callback = effectSource.slice(
    'useEffect('.length,
    effectSource.lastIndexOf('}, [routeInitialized, step]') + 1,
  );
  const updates = [];
  const runEffect = (routeInitialized, step, currentSearch) => {
    const window = {
      location: {
        pathname: '/expert/expert-onboarding/',
        search: currentSearch,
      },
      history: {
        replaceState(_state, _title, url) {
          updates.push(url);
        },
      },
    };
    vm.runInNewContext(`(${callback})()`, { routeInitialized, step, window });
  };

  runEffect(false, 'register', '?resume=otp');
  assert.deepEqual(updates, [], 'the initial register default must not overwrite the OTP resume URL');

  runEffect(true, 'otp', '?flow=signup');
  assert.deepEqual(updates, ['/expert/expert-onboarding/?resume=otp']);
});
