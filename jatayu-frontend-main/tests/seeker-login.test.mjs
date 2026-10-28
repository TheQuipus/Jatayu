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
      react: { Suspense: 'Suspense' },
      'react/jsx-runtime': { jsx, jsxs: jsx },
      'next/navigation': { useRouter: () => ({}), useSearchParams: () => new URLSearchParams() },
      '@/components/seeker/onboarding/LoginStep': { default: 'SeekerLoginStep' },
      '@/components/expert/onboarding/LoginStep': { default: 'ExpertLoginStep' },
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
