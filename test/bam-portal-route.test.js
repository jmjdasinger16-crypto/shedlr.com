"use strict";

const { spawn } = require("node:child_process");
const { once } = require("node:events");
const assert = require("node:assert/strict");
const { join } = require("node:path");
const test = require("node:test");

test("both BAM URLs serve the same Workflow portal and navigation prefers the new URL", { timeout: 5000 }, async t => {
  const server = spawn(process.execPath, [join(__dirname, "../server.js")], {
    env: { ...process.env, PORT: "0" },
    stdio: ["ignore", "pipe", "inherit"]
  });
  t.after(() => server.kill());
  const [ready] = await once(server.stdout, "data");
  const port = String(ready).match(/running on port (\d+)/)?.[1];
  assert.ok(Number(port)>0);
  async function read(path) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { redirect: "manual" });
    assert.equal(response.status, 200, path);
    assert.match(response.headers.get("content-type"), /^text\/html/);
    return response.text();
  }
  const portal = await read("/bam-portal");
  for (const path of ["/bam-portal/", "/bam-portal.html", "/bam-training", "/bam-training.html", "/bam-portal?view=team", "/bam-training?view=team"]) {
    assert.equal(await read(path), portal, path);
  }
  assert.match(portal, /<title>Shedlr \| BAM Workflow<\/title>/);
  assert.match(portal, /aria-label="Workflow navigation"/);
  assert.doesNotMatch(portal, /BAM TRAINING|Loading BAM Training/);
  assert.match(await read("/connect"), /href="\/bam-portal">BAM Workflow sign-in/);
  assert.match(await read("/admin.html"), /location\.assign\('\/bam-portal\?view=team'\)">BAM Workflow/);
});
