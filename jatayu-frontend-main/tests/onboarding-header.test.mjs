import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

function loadTsModule(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(import.meta.dirname, "..", file), "utf8");
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

const headerState = loadTsModule("lib/onboardingHeaderState.ts", {}, { URLSearchParams });

test("isPostOtpOnboardingHeader returns false for non-onboarding pages and pre-OTP steps", () => {
  for (const [pathname, search] of [
    ["/", ""],
    ["/expert/", ""],
    ["/login", ""],
    ["/login", "?role=expert"],
    ["/forgot-password", "?role=expert"],
    ["/reset-password", "?token=abc"],
    ["/seeker/seeker-onboarding/", ""],
    ["/seeker/seeker-onboarding/", "?flow=signup"],
    ["/seeker/seeker-onboarding/", "?auth=login"],
    ["/seeker/seeker-onboarding/", "?resume=otp"],
    ["/seeker/seeker-onboarding/", "?step=register"],
    ["/seeker/seeker-onboarding/", "?step=login"],
    ["/seeker/seeker-onboarding/", "?step=otp"],
    ["/expert/expert-onboarding/", ""],
    ["/expert/expert-onboarding/", "?flow=signup"],
    ["/expert/expert-onboarding/", "?auth=login"],
    ["/expert/expert-onboarding/", "?resume=otp"],
    ["/expert/expert-onboarding/", "?step=register"],
    ["/expert/expert-onboarding/", "?step=login"],
    ["/expert/expert-onboarding/", "?step=otp"],
  ]) {
    assert.equal(
      headerState.isPostOtpOnboardingHeader(pathname, search),
      false,
      `Expected false for ${pathname}${search}`,
    );
  }
});

test("isPostOtpOnboardingHeader returns true for all post-OTP seeker and expert onboarding steps including success", () => {
  for (const [pathname, search] of [
    ["/seeker/seeker-onboarding/", "?step=phone"],
    ["/seeker/seeker-onboarding/", "?step=welcome"],
    ["/seeker/seeker-onboarding/", "?step=category"],
    ["/seeker/seeker-onboarding/", "?step=budget"],
    ["/seeker/seeker-onboarding/", "?step=review"],
    ["/seeker/seeker-onboarding/", "?step=success"],
    ["/expert/expert-onboarding/", "?step=category"],
    ["/expert/expert-onboarding/", "?step=credentials"],
    ["/expert/expert-onboarding/", "?step=review"],
    ["/expert/expert-onboarding/", "?step=signup-complete"],
    ["/expert/expert-onboarding/", "?step=account-status"],
    ["/expert/expert-onboarding/", "?step=success"],
    ["/expert/expert-onboarding/", "?kyc=success"],
    ["/expert/expert-onboarding/", "?resume=category"],
  ]) {
    assert.equal(
      headerState.isPostOtpOnboardingHeader(pathname, search),
      true,
      `Expected true for ${pathname}${search}`,
    );
  }
});

test("TopNavbar renders non-clickable static span logo during minimal onboarding header and cleans up listeners", () => {
  const navSource = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/ui/TopNavbar.tsx"),
    "utf8",
  );
  assert.match(navSource, /isWizardMinimalHeader \? \(\s*<span className=\{`\$\{styles\.logo\} \$\{styles\.logoStatic\}`\}>/);
  assert.match(navSource, /if \(nextMinimal\) \{\s*setIsOpen\(false\);\s*\}/);
  assert.match(navSource, /window\.removeEventListener\(ONBOARDING_STEP_CHANGE_EVENT, syncWizardHeader\)/);
  assert.match(navSource, /window\.removeEventListener\("popstate", syncWizardHeader\)/);

  const navCss = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/ui/TopNavbar.module.css"),
    "utf8",
  );
  assert.match(navCss, /\.logoStatic\s*\{[^}]*cursor:\s*default;/s);
  assert.match(navCss, /\.logoStatic:hover\s*\{[^}]*opacity:\s*1;/s);
});
