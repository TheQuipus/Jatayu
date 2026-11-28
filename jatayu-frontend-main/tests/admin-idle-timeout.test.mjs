import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

function loadTsModule(relativePath, mocks = {}) {
  const source = fs.readFileSync(new URL(relativePath, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    require(id) {
      if (id in mocks) return mocks[id];
      throw new Error(`Unexpected require: ${id}`);
    },
    URLSearchParams,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    ...mocks.__globals,
  });
  return loaded.exports;
}

test("adminSettings includes Security section, 5min default, 1min testing, and Disabled option", () => {
  const adminSettings = loadTsModule("../lib/adminSettings.ts");
  assert.equal(adminSettings.DEFAULT_ADMIN_IDLE_TIMEOUT_MINUTES, undefined);
  assert.equal(adminSettings.DEFAULT_ADMIN_SETTINGS.security.adminIdleTimeoutMinutes, 5);
  assert.equal(adminSettings.DEFAULT_ADMIN_SETTINGS.security.adminIdleWarningSeconds, 60);
  assert.equal(adminSettings.parseSettingsSection("security"), "security");
  assert.ok(adminSettings.SETTINGS_SECTIONS.some((s) => s.id === "security" && s.label === "Security"));

  const optionValues = [...adminSettings.ADMIN_IDLE_TIMEOUT_OPTIONS].map((o) => o.value);
  assert.deepEqual(optionValues, [1, 5, 10, 15, 30, 60, 0]);
  assert.equal(
    adminSettings.ADMIN_IDLE_TIMEOUT_OPTIONS.find((o) => o.value === 0)?.label,
    "Disabled",
  );
});

test("adminSettingsSync preserves Disabled (0) and 1min testing timeout across round-trip", () => {
  const adminSettings = loadTsModule("../lib/adminSettings.ts");
  const sync = loadTsModule("../lib/adminSettingsSync.ts", {
    "@/lib/api": {},
    "@/lib/adminSettings": adminSettings,
  });

  const mappedDisabled = sync.mapBackendSettingsToAdmin({
    ADMIN_IDLE_TIMEOUT_MINUTES: "0",
    ADMIN_IDLE_WARNING_SECONDS: "30",
  });
  assert.equal(mappedDisabled.security.adminIdleTimeoutMinutes, 0);
  assert.equal(mappedDisabled.security.adminIdleWarningSeconds, 30);

  const mappedOneMin = sync.mapBackendSettingsToAdmin({
    ADMIN_IDLE_TIMEOUT_MINUTES: "1",
    ADMIN_IDLE_WARNING_SECONDS: "60",
  });
  assert.equal(mappedOneMin.security.adminIdleTimeoutMinutes, 1);

  const backendPayload = sync.mapAdminSettingsToBackend(mappedDisabled);
  assert.equal(backendPayload.ADMIN_IDLE_TIMEOUT_MINUTES, "0");
  assert.equal(backendPayload.ADMIN_IDLE_WARNING_SECONDS, "30");
});

test("adminIdleSession sanitizes ?next= paths and enforces single-flight idle logout", () => {
  const store = new Map();
  const redirects = [];
  let socketDisconnected = false;

  const mockWindow = {
    location: {
      pathname: "/admin/applications",
      search: "?filter=overdue",
      replace(url) {
        redirects.push(url);
      },
    },
    dispatchEvent() {},
  };

  const mockStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };

  const idleSession = loadTsModule("../lib/adminIdleSession.ts", {
    "@/lib/socket": {
      disconnectSocket: () => {
        socketDisconnected = true;
      },
    },
    __globals: {
      window: mockWindow,
      localStorage: mockStorage,
      sessionStorage: mockStorage,
    },
  });

  assert.equal(idleSession.sanitizeAdminNextPath("/admin/applications?filter=overdue"), "/admin/applications?filter=overdue");
  assert.equal(idleSession.sanitizeAdminNextPath("//evil.com/admin"), null);
  assert.equal(idleSession.sanitizeAdminNextPath("/seeker/dashboard"), null);
  assert.equal(idleSession.sanitizeAdminNextPath("/admin"), null);
  assert.equal(idleSession.getEffectiveAdminWarningSeconds(1, 60), 20);
  assert.equal(idleSession.getEffectiveAdminWarningSeconds(5, 60), 60);

  store.set("jatayu_admin_token", "tok-123");
  idleSession.handleAdminApiUnauthorized(401, "ADMIN_SESSION_IDLE_TIMEOUT");
  idleSession.handleAdminApiUnauthorized(401, "ADMIN_SESSION_IDLE_TIMEOUT");

  assert.equal(socketDisconnected, true);
  assert.equal(store.has("jatayu_admin_token"), false);
  assert.equal(redirects.length, 1);
  assert.equal(
    redirects[0],
    "/admin?reason=idle_timeout&next=%2Fadmin%2Fapplications%3Ffilter%3Doverdue",
  );
});
