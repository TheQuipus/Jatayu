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

function toPlain(value) {
  return JSON.parse(JSON.stringify(value));
}

const seekerCategories = loadTsModule("lib/seekerCategories.ts");
const preselectMod = loadTsModule("lib/seekerDiscoverPreselect.ts", {
  "./seekerCategories": seekerCategories,
});

test("SEEKER_PREDEFINED_CATEGORIES matches exact onboarding ids, labels, and order with other-not-sure last in onboarding", () => {
  const expected = [
    ["career-work", "Career & Work"],
    ["legal-compliance", "Legal & Compliance"],
    ["business-entrepreneurship", "Business & Entrepreneurship"],
    ["personal-growth", "Personal Growth"],
    ["finance-investment", "Finance & Investment"],
    ["software", "Software & Development"],
    ["design", "Design & Creative"],
    ["business", "Business & Consulting"],
    ["marketing", "Marketing & Growth"],
    ["finance", "Finance & Tax"],
    ["health", "Health & Wellness"],
    ["legal", "Legal & Founder Contracts"],
    ["product", "Product Management"],
    ["data", "Data & Analytics"],
  ];

  assert.deepEqual(
    toPlain(seekerCategories.SEEKER_PREDEFINED_CATEGORIES.map((c) => [c.id, c.label])),
    expected,
  );

  const onboardingSource = fs.readFileSync(
    path.join(import.meta.dirname, "..", "app/seeker/seeker-onboarding/page.tsx"),
    "utf8",
  );
  assert.match(onboardingSource, /\.\.\.SEEKER_PREDEFINED_CATEGORIES\.map/);
  assert.match(onboardingSource, /\{\s*id:\s*"other-not-sure",\s*label:\s*"Other",\s*icon:\s*Lightbulb\s*\}/);
});

test("mapBackendSeekerToProfile preserves selectedBudget and selectedLanguages", () => {
  const profileMod = loadTsModule("lib/seekerProfileApi.ts", {
    "@/lib/api": { getSeekerProfile: async () => ({}), getSeekerMe: async () => ({}), getSeekerToken: () => null },
    "@/lib/seekerDashboard": { SEEKER_PROFILE: { name: "Test", avatar: "/a.png", isPro: false, email: "a@b.com" } },
  });

  const mapped = profileMod.mapBackendSeekerToProfile({
    fullName: "Priya",
    category: "health",
    selectedBudget: "standard",
    selectedLanguages: ["english", "hindi"],
  });

  assert.equal(mapped.category, "health");
  assert.equal(mapped.selectedBudget, "standard");
  assert.deepEqual(mapped.selectedLanguages, ["english", "hindi"]);
});

test("deriveSeekerDiscoverPreselect maps predefined category, known languages, and budget bucket while skipping custom/unknown values", () => {
  const availableLangs = ["English", "Hindi", "Tamil"];

  const full = toPlain(preselectMod.deriveSeekerDiscoverPreselect(
    { category: "health", selectedLanguages: ["english", "CustomLang", "tamil"], selectedBudget: "budget" },
    availableLangs,
  ));
  assert.deepEqual(full.categories, ["health"]);
  assert.deepEqual(full.languages, ["English", "Tamil"]);
  assert.deepEqual(full.priceRange, [0, 2500]);

  const standard = toPlain(preselectMod.deriveSeekerDiscoverPreselect({ selectedBudget: "standard" }, availableLangs));
  assert.deepEqual(standard.priceRange, [0, 8000]);

  const premium = toPlain(preselectMod.deriveSeekerDiscoverPreselect({ selectedBudget: "premium" }, availableLangs));
  assert.deepEqual(premium.priceRange, [0, 20000]);

  const elite = toPlain(preselectMod.deriveSeekerDiscoverPreselect({ selectedBudget: "elite" }, availableLangs));
  assert.deepEqual(elite.priceRange, [0, 300000]);

  const customCat = toPlain(preselectMod.deriveSeekerDiscoverPreselect(
    { category: "custom-vastu" },
    availableLangs,
  ));
  assert.deepEqual(customCat.categories, []);

  const otherCat = toPlain(preselectMod.deriveSeekerDiscoverPreselect(
    { category: "other-not-sure" },
    availableLangs,
  ));
  assert.deepEqual(otherCat.categories, []);
});

test("areFiltersEqualToPreselect detects untouched preselection vs user filter edits", () => {
  const preselect = { categories: ["health"], languages: ["English"], priceRange: [0, 2500] };
  assert.equal(
    preselectMod.areFiltersEqualToPreselect(
      {
        selectedTopics: ["health"],
        selectedLanguages: ["English"],
        selectedRatings: [],
        priceRange: [0, 2500],
        selectedAvailabilities: [],
        searchQuery: "",
      },
      preselect,
    ),
    true,
  );
  assert.equal(
    preselectMod.areFiltersEqualToPreselect(
      {
        selectedTopics: [],
        selectedLanguages: ["English"],
        selectedRatings: [],
        priceRange: [0, 2500],
        selectedAvailabilities: [],
        searchQuery: "",
      },
      preselect,
    ),
    false,
  );
});

test("Expert.tsx keeps public expertiseTags untouched, applies seeker preselection, removes No exact matches found, and renders Recommended profiles", () => {
  const expertSource = fs.readFileSync(
    path.join(import.meta.dirname, "..", "components/expert/Expert.tsx"),
    "utf8",
  );

  assert.match(expertSource, /const publicTopicOptions = expertiseTags\.map/);
  assert.match(expertSource, /const topicOptions = seeker \? seekerTopicOptions : publicTopicOptions;/);
  assert.match(expertSource, /if \(!seeker\) return staticLanguages;/);
  assert.match(expertSource, /const displayedFallbackSuggestions = !seeker && usingApi \? fallbackSuggestions : \[\];/);
  assert.match(expertSource, /Recommended profiles/);
  assert.match(expertSource, /Picked for you based on your preferences\. Adjust the filters anytime\./);
  assert.match(expertSource, /Nothing matches all your preferences exactly, so here are the closest experts\. Adjust the filters anytime\./);
  assert.doesNotMatch(expertSource, /No exact matches found/);
});
