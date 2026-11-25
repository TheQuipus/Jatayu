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
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
    ...extraContext,
  });
  return loaded.exports;
}

test("supportApi exports getMySupportTickets, getMySupportTicket, and openGlobalSupportForm", async () => {
  const fetchCalls = [];
  let nextResponse = {
    ok: true,
    status: 200,
    body: {},
  };

  const dispatchedEvents = [];

  const api = loadModule("../lib/supportApi.ts", {
    window: {
      dispatchEvent(evt) {
        dispatchedEvents.push(evt.type);
      },
      location: { pathname: "/seeker/support" },
    },
    require(id) {
      if (id === "@/lib/api") {
        return {
          getSeekerToken: () => "seeker-jwt-token",
          getExpertToken: () => null,
          getToken: () => "seeker-jwt-token",
        };
      }
      if (id === "@/lib/emailValidation") {
        return { getEmailValidationError: () => null };
      }
      if (id === "@/lib/publicApiBase") {
        return { publicApiBase: () => "http://localhost:5000" };
      }
      return {};
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

  // 1. openGlobalSupportForm triggers OPEN_SUPPORT_FORM_EVENT
  api.openGlobalSupportForm();
  assert.equal(dispatchedEvents.includes(api.OPEN_SUPPORT_FORM_EVENT), true);

  // 2. getMySupportTickets fetches with pagination and status
  nextResponse = {
    ok: true,
    status: 200,
    body: {
      items: [
        {
          id: "st-1",
          ticketNumber: "SUP-1001",
          subject: "Issue 1",
          description: "Desc",
          status: "open",
          lastReplyBy: null,
          viewerStatus: { key: "in_progress", label: "In Progress" },
          statusLabel: "In Progress",
          createdAt: "2026-11-20T10:00:00.000Z",
          lastRepliedAt: null,
          closedAt: null,
          replyCount: 0,
        },
      ],
      counts: { all: 3, in_progress: 1, response_received: 1, closed: 1 },
      pagination: { page: 1, limit: 10, total: 3, totalPages: 1 },
    },
  };

  const listRes = await api.getMySupportTickets(
    { page: 1, limit: 10, status: "in_progress" },
    "/seeker/support",
  );
  assert.equal(listRes.items.length, 1);
  assert.equal(listRes.counts.in_progress, 1);
  assert.equal(listRes.counts.response_received, 1);
  assert.equal(listRes.counts.closed, 1);
  assert.ok(fetchCalls.at(-1).url.includes("/api/support/tickets?page=1&limit=10&status=in_progress"));
  assert.equal(fetchCalls.at(-1).init.headers.Authorization, "Bearer seeker-jwt-token");

  // 3. getMySupportTicket fetches single ticket
  nextResponse = {
    ok: true,
    status: 200,
    body: {
      ticket: {
        id: "st-1",
        ticketNumber: "SUP-1001",
        subject: "Issue 1",
        description: "Desc",
        status: "open",
        lastReplyBy: "admin",
        viewerStatus: { key: "response_received", label: "Response Received" },
        statusLabel: "Response Received",
        createdAt: "2026-11-20T10:00:00.000Z",
        lastRepliedAt: "2026-11-21T10:00:00.000Z",
        closedAt: null,
        replies: [
          {
            id: "rep-1",
            authorType: "admin",
            authorName: "Jatayu Support",
            adminName: "Jatayu Support",
            message: "Fixed",
            createdAt: "2026-11-21T10:00:00.000Z",
          },
        ],
      },
    },
  };

  const detailRes = await api.getMySupportTicket("SUP-1001", "/seeker/support");
  assert.equal(detailRes.ticket.ticketNumber, "SUP-1001");
  assert.equal(detailRes.ticket.replies.length, 1);
  assert.ok(fetchCalls.at(-1).url.includes("/api/support/tickets/SUP-1001"));

  // 4. createMySupportReply posts reply and dispatches MY_SUPPORT_TICKETS_UPDATED_EVENT
  nextResponse = {
    ok: true,
    status: 201,
    body: {
      message: "Reply sent successfully",
      reply: { id: "rep-2", authorType: "seeker", authorName: "Priya", message: "Thanks!", createdAt: "2026-11-22T10:00:00.000Z" },
      ticket: {
        id: "st-1",
        ticketNumber: "SUP-1001",
        status: "open",
        lastReplyBy: "requester",
        viewerStatus: { key: "in_progress", label: "In Progress" },
        replies: [],
      },
    },
  };
  const replyRes = await api.createMySupportReply("st-1", "Thanks!", "/seeker/support");
  assert.equal(replyRes.ticket.lastReplyBy, "requester");
  assert.ok(fetchCalls.at(-1).url.includes("/api/support/tickets/st-1/replies"));
  assert.equal(dispatchedEvents.includes(api.MY_SUPPORT_TICKETS_UPDATED_EVENT), true);
});

test("Seeker sidebar links Support to /seeker/support and activates on /seeker/support", () => {
  const seekerDashboardSource = fs.readFileSync(
    new URL("../lib/seekerDashboard.ts", import.meta.url),
    "utf8",
  );

  assert.ok(
    seekerDashboardSource.includes('{ id: "support", label: "Support", href: "/seeker/support" }'),
    "QUICK_LINKS must link support to /seeker/support",
  );

  const seekerShellSource = fs.readFileSync(
    new URL("../components/seeker/SeekerShell.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(
    seekerShellSource.includes('if (id === "support") return normPathname.startsWith("/seeker/support/");'),
    "SeekerShell must activate 'support' nav item on /seeker/support/",
  );
});

test("Expert sidebar places Support below Notifications and allows unapproved experts", () => {
  const expertDashboardSource = fs.readFileSync(
    new URL("../lib/expertDashboard.ts", import.meta.url),
    "utf8",
  );

  const notifIdx = expertDashboardSource.indexOf('{ id: "notifications", label: "Notifications"');
  const supportIdx = expertDashboardSource.indexOf('{ id: "support", label: "Support", href: "/expert/support/" }');

  assert.ok(notifIdx > -1, "MAIN_NAV must contain notifications");
  assert.ok(supportIdx > -1, "MAIN_NAV must contain support");
  assert.ok(supportIdx > notifIdx, "Support must be directly below Notifications in MAIN_NAV");

  assert.ok(
    expertDashboardSource.includes('export const UNAPPROVED_ALLOWED_NAV_IDS = new Set(["dashboard", "profile", "support"]);'),
    "UNAPPROVED_ALLOWED_NAV_IDS must include 'support' so unapproved experts can access help",
  );

  const expertShellSource = fs.readFileSync(
    new URL("../components/expert/ExpertShell.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(
    expertShellSource.includes("support: Headphones"),
    "ExpertShell must map 'support' to Headphones icon",
  );
  assert.ok(
    expertShellSource.includes('if (id === "support") return pathname.startsWith("/expert/support/");'),
    "ExpertShell must activate 'support' on /expert/support/",
  );
});

test("Seeker and Expert support pages render MySupportTickets inside Suspense", () => {
  const seekerPageSource = fs.readFileSync(
    new URL("../app/seeker/(app)/support/page.tsx", import.meta.url),
    "utf8",
  );
  const expertPageSource = fs.readFileSync(
    new URL("../app/expert/(app)/support/page.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(
    seekerPageSource.includes("<MySupportTickets") && seekerPageSource.includes("<Suspense"),
    "Seeker support page must render MySupportTickets in Suspense",
  );
  assert.ok(
    expertPageSource.includes("<MySupportTickets") && expertPageSource.includes("<Suspense"),
    "Expert support page must render MySupportTickets in Suspense",
  );
});

test("TopNavbar suppresses landing/mobile header on /seeker/support and /expert/support", () => {
  const topNavbarSource = fs.readFileSync(
    new URL("../components/ui/TopNavbar.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(
    topNavbarSource.includes('pathname?.startsWith("/seeker/support")'),
    "TopNavbar must recognize /seeker/support as a seeker app path",
  );
  assert.ok(
    topNavbarSource.includes('"/expert/support"'),
    "TopNavbar must recognize /expert/support as an expert portal path",
  );
});

test("MySupportTickets wraps in centered container and dashboard section", () => {
  const componentSource = fs.readFileSync(
    new URL("../components/support/MySupportTickets.tsx", import.meta.url),
    "utf8",
  );
  const cssSource = fs.readFileSync(
    new URL("../components/support/MySupportTickets.module.css", import.meta.url),
    "utf8",
  );

  assert.ok(
    componentSource.includes("styles.dashboard") && componentSource.includes("container"),
    "MySupportTickets must wrap inside .dashboard and .container",
  );
  assert.ok(
    cssSource.includes(".ticketCard") && cssSource.includes("background-color: #ffffff !important"),
    "Ticket card must have solid opaque white background",
  );
});

test("ExpertShell and SeekerShell handle collapsed state with clean header, avatar fallback, and persistence", () => {
  const expertShellSource = fs.readFileSync(
    new URL("../components/expert/ExpertShell.tsx", import.meta.url),
    "utf8",
  );
  const expertCssSource = fs.readFileSync(
    new URL("../components/expert/ExpertShell.module.css", import.meta.url),
    "utf8",
  );
  const seekerShellSource = fs.readFileSync(
    new URL("../components/seeker/SeekerShell.tsx", import.meta.url),
    "utf8",
  );
  const seekerCssSource = fs.readFileSync(
    new URL("../components/seeker/SeekerShell.module.css", import.meta.url),
    "utf8",
  );

  // Persistence
  assert.ok(
    expertShellSource.includes("expert_sidebar_collapsed"),
    "ExpertShell must persist collapsed state in localStorage",
  );
  assert.ok(
    seekerShellSource.includes("seeker_sidebar_collapsed"),
    "SeekerShell must persist collapsed state in localStorage",
  );

  // Clean collapsed header
  assert.ok(
    expertCssSource.includes(".brandRowCollapsed") && expertCssSource.includes(".brandCollapsed"),
    "ExpertShell must define brandRowCollapsed and brandCollapsed to prevent toggle squeeze",
  );
  assert.ok(
    seekerCssSource.includes(".brandContainerCollapsed") && seekerCssSource.includes(".brandCollapsed"),
    "SeekerShell must define brandContainerCollapsed and brandCollapsed",
  );

  // Avatar initials fallback (no black silhouette)
  assert.ok(
    expertShellSource.includes("initials") && expertCssSource.includes(".userAvatarInitials"),
    "ExpertShell must compute initials and render userAvatarInitials fallback",
  );
  assert.ok(
    seekerShellSource.includes("initials") && seekerCssSource.includes(".userAvatarInitials"),
    "SeekerShell must compute initials and render userAvatarInitials fallback",
  );

  // Proper logout click area
  assert.ok(
    expertCssSource.includes(".userMenuBtnCollapsed") && expertCssSource.includes("width: 36px"),
    "ExpertShell must give collapsed logout button 36px click target",
  );
  assert.ok(
    seekerCssSource.includes(".userMenuBtnCollapsed") && seekerCssSource.includes("width: 36px"),
    "SeekerShell must give collapsed logout button 36px click target",
  );
});

test("MySupportTickets implements requester status mapping, chip filters, composer visibility, and reply error mapping", () => {
  const statusHelper = loadModule("../lib/supportStatus.ts");
  const myTicketsSource = fs.readFileSync(
    new URL("../components/support/MySupportTickets.tsx", import.meta.url),
    "utf8",
  );
  const myTicketsModule = loadModule("../components/support/MySupportTickets.tsx", {
    require(id) {
      if (id === "@/components/ui/Spinner") return () => null;
      if (id === "@/lib/supportApi") {
        return {
          MY_SUPPORT_TICKETS_UPDATED_EVENT: "jatayu:support:tickets_updated",
          getMySupportTicket: async () => ({}),
          getMySupportTickets: async () => ({}),
          createMySupportReply: async () => ({}),
          openGlobalSupportForm: () => {},
        };
      }
      if (id === "@/lib/supportStatus") return statusHelper;
      if (id === "./MySupportTickets.module.css") return {};
      return {};
    },
  });

  // 1. Requester status derivation
  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "open", lastReplyBy: null }, "requester").key, "in_progress");
  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "open", lastReplyBy: "requester" }, "requester").key, "in_progress");
  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "open", lastReplyBy: "admin" }, "requester").key, "response_received");
  assert.equal(statusHelper.resolveTicketViewerStatus({ status: "closed", lastReplyBy: "admin" }, "requester").key, "closed");

  // 2. Filter chips present
  for (const chipLabel of ["All", "In Progress", "Response Received", "Closed"]) {
    assert.ok(myTicketsSource.includes(`<span>${chipLabel}</span>`), `Filter chip '${chipLabel}' must be rendered`);
  }

  // 3. Composer visibility rules
  assert.equal(myTicketsModule.isRequesterComposerVisible({ status: "open" }), true);
  assert.equal(myTicketsModule.isRequesterComposerVisible({ status: "closed" }), false);
  assert.ok(
    myTicketsSource
      .replace(/\s+/g, " ")
      .includes(
        "This ticket has been closed by Jatayu Support. If you still need help, please raise a new ticket.",
      ),
  );

  // 4. Error-code to message mapping
  assert.deepEqual({ ...myTicketsModule.getRequesterReplyErrorMessage({ status: 502 }) }, {
    message: "Your reply could not be delivered, please try again",
    shouldReload: false,
  });
  assert.deepEqual({ ...myTicketsModule.getRequesterReplyErrorMessage({ status: 429, code: "SUPPORT_RATE_LIMITED" }) }, {
    message: "You are sending replies too quickly, please wait a minute",
    shouldReload: false,
  });
  assert.deepEqual({ ...myTicketsModule.getRequesterReplyErrorMessage({ status: 422, message: "Reply message is required" }) }, {
    message: "Reply message is required",
    shouldReload: false,
  });
  assert.deepEqual({ ...myTicketsModule.getRequesterReplyErrorMessage({ status: 409, code: "SUPPORT_TICKET_CLOSED" }) }, {
    message: "This ticket has been closed by Jatayu Support.",
    shouldReload: true,
  });
  assert.deepEqual({ ...myTicketsModule.getRequesterReplyErrorMessage(new TypeError("Failed to fetch")) }, {
    message: "Unable to send reply. Please check your connection and try again.",
    shouldReload: false,
  });
});

