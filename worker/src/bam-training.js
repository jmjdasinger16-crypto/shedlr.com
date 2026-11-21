const COOKIE = "__Host-shedlr_bam_training";
const TTL = 8 * 3600;
const FIELDS = [["industry","city"],["one","two","three"],["discovery","next"],["outcome"],["verify"]];
const STATUSES = ["Prospect","Interested","Follow-up agreed","Link sent","Signed up","Closed / not a fit","Do not contact"];
const OUTREACH = {text:"Text logged",call:"Call logged",followup:"Follow-up logged"};
const HITLIST_SQL = `WITH activity AS (
  SELECT detail, MAX(CASE WHEN kind='Text logged' THEN happened_at END) last_text,
    MAX(CASE WHEN kind='Call logged' THEN happened_at END) last_call,
    MAX(CASE WHEN kind='Follow-up logged' THEN happened_at END) last_followup,
    MAX(CASE WHEN kind='Program link sent' THEN happened_at END) last_link
  FROM bam_training_events WHERE rep_id=? AND kind IN ('Text logged','Call logged','Follow-up logged','Program link sent') GROUP BY detail
) SELECT h.id,h.business,h.contact,h.market,h.status,h.followup,h.notes,h.archived,a.last_text,a.last_call,a.last_followup,a.last_link
  FROM bam_training_hitlist h LEFT JOIN activity a ON a.detail=CAST(h.id AS TEXT)
  WHERE h.rep_id=? ORDER BY h.archived,h.followup='',h.followup,h.updated_at DESC LIMIT 1000`;
const TOPICS = ["Picking a market","No replies yet","Nervous about calls","Clicks but no signups","Checkout or activation"];
const now = () => new Date().toISOString();
const seconds = () => Math.floor(Date.now()/1000);
const response = (data, status=200, headers={}) => Response.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff",...headers}});
const error = (message,status=400) => response({error:message},status);
const cookie = (token="", maxAge=TTL) => ({"Set-Cookie":`${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`});
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(24)),b=>b.toString(16).padStart(2,"0")).join("");
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,"0")).join("");
const val = (data,key,max,required=false) => {
  const value=data?.[key]??"";
  if(typeof value!=="string"||value.length>max||required&&!value.trim()) throw new TypeError(`Check ${key}.`);
  return value.trim();
};
function emailOf(data){
  const email=val(data,"email",254,true).toLowerCase();
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new TypeError("Invalid email");
  return email;
}
const sessionToken = request => /(?:^|;\s*)__Host-shedlr_bam_training=([a-f0-9]{48})(?:;|$)/.exec(request.headers.get("Cookie")||"")?.[1];
function trainingHandoffs(env){
  try{
    const emails=JSON.parse(env.BAM_TRAINING_HANDOFFS||"[]");
    if(Array.isArray(emails)&&emails.length===2&&emails.every(email=>typeof email==="string"&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))return emails;
  }catch{}
  return [];
}

