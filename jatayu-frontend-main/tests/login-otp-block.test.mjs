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

const otpResend = loadTsModule("lib/otpResend.ts");

test("extractOtpBlockDeadline detects 429 OTP_RESEND_LIMIT_REACHED from blockedUntil or retryAfterSeconds", () => {
  const t0 = 1_000_000;
  const blockedUntil = new Date(t0 + 1692 * 1000).toISOString();

  assert.equal(
    otpResend.extractOtpBlockDeadline(
      { status: 429, data: { code: "OTP_RESEND_LIMIT_REACHED", blockedUntil, retryAfterSeconds: 1692 } },
      t0,
    ),
    Date.parse(blockedUntil),
  );

  assert.equal(
    otpResend.extractOtpBlockDeadline(
      { status: 429, data: { code: "OTP_RESEND_LIMIT_REACHED", retryAfterSeconds: 120 } },
      t0,
    ),
    t0 + 120_000,
  );

  assert.equal(
    otpResend.extractOtpBlockDeadline({ status: 401, data: { code: "INVALID_CREDENTIALS" } }, t0),
    null,
  );
});

test("formatBlockRemaining and formatOtpLoginBlockMessage format minutes and seconds cleanly", () => {
  assert.equal(otpResend.formatBlockRemaining(28 * 60 + 12), "28 min 12 s");
  assert.equal(otpResend.formatBlockRemaining(45), "45 s");
  assert.equal(
    otpResend.formatOtpLoginBlockMessage(28 * 60 + 12),
    "OTP limit reached. Please try again in 28 min 12 s.",
  );
  const parts = otpResend.formatOtpLoginBlockParts(19);
  assert.equal(parts.prefix, "OTP limit reached. Please try again in ");
  assert.equal(parts.countdown, "19 s");
  assert.equal(parts.suffix, ".");
  assert.equal(`${parts.prefix}${parts.countdown}${parts.suffix}`, otpResend.formatOtpLoginBlockMessage(19));
  assert.equal(otpResend.cooldownRemainingSeconds(1_000_000, 1_000_000), 0);
});

test("seeker and expert LoginStep render blockMessage below Login button, keep Login enabled, clear on email/password edit and before submit, and do not trigger OTP step", () => {
  for (const file of [
    "components/seeker/onboarding/LoginStep.tsx",
    "components/expert/onboarding/LoginStep.tsx",
  ]) {
    const source = fs.readFileSync(path.join(import.meta.dirname, "..", file), "utf8");
    assert.match(source, /if \(handleLoginBlockError\(error\)\) \{\s*return;\s*\}/);
    const clearMatches = source.match(/clearBlock\(\);/g) || [];
    assert.equal(clearMatches.length, 3, `${file} must call clearBlock() on submit, email edit, and password edit`);
    assert.match(source, /disabled=\{!canSubmit \|\| isSubmitting\}/);
    const loginBtnIdx = source.indexOf('label={isSubmitting ? "Logging in..." : "Login"}');
    const blockMsgIdx = source.indexOf("styles.loginBlockError");
    assert.ok(loginBtnIdx > 0 && blockMsgIdx > loginBtnIdx, `${file} must render blockMessage below Login button`);
    assert.match(source, /<span className=\{styles\.loginBlockCountdown\}>\{blockParts\.countdown\}<\/span>/);
  }

  const checkoutModalSource = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/checkout/CheckoutAuthModal.tsx"),
    "utf8",
  );
  assert.match(checkoutModalSource, /<span className=\{styles\.loginBlockCountdown\}>\{parts\.countdown\}<\/span>/);

  const checkoutSource = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/checkout/Checkout.tsx"),
    "utf8",
  );
  const checkoutClearMatches = checkoutSource.match(/clearLoginBlock\(\);/g) || [];
  assert.equal(checkoutClearMatches.length, 3, "Checkout.tsx must call clearLoginBlock() on submit, email edit, and password edit");
});

test("useLoginOtpBlock clears block state when a 429 block is followed by a 401 or password edit", () => {
  let stateDeadline = null;
  let stateRemaining = 0;
  const hook = loadTsModule("hooks/useLoginOtpBlock.ts", {
    react: {
      useState: (initial) => {
        if (initial === null) return [stateDeadline, (val) => { stateDeadline = val; }];
        return [stateRemaining, (val) => { stateRemaining = val; }];
      },
      useEffect: () => {},
      useCallback: (fn) => fn,
    },
    "@/lib/otpResend": otpResend,
  });

  const result = hook.useLoginOtpBlock();
  // 1. First attempt returns 429 block -> handled, blockMessage set
  const handled429 = result.handleLoginBlockError({
    status: 429,
    data: { code: "OTP_RESEND_LIMIT_REACHED", retryAfterSeconds: 600 },
  });
  assert.equal(handled429, true);
  assert.ok(stateDeadline !== null && stateRemaining > 0);

  // 2. Next attempt starts -> clearBlock() clears stale block; 401 returns false (only credentials error shows)
  result.clearBlock();
  assert.equal(stateDeadline, null);
  assert.equal(stateRemaining, 0);
  const handled401 = result.handleLoginBlockError({
    status: 401,
    message: "Invalid email or password",
  });
  assert.equal(handled401, false);
  assert.equal(stateDeadline, null);
  assert.equal(stateRemaining, 0);
});
