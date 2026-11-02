import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const route = read("app/expert/(app)/profile/page.tsx");
const page = read("components/expert/profile/ExpertProfilePage.tsx");
const navigation = read("lib/expertDashboard.ts");
const view = read("components/expert/profile/ExpertProfileView.tsx");

test("the protected Profile route defaults to view mode and opens the existing editor explicitly", () => {
  assert.match(route, /mode === "edit"/);
  assert.match(route, /<ExpertProfilePage isEditing=\{mode === "edit"\} \/>/);
  assert.match(page, /isEditing = false/);
  assert.match(page, /\{isEditing \? <ExpertProfileEditor \/> : <ExpertProfileView \/>\}/);
  assert.match(page, /isEditing \? EXPERT_PROFILE_HREF : EXPERT_PROFILE_EDIT_HREF/);
});

test("Profile navigation opens the read-only view while explicit edit actions open edit mode", () => {
  assert.match(navigation, /EXPERT_PROFILE_HREF = "\/expert\/profile\/"/);
  assert.match(navigation, /EXPERT_PROFILE_EDIT_HREF = `\$\{EXPERT_PROFILE_HREF\}\?mode=edit`/);
  assert.match(navigation, /label: "Profile", href: EXPERT_PROFILE_HREF/);
  assert.match(navigation, /label: "Edit Profile",\s*href: EXPERT_PROFILE_EDIT_HREF/);
});

test("the read-only Profile view fetches the authenticated expert's current saved profile", () => {
  assert.match(view, /fetchExpertProfileRecord\(\)/);
  assert.match(view, /mapBackendProfileToExpertData\(record\)/);
  assert.match(view, /role="alert"/);
  assert.match(view, /Try again/);
});
