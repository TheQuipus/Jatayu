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

function collectText(node, out = []) {
  if (node == null || typeof node === "boolean") return out;
  if (typeof node === "string" || typeof node === "number") {
    out.push(String(node));
    return out;
  }
  if (Array.isArray(node)) {
    for (const item of node) collectText(item, out);
    return out;
  }
  if (typeof node === "object" && node.props) {
    collectText(node.props.children, out);
  }
  return out;
}

function findButtons(node, out = []) {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) {
    for (const item of node) findButtons(item, out);
    return out;
  }
  if (node.type === "button") {
    out.push(node);
  }
  if (node.props?.children) {
    findButtons(node.props.children, out);
  }
  return out;
}

const otpResend = loadTsModule("lib/otpResend.ts");

function renderControl(props) {
  const jsx = (type, p) => ({ type, props: p });
  const mod = loadTsModule("components/auth/OtpResendControl.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "@/lib/otpResend": otpResend,
    "./OtpResendControl.module.css": {
      default: {
        wrapper: "wrapper",
        dark: "dark",
        light: "light",
        actionRow: "actionRow",
        resendButton: "resendButton",
        counter: "counter",
        blockCallout: "blockCallout",
        blockMessageLine: "blockMessageLine",
      },
    },
  });
  return mod.default(props);
}

test("cooldown constant is 30 seconds and deadline math computes 30s at t0 and 0s at t0 + 30s", () => {
  assert.equal(otpResend.OTP_RESEND_COOLDOWN_SECONDS, 30);
  const t0 = 1_000_000;
  const endsAt = otpResend.computeCooldownEndsAt(otpResend.OTP_RESEND_COOLDOWN_SECONDS, t0);
  assert.equal(otpResend.cooldownRemainingSeconds(endsAt, t0), 30);
  assert.equal(otpResend.cooldownRemainingSeconds(endsAt, t0 + 15_001), 15);
  assert.equal(otpResend.cooldownRemainingSeconds(endsAt, t0 + 30_000), 0);
});

test("renders Resend OTP label and (0/3), (1/3), (2/3), (3/3) counters", () => {
  for (const [attempts, expected] of [
    [0, "(0/3)"],
    [1, "(1/3)"],
    [2, "(2/3)"],
    [3, "(3/3)"],
  ]) {
    const tree = renderControl({
      resendSeconds: 0,
      isResending: false,
      resendAttempts: attempts,
      maxResendAttempts: 3,
      blockedUntil: null,
      onResend: () => {},
    });
    const text = collectText(tree).join(" ");
    const buttons = findButtons(tree);
    assert.equal(buttons.length, 1);
    assert.equal(collectText(buttons[0]).join(""), "Resend OTP");
    assert.ok(text.includes(expected), `expected ${expected} in "${text}"`);
    assert.equal(/resend the code/i.test(text), false);
  }
});

test("blocked state disables the button and renders all three exact messages", () => {
  const futureIso = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const tree = renderControl({
    resendSeconds: 12,
    isResending: false,
    resendAttempts: 3,
    maxResendAttempts: 3,
    blockedUntil: futureIso,
    onResend: () => {},
  });
  const buttons = findButtons(tree);
  assert.equal(buttons[0].props.disabled, true);
  assert.equal(collectText(buttons[0]).join(""), "Resend OTP");

  const text = collectText(tree).join("\n");
  assert.ok(text.includes("Check inbox/spam of your registered email and phone number."));
  assert.ok(text.includes("Make sure the email and phone number you entered are correct."));
  assert.ok(text.includes("Or try again in 30 mins."));
});

test("OTP_RESEND_COOLDOWN 429 sets deadline from retryAfterSeconds without red error", () => {
  const t0 = 5_000_000;
  const initial = otpResend.createInitialOtpResendState(0, t0);
  const { state, errorMessage } = otpResend.applyResendError(
    initial,
    { code: "OTP_RESEND_COOLDOWN", data: { code: "OTP_RESEND_COOLDOWN", retryAfterSeconds: 22 } },
    t0,
  );
  assert.equal(errorMessage, null);
  assert.equal(otpResend.cooldownRemainingSeconds(state.cooldownEndsAt, t0), 22);
});

test("OTP_RESEND_LIMIT_REACHED 429 sets (3/3) and blocked state", () => {
  const t0 = 6_000_000;
  const blockedUntil = new Date(t0 + 30 * 60 * 1000).toISOString();
  const initial = otpResend.createInitialOtpResendState(0, t0);
  const { state, errorMessage } = otpResend.applyResendError(
    initial,
    {
      code: "OTP_RESEND_LIMIT_REACHED",
      data: {
        code: "OTP_RESEND_LIMIT_REACHED",
        resendAttempts: 3,
        maxResendAttempts: 3,
        blockedUntil,
      },
    },
    t0,
  );
  assert.equal(errorMessage, null);
  assert.equal(state.resendAttempts, 3);
  assert.equal(state.blockedUntil, blockedUntil);
  assert.equal(otpResend.isResendBlocked(state, t0), true);
});

test("blocked OtpResendControl renders bulleted ul/li list without red box callout styles", () => {
  const now = Date.now();
  const futureIso = new Date(now + 10 * 60 * 1000).toISOString();
  const tree = renderControl({
    resendSeconds: 0,
    isResending: false,
    resendAttempts: 3,
    maxResendAttempts: 3,
    blockedUntil: futureIso,
    variant: "dark",
    onResend: () => {},
  });

  const findByType = (node, tag, acc = []) => {
    if (!node || typeof node !== "object") return acc;
    if (Array.isArray(node)) {
      for (const child of node) findByType(child, tag, acc);
      return acc;
    }
    if (node.type === tag) acc.push(node);
    if (node.props?.children) findByType(node.props.children, tag, acc);
    return acc;
  };

  const lists = findByType(tree, "ul");
  const items = findByType(tree, "li");
  assert.equal(lists.length, 1);
  assert.equal(items.length, 3);

  const css = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/auth/OtpResendControl.module.css"),
    "utf8",
  );
  assert.doesNotMatch(css, /\.blockCallout/);
  assert.match(css, /\.blockList\s*\{[^}]*background:\s*transparent;\s*border:\s*none;/s);
});