test("GlobalSupportButton implements compact contact rows, taller description, new success copy, Spinner submitting state, and inverted trigger colors", () => {
  const buttonSource = fs.readFileSync(
    new URL("../components/ui/GlobalSupportButton.tsx", import.meta.url),
    "utf8",
  );
  const buttonCss = fs.readFileSync(
    new URL("../components/ui/GlobalSupportButton.module.css", import.meta.url),
    "utf8",
  );

  // Compact contact rows when account has email/phone, no "From your account" helper
  assert.ok(buttonSource.includes("Email address -"));
  assert.ok(buttonSource.includes("Mobile number -"));
  assert.equal(buttonSource.includes("From your account"), false);
  assert.ok(buttonSource.includes("rows={6}"));
  assert.ok(
    buttonSource.includes(
      "We have received your support request and we will provide a response shortly.",
    ),
  );

  // Submitting state with Spinner and "Submitting" label
  assert.ok(buttonSource.includes("<Spinner") && buttonSource.includes('"Submitting"'));

  // Inverted floating button colors: orange default, white when open
  assert.ok(buttonCss.includes(".trigger {") && buttonCss.includes("background: var(--pomegranate);"));
  assert.ok(buttonCss.includes(".containerOpen .trigger {") && buttonCss.includes("background: var(--white);"));
});

