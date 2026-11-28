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
      if (id === "@/lib/adminIdleSession") {
        return { handleAdminApiUnauthorized: () => {} };
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
      counts: {
        all: 7,
        new: 2,
        in_progress: 3,
        response_received: 1,
        closed: 1,
        needsAttention: 3,
      },
      pagination: { page: 2, limit: 10, total: 7, totalPages: 1 },
    },
  };
  const listRes = await api.getAdminSupportTickets({
    page: 2,
    limit: 10,
    status: "new",
    requesterType: "seeker",
    search: "  SUP-1001 ",
  });
  assert.equal(listRes.counts.needsAttention, 3);
  assert.equal(
    fetchCalls.at(-1).url,
    "http://localhost:5000/api/admin/support/tickets?page=2&limit=10&status=new&requesterType=seeker&search=SUP-1001",
  );
  assert.equal(fetchCalls.at(-1).init.headers.Authorization, "Bearer admin-jwt-token");

  // 2. getAdminSupportNeedsAttentionCount
  const needsAttentionCount = await api.getAdminSupportNeedsAttentionCount();
  assert.equal(needsAttentionCount, 3);
  assert.equal(
    fetchCalls.at(-1).url,
    "http://localhost:5000/api/admin/support/tickets?page=1&limit=1",
  );

  // 3. getAdminSupportTicket
  nextResponse = {
    ok: true,
    status: 200,
    body: {
      ticket: {
        id: "t-1",
        ticketNumber: "SUP-1000",
        status: "open",
        lastReplyBy: null,
        viewerStatus: { key: "new", label: "New" },
      },
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
      ticket: {
        id: "t-1",
        ticketNumber: "SUP-1000",
        status: "open",
        lastReplyBy: "admin",
        viewerStatus: { key: "in_progress", label: "In Progress" },
      },
      supportFromEmail: "support@thequipus.com",
    },
  };
  const replyRes = await api.replyToAdminSupportTicket("t-1", "Issue has been resolved.");
  assert.equal(replyRes.ticket.lastReplyBy, "admin");
  assert.deepEqual(dispatchedEvents, [api.ADMIN_SUPPORT_UPDATED_EVENT]);

  // 5. closeAdminSupportTicket and reopenAdminSupportTicket dispatch ADMIN_SUPPORT_UPDATED_EVENT
  nextResponse = {
    ok: true,
    status: 200,
    body: {
      message: "Support ticket marked as closed",
      ticket: { id: "t-1", status: "closed", viewerStatus: { key: "closed", label: "Closed" } },
    },
  };
  const closeRes = await api.closeAdminSupportTicket("t-1");
  assert.equal(closeRes.ticket.status, "closed");
  assert.equal(
    fetchCalls.at(-1).url,
    "http://localhost:5000/api/admin/support/tickets/t-1/close",
  );
  assert.equal(dispatchedEvents.length, 2);

  nextResponse = {
    ok: true,
    status: 200,
    body: {
      message: "Support ticket reopened",
      ticket: { id: "t-1", status: "open", lastReplyBy: null, viewerStatus: { key: "new", label: "New" } },
    },
  };
  const reopenRes = await api.reopenAdminSupportTicket("t-1");
  assert.equal(reopenRes.ticket.status, "open");
  assert.equal(
    fetchCalls.at(-1).url,
    "http://localhost:5000/api/admin/support/tickets/t-1/reopen",
  );
  assert.equal(dispatchedEvents.length, 3);

  // 6. replyToAdminSupportTicket failure throws with status & code and does NOT dispatch event
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
  assert.equal(dispatchedEvents.length, 3);
});

test("AdminShell places Support directly below User Management and above Settings with red needsAttention badge and focus/event refresh", () => {
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
      shellSource.includes("getAdminSupportNeedsAttentionCount()") &&
      shellSource.includes('window.addEventListener("focus"'),
    "AdminShell must load needsAttention count and refresh on ADMIN_SUPPORT_UPDATED_EVENT and window focus",
  );
  assert.ok(
    shellSource.includes("badge: openSupportCount") &&
      shellSource.includes('badgeVariant: "red"'),
    "AdminShell must show a red badge with openSupportCount when > 0",
  );
});

test("supportStatus helper covers all four viewer status keys, labels, and badge tones", () => {
  const statusHelper = loadModule("../lib/supportStatus.ts");

  assert.deepEqual({ ...statusHelper.getSupportStatusMeta("new") }, {
    key: "new",
    label: "New",
    badgeTone: "red",
  });
  assert.deepEqual({ ...statusHelper.getSupportStatusMeta("in_progress") }, {
    key: "in_progress",
    label: "In Progress",
    badgeTone: "neutral",
  });
  assert.deepEqual({ ...statusHelper.getSupportStatusMeta("response_received") }, {
    key: "response_received",
    label: "Response Received",
    badgeTone: "amber",
  });
  assert.deepEqual({ ...statusHelper.getSupportStatusMeta("closed") }, {
    key: "closed",
    label: "Closed",
    badgeTone: "muted",
  });

  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "open", lastReplyBy: null }, "admin").key, "new");
  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "open", lastReplyBy: "admin" }, "admin").key, "in_progress");
  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "open", lastReplyBy: "requester" }, "admin").key, "response_received");
  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "closed", lastReplyBy: "admin" }, "admin").key, "closed");
});

