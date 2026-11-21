"use strict";

const assert = require("node:assert/strict");
const { existsSync, readFileSync } = require("node:fs");
const { join } = require("node:path");
const test = require("node:test");
const { createContext, runInContext } = require("node:vm");
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

test("Step 4 uses the selected category link, personalized sign-off and separate promo text", async () => {
  const { bamCategories } = await import("../worker/src/category-programs.mjs");
  const main = { addEventListener() {}, setAttribute() {} };
  const view = createContext({
    document: { querySelector: () => main, addEventListener() {} },
    window: {},
    location: { search: "" },
    URLSearchParams,
    fetch: () => new Promise(() => {}),
    bamCategories
  });
  for (const file of ["bam-playbook.js", "bam-training.js"]) {
    runInContext(readFileSync(join(__dirname, "../js", file), "utf8"), view);
  }
  runInContext('state.user={name:"Patrick Example"};state.lesson=3;state.categories=bamCategories;', view);
  for (const { id, label, page } of bamCategories) {
    view.label = label;
    const html = runInContext('state.answers[0]={industry:label,city:"Dallas"};lesson()', view);
    const text = html.match(/id="send-link"[^>]*>([^<]*)<\/textarea>/)?.[1];
    assert.ok(text?.includes(`https://shedlr.com${page}`), `${id}: matching program page`);
    assert.match(text, /month to month with no long-term commitment/);
    assert.match(text, /I’ll send you the promo code/);
    assert.match(text, /Once you’re signed up, I’ll get our Lead Acquisition team/);
    assert.match(text, /It’s Patrick again.*you can text me right here/);
    assert.doesNotMatch(text, /EARNOURBUSINESS/);
    assert.match(html, /id="promo-text"[^>]*>Use EARNOURBUSINESS/);
  }
});
