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

test("MAIN_NAV renames discover item label to Our Experts while keeping /seeker/discover/ href", () => {
  const mod = loadTsModule("lib/seekerDashboard.ts", {
    "@/lib/experts": { featuredExperts: [{ image: "/a.png", name: "A", role: "R" }, { image: "/b.png", name: "B", role: "R" }, { image: "/c.png", name: "C", role: "R" }, { image: "/d.png", name: "D", role: "R" }, { image: "/e.png", name: "E", role: "R" }, { image: "/f.png", name: "F", role: "R" }, { image: "/g.png", name: "G", role: "R" }], getExpertDetailHref: () => "/expert/a" },
    "@/lib/booking": { buildGoogleCalendarUrl: () => "", calculateBookingTotal: () => 0, getConsultationPrice: () => 0 },
  });

  const navItem = mod.MAIN_NAV.find((item) => item.id === "discover");
  assert.ok(navItem);
  assert.equal(navItem.label, "Our Experts");
  assert.equal(navItem.href, "/seeker/discover/");
});

test("seeker discover page metadata uses Our Experts title", () => {
  const mod = loadTsModule("app/seeker/(app)/discover/page.tsx", {
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) },
    "@/components/expert/Expert": { default: () => null },
  });

  assert.equal(mod.metadata.title, "Our Experts — Jatayu");
});

test("ExpertDetail and Checkout breadcrumbs use Our Experts for seekers and Discover for non-seekers", () => {
  const expertDetailSource = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/expert/ExpertDetail.tsx"),
    "utf8",
  );
  const checkoutSource = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/checkout/Checkout.tsx"),
    "utf8",
  );

  assert.match(
    expertDetailSource,
    /label:\s*seeker\s*\?\s*"Our Experts"\s*:\s*"Discover",\s*href:\s*seeker\s*\?\s*"\/seeker\/discover"\s*:\s*"\/expert"/,
  );
  assert.match(
    checkoutSource,
    /label:\s*seeker\s*\?\s*"Our Experts"\s*:\s*"Discover",\s*href:\s*seeker\s*\?\s*"\/seeker\/discover\/"\s*:\s*"\/expert\/"/,
  );
});
