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
      jsx: ts.JsxEmit.React,
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

test("AdminSupportList helper functions correctly format date, time, relative ago and filter tickets", () => {
  const listModule = loadModule("../components/admin/support/AdminSupportList.tsx", {
    require(id) {
      if (id === "@/components/ui/ChamferCardBorder") {
        return () => null;
      }
      if (id === "@/lib/adminSupportApi") {
        return {
          ADMIN_SUPPORT_UPDATED_EVENT: "admin-support-updated",
          getAdminSupportTickets: async () => ({ items: [], counts: { all: 0, open: 0, replied: 0 } }),
        };
      }
      if (id === "@/components/admin/applications/ExpertApplications.module.css") {
        return {};
      }
      if (id === "./AdminSupportList.module.css") {
        return {};
      }
      if (id === "next/link" || id === "next/navigation" || id === "lucide-react") {
        return {};
      }
      return {};
    },
  });

  const {
    formatSubmittedDate,
    formatSubmittedTime,
    formatSubmittedAgo,
    filterSupportTickets,
  } = listModule;

  const iso = "2026-11-20T10:30:00.000Z";
  assert.ok(formatSubmittedDate(iso).includes("2026"));
  assert.ok(formatSubmittedTime(iso).length > 0);
  assert.ok(formatSubmittedAgo(iso).includes("ago"));
  assert.equal(formatSubmittedDate(null), "—");
  assert.equal(formatSubmittedTime(null), "—");
  assert.equal(formatSubmittedAgo(null), "—");

  const sampleTickets = [
    {
      id: "t-1",
      ticketNumber: "SUP-1001",
      requesterType: "seeker",
      requesterName: "Priya Sharma",
      subject: "Billing Issue",
      status: "open",
      createdAt: iso,
    },
    {
      id: "t-2",
      ticketNumber: "SUP-1002",
      requesterType: "expert",
      requesterName: "Dr. Expert",
      subject: "Account Access",
      status: "replied",
      createdAt: iso,
    },
  ];

  // Filter by requesterName
  const byName = filterSupportTickets(sampleTickets, {
    requesterName: "Priya Sharma",
    role: "all",
    subject: "all",
    status: "all",
    submittedDate: "all",
  });
  assert.equal(byName.length, 1);
  assert.equal(byName[0].ticketNumber, "SUP-1001");

  // Filter by role
  const byRole = filterSupportTickets(sampleTickets, {
    requesterName: "all",
    role: "expert",
    subject: "all",
    status: "all",
    submittedDate: "all",
  });
  assert.equal(byRole.length, 1);
  assert.equal(byRole[0].ticketNumber, "SUP-1002");

  // Filter by subject
  const bySubject = filterSupportTickets(sampleTickets, {
    requesterName: "all",
    role: "all",
    subject: "Billing Issue",
    status: "all",
    submittedDate: "all",
  });
  assert.equal(bySubject.length, 1);
  assert.equal(bySubject[0].ticketNumber, "SUP-1001");

  // Filter by status
  const byStatus = filterSupportTickets(sampleTickets, {
    requesterName: "all",
    role: "all",
    subject: "all",
    status: "replied",
    submittedDate: "all",
  });
  assert.equal(byStatus.length, 1);
  assert.equal(byStatus[0].ticketNumber, "SUP-1002");

  // Default 'all' preserves all
  const allFiltered = filterSupportTickets(sampleTickets, {
    requesterName: "all",
    role: "all",
    subject: "all",
    status: "all",
    submittedDate: "all",
  });
  assert.equal(allFiltered.length, 2);
});

test("AdminSupportList KPI cards use baseStyles.kpiRow with label 'Total' to match ExpertApplications 1:1", () => {
  const listSource = fs.readFileSync(
    new URL("../components/admin/support/AdminSupportList.tsx", import.meta.url),
    "utf8",
  );

  // Must use baseStyles.kpiRow directly without kpiRowThree
  assert.ok(
    listSource.includes("className={baseStyles.kpiRow}"),
    "KPI row must use baseStyles.kpiRow directly without overriding grid columns",
  );
  assert.ok(
    !listSource.includes("customStyles.kpiRowThree"),
    "customStyles.kpiRowThree must not be present in AdminSupportList.tsx",
  );

  // Label must be "Total" (not "Total Tickets")
  assert.ok(
    listSource.includes("<span className={baseStyles.kpiLabel}>Total</span>"),
    "Card label must be 'Total' (matching ExpertApplications)",
  );
});

test("AdminSupportDetailPage exports generateStaticParams and metadata matching [ticketId]", async () => {
  const pageSource = fs.readFileSync(
    new URL("../app/admin/(app)/support/[ticketId]/page.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(pageSource.includes("generateStaticParams"), "Page must export generateStaticParams");
  assert.ok(
    pageSource.includes("getAdminSupportTicketStaticParams"),
    "Page must call getAdminSupportTicketStaticParams() for static export",
  );
  assert.ok(pageSource.includes("generateMetadata"), "Page must export generateMetadata");

  const pageModule = loadModule("../app/admin/(app)/support/[ticketId]/page.tsx", {
    require(id) {
      if (id === "@/components/admin/support/AdminSupportDetail") {
        return () => null;
      }
      if (id === "@/lib/adminStaticParams") {
        return {
          getAdminSupportTicketStaticParams: () => [{ ticketId: "SUP-1000" }, { ticketId: "SUP-1001" }],
        };
      }
      return {};
    },
  });

  const staticParams = pageModule.generateStaticParams();
  assert.deepEqual(staticParams, [{ ticketId: "SUP-1000" }, { ticketId: "SUP-1001" }]);

  const metadata = await pageModule.generateMetadata({
    params: Promise.resolve({ ticketId: "SUP-1005" }),
  });
  assert.equal(metadata.title, "SUP-1005 — Support — Jatayu Admin");
});

test("AdminSupportDetail component implements required error handling, limits, and sender check", () => {
  const detailSource = fs.readFileSync(
    new URL("../components/admin/support/AdminSupportDetail.tsx", import.meta.url),
    "utf8",
  );

  // 1. Max character limit 5000
  assert.ok(detailSource.includes("MAX_REPLY_CHARS = 5000"), "Must enforce 5000 char limit");
  assert.ok(detailSource.includes("maxLength={MAX_REPLY_CHARS}"), "Textarea must have maxLength=5000");

  // 2. Unconfigured sender warning & button disable
  assert.ok(
    detailSource.includes("Support sender address not configured."),
    "Must warn if supportFromEmail is not configured",
  );
  assert.ok(
    detailSource.includes("!supportFromEmail"),
    "Send button must be disabled when supportFromEmail is null or empty",
  );

  // 3. Error mappings
  assert.ok(
    detailSource.includes("Email could not be sent, the ticket is still Open, please try again."),
    "Must handle 502 with clear retry message and preserve draft",
  );
  assert.ok(
    detailSource.includes("SUPPORT_TICKET_ALREADY_REPLIED"),
    "Must handle 409 already replied and reload ticket",
  );
  assert.ok(
    detailSource.includes("SUPPORT_SENDER_NOT_CONFIGURED"),
    "Must handle 422 sender unconfigured",
  );

  // 4. Replied state lock note
  assert.ok(
    detailSource.includes("This ticket has been replied to."),
    "Must show read-only note when ticket is replied",
  );

  // 5. Breadcrumb & back button to /admin/support
  assert.ok(
    detailSource.includes('href="/admin/support"'),
    "Must provide link back to /admin/support",
  );
});


