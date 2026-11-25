const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Miniflare } = require("miniflare");

test("real contact attempts are logged only for active accounts and activity counts stored records", async t => {
  const root = path.resolve(__dirname, "..");
  const mf = new Miniflare({
    modules: true, modulesRoot: root, modulesRules: [{ type: "ESModule", include: ["**/*.js", "**/*.mjs"] }],
    scriptPath: path.join(root, "worker/src/index.js"), compatibilityDate: "2026-04-26",
    d1Databases: { DB: "activity-test" },
    bindings: { ADMIN_PASSWORD: "owner-test-only", STAFF_PASSWORD: "staff-test-only", ADMIN_SESSION_SECRET: "owner-test-signing-secret" },
  });
  t.after(() => mf.dispose());
  const db = await mf.getD1Database("DB");
  for (const statement of fs.readFileSync(path.join(root, "worker/schema.sql"), "utf8").replace(/^\s*--.*$/gm, "").split(";").filter(s => s.trim())) await db.prepare(statement).run();
  const { logContactAttempt, getPortalActivity } = await import("../worker/src/lead-activity.mjs");
  const now = new Date();
  const iso = days => new Date(now.getTime() - days * 86400000).toISOString();
  await db.prepare("INSERT INTO businesses(id,email,status,created_at,updated_at) VALUES (1,'a@example.com','active',?,?),(2,'b@example.com','canceled',?,?)").bind(iso(30), iso(30), iso(30), iso(30)).run();
  for (const id of [1, 2, 3]) await db.prepare("INSERT INTO leads(id,name,category,status,submitted_at) VALUES (?,'Lead','roofing','assigned',?)").bind(id, iso(30)).run();
  await db.prepare("INSERT INTO lead_assignments(id,lead_id,business_id,assigned_at) VALUES (1,1,1,?),(2,1,2,?),(3,2,1,?),(4,3,2,?)").bind(iso(1), iso(1), iso(20), iso(1)).run();

  assert.equal((await logContactAttempt(db, 1, { rep: "", outcome: "no_answer" })).status, 400);
  assert.equal((await logContactAttempt(db, 1, { rep: "Sam R.", outcome: "made_up" })).status, 400);
  assert.equal((await logContactAttempt(db, 3, { rep: "Sam R.", outcome: "no_answer" })).status, 404);
  const ok = await logContactAttempt(db, 1, { rep: "Sam R.", outcome: "no_answer_voicemail", comment: "Will retry tomorrow." }, now);
  assert.deepEqual([ok.status, ok.notes_created], [201, 1]);
  const notes = (await db.prepare("SELECT business_id, author, content, created_at FROM lead_notes").all()).results;
  assert.equal(notes.length, 1);
  assert.equal(notes[0].business_id, 1);
  assert.equal(notes[0].author, "shedlr_attempt");
  assert.equal(notes[0].content, "Sam R. called. No answer, voicemail left. Will retry tomorrow.");
  assert.equal(notes[0].created_at, now.toISOString());

  const activity = await getPortalActivity(db, 1, now);
  assert.equal(activity.leads_delivered, 1);
  assert.equal(activity.attempts_logged, 1);
  assert.equal(activity.last_attempt_at, now.toISOString());
  assert.deepEqual(await getPortalActivity(db, 99, now), { days: 7, leads_delivered: 0, attempts_logged: 0, last_delivery_at: null, last_attempt_at: null });

  async function post(url, body, cookie) {
    const headers = { "Content-Type": "application/json" }; if (cookie) headers.Cookie = cookie;
    return mf.dispatchFetch(`http://localhost${url}`, { method: "POST", headers, body: JSON.stringify(body) });
  }
  assert.equal((await post("/api/admin/leads/1/attempts", { rep: "X", outcome: "no_answer" })).status, 401);
  const staff = (await post("/api/admin/login", { password: "staff-test-only" })).headers.get("set-cookie").split(";")[0];
  assert.equal((await post("/api/admin/leads/1/attempts", { rep: "X", outcome: "no_answer" }, staff)).status, 403);
  const owner = (await post("/api/admin/login", { password: "owner-test-only" })).headers.get("set-cookie").split(";")[0];
  const res = await post("/api/admin/leads/1/attempts", { rep: "Dana", outcome: "text_sent" }, owner);
  assert.equal(res.status, 201);
  assert.equal((await res.json()).notes_created, 1);
});
