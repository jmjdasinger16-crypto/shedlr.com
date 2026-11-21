"use strict";

const assert = require("node:assert/strict");
const { existsSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const playbooks = require("../js/bam-playbook.js");

test("every catalog category has an exclusive playbook across the five steps", async () => {
  const { bamCategories } = await import("../worker/src/category-programs.mjs");
  assert.deepEqual(Object.keys(playbooks).sort(), bamCategories.map(c => c.id).sort());
  const fields = ["search", "target", "text", "focus", "questions", "example", "answer", "nudge", "handoff"];
  const seen = Object.fromEntries(fields.map(field => [field, new Set()]));
  for (const { id, page } of bamCategories) {
    assert.ok(existsSync(join(__dirname, "..", page)), `${id}: published page`);
    const entry = playbooks[id];
    assert.equal(entry.questions.length, 3, `${id}: three qualifying questions`);
    assert.equal(new Set(entry.questions).size, 3, `${id}: no repeated questions`);
    for (const question of [...entry.questions, entry.text, entry.nudge]) {
      assert.match(question, /\?$/, `${id}: ends with a question`);
    }
    for (const field of fields) {
      const value = [].concat(entry[field]).join(" ").trim();
      assert.ok(value.length > 12, `${id}: ${field} is populated`);
      assert.doesNotMatch(value, /not a real|100 Example Lane|only use real info/i);
      assert.ok(!seen[field].has(value.toLowerCase()), `${id}: unique ${field}`);
      seen[field].add(value.toLowerCase());
    }
  }
});

test("every first text is one short question with no brand or call pitch", () => {
  for (const [id, { text }] of Object.entries(playbooks)) {
    assert.match(text, /^Hey, [^!?\n.]+\?$/, `${id}: one conversational question`);
    assert.ok(text.length <= 110, `${id}: short enough for a first text`);
    assert.doesNotMatch(text, /Shedlr|quick call|hop on a call|https?:|promo code|sign up/i, `${id}: no pitch`);
  }
  assert.equal(playbooks["junk-removal"].text, "Hey, do you guys have availability to remove a demolished shed this week?");
});

test("examples fit how the businesses actually accept work or bookings", () => {
  const airbnb = playbooks.airbnb;
  assert.match(airbnb.target, /hosts or managers/i);
  assert.match(airbnb.text, /openings for a guest booking/i);
  assert.match(airbnb.example, /Friday through Sunday.*two bedrooms.*two-night stay/i);
  assert.match(airbnb.handoff, /minimum stay.*guest capacity.*approved booking channel/i);
  assert.match(playbooks["junk-removal"].example, /Jim Stanly.*10×12.*shed/i);
  assert.match(playbooks.irrigation.questions.join(" "), /valves and controllers/i);
  assert.match(playbooks.irrigation.example, /zone/i);
  assert.match(playbooks.flooring.example, /vinyl/i);
});
