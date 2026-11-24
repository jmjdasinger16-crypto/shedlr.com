const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Miniflare } = require("miniflare");

test("every service category has three distinct follow-up examples; intake facts are quoted", async () => {
  const { categoryIds } = await import("../worker/src/category-programs.mjs");
  const { buildFollowUpNote, followUpTopics } = await import("../worker/src/lead-follow-up.mjs");
  assert.deepEqual(Object.keys(followUpTopics).sort(), [...categoryIds].sort());
  const topics = categoryIds.flatMap(category => followUpTopics[category]);
  assert.equal(topics.length, categoryIds.length * 3);
  assert.equal(new Set(topics).size, topics.length);
  for (const category of categoryIds) {
    const note = buildFollowUpNote({ category });
    for (const topic of followUpTopics[category]) assert.ok(note.includes(topic));
  }
  const freezer = buildFollowUpNote({ category: "appliance-repair", message: "LG fridge is warm; freezer still works." });
  assert.match(freezer, /Lead intake: “LG fridge is warm; freezer still works\.”/);
  assert.match(freezer, /current temperatures/);
  assert.doesNotMatch(freezer, /Whirlpool|Samsung|GE/);
  const ice = buildFollowUpNote({ category: "appliance-repair", message: "Samsung ice maker stopped working" });
  assert.match(ice, /water dispenser/);
  const leak = buildFollowUpNote({ category: "appliance-repair", message: "GE refrigerator leaks under the freezer" });
  assert.match(leak, /where water collects/);
  assert.doesNotMatch(leak, /current temperatures/);
  assert.match(buildFollowUpNote({ category: "appliance-repair", message: "Bosch dishwasher not draining" }), /part of the cycle/);
  assert.match(buildFollowUpNote({ category: "unrecognized", preferred_category: "flooring" }), /subfloor/);
  assert.match(buildFollowUpNote({ category: "constructor" }), /Confirm the job scope/);
});

test("owner action adds notes only to recent assignments for active businesses in D1", async t => {
  const root = path.resolve(__dirname, "..");
  const mf = new Miniflare({
    modules: true, modulesRoot: root, modulesRules: [{ type: "ESModule", include: ["**/*.js", "**/*.mjs"] }],
    scriptPath: path.join(root, "worker/src/index.js"), compatibilityDate: "2026-04-26",
    d1Databases: { DB: "follow-up-test" },
    bindings: { ADMIN_PASSWORD: "owner-test-only", STAFF_PASSWORD: "staff-test-only", ADMIN_SESSION_SECRET: "owner-test-signing-secret" },
  });
  t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB");
  for (const statement of fs.readFileSync(path.join(root, "worker/schema.sql"), "utf8").replace(/^\s*--.*$/gm, "").split(";").filter(s => s.trim())) {
    await db.prepare(statement).run();
  }
  const endpoint = "/api/admin/leads/follow-up-notes";
  async function post(url, data, cookie, status = 200) {
    const headers = { "Content-Type": "application/json" };
    if (cookie) headers.Cookie = cookie;
    const res = await mf.dispatchFetch(`http://localhost${url}`, { method: "POST", headers, body: JSON.stringify(data) });
    assert.equal(res.status, status, `${url}: ${res.status}`);
    return { data: await res.json(), cookie: res.headers.get("set-cookie")?.split(";")[0] };
  }
  const now = Date.now();
  const iso = offset => new Date(now + offset * 60_000).toISOString();
  for (const [index, status] of ["active", "canceled", "past_due", "suspended"].entries()) {
    await db.prepare("INSERT INTO businesses(id,email,status,created_at,updated_at) VALUES (?,?,?,?,?)")
      .bind(index + 1, `test-${index}@example.com`, status, iso(-100), iso(-100)).run();
  }
  const fixtures = [
    [1, 1, -5, "assigned", "appliance-repair", "Whirlpool fridge is not cooling"],
    [2, 1, -60.5, "assigned", "roofing", "Older assignment"],
    [3, 2, -1, "assigned", "roofing", "Canceled account"],
    [4, 3, -1, "assigned", "roofing", "Past-due account"],
    [5, 4, -1, "assigned", "roofing", "Suspended account"],
    [6, 1, -10, "archived", "roofing", "Archived lead"],
    [7, 1, 10, "assigned", "roofing", "Future assignment"],
    [8, null, -3, "new", "roofing", "No assignment"],
    [9, 1, -59.5, "assigned", "fencing", "Need a new fence"],
  ];
  for (const [id, account, minutes, status, category, message] of fixtures) {
    await db.prepare("INSERT INTO leads(id,name,status,category,message,submitted_at) VALUES (?,'Test lead',?,?,?,?)")
      .bind(id, status, category, message, iso(-120)).run();
    if (account) await db.prepare("INSERT INTO lead_assignments(id,lead_id,business_id,assigned_at) VALUES (?,?,?,?)")
      .bind(id, id, account, iso(minutes)).run();
  }
  await db.prepare("INSERT INTO lead_notes(assignment_id,business_id,lead_id,content,created_at,updated_at) VALUES (1,1,1,'Existing human note',?,?)")
    .bind(iso(-2), iso(-2)).run();

  await post(endpoint, {}, null, 401);
  const staff = (await post("/api/admin/login", { password: "staff-test-only" })).cookie;
  await post(endpoint, {}, staff, 403);
  const owner = (await post("/api/admin/login", { password: "owner-test-only" })).cookie;
  await post("/api/admin/leads/backfill-notes", {}, owner, 404);
  const dry = (await post(endpoint, { dryRun: true, minGapHours: 720 }, owner)).data;
  assert.deepEqual(dry, { scanned: 2, backfilled_leads: 0, notes_created: 0, dry_run: true });
  assert.equal((await db.prepare("SELECT COUNT(*) AS total FROM lead_notes").first()).total, 1);

  const runs = await Promise.all([post(endpoint, {}, owner), post(endpoint, {}, owner)]);
  assert.equal(runs.reduce((sum, { data }) => sum + data.notes_created, 0), 2);
  assert.equal((await post(endpoint, {}, owner)).data.notes_created, 0);
  const { results } = await db.prepare("SELECT lead_id, business_id, author, content, created_at FROM lead_notes ORDER BY id").all();
  const [existing, ...added] = results;
  assert.equal(existing.content, "Existing human note");
  assert.equal(existing.author, "business");
  assert.deepEqual(added.map(row => row.lead_id).sort(), [1, 9]);
  assert.ok(added.every(row => row.author === "shedlr_follow_up" && row.business_id === 1 && Date.parse(row.created_at) >= now));
  assert.match(added.find(row => row.lead_id === 1).content, /Whirlpool fridge is not cooling.*current temperatures/);
  assert.match(added.find(row => row.lead_id === 9).content, /footage and gates/);
});
