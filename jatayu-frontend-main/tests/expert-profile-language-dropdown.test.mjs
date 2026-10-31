import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";

const editor = fs.readFileSync(
  new URL("../components/expert/profile/ExpertProfileEditor.tsx", import.meta.url),
  "utf8",
);
const dropdown = fs.readFileSync(
  new URL("../components/admin/settings/SmartSearchSelect.tsx", import.meta.url),
  "utf8",
);

test("post-login Spoken Languages uses the reusable searchable dropdown", () => {
  assert.match(editor, /import SmartSearchSelect, \{ type SmartOption \} from "@\/components\/admin\/settings\/SmartSearchSelect"/);
  assert.match(editor, /<SmartSearchSelect[\s\S]*?aria-label="Languages Spoken"/);
  assert.match(editor, /const SPOKEN_LANGUAGE_OPTIONS: SmartOption\[\]/);
  assert.match(editor, /id="profile-languages"[\s\S]*?value=""/);
  assert.match(dropdown, /<input[\s\S]*?id=\{id\}/);
  assert.match(dropdown, /onFocus=\{\(\) => \{[\s\S]*?setIsOpen\(true\)/);
  assert.match(dropdown, /\{isOpen && \([\s\S]*?filteredOptions\.map/);
});

test("language selection remains multi-select, removable, and saved through the existing profile path", () => {
  assert.match(editor, /updateProfile\("languages", \[\.\.\.profile\.languages, language\]\)/);
  assert.match(editor, /Selected spoken languages/);
  assert.match(editor, /aria-label=\{`Remove \$\{language\}`\}/);
  assert.match(editor, /updateProfile\(\s*"languages",\s*profile\.languages\.filter/);
  assert.match(editor, /focusAreas: profile\.languages/);
  assert.match(editor, /languages: profile\.languages/);
});

test("custom language labels are preserved and dropdown closes on outside click", () => {
  assert.match(editor, /customValueTransform=\{\(language\) => language\}/);
  assert.match(dropdown, /customValueTransform\s*\?\s*customValueTransform\(trimmed\)/);
  assert.match(dropdown, /document\.addEventListener\("mousedown", handleClickOutside\)/);
  assert.match(dropdown, /!containerRef\.current\.contains\(event\.target as Node\)[\s\S]*?setIsOpen\(false\)/);
  assert.match(dropdown, /onClick=\{\(\) => handleSelect\(opt\.value\)\}/);
});