test("AdminSupportList helper functions correctly format date, time, relative ago and filter tickets", () => {
  const statusHelper = loadModule("../lib/supportStatus.ts");
  const listModule = loadModule("../components/admin/support/AdminSupportList.tsx", {
    require(id) {
      if (id === "@/components/ui/ChamferCardBorder") {
        return () => null;
      }
      if (id === "@/lib/adminSupportApi") {
        return {
          ADMIN_SUPPORT_UPDATED_EVENT: "admin-support-updated",
          getAdminSupportTickets: async () => ({
            items: [],
            counts: { all: 0, new: 0, in_progress: 0, response_received: 0, closed: 0, needsAttention: 0 },
          }),
        };
      }
      if (id === "@/lib/supportStatus") {
        return statusHelper;
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
      lastReplyBy: null,
      viewerStatus: { key: "new", label: "New" },
      createdAt: iso,
    },
    {
      id: "t-2",
      ticketNumber: "SUP-1002",
      requesterType: "expert",
      requesterName: "Dr. Expert",
      subject: "Account Access",
      status: "open",
      lastReplyBy: "admin",
      viewerStatus: { key: "in_progress", label: "In Progress" },
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

  // Filter by viewerStatus key
  const byStatus = filterSupportTickets(sampleTickets, {
    requesterName: "all",
    role: "all",
    subject: "all",
    status: "in_progress",
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

test("AdminSupportList uses 5 KPI cards with baseStyles.kpiCard and no blue/purple role colors", () => {
  const listSource = fs.readFileSync(
    new URL("../components/admin/support/AdminSupportList.tsx", import.meta.url),
    "utf8",
  );
  const listCssSource = fs.readFileSync(
    new URL("../components/admin/support/AdminSupportList.module.css", import.meta.url),
    "utf8",
  );

  assert.ok(listSource.includes("baseStyles.kpiRow") && listSource.includes("customStyles.kpiRowFive"));
  for (const label of ["Total", "New", "In Progress", "Response Received", "Closed"]) {
    assert.ok(
      listSource.includes(`<span className={baseStyles.kpiLabel}>${label}</span>`),
      `KPI row must include '${label}' card`,
    );
  }
  assert.ok(!listCssSource.includes("#0ea5e9") && !listCssSource.includes("#8b5cf6"), "No blue or purple role chips");
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

test("AdminSupportDetail component implements multi-reply, close/reopen, error mapping, and form visibility rules", () => {
  const detailSource = fs.readFileSync(
    new URL("../components/admin/support/AdminSupportDetail.tsx", import.meta.url),
    "utf8",
  );
  const statusHelper = loadModule("../lib/supportStatus.ts");
  const detailModule = loadModule("../components/admin/support/AdminSupportDetail.tsx", {
    require(id) {
      if (id === "@/components/ui/Spinner") return () => null;
      if (id === "@/lib/adminSupportApi") {
        return {
          ADMIN_SUPPORT_UPDATED_EVENT: "admin-support-updated",
          getAdminSupportTicket: async () => ({}),
          replyToAdminSupportTicket: async () => ({}),
          closeAdminSupportTicket: async () => ({}),
          reopenAdminSupportTicket: async () => ({}),
        };
      }
      if (id === "@/lib/supportStatus") return statusHelper;
      if (id === "./AdminSupportDetail.module.css") return {};
      return {};
    },
  });

  // 1. Max character limit 5000 & no window.confirm / alert
  assert.ok(detailSource.includes("MAX_REPLY_CHARS = 5000"), "Must enforce 5000 char limit");
  assert.ok(detailSource.includes("maxLength={MAX_REPLY_CHARS}"), "Textarea must have maxLength=5000");
  assert.ok(!detailSource.includes("window.confirm") && !detailSource.includes("window.alert"));

  // 2. Form visibility rules (open even after admin replied, hidden only when closed)
  assert.equal(detailModule.isReplyFormVisible({ status: "open" }), true);
  assert.equal(detailModule.isReplyFormVisible({ status: "closed" }), false);

  // 3. Error code -> message mapping
  assert.deepEqual({ ...detailModule.getReplyErrorMessage({ status: 502 }) }, {
    message: "Email could not be sent, please try again",
    shouldReload: false,
  });
  assert.deepEqual(
    { ...detailModule.getReplyErrorMessage({ status: 422, code: "SUPPORT_SENDER_NOT_CONFIGURED" }) },
    {
      message: "Support sender address not configured. Please configure Sender Email or SMTP Username in Admin Settings.",
      shouldReload: false,
    },
  );
  assert.deepEqual(
    { ...detailModule.getReplyErrorMessage({ status: 409, code: "SUPPORT_TICKET_CLOSED" }) },
    {
      message: "This ticket is closed. Reopen it to reply.",
      shouldReload: true,
    },
  );
  assert.deepEqual(
    { ...detailModule.getCloseReopenErrorMessage({ status: 409, code: "SUPPORT_TICKET_ALREADY_CLOSED" }, "close") },
    {
      message: "This ticket is already closed.",
      shouldReload: true,
    },
  );
  assert.deepEqual(
    { ...detailModule.getCloseReopenErrorMessage({ status: 409, code: "SUPPORT_TICKET_NOT_CLOSED" }, "reopen") },
    {
      message: "This ticket is not closed.",
      shouldReload: true,
    },
  );

  // 4. Closed note & back button
  assert.ok(detailSource.includes("This ticket is closed. Reopen it to reply."));
  assert.ok(detailSource.includes('href="/admin/support"'));
});


