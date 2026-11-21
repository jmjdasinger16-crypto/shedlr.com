const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { Miniflare } = require("miniflare");

const root=path.resolve(__dirname,"..");
const ownerPassword="local-owner-test-only";
const repPassword="local-rep-test-only";

test("BAM training uses the existing owner session and persists isolated rep work",async t=>{
  const mf=new Miniflare({modules:true,modulesRoot:root,modulesRules:[{type:"ESModule",include:["**/*.js"]}],scriptPath:path.join(root,"worker/src/index.js"),
    compatibilityDate:"2026-04-26",
    d1Databases:{DB:"shedlr-bam-test"},
    bindings:{ADMIN_PASSWORD:ownerPassword,ADMIN_SESSION_SECRET:"local-owner-test-signing-secret",STAFF_PASSWORD:"local-VA",RETENTION_PASSWORD:"local-retention",BAM_PASSWORD:"local-legacy-bam",
      BAM_TRAINING_HANDOFFS:JSON.stringify(["one@example.com","two@example.com"])}});
  t.after(()=>mf.dispose());
  const db=await mf.getD1Database("DB");
  for(const file of ["schema.sql","migration_career_applications.sql","migration_bam_training.sql","migration_bam_training.sql"]){
    const sql=fs.readFileSync(path.join(root,"worker",file),"utf8");
    for(const statement of sql.replace(/^\s*--.*$/gm,"").split(";").filter(s=>s.trim())) await db.prepare(statement).run();
  }
  async function call(url,body,cookie,expected=200,extra={}){
    const headers={...extra}; if(body)headers["Content-Type"]="application/json";if(cookie)headers.Cookie=cookie;
    const result=await mf.dispatchFetch(`http://localhost${url}`,{method:body?"POST":"GET",headers,body:body&&JSON.stringify(body)});
    const data=await result.json();
    assert.equal(result.status,expected,`${url} ${body?.action||""}: ${data.error||""}`);
    return {...data,cookie:result.headers.get("set-cookie")?.split(";")[0]};
  }
  const bam=(action,body={},cookie,status,extra)=>call("/api/bam-training",{...body,action},cookie,status,extra);
  const original=await call("/api/health"); assert.equal(original.ok,true);
  const owner=(await call("/api/admin/login",{password:ownerPassword})).cookie;
  assert.equal((await call("/api/admin/session",null,owner)).role,"admin");
  await call("/api/admin/applications",null,owner);
  await bam("team",{},null,401);
  await bam("team",{},owner,403,{Origin:"https://example.invalid"});
  for(const password of ["local-VA","local-retention","local-legacy-bam"]){
    const other=(await call("/api/admin/login",{password})).cookie;
    await bam("team",{},other,403);
    await bam("progress",{},other,401);
    await bam("invite",{name:"Not allowed",email:"no@example.com"},other,403);
  }
  await bam("progress",{},owner,401);
  async function enroll(name,email){
    const {code}=await bam("invite",{name,email},owner);
    const data=await bam("join",{email,password:repPassword,code});
    assert.ok(data.cookie.startsWith("__Host-shedlr_bam_training="));
    await bam("join",{email,password:repPassword,code},null,403);
    return data.cookie;
  }
  const a="rep-a@example.com", b="rep-b@example.com";
  const alice=await enroll("Alice Practice",a), bob=await enroll("Bob Practice",b);
  await bam("team",{},alice,401);
  await call("/api/admin/session",null,alice,401);
  await bam("complete",{lesson:2,answers:{discovery:"Where?",next:"Offer page",quiz:"0"}},alice,400);
  for(const [lesson,answers] of [
    [0,{industry:"Junk removal",city:"Dallas"}],[1,{one:"Alias 1",two:"Alias 2",three:"Alias 3"}],
    [2,{discovery:"Where?",next:"Offer page",quiz:"1"}],[3,{outcome:"Call next week"}],[4,{verify:"Check approved record",quiz:"2"}]
  ])await bam("complete",{lesson,answers},alice);
  await bam("gameplan",{market:"Dallas",goal:"Practice",next:"Follow up",checks:["0","2"]},alice);
  await bam("blocker",{topic:"No replies yet"},alice);
  const prospect={business:"Alice Business",status:"Follow-up agreed",market:"Dallas",contact:"Public office",notes:"Agreed Thursday",followup:"2026-11-26"};
  await bam("save_business",prospect,alice);
  const [row]=(await bam("hitlist",{},alice)).rows;
  await bam("save_business",{...prospect,id:row.id,business:"Tampered"},bob,404);
  await bam("archive_business",{id:row.id},bob,404);
  assert.deepEqual((await bam("hitlist",{},bob)).rows,[]);
  assert.deepEqual((await bam("progress",{},bob)).answers,{});
  await bam("save_business",{...prospect,business:"Bob Business"},bob);
  await bam("signout",{},alice);
  await bam("progress",{},alice,401);
  const signed=(await bam("signin",{email:a,password:repPassword})).cookie;
  const progress=await bam("progress",{},signed);
  assert.equal(Object.keys(progress.answers).length,5);
  assert.equal(progress.categories.length,41);
  assert.equal(new Set(progress.categories.map(c=>c.id)).size,progress.categories.length);
  for(const c of progress.categories){assert.ok(c.label);if(c.page)assert.ok(fs.existsSync(path.join(root,c.page)));}
  assert.equal(progress.categories.find(c=>c.id==="dog-training").page,"/leads/dog-training.html");
  assert.equal(progress.categories.find(c=>c.id==="plumbing").page,null);
  assert.deepEqual(progress.plan.checks,["0","2"]);
  assert.equal(progress.blocker,"No replies yet");
  assert.deepEqual(progress.handoffs,["one@example.com","two@example.com"]);
  assert.equal(progress.offer,undefined);
  assert.equal((await bam("hitlist",{},signed)).rows[0].business,"Alice Business");
  const team=await bam("team",{},owner);
  assert.equal(team.handoffsReady,true);
  const ar=team.reps.find(r=>r.email===a);
  assert.equal(ar.completed,1);assert.equal(ar.logins,2);assert.equal(ar.businesses,1);assert.ok(ar.last_login_at);
  assert.ok(team.events.some(e=>e.kind==="Coaching requested"));
  assert.equal((await bam("team_hitlist",{id:ar.id},owner)).rows[0].business,"Alice Business");
  await bam("log_outreach",{id:row.id,channel:"text"},bob,404);
  for(const channel of ["text","call","followup"])await bam("log_outreach",{id:row.id,channel},signed);
  const outreach=(await bam("hitlist",{},signed)).rows[0];
  for(const key of ["last_text","last_call","last_followup"])assert.ok(outreach[key]);
  assert.equal((await bam("team_hitlist",{id:ar.id},owner)).rows[0].last_call,outreach.last_call);
  await bam("prospecting_ready",{},signed,409);
  const market="Junk removal · Dallas";
  const prospects=["New Company One","New Company Two","New Company Three"].map((business,i)=>({business,contact:`806555010${i}`,source:`https://example.com/${i}`,notes:"Practice source"}));
  await bam("import_prospects",{market,rows:[...prospects,{...prospects[0],source:"javascript:alert(1)"}]},signed,400);
  assert.equal((await bam("hitlist",{},signed)).rows.length,1);
  const imported=await bam("import_prospects",{market,rows:[...prospects,{...prospects[0],business:prospects[0].business.toUpperCase()}]},signed);
  assert.equal(imported.added,3);assert.equal(imported.skipped,1);
  assert.equal((await bam("import_prospects",{market,rows:prospects},signed)).added,0);
  assert.equal((await bam("hitlist",{},bob)).rows.length,1);
  await bam("prospecting_ready",{},signed);
  assert.equal((await bam("progress",{},signed)).answers[1].market,market);
  assert.equal((await bam("hitlist",{},signed)).rows.find(r=>r.business===prospects[0].business).status,"Prospect");
  await bam("workflow_step",{step:1},signed);
  await bam("workflow_step",{step:2},signed);
  await bam("record_link",{business:prospects[0].business,location:"Dallas",phone:"invalid"},signed,400);
  await bam("record_link",{business:prospects[0].business,location:"Dallas",phone:"806-555-0100"},signed);
  const linked=(await bam("hitlist",{},signed)).rows.filter(r=>r.business===prospects[0].business);
  assert.equal(linked.length,1);assert.equal(linked[0].status,"Link sent");assert.ok(linked[0].last_link);
  await bam("workflow_step",{step:4,id:linked[0].id,verified:true},bob,409);
  await bam("complete",{lesson:0,answers:{industry:"Junk Removal",city:"Dallas"}},bob);
  await bam("workflow_step",{step:4,id:linked[0].id,verified:true},bob,404);
  await bam("workflow_step",{step:4,id:linked[0].id,verified:false},signed,400);
  await bam("workflow_step",{step:4,id:linked[0].id,verified:true},signed);
  assert.equal((await bam("hitlist",{},signed)).rows.find(r=>r.id===linked[0].id).status,"Signed up");
  assert.equal((await bam("team",{},owner)).reps.find(r=>r.email===a).completed,5);
  await bam("save_business",{...prospect,id:row.id,status:"Do not contact"},signed);
  assert.equal((await bam("hitlist",{},signed)).rows.find(r=>r.id===row.id).followup,"");
  await bam("log_outreach",{id:row.id,channel:"call"},signed,404);
  await bam("archive_business",{id:row.id},signed);
  assert.equal((await bam("hitlist",{},signed)).rows.find(r=>r.id===row.id).archived,1);
  await bam("clear_blocker",{},signed);
  const reset=await bam("reset",{email:a},owner);
  const refreshed=(await bam("join",{email:a,password:"different-password-test",code:reset.code})).cookie;
  await bam("progress",{},signed,401);
  assert.equal(Object.keys((await bam("progress",{},refreshed)).answers).length,5);
  assert.equal((await bam("hitlist",{},refreshed)).rows.find(r=>r.id===row.id).last_followup,outreach.last_followup);
  await bam("account_status",{id:ar.id,active:false},owner);
  await bam("progress",{},refreshed,401);
  await bam("signin",{email:a,password:"different-password-test"},null,401);
  const boundary="shedlr_test_boundary";
  const app=Object.entries({name:"Practice Applicant",email:"app@example.com",phone:"8065550100"}).map(([k,v])=>
    `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`).join("")+`--${boundary}--\r\n`;
  const applied=await mf.dispatchFetch("http://localhost/api/careers/apply",{method:"POST",headers:{"Content-Type":`multipart/form-data; boundary=${boundary}`},body:app});
  assert.equal(applied.status,201,await applied.text());
  assert.equal((await call("/api/admin/applications",null,owner)).applications[0].email,"app@example.com");
});
