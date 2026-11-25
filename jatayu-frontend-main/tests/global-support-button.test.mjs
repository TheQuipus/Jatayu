import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function transpileCommonJs(relativePath) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  return { source, outputText };
}

const emailModule = { exports: {} };
vm.runInNewContext(transpileCommonJs("../lib/emailValidation.ts").outputText, {
  module: emailModule,
  exports: emailModule.exports,
});

function loadSupportApi(tokens = { seeker: null, expert: null, fallback: null }) {
  const { outputText } = transpileCommonJs("../lib/supportApi.ts");
  const loaded = { exports: {} };

  const customRequire = (id) => {
    if (id === "@/lib/api") {
      return {
        getSeekerToken: () => tokens.seeker,
        getExpertToken: () => tokens.expert,
        getToken: () => tokens.fallback ?? (tokens.expert || tokens.seeker),
      };
    }
    if (id === "@/lib/emailValidation") {
      return emailModule.exports;
    }
    if (id === "@/lib/publicApiBase") {
      return { publicApiBase: () => "http://localhost:5000" };
    }
    throw new Error(`Unexpected import: ${id}`);
  };

  vm.runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    require: customRequire,
    fetch: async () => ({ ok: true, json: async () => ({}) }),
  });

  return loaded.exports;
}

test("normalizeSupportPhone normalizes 10, 11 (0-prefixed), 12 (91-prefixed), and 13 (910-prefixed) digit numbers", () => {
  const { normalizeSupportPhone, isValidSupportPhone } = loadSupportApi();
  for (const raw of [
    "9876543210",
    "+919876543210",
    "+91 98765 43210",
    "09876543210",
    "+91 09876543210",
  ]) {
    assert.equal(normalizeSupportPhone(raw), "9876543210");
    assert.equal(isValidSupportPhone(raw), true);
  }
  assert.equal(isValidSupportPhone("12345"), false);
});

test("resolveSupportAuthToken hides on /admin/* and resolves seeker vs expert token by route when both exist", () => {
  const both = loadSupportApi({
    seeker: "seeker-jwt",
    expert: "expert-jwt",
  });

  // Never resolves a token on /admin or /admin/*
  assert.equal(both.isAdminRoutePath("/admin"), true);
  assert.equal(both.isAdminRoutePath("/admin/dashboard"), true);
  assert.equal(both.resolveSupportAuthToken("/admin/dashboard"), null);

  // When both seeker & expert tokens exist in the browser:
  assert.equal(both.resolveSupportAuthToken("/seeker/dashboard"), "seeker-jwt");
  assert.equal(both.resolveSupportAuthToken("/seeker/seeker-onboarding"), "seeker-jwt");
  assert.equal(both.resolveSupportAuthToken("/checkout"), "seeker-jwt");
  assert.equal(both.resolveSupportAuthToken("/expert/dashboard"), "expert-jwt");
  assert.equal(both.resolveSupportAuthToken("/expert/expert-onboarding"), "expert-jwt");
  assert.equal(both.resolveSupportAuthToken("/login", "?role=user"), "seeker-jwt");
  assert.equal(both.resolveSupportAuthToken("/login", "?role=expert"), "expert-jwt");

  // When only one token exists:
  const seekerOnly = loadSupportApi({ seeker: "seeker-only-jwt", expert: null });
  assert.equal(seekerOnly.resolveSupportAuthToken("/"), "seeker-only-jwt");
  assert.equal(seekerOnly.resolveSupportAuthToken("/expert/some-slug"), "seeker-only-jwt");

  const none = loadSupportApi({ seeker: null, expert: null });
  assert.equal(none.resolveSupportAuthToken("/seeker/dashboard"), null);
});

test("validateSupportFormInput validates email, phone, predefined/custom subject, and 1-160 char description", () => {
  const { validateSupportFormInput, PREDEFINED_SUPPORT_SUBJECTS } = loadSupportApi();

  const empty = validateSupportFormInput({
    email: "",
    phone: "",
    subject: "",
    description: "",
  });
  assert.equal(empty.valid, false);
  assert.ok(empty.errors.email);
  assert.ok(empty.errors.phone);
  assert.ok(empty.errors.subject);
  assert.ok(empty.errors.description);

  // Predefined subject + 09876543210 phone
  const validPredefined = validateSupportFormInput({
    email: "Priya@Example.com",
    phone: "09876543210",
    subject: PREDEFINED_SUPPORT_SUBJECTS[0],
    description: "Unable to reschedule my confirmed booking.",
  });
  assert.equal(validPredefined.valid, true);
  assert.equal(validPredefined.values.email, "priya@example.com");
  assert.equal(validPredefined.values.phone, "9876543210");

  // Valid custom subject (2 to 120 chars, plain text)
  const validCustom = validateSupportFormInput({
    email: "expert@example.com",
    phone: "+91 98765 43210",
    subject: "GST invoice correction needed",
    description: "Please update my GSTIN on the last payout.",
  });
  assert.equal(validCustom.valid, true);
  assert.equal(validCustom.values.subject, "GST invoice correction needed");

  // Invalid custom subject (HTML tags or < 2 chars)
  const htmlSubject = validateSupportFormInput({
    email: "expert@example.com",
    phone: "9876543210",
    subject: "<script>alert(1)</script>",
    description: "Valid description",
  });
  assert.equal(htmlSubject.valid, false);
  assert.match(htmlSubject.errors.subject, /plain text only/i);

  // Description > 160 chars
  const tooLongDesc = validateSupportFormInput({
    email: "expert@example.com",
    phone: "9876543210",
    subject: PREDEFINED_SUPPORT_SUBJECTS[1],
    description: "x".repeat(161),
  });
  assert.equal(tooLongDesc.valid, false);
  assert.match(tooLongDesc.errors.description, /1 and 160/i);
});

test("GlobalSupportButton component mounts once in RootLayout and reuses DropdownFilter with light variant and custom option creation", () => {
  const componentSource = fs.readFileSync(
    new URL("../components/ui/GlobalSupportButton.tsx", import.meta.url),
    "utf8",
  );
  const layoutSource = fs.readFileSync(
    new URL("../app/layout.tsx", import.meta.url),
    "utf8",
  );

  assert.match(layoutSource, /import GlobalSupportButton from "@\/components\/ui\/GlobalSupportButton"/);
  assert.match(layoutSource, /<GlobalSupportButton \/>/);

  // Hydration safety (useSyncExternalStore with getServerAuthSnapshot) and admin route guard
  assert.match(componentSource, /useSyncExternalStore/);
  assert.match(componentSource, /const isVisible = !isAdminRoutePath\(pathname\) && Boolean\(activeToken\)/);
  assert.match(componentSource, /if \(!isVisible\)/);

  // Reuses DropdownFilter with variant="light", isSearchable, allowCustomOption
  assert.match(componentSource, /<DropdownFilter[\s\S]*?variant="light"[\s\S]*?isSearchable=\{true\}[\s\S]*?allowCustomOption=\{true\}/);

  // Exact retry error message and live character counter
  assert.match(componentSource, /Something went wrong, please raise the ticket again\./);
  assert.match(componentSource, /\{description\.length\} \/ \{SUPPORT_DESCRIPTION_MAX_LENGTH\}/);
});