test("SeekerShell, ExpertShell, and notificationApi implement support response badge and admin notification token routing", () => {
  const seekerShell = fs.readFileSync(
    new URL("../components/seeker/SeekerShell.tsx", import.meta.url),
    "utf8",
  );
  const expertShell = fs.readFileSync(
    new URL("../components/expert/ExpertShell.tsx", import.meta.url),
    "utf8",
  );
  const notificationApi = fs.readFileSync(
    new URL("../lib/notificationApi.ts", import.meta.url),
    "utf8",
  );
  const notificationPanel = fs.readFileSync(
    new URL("../components/seeker/NotificationPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.ok(seekerShell.includes("getMySupportSummary"));
  assert.ok(seekerShell.includes("supportResponseCount > 99 ? \"99+\" : supportResponseCount"));
  assert.ok(seekerShell.includes("navBadgeRed"));

  assert.ok(expertShell.includes("getMySupportSummary"));
  assert.ok(expertShell.includes("supportResponseCount > 99 ? \"99+\" : supportResponseCount"));
  assert.ok(expertShell.includes("navBadgeRed"));

  assert.ok(notificationApi.includes('window.location.pathname.startsWith("/admin")'));
  assert.ok(notificationPanel.includes('window.addEventListener("focus", loadNotifications)'));
});
