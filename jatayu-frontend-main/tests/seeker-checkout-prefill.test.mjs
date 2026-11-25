import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

function createStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    clear() {
      map.clear();
    },
  };
}

function loadModule(file, mocks = {}, globals = {}) {
  const source = fs.readFileSync(path.join(import.meta.dirname, "..", file), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  const loaded = { exports: {} };
  const sandbox = vm.createContext({
    module: loaded,
    exports: loaded.exports,
    setTimeout: () => 0,
    console,
    require: (name) => {
      if (name in mocks) return mocks[name];
      throw new Error(`Unexpected dependency: ${name}`);
    },
    ...globals,
  });
  vm.runInContext(outputText, sandbox);
  return loaded.exports;
}

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function findElements(node, predicate, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const child of node) findElements(child, predicate, acc);
    return acc;
  }
  if (predicate(node)) acc.push(node);
  if (node.props && node.props.children) {
    findElements(node.props.children, predicate, acc);
  }
  return acc;
}

function loadSeekerProfileApi(overrides = {}) {
  const localStorage = createStorage();
  const sessionStorage = createStorage();
  const dispatchedEvents = [];

  const mod = loadModule(
    "lib/seekerProfileApi.ts",
    {
      "@/lib/api": {
        getToken: () => overrides.token ?? "test-token",
        getSeekerMe: overrides.getSeekerMe ?? (async () => ({})),
        getSeekerProfile: overrides.getSeekerProfile ?? (async () => ({})),
      },
      "@/lib/seekerDashboard": {
        SEEKER_PROFILE: {
          name: "Priya Sharma",
          avatar: "/assets/img/avatar1.png",
          isPro: true,
          email: "priya.sharma@jatayu.io",
        },
      },
    },
    {
      window: {
        localStorage,
        sessionStorage,
        dispatchEvent: (event) => dispatchedEvents.push(event.type),
      },
      localStorage,
      sessionStorage,
      Event: class Event {
        constructor(type) {
          this.type = type;
        }
      },
    },
  );

  return { mod, localStorage, sessionStorage, dispatchedEvents };
}

test("maps backend seeker onboarding fields and derives Your Question pre-fill values", () => {
  const { mod } = loadSeekerProfileApi();

  const mapped = mod.mapBackendSeekerToProfile({
    id: "seeker-1",
    fullName: "Aarav Gupta",
    email: "aarav@example.com",
    phone: "9876543210",
    category: "career-work",
    topics: [],
    needsText:
      "I want to understand my options clearly and leave with a confident direction.\nI need a concrete action plan that I can start executing this week.\nTransitioning from engineering to PM.",
    selectedNeedChips: ["clarity", "plan"],
  });

  assert.equal(mapped.category, "career-work");
  assert.deepEqual(toPlain(mapped.selectedNeedChips), ["clarity", "plan"]);

  const prefill = mod.deriveSeekerQuestionPrefill(mapped);
  assert.equal(prefill.subject, "Career & Work");
  assert.equal(
    prefill.context,
    "I want to understand my options clearly and leave with a confident direction.\nI need a concrete action plan that I can start executing this week.\nTransitioning from engineering to PM.",
  );
  assert.deepEqual(toPlain(prefill.selectedContextChips), ["clarity", "plan"]);
});

test("uses onboardingMetadata.needsSubject or topics when present for subject pre-fill", () => {
  const { mod } = loadSeekerProfileApi();

  const withAiSubject = mod.mapBackendSeekerToProfile({
    category: "career-work",
    topics: ["Resume Review", "Career Pivot"],
    needsText: "Need help with PM transition.",
    selectedNeedChips: ["Clarity & Direction", "Deep Knowledge"],
    onboardingMetadata: {
      needsSubject: "PM Career Transition Strategy",
    },
  });

  const prefillAi = mod.deriveSeekerQuestionPrefill(withAiSubject);
  assert.equal(prefillAi.subject, "PM Career Transition Strategy");
  assert.deepEqual(toPlain(prefillAi.selectedContextChips), ["clarity", "knowledge"]);

  const withTopics = mod.mapBackendSeekerToProfile({
    category: "career-work",
    topics: ["Resume Review", "Salary Negotiation"],
    needsText: "Need help with interview prep.",
    selectedNeedChips: ["solution"],
  });

  const prefillTopics = mod.deriveSeekerQuestionPrefill(withTopics);
  assert.equal(prefillTopics.subject, "Resume Review, Salary Negotiation");
  assert.deepEqual(toPlain(prefillTopics.selectedContextChips), ["solution"]);
});

test("handles seekers with missing or partial onboarding data without breaking", () => {
  const { mod } = loadSeekerProfileApi();

  assert.deepEqual(toPlain(mod.deriveSeekerQuestionPrefill(null)), {
    subject: "",
    context: "",
    selectedContextChips: [],
  });

  const skippedNeeds = mod.mapBackendSeekerToProfile({
    fullName: "Legacy Seeker",
    category: "legal-compliance",
    needsText: undefined,
    selectedNeedChips: undefined,
  });

  const prefill = mod.deriveSeekerQuestionPrefill(skippedNeeds);
  assert.equal(prefill.subject, "Legal & Compliance");
  assert.equal(prefill.context, "");
  assert.deepEqual(toPlain(prefill.selectedContextChips), []);
});

