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

function loadModule(relativePath, extraContext = {}) {
  const { outputText } = transpileCommonJs(relativePath);
  const loaded = { exports: {} };
  vm.runInNewContext(outputText, {
    module: loaded,
    exports: loaded.exports,
    URLSearchParams,
    CustomEvent: class CustomEvent {
      constructor(type) {
        this.type = type;
      }
    },
    ...extraContext,
  });
  return loaded.exports;
}

test("adminDashboard exports ADMIN_SUPPORT_HREF and ADMIN_SUPPORT_PATH_PREFIXES", () => {
  const dashboard = loadModule("../lib/adminDashboard.ts");
  assert.equal(dashboard.ADMIN_SUPPORT_HREF, "/admin/support");
  assert.deepEqual([...dashboard.ADMIN_SUPPORT_PATH_PREFIXES], ["/admin/support"]);
});

test("adminStaticParams exports getAdminSupportTicketStaticParams for SUP-1000..SUP-1099", () => {
  const staticParams = loadModule("../lib/adminStaticParams.ts", {
    require() {
      return {
        DEMO_APPLICATION_APP_IDS: [],
        ADMIN_REVIEW_APPLICATIONS: [],
        MOCK_EXPERTS: [],
        MOCK_SEEKERS: [],
      };
    },
  });
  const params = staticParams.getAdminSupportTicketStaticParams();
  assert.equal(params.length, 100);
  assert.equal(params[0].ticketId, "SUP-1000");
  assert.equal(params[99].ticketId, "SUP-1099");
});

test("adminSupportApi calls admin support endpoints with Bearer token and dispatches ADMIN_SUPPORT_UPDATED_EVENT on reply", async () => {
  const fetchCalls = [];
  const dispatchedEvents = [];
  let nextResponse = {
    ok: true,
    status: 200,
    body: {},
  };

  const api = loadModule("../lib/adminSupportApi.ts", {
    window: {
      dispatchEvent(evt) {
        dispatchedEvents.push(evt.type);
      },
    },
    require(id) {
      if (id === "@/lib/api") {
        return { getAdminToken: () => "admin-jwt-token" };
      }
      if (id === "@/lib/publicApiBase") {
        return { publicApiBase: () => "http://localhost:5000" };
      }
      throw new Error(`Unexpected import: ${id}`);
    },
    fetch: async (url, init) => {
      fetchCalls.push({ url, init });
      return {
        ok: nextResponse.ok,
        status: nextResponse.status,
        json: async () => nextResponse.body,
      };
    },
  });

  // 1. getAdminSupportTickets with filters
  nextResponse = {
    ok: true,
    status: 200,
    body: {
      items: [],
      counts: { all: 7, open: 3, replied: 4 },
      pagination: { page: 2, limit: 10, total: 7, totalPages: 1 },
    },
  };
  const listRes = await api.getAdminSupportTickets({
    page: 2,
    limit: 10,
    status: "open",
    requesterType: "seeker",
    search: "  SUP-1001 ",
  });
  assert.equal(listRes.counts.open, 3);
  assert.equal(
    fetchCalls.at(-1).url,
    "http://localhost:5000/api/admin/support/tickets?page=2&limit=10&status=open&requesterType=seeker&search=SUP-1001",
  );
  assert.equal(fetchCalls.at(-1).init.headers.Authorization, "Bearer admin-jwt-token");

  // 2. getAdminSupportOpenCount
  const openCount = await api.getAdminSupportOpenCount();
  assert.equal(openCount, 3);
  assert.equal(
    fetchCalls.at(-1).url,
    "http://localhost:5000/api/admin/support/tickets?page=1&limit=1",
  );

  // 3. getAdminSupportTicket
  nextResponse = {
    ok: true,
    status: 200,
    body: {
      ticket: { id: "t-1", ticketNumber: "SUP-1000", status: "open" },
      supportFromEmail: "support@thequipus.com",
    },
  };
  const detailRes = await api.getAdminSupportTicket("SUP-1000");
  assert.equal(detailRes.supportFromEmail, "support@thequipus.com");
  assert.equal(
    fetchCalls.at(-1).url,
    "http://localhost:5000/api/admin/support/tickets/SUP-1000",
  );

  // 4. replyToAdminSupportTicket success dispatches ADMIN_SUPPORT_UPDATED_EVENT
  nextResponse = {
    ok: true,
    status: 201,
    body: {
      message: "Reply sent successfully",
      reply: { id: "r-1", fromEmail: "support@thequipus.com" },
      ticket: { id: "t-1", ticketNumber: "SUP-1000", status: "replied" },
      supportFromEmail: "support@thequipus.com",
    },
  };
  const replyRes = await api.replyToAdminSupportTicket("t-1", "Issue has been resolved.");
  assert.equal(replyRes.ticket.status, "replied");
  assert.deepEqual(dispatchedEvents, [api.ADMIN_SUPPORT_UPDATED_EVENT]);

  // 5. replyToAdminSupportTicket failure throws with status & code and does NOT dispatch event
  nextResponse = {
    ok: false,
    status: 502,
    body: {
      message: "Failed to send reply email. Please try again.",
      code: "SUPPORT_REPLY_DELIVERY_FAILED",
    },
  };
  await assert.rejects(
    () => api.replyToAdminSupportTicket("t-1", "Will fail"),
    (err) => {
      assert.equal(err.message, "Failed to send reply email. Please try again.");
      assert.equal(err.status, 502);
      assert.equal(err.code, "SUPPORT_REPLY_DELIVERY_FAILED");
      return true;
    },
  );
  assert.equal(dispatchedEvents.length, 1);
});

test("AdminShell places Support directly below User Management and above Settings with red open-ticket badge and event refresh", () => {
  const shellSource = fs.readFileSync(
    new URL("../components/admin/AdminShell.tsx", import.meta.url),
    "utf8",
  );

  const userMgmtIdx = shellSource.indexOf("<UserManagementNavGroup");
  const supportIdx = shellSource.indexOf("<NavLink item={supportNavItem}");
  const settingsIdx = shellSource.indexOf("<SettingsNavGroup");

  assert.ok(userMgmtIdx > -1, "AdminShell must render UserManagementNavGroup");
  assert.ok(supportIdx > userMgmtIdx, "Support NavLink must appear directly below UserManagementNavGroup");
  assert.ok(settingsIdx > supportIdx, "Support NavLink must appear above SettingsNavGroup");

  assert.ok(
    shellSource.includes('if (itemId === "support")') &&
      shellSource.includes("ADMIN_SUPPORT_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))"),
    "isNavActive must highlight Support on /admin/support and /admin/support/[ticketId]",
  );
  assert.ok(
    shellSource.includes("ADMIN_SUPPORT_UPDATED_EVENT") &&
      shellSource.includes("getAdminSupportOpenCount()"),
    "AdminShell must load open ticket count and refresh when ADMIN_SUPPORT_UPDATED_EVENT fires",
  );
  assert.ok(
    shellSource.includes("badge: openSupportCount") &&
      shellSource.includes('badgeVariant: "red"'),
    "AdminShell must show a red badge with openSupportCount when openSupportCount > 0",
  );
});
