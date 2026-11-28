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

function findElements(node, predicate, acc = []) {
  if (!node || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const child of node) findElements(child, predicate, acc);
    return acc;
  }
  if (predicate(node)) acc.push(node);
  if (node.props?.children) findElements(node.props.children, predicate, acc);
  return acc;
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

function renderSection(props) {
  const jsx = (type, p) => ({ type, props: p });
  const SpinnerStub = function Spinner(p) {
    return { type: "SpinnerStub", props: p };
  };
  const ExpertCardStub = function ExpertCard(p) {
    return { type: "ExpertCardStub", props: p };
  };
  const LinkStub = function Link(p) {
    return { type: "LinkStub", props: p };
  };

  const mod = loadTsModule("components/seeker/dashboard/RecommendedExpertsSection.tsx", {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    "next/link": { default: LinkStub },
    "@/components/ui/ExpertCard": { default: ExpertCardStub },
    "@/components/ui/Spinner": { default: SpinnerStub },
    "./SeekerDashboard.module.css": {
      default: {
        contentSection: "contentSection",
        featuredSection: "featuredSection",
        featuredHeaderRow: "featuredHeaderRow",
        featuredTitle: "featuredTitle",
        sortedText: "sortedText",
        recommendedStatePanel: "recommendedStatePanel",
        recommendedStateText: "recommendedStateText",
        recommendedRetryBtn: "recommendedRetryBtn",
        recommendedStateLink: "recommendedStateLink",
        recommendedGrid: "recommendedGrid",
        recommendedCard: "recommendedCard",
      },
    },
  });

  return {
    tree: mod.default(props),
    SpinnerStub,
    ExpertCardStub,
    LinkStub,
  };
}

test("RecommendedExpertsSection renders loading state with Spinner", () => {
  const { tree, SpinnerStub } = renderSection({
    matches: [],
    isLoading: true,
    error: null,
    bookmarkedExperts: new Set(),
    onBookmarkToggle: () => {},
  });

  const spinners = findElements(tree, (node) => node.type === SpinnerStub);
  assert.equal(spinners.length, 1);
  const text = collectText(tree).join(" ");
  assert.match(text, /Finding your best expert matches/i);
});

test("RecommendedExpertsSection renders up to 4 fetched matches using ExpertCard", () => {
  const sampleMatches = [
    { id: "e1", name: "Expert One", role: "Advisor", desc: "D1", image: "/1.png", topics: [], languages: ["English"], price: 1000, rating: 4.8, replyTime: "15m", matchTier: 1 },
    { id: "e2", name: "Expert Two", role: "Coach", desc: "D2", image: "/2.png", topics: [], languages: ["Hindi"], price: 1500, rating: 4.7, replyTime: "20m", matchTier: 2 },
    { id: "e3", name: "Expert Three", role: "Mentor", desc: "D3", image: "/3.png", topics: [], languages: ["English"], price: 2000, rating: 4.6, replyTime: "30m", matchTier: 3 },
    { id: "e4", name: "Expert Four", role: "Strategist", desc: "D4", image: "/4.png", topics: [], languages: ["Tamil"], price: 2500, rating: 4.5, replyTime: "45m", matchTier: 4 },
    { id: "e5", name: "Expert Five", role: "Consultant", desc: "D5", image: "/5.png", topics: [], languages: ["English"], price: 3000, rating: 4.4, replyTime: "1h", matchTier: 5 },
  ];

  const { tree, ExpertCardStub } = renderSection({
    matches: sampleMatches,
    isLoading: false,
    error: null,
    bookmarkedExperts: new Set(["Expert Two"]),
    onBookmarkToggle: () => {},
  });

  const cards = findElements(tree, (node) => node.type === ExpertCardStub);
  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map((c) => c.props.expert.id), ["e1", "e2", "e3", "e4"]);
  assert.equal(cards[0].props.seeker, true);
  assert.equal(cards[0].props.linkToDetail, true);
  assert.equal(cards[1].props.isBookmarked, true);
});

test("RecommendedExpertsSection renders empty state with Our Experts link", () => {
  const { tree, LinkStub } = renderSection({
    matches: [],
    isLoading: false,
    error: null,
    bookmarkedExperts: new Set(),
    onBookmarkToggle: () => {},
  });

  const text = collectText(tree).join(" ");
  assert.match(text, /No expert matches found/i);
  const links = findElements(tree, (node) => node.type === LinkStub);
  assert.ok(links.some((link) => link.props.href === "/seeker/discover/" && collectText(link).join("").includes("Browse Our Experts")));
});

test("RecommendedExpertsSection renders error state with retry action and no fake experts", () => {
  let retried = false;
  const { tree, ExpertCardStub } = renderSection({
    matches: [],
    isLoading: false,
    error: "Unable to load recommended experts right now.",
    onRetry: () => { retried = true; },
    bookmarkedExperts: new Set(),
    onBookmarkToggle: () => {},
  });

  const cards = findElements(tree, (node) => node.type === ExpertCardStub);
  assert.equal(cards.length, 0);
  const text = collectText(tree).join(" ");
  assert.match(text, /Unable to load recommended experts right now/i);
  const buttons = findElements(tree, (node) => node.type === "button");
  assert.equal(buttons.length, 1);
  buttons[0].props.onClick();
  assert.equal(retried, true);
});

test("SeekerDashboard calls getFeaturedMatches with RECOMMENDED_EXPERTS_COUNT and no category/topics", () => {
  const source = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/seeker/dashboard/SeekerDashboard.tsx"),
    "utf8",
  );
  assert.match(source, /getFeaturedMatches\(\{\s*limit:\s*RECOMMENDED_EXPERTS_COUNT,\s*throwOnError:\s*true\s*\}\)/);
  assert.doesNotMatch(source, /RECOMMENDED_EXPERTS(?!_COUNT)/);
});