test("preserves stored onboarding question fields across partial profile updates", () => {
  const { mod } = loadSeekerProfileApi();

  mod.saveStoredSeekerProfile(
    mod.mapBackendSeekerToProfile({
      fullName: "Meera Nair",
      email: "meera@example.com",
      category: "business-entrepreneurship",
      needsText: "Launching a B2B SaaS product and need GTM feedback.",
      selectedNeedChips: ["clarity", "support"],
      onboardingMetadata: { needsSubject: "B2B SaaS GTM Strategy" },
    }),
  );

  // Simulate Checkout step 4 saving phone number only
  mod.saveStoredSeekerProfile({ phone: "9876543210" });

  const stored = mod.getStoredSeekerProfile();
  assert.equal(stored.phone, "9876543210");
  assert.equal(stored.category, "business-entrepreneurship");
  assert.equal(stored.needsSubject, "B2B SaaS GTM Strategy");
  assert.equal(stored.needsText, "Launching a B2B SaaS product and need GTM feedback.");
  assert.deepEqual(toPlain(stored.selectedNeedChips), ["clarity", "support"]);
});

test("StepQuestionContext pre-selects onboarding chips and supports editing and clearing", () => {
  const jsx = (type, props, key) => ({ type, props: { ...props, key } });
  const outcomeOptions = loadModule("components/seeker/onboarding/seekerOutcomeOptions.ts", {
    "lucide-react": {
      Target: "Target",
      Zap: "Zap",
      Brain: "Brain",
      Handshake: "Handshake",
      ShieldCheck: "ShieldCheck",
      Sparkles: "Sparkles",
    },
  });

  const stepQuestionModule = loadModule("components/checkout/StepQuestionContext.tsx", {
    react: {
      useState: (init) => [typeof init === "function" ? init() : init, () => {}],
      useRef: (init) => ({ current: init }),
    },
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "lucide-react": {
      Target: "Target",
      Zap: "Zap",
      Brain: "Brain",
      Handshake: "Handshake",
      ShieldCheck: "ShieldCheck",
      Lightbulb: "Lightbulb",
    },
    "@/components/ui/ShinyText": { default: "ShinyText" },
    "@/components/ui/TextButton": { default: "TextButton" },
    "@/components/ui/TonePillButton": { default: "TonePillButton" },
    "@/components/seeker/onboarding/seekerOutcomeOptions": outcomeOptions,
    "./checkoutTypes": {
      MAX_CONTEXT_LENGTH: 1000,
      CONTEXT_IMPROVEMENT_STYLES: [],
    },
    "./checkoutUtils": {
      getImprovedContextText: (s, t) => t,
      getContextImprovementHint: () => "",
    },
    "@/lib/aiTextImprovement": {
      generateAiSubject: () => "Generated Subject",
    },
    "@/lib/aiImprovementApi": {
      callAiImproveNeeds: async () => ({}),
      mapChipIdsToGoalNames: () => [],
    },
    "./StepHeader": { default: "StepHeader" },
    "./StepQuestionContext.module.css": {
      default: { contextChipSelected: "selected" },
      contextChipSelected: "selected",
    },
  });

  let currentSubject = "Career & Work";
  let currentContext =
    "I want to understand my options clearly and leave with a confident direction.\nCustom challenge details.";
  let currentChips = ["clarity"];

  const tree = stepQuestionModule.default({
    subject: currentSubject,
    onSubjectChange: (val) => {
      currentSubject = val;
    },
    context: currentContext,
    onContextChange: (val) => {
      currentContext = val;
    },
    selectedContextChips: currentChips,
    onSelectedContextChipsChange: (chips) => {
      currentChips = chips;
    },
    showContextImprovementPanel: false,
    onShowContextImprovementPanelChange: () => {},
    selectedContextImproveStyle: null,
    onSelectedContextImproveStyleChange: () => {},
  });

  const subjectInput = findElements(tree, (el) => el.type === "input" && el.props?.id === "booking-subject")[0];
  const contextTextarea = findElements(tree, (el) => el.type === "textarea" && el.props?.id === "booking-context")[0];
  const chipButtons = findElements(
    tree,
    (el) => el.type === "button" && typeof el.props?.["aria-pressed"] === "boolean",
  );

  assert.equal(subjectInput.props.value, "Career & Work");
  assert.equal(
    contextTextarea.props.value,
    "I want to understand my options clearly and leave with a confident direction.\nCustom challenge details.",
  );
  assert.equal(chipButtons.length, 5);
  assert.equal(chipButtons[0].props["aria-pressed"], true);
  assert.equal(chipButtons[1].props["aria-pressed"], false);

  // Deselecting the pre-selected "clarity" chip removes its prefix and keeps custom text
  chipButtons[0].props.onClick();
  assert.deepEqual(toPlain(currentChips), []);
  assert.equal(currentContext, "Custom challenge details.");

  // Seeker can edit or clear subject and context freely
  subjectInput.props.onChange({ target: { value: "" } });
  contextTextarea.props.onChange({ target: { value: "Replaced description" } });
  assert.equal(currentSubject, "");
  assert.equal(currentContext, "Replaced description");

  // Reset button clears subject, context, and selected chips
  const resetButton = findElements(
    tree,
    (el) => el.type === "TextButton" && el.props?.label === "Reset",
  )[0];
  assert.ok(resetButton);
  assert.equal(resetButton.props.disabled, false);
  currentSubject = "Career & Work";
  currentChips = ["clarity"];
  resetButton.props.onClick();
  assert.equal(currentSubject, "");
  assert.equal(currentContext, "");
  assert.deepEqual(toPlain(currentChips), []);
});