export async function handleBamTraining(request, env, auth, categories){
  if(request.method!=="POST")return error("Method not allowed.",405);
  if(request.headers.get("Origin")&&request.headers.get("Origin")!==new URL(request.url).origin)return error("Request origin not allowed.",403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get("Content-Type")||""))return error("Use JSON.",415);
  try{
    if(Number(request.headers.get("Content-Length"))>48000)return error("Request too large.",413);
    const reader=request.body?.getReader();
    let length=0; let text=""; const decoder=new TextDecoder();
    for(;;){
      const chunk=reader&&await reader.read();
      if(!chunk||chunk.done)break;
      length+=chunk.value.byteLength;
      if(length>48000){await reader.cancel();return error("Request too large.",413);}
      text+=decoder.decode(chunk.value,{stream:true});
    }
    const d=JSON.parse(text+decoder.decode());
    if(!d||typeof d!=="object"||Array.isArray(d))return error("Invalid request.");
    const db=env.DB;
    const p=(sql,...args)=>db.prepare(sql).bind(...args);
    const event=(id,kind,detail="")=>p("INSERT INTO bam_training_events(rep_id,kind,detail,happened_at) VALUES(?,?,?,?)",id,kind,detail,now());
    async function throttle(key,max){
      const current=seconds(); const bucket=await hash(key);
      const row=await p(`INSERT INTO bam_training_rate VALUES(?,1,?)
          ON CONFLICT(bucket) DO UPDATE SET attempts=CASE WHEN expires_at<=? THEN 1 ELSE attempts+1 END,
          expires_at=CASE WHEN expires_at<=? THEN excluded.expires_at ELSE expires_at END RETURNING attempts`,
          bucket,current+900,current,current).first();
      return Number(row.attempts)>max;
    }
    if(d.action==="team"||d.action==="invite"||d.action==="reset"||d.action==="account_status"||d.action==="team_hitlist"){
      const admin=await auth.getAdminSession(request,env);
      if(admin?.role!=="admin")return error("Sign in to the main admin portal as the owner.",admin?403:401);
      if(d.action==="team"){
        const [reps,events]=await db.batch([
          p(`SELECT r.id,r.name,r.email,r.active,r.last_login_at,
             (SELECT COUNT(*) FROM bam_training_lessons l WHERE l.rep_id=r.id AND (l.lesson=0 OR json_extract(l.answers,'$.workflow')=2)) completed,
             (SELECT COUNT(*) FROM bam_training_hitlist h WHERE h.rep_id=r.id AND h.archived=0) businesses,
             (SELECT COUNT(*) FROM bam_training_events e WHERE e.rep_id=r.id AND e.kind IN ('Signed in','Account activated','Access reset')) logins,
             (SELECT w.blocker FROM bam_training_work w WHERE w.rep_id=r.id) blocker,
             (SELECT MAX(e.happened_at) FROM bam_training_events e WHERE e.rep_id=r.id) last_activity
             FROM bam_training_reps r ORDER BY last_activity DESC,r.name LIMIT 250`),
          p("SELECT e.kind,e.detail,e.happened_at,r.name FROM bam_training_events e JOIN bam_training_reps r ON r.id=e.rep_id ORDER BY e.id DESC LIMIT 80")
        ]);
        return response({reps:reps.results,events:events.results,handoffsReady:trainingHandoffs(env).length===2});
      }
      if(d.action==="invite"||d.action==="reset"){
        const email=emailOf(d);
        const rep=await p("SELECT name,active FROM bam_training_reps WHERE email=?",email).first();
        if(d.action==="invite"&&rep)return error("That BAM already has an account. Use Reset access.",409);
        if(d.action==="reset"&&(!rep||!rep.active))return error("Enable the BAM before issuing a reset code.",409);
        const name=rep?.name||val(d,"name",100,true);
        const code=token();
        await p("INSERT INTO bam_training_invites VALUES(?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,code_hash=excluded.code_hash,expires_at=excluded.expires_at",email,name,await hash(code),seconds()+7*86400).run();
        return response({code,email});
      }
      if(!Number.isSafeInteger(d.id)||d.id<=0)return error("Select a BAM.");
      if(d.action==="team_hitlist"){
        const rows=await p(HITLIST_SQL,d.id,d.id).all();
        return response({rows:rows.results});
      }
      if(typeof d.active!=="boolean")return error("Invalid account status.");
      const changes=[p("UPDATE bam_training_reps SET active=? WHERE id=?",Number(d.active),d.id)];
      if(!d.active)changes.push(p("DELETE FROM bam_training_sessions WHERE rep_id=?",d.id),p("DELETE FROM bam_training_invites WHERE email=(SELECT email FROM bam_training_reps WHERE id=?)",d.id));
      await db.batch(changes);
      return response({ok:true});
    }

    if(d.action==="signin"||d.action==="join"){
      const email=emailOf(d), ip=request.headers.get("CF-Connecting-IP")||"local";
      const password=d.password;
      if(typeof password!=="string"||password.length>160||password.length<(d.action==="join"?12:1))return error(d.action==="join"?"Use a password with at least 12 characters.":"Enter your password.");
      if(await throttle(`ip:${ip}`,120)||await throttle(`account:${email}`,12))return error("Too many attempts. Try again in 15 minutes.",429);
      const when=now(), expiry=seconds();
      let rep=await p("SELECT id,email,name,active,password_hash FROM bam_training_reps WHERE email=?",email).first();
      if(d.action==="signin"){
        const dummy="pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
        const valid=await auth.verifyPassword(password,rep?.password_hash||dummy);
        if(!rep?.active||!valid)return error("Email or password is incorrect, or access is disabled.",401);
      }else{
        const code=val(d,"code",128,true);
        const digest=await hash(code);
        const invite=await p("SELECT name FROM bam_training_invites WHERE email=? AND code_hash=? AND expires_at>?",email,digest,expiry).first();
        if(!invite||rep&&!rep.active)return error("That code is invalid, used, or expired.",403);
        const pw=await auth.hashPassword(password);
        const sid=token(), sidHash=await hash(sid);
        const [changed]=await db.batch([
          p(`INSERT INTO bam_training_reps(email,name,password_hash,created_at,last_login_at)
             SELECT email,name,?,?,? FROM bam_training_invites WHERE email=? AND code_hash=? AND expires_at>?
             ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash,last_login_at=excluded.last_login_at WHERE active=1`,
             pw,when,when,email,digest,expiry),
          p("DELETE FROM bam_training_sessions WHERE rep_id=(SELECT id FROM bam_training_reps WHERE email=? AND password_hash=? AND active=1)",email,pw),
          p("INSERT INTO bam_training_sessions SELECT ?,id,? FROM bam_training_reps WHERE email=? AND password_hash=? AND active=1",sidHash,expiry+TTL,email,pw),
          p("INSERT INTO bam_training_events(rep_id,kind,detail,happened_at) SELECT id,?,'',? FROM bam_training_reps WHERE email=? AND password_hash=? AND active=1",rep?"Access reset":"Account activated",when,email,pw),
          p("DELETE FROM bam_training_invites WHERE email=? AND code_hash=?",email,digest),
          p("DELETE FROM bam_training_rate WHERE bucket=? AND EXISTS(SELECT 1 FROM bam_training_reps WHERE email=? AND password_hash=?)",await hash(`account:${email}`),email,pw)
        ]);
        if(!changed.meta.changes)return error("That code is no longer available.",403);
        return response({user:{email,name:invite.name}},200,cookie(sid));
      }
      const sid=token();
      await db.batch([
        p("DELETE FROM bam_training_sessions WHERE expires_at<=?",expiry),
        p("DELETE FROM bam_training_rate WHERE expires_at<=?",expiry),
        p("INSERT INTO bam_training_sessions SELECT ?,id,? FROM bam_training_reps WHERE id=? AND active=1 AND password_hash=?",await hash(sid),expiry+TTL,rep.id,rep.password_hash),
        p("UPDATE bam_training_reps SET last_login_at=? WHERE id=? AND active=1 AND password_hash=?",when,rep.id,rep.password_hash),
        p("INSERT INTO bam_training_events(rep_id,kind,detail,happened_at) SELECT id,'Signed in','',? FROM bam_training_reps WHERE id=? AND active=1 AND password_hash=?",when,rep.id,rep.password_hash),
        p("DELETE FROM bam_training_rate WHERE bucket=?",await hash(`account:${email}`))
      ]);
      return response({user:{email:rep.email,name:rep.name}},200,cookie(sid));
    }

    const sid=sessionToken(request);
    const sidHash=sid?await hash(sid):null;
    const rep=sidHash&&await p(`SELECT r.id,r.name,r.email FROM bam_training_sessions s JOIN bam_training_reps r ON r.id=s.rep_id
       WHERE s.token_hash=? AND s.expires_at>? AND r.active=1`,sidHash,seconds()).first();
    if(!rep)return error("Sign in to BAM Training.",401);
    const id=rep.id, when=now();
    if(d.action==="signout"){
      await p("DELETE FROM bam_training_sessions WHERE token_hash=?",sidHash).run();
      return response({ok:true},200,cookie("",0));
    }
    if(d.action==="progress"){
      const [{results},work]=await Promise.all([
        p("SELECT lesson,answers FROM bam_training_lessons WHERE rep_id=?",id).all(),
        p("SELECT gameplan,blocker FROM bam_training_work WHERE rep_id=?",id).first()
      ]);
      return response({user:{name:rep.name,email:rep.email},answers:Object.fromEntries(results.map(r=>[r.lesson,JSON.parse(r.answers)])),
        plan:work?.gameplan?JSON.parse(work.gameplan):null,blocker:work?.blocker||null,
        handoffs:trainingHandoffs(env),categories});
    }
    if(d.action==="hitlist"){
      const rows=await p(HITLIST_SQL,id,id).all();
      return response({rows:rows.results});
    }
    if(d.action==="log_outreach"){
      if(!Number.isSafeInteger(d.id)||d.id<=0||!Object.hasOwn(OUTREACH,d.channel))return error("Select a prospect and outreach action.");
      const result=await p(`INSERT INTO bam_training_events(rep_id,kind,detail,happened_at)
          SELECT rep_id,?,CAST(id AS TEXT),? FROM bam_training_hitlist
          WHERE id=? AND rep_id=? AND archived=0 AND status NOT IN ('Signed up','Closed / not a fit','Do not contact')`,
          OUTREACH[d.channel],when,d.id,id).run();
      if(!result.meta.changes)return error("This prospect is not available for outreach.",404);
      return response({ok:true});
    }
    if(d.action==="import_prospects"){
      if(!Array.isArray(d.rows)||!d.rows.length||d.rows.length>20)return error("Paste 1 to 20 spreadsheet rows.");
      const market=val(d,"market",120,true);
      const statements=d.rows.map(row=>{
        const business=val(row,"business",140,true),contact=val(row,"contact",200,true),notes=val(row,"notes",180);
        const source=val(row,"source",300,true);
        let url;try{url=new URL(source);}catch{throw new TypeError("Use a valid source URL.");}
        if(!["https:","http:"].includes(url.protocol)||url.username||url.password)throw new TypeError("Use a business website URL.");
        return p(`INSERT INTO bam_training_hitlist(rep_id,business,contact,market,status,followup,notes,updated_at)
          SELECT ?,?,?,?,'Prospect','',?,? WHERE (SELECT COUNT(*) FROM bam_training_hitlist WHERE rep_id=?)<1000
          AND NOT EXISTS(SELECT 1 FROM bam_training_hitlist WHERE rep_id=? AND lower(business)=lower(?) AND lower(market)=lower(?))`,
          id,business,contact,market,[notes,`Source: ${url.href}`].filter(Boolean).join("\n"),when,id,id,business,market);
      });
      const results=await db.batch(statements);
      const added=results.reduce((sum,r)=>sum+r.meta.changes,0);
      if(added)await event(id,"Prospects imported",String(added)).run();
      return response({added,skipped:d.rows.length-added});
    }
    let statement, activity;
    if(d.action==="workflow_step"&&d.step===4&&d.sent===true){
      // A rep's email confirmation is a checkpoint, not proof of signup or payment.
      statement=p("INSERT INTO bam_training_lessons VALUES(?,?,?,?) ON CONFLICT(rep_id,lesson) DO UPDATE SET answers=excluded.answers",id,4,JSON.stringify({workflow:2}),when);
      activity=event(id,"Handoff email logged","");
    }else if(d.action==="workflow_step"||d.action==="record_link"){
      const saved=await p("SELECT answers FROM bam_training_lessons WHERE rep_id=? AND lesson=0",id).first();
      const market=saved&&JSON.parse(saved.answers);
      const category=categories.find(c=>c.label.toLowerCase()===String(market?.industry||"").toLowerCase());
      if(!category||!market.city)return error("Save a supported category and city first.",409);
      const step=d.action==="record_link"?3:d.step;
      const checkpoint=p("INSERT INTO bam_training_lessons VALUES(?,?,?,?) ON CONFLICT(rep_id,lesson) DO UPDATE SET answers=excluded.answers",id,step,JSON.stringify({workflow:2}),when);
      if(step===3&&d.action==="record_link"){
        const business=val(d,"business",140,true),location=val(d,"location",120,true),phone=val(d,"phone",40,true);
        if(!/^[+()\d.\s-]+$/.test(phone)||!/^\d{10,15}$/.test(phone.replace(/\D/g,"")))return error("Enter a valid business phone number.");
        const target=`${category.label} · ${location}`, original=`${market.industry} · ${market.city}`;
        if(target.length>120)return error("Use a shorter business location.");
        const similar="rep_id=? AND lower(business)=lower(?) AND lower(market) IN (lower(?),lower(?))";
        const existing=await p(`SELECT id,status,archived FROM bam_training_hitlist WHERE ${similar} LIMIT 2`,id,business,target,original).all();
        if(existing.results.length>1)return error("More than one matching business. Review your Hitlist before logging another link.",409);
        const row=existing.results[0];
        if(row&&(row.archived||["Signed up","Closed / not a fit","Do not contact"].includes(row.status)))return error("This business is not available for a new link. Review your Hitlist.",409);
        const written=row?await p(`UPDATE bam_training_hitlist SET contact=?,market=?,status='Link sent',updated_at=? WHERE id=? AND rep_id=? AND archived=0 AND status NOT IN ('Signed up','Closed / not a fit','Do not contact')`,phone,target,when,row.id,id).run()
          :await p(`INSERT INTO bam_training_hitlist(rep_id,business,contact,market,status,followup,notes,updated_at) SELECT ?,?,?,?,'Link sent','','',? WHERE (SELECT COUNT(*) FROM bam_training_hitlist WHERE rep_id=?)<1000 AND NOT EXISTS(SELECT 1 FROM bam_training_hitlist WHERE ${similar})`,id,business,phone,target,when,id,id,business,target,original).run();
        if(!written.meta.changes)return error("The Hitlist changed or is full. Refresh and try again.",409);
        await db.batch([checkpoint,event(id,"Program link sent",String(row?.id??written.meta.last_row_id))]);
        return response({ok:true});
      }
      if(d.action!=="workflow_step"||![1,2,4].includes(step))return error("Select a workflow step.");
      if(step===4){
        if(!Number.isSafeInteger(d.id)||d.id<=0||d.verified!==true)return error("Select a business and verify signup and payment first.");
        const changed=await p("UPDATE bam_training_hitlist SET status='Signed up',followup='',updated_at=? WHERE id=? AND rep_id=? AND archived=0 AND status IN ('Link sent','Signed up')",when,d.id,id).run();
        if(!changed.meta.changes)return error("This business is not available for handoff.",404);
        activity=event(id,"Handoff email logged",String(d.id));
      }else activity=event(id,step===1?"First text response confirmed":"Qualifying call confirmed");
      statement=checkpoint;
    }else if(d.action==="prospecting_ready"){
      const market=await p("SELECT answers FROM bam_training_lessons WHERE rep_id=? AND lesson=0",id).first();
      if(!market)return error("Save your niche and city first.",409);
      const a=JSON.parse(market.answers);
      const selected=`${a.industry} · ${a.city}`;
      const count=await p(`SELECT COUNT(DISTINCT lower(business)) prospect_count FROM bam_training_hitlist
        WHERE rep_id=? AND lower(market)=lower(?) AND archived=0 AND contact!=''
        AND status NOT IN ('Signed up','Closed / not a fit','Do not contact')`,id,selected).first();
      if(count.prospect_count<3)return error("Save three active businesses with contact details in this market first.",409);
      statement=p("INSERT INTO bam_training_lessons VALUES(?,1,?,?) ON CONFLICT(rep_id,lesson) DO UPDATE SET answers=excluded.answers",id,JSON.stringify({market:selected}),when);
      activity=event(id,"Checkpoint saved","Step 2");
    }else if(d.action==="complete"){
      const i=d.lesson;
      if(!Number.isInteger(i)||!FIELDS[i]||!d.answers||typeof d.answers!=="object")return error("Select a training lesson.");
      const answers=Object.fromEntries(FIELDS[i].map(k=>[k,val(d.answers,k,220,true)]));
      if(i===2||i===4){
        if(d.answers.quiz!==(i===2?"1":"2"))return error("Review the lesson and try again.");
        answers.quiz=d.answers.quiz;
      }
      statement=p("INSERT INTO bam_training_lessons VALUES(?,?,?,?) ON CONFLICT(rep_id,lesson) DO UPDATE SET answers=excluded.answers",id,i,JSON.stringify(answers),when);
      activity=event(id,"Checkpoint saved",`Step ${i+1}`);
    }else if(d.action==="gameplan"){
      if(!Array.isArray(d.checks)||d.checks.some(k=>!["0","1","2"].includes(k)))return error("Invalid checklist.");
      const plan={market:val(d,"market",100,true),goal:val(d,"goal",140,true),next:val(d,"next",160,true),checks:[...new Set(d.checks)]};
      statement=p("INSERT INTO bam_training_work(rep_id,gameplan) VALUES(?,?) ON CONFLICT(rep_id) DO UPDATE SET gameplan=excluded.gameplan",id,JSON.stringify(plan));
      activity=event(id,"Gameplan saved");
    }else if(d.action==="blocker"||d.action==="clear_blocker"){
      const topic=d.action==="clear_blocker"?null:d.topic;
      if(topic!==null&&!TOPICS.includes(topic))return error("Select a blocker.");
      statement=p("INSERT INTO bam_training_work(rep_id,blocker) VALUES(?,?) ON CONFLICT(rep_id) DO UPDATE SET blocker=excluded.blocker",id,topic);
      activity=event(id,topic?"Coaching requested":"Blocker resolved",topic||"");
    }else if(d.action==="save_business"||d.action==="archive_business"){
      const row=d.id;
      if(row!=null&&(!Number.isSafeInteger(row)||row<=0))return error("Select a business.");
      if(d.action==="archive_business"){
        statement=p("UPDATE bam_training_hitlist SET archived=1,updated_at=? WHERE id=? AND rep_id=? AND archived=0",when,row,id);
        activity=event(id,"Hitlist business archived");
      }else{
        const s=d.status; let f=val(d,"followup",10);
        if(!STATUSES.includes(s))return error("Select a Hitlist status.");
        if(f&&(!/^\d{4}-\d\d-\d\d$/.test(f)||Number.isNaN(Date.parse(f))||new Date(f).toISOString().slice(0,10)!==f))return error("Enter a valid follow-up date.");
        if(["Signed up","Closed / not a fit","Do not contact"].includes(s))f="";
        const values=[val(d,"business",140,true),val(d,"contact",200),val(d,"market",120),s,f,val(d,"notes",1000),when];
        statement=row==null
          ?p("INSERT INTO bam_training_hitlist(rep_id,business,contact,market,status,followup,notes,updated_at) SELECT ?,?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM bam_training_hitlist WHERE rep_id=?)<1000",id,...values,id)
          :p("UPDATE bam_training_hitlist SET business=?,contact=?,market=?,status=?,followup=?,notes=?,updated_at=? WHERE id=? AND rep_id=? AND archived=0",...values,row,id);
        activity=event(id,row==null?"Hitlist business added":"Hitlist updated");
      }
      const changed=await statement.run();
      if(!changed.meta.changes)return error(row==null?"Your Hitlist has reached its limit.":"That business was not found.",row==null?409:404);
      await activity.run();
      return response({ok:true});
    }else return error("Unknown action.",404);
    await db.batch([statement,activity]);
    return response({ok:true});
  }catch(e){
    if(e instanceof TypeError||e instanceof SyntaxError)return error("Check the fields and try again.");
    if(/no such table:\s*bam_training_/i.test(String(e)))return error("BAM Training is not initialized yet. Apply the database migration.",503);
    console.error("BAM training request failed",e?.name);
    return error("BAM Training is temporarily unavailable.",503);
  }
}
