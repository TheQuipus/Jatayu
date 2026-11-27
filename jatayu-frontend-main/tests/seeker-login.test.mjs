import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';

// Exercise the actual page callbacks without a browser or external auth service.
function loadModule(file, mocks, globals = {}) {
  const source = fs.readFileSync(path.join(import.meta.dirname, '..', file), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loaded, exports: loaded.exports,
    require: (name) => {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    ...globals,
  });
  return loaded.exports;
}

for (const [user, expected] of [
  [{ phone: '9876543210', onboardingStep: 'category' }, '/seeker/seeker-onboarding/?step=category'],
  [{ phone: '9876543210', onboardingStep: 'budget' }, '/seeker/seeker-onboarding/?step=budget'],
  [{}, '/seeker/seeker-onboarding/?step=phone'],
  [{ phone: '', status: 'active' }, '/seeker/seeker-onboarding/?step=phone'],
  [{ phone: '9876543210', status: 'active' }, '/seeker/dashboard/'],
  [{ phone: '9876543210', onboardingComplete: true }, '/seeker/dashboard/'],
]) {
  test(`seeker login resumes ${JSON.stringify(user)}`, () => {
    let assigned;
    let persisted;
    const auth = loadModule('lib/seekerAuth.ts', { '@/lib/api': {} });
    const jsx = (type, props) => ({ type, props });
    const page = loadModule('app/login/page.tsx', {
      react: {
        Suspense: 'Suspense',
        useState: (init) => [typeof init === 'function' ? init() : init, () => {}],
        useEffect: () => {},
      },
      'react/jsx-runtime': { jsx, jsxs: jsx },
      'next/navigation': { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
      '@/components/seeker/onboarding/LoginStep': { default: 'SeekerLoginStep' },
      '@/components/seeker/onboarding/OtpStep': { default: 'SeekerOtpStep' },
      '@/components/expert/onboarding/LoginStep': { default: 'ExpertLoginStep' },
      '@/components/expert/onboarding/OtpStep': { default: 'ExpertOtpStep' },
      '@/lib/seekerAuth': {
        ...auth,
        persistSeekerAuthSession: (response) => { persisted = response; return response.user; },
      },
      '@/lib/expertAuth': {},
      '@/lib/expertDashboard': {},
      '@/lib/joinAsExpertNav': {},
      '@/app/expert/expert-onboarding/page.module.css': {},
    }, { window: { location: { assign: (url) => { assigned = url; } } } });
    const content = page.default().props.children;
    const rolePage = content.type(content.props);
    const login = rolePage.type(rolePage.props).props.children;
    const response = { token: 'test-token', user };
    login.props.onContinue(response);
    assert.equal(persisted, response);
    assert.equal(assigned, expected);
  });
}

test('seeker LoginStep renders submitError below password input with 14px passwordSubmitError class', () => {
  const source = fs.readFileSync(
    path.join(import.meta.dirname, '..', 'components/seeker/onboarding/LoginStep.tsx'),
    'utf8',
  );
  const pwIdx = source.indexOf('id="loginPassword"');
  const submitErrIdx = source.indexOf('styles.passwordSubmitError');
  const forgotIdx = source.indexOf('styles.forgotPasswordRow');
  const loginBtnIdx = source.indexOf('label={isSubmitting ? "Logging in..." : "Login"}');
  assert.ok(pwIdx > 0 && submitErrIdx > pwIdx && submitErrIdx < forgotIdx && forgotIdx < loginBtnIdx);

  const css = fs.readFileSync(
    path.join(import.meta.dirname, '..', 'components/seeker/onboarding/RegisterStep.module.css'),
    'utf8',
  );
  assert.match(css, /\.passwordSubmitError\s*\{[^}]*font-size:\s*14px;[^}]*color:\s*#FF3B30;/s);
});
