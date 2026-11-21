const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("every category has a unique landing page, catalog link, sitemap URL and matching signup", async () => {
  const { programs, groups } = await import("../worker/src/category-programs.mjs");
  const read = name => fs.readFileSync(path.join(__dirname, "..", name), "utf8");
  const orderOptions = read("contact.html").match(/<select id="category" name="category">([\s\S]*?)<\/select>/)[1];
  const catalog = read("leads/programs.html");
  const sitemap = read("sitemap.xml");
  const programIds = new Set(programs.map(p => p.id));
  assert.equal(programIds.size, programs.length);
  assert.equal(new Set(programs.map(p => p.slug)).size, programs.length);
  assert.deepEqual(new Set([...orderOptions.matchAll(/<option value="([^"]+)"/g)].map(m => m[1])), programIds);
  assert.equal([...orderOptions.matchAll(/<option value="[^"]+"/g)].length, programs.length);
  const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  assert.equal(new Set(locations).size, locations.length);
  for (const p of programs) {
    assert.match(p.id, /^[a-z0-9-]+$/);
    assert.ok(Object.hasOwn(groups, p.group));
    const page = read(`leads/${p.slug}.html`);
    assert.ok(page.includes(`rel="canonical" href="https://shedlr.com/leads/${p.slug}.html"`), p.id);
    assert.ok(locations.includes(`https://shedlr.com/leads/${p.slug}.html`), p.id);
    assert.ok(catalog.includes(`href="${p.slug}.html"`), p.id);
    assert.ok(page.includes(`contact.html?category=${p.id}#order-form`), p.id);
    if (p.jobs) {
      assert.equal(p.jobs.length, 3);
      assert.ok(p.fit && p.example && p.service);
    }
  }
  for (const id of ["fencing", "irrigation", "flooring"]) {
    assert.ok(programs.find(p => p.id === id)?.isNew, id);
  }
});
