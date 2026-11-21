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
      BAM_TRAINING_OFFER:JSON.stringify({price:"$100",code:"PRACTICEONLY",handoffs:["one@example.com","two@example.com"]})}});
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
  assert.deepEqual(progress.plan.checks,["0","2"]);
  assert.equal(progress.blocker,"No replies yet");
  assert.equal(progress.offer.code,"PRACTICEONLY");
  assert.equal((await bam("hitlist",{},signed)).rows[0].business,"Alice Business");
  const team=await bam("team",{},owner);
  assert.equal(team.offerReady,true);
  const ar=team.reps.find(r=>r.email===a);
  assert.equal(ar.completed,5);assert.equal(ar.logins,2);assert.equal(ar.businesses,1);assert.ok(ar.last_login_at);
  assert.ok(team.events.some(e=>e.kind==="Coaching requested"));
  assert.equal((await bam("team_hitlist",{id:ar.id},owner)).rows[0].business,"Alice Business");
  await bam("save_business",{...prospect,id:row.id,status:"Do not contact"},signed);
  assert.equal((await bam("hitlist",{},signed)).rows[0].followup,"");
  await bam("archive_business",{id:row.id},signed);
  assert.equal((await bam("hitlist",{},signed)).rows[0].archived,1);
  await bam("clear_blocker",{},signed);
  const reset=await bam("reset",{email:a},owner);
  const refreshed=(await bam("join",{email:a,password:"different-password-test",code:reset.code})).cookie;
  await bam("progress",{},signed,401);
  assert.equal(Object.keys((await bam("progress",{},refreshed)).answers).length,5);
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
