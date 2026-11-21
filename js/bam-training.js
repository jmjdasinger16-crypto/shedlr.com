"use strict";
const main = document.querySelector("main");
const state = { view: "home", lesson: 0, completed: new Set(), answers: {}, plan: null, checks: [], blocker: null };
const lessons = [
  {
    title: "Pick your first market", time: 5, desc: "Choose one industry, one city, and the right Shedlr page.",
    steps: ["Start with a service you understand. Junk removal, cleaning, or auto detailing are good practice categories.", "Choose one city and open the Shedlr industry page you would share with an interested business owner.", "Know what you’re offering: a paid lead service. It is not a promise of a particular job or sale."],
    question: "What market will you practice in?",
    fields: [["industry","Industry","Junk removal"],["city","City","Dallas, TX"]],
    resource: ["Open the Junk Removal program page","https://shedlr.com/leads/junk-removal.html"]
  },
  {
    title: "Build a prospect list", time: 10, desc: "Find three local businesses and write down why each one fits.",
    steps: ["Look for independent businesses that offer the target service in your city.", "Use a direct public business source. Look for signs they want more work, such as an active promotion or openings for new customers.", "Check for duplicates and prior outreach in the Hitlist. Use aliases in this checkpoint and keep business contact details in the Hitlist."],
    question: "What makes each prospect a fit?",
    fields: [["one","Practice prospect 1","Alias and reason"],["two","Practice prospect 2","Alias and reason"],["three","Practice prospect 3","Alias and reason"]],
  },
  {
    title: "Practice the call", time: 8, desc: "Introduce Shedlr, use a job example, and find out what work fits.",
    steps: ["Introduce yourself as a Shedlr representative. Explain that Shedlr connects service providers with prospective customers.", "Describe a specific type of request as an example, not as an available assignment. If there is a real request, share only verified, authorized details and say whether it’s a lead or a booking.", "Ask about the crew’s capacity and service area. If there’s a fit, offer the category page. If they decline, thank them and stop."],
    quote: "Hi, I’m [name] with Shedlr. We help local providers connect with customers who need work done. For example, a homeowner might need a demolished shed hauled away before a rebuild. That’s an example of the work we’d look to match you with, not a job I’m assigning today. Is that the kind of work your crew takes?",
    question: "Practice one discovery question and a clear next step.",
    fields: [["discovery","Your discovery question","What types of loads can your crew handle?"],["next","Your suggested next step","Offer the matching page if they’re interested."]],
    quiz: ["An owner asks, “Is that job already booked for me?”","Say yes so they know what they might get.","Say it’s an example, not a booked job.","Ask them to sign up before you answer."],
  },
  {
    title: "Work your Hitlist", time: 5, desc: "Give every productive conversation a clear next step.",
    steps: ["If they’re interested but not ready, use the existing approved Hitlist. Note what work they care about and any agreed follow-up.", "Send the matching program page after they ask for it. Be clear that it’s a paid service before inviting them to sign up.", "A click is not a signup and does not tell you why someone stopped. Ask what was unclear if follow-up was agreed, and honor any opt-out."],
    question: "Record a practice outcome in one sentence.",
    fields: [["outcome","Outcome and next action","Interested in light loads; agreed to follow up Thursday."]],
  },
  {
    title: "Confirm and hand off", time: 7, desc: "Verify the purchase and introduce the customer to Acquisition.",
    steps: ["Confirm the initial charge, renewal price, and billing terms at checkout; do not guess renewal terms.", "Verify that payment cleared through the approved record. Never take card details or passwords. Escalate a missing activation link through the approved internal process.", "Include business, category, service area, requested work, activation status and open questions in the handoff. Record the exact checkout email only in the approved operational tool."],
    question: "An owner says they paid, but you can’t verify it. What do you do first?",
    fields: [["verify","Your action","Ask the authorized team to verify payment."]],
    quiz: ["Which counts as a confirmed purchase?","A visit to the landing page.","A prospect says they submitted the form.","A successful payment in the approved record."],
    correct: 2,
  }
];
const tasks = ["Review the Hitlist for agreed follow-ups","Pick one niche and city for this session","Write one next action before signing off"];
const blockers = {
  "Picking a market":"Restart with one city and one straightforward service. Look at the matching category page before broadening your search.",
  "No replies yet":"Check the prospect’s fit and whether you’re using an approved channel. One relevant question is more useful than a longer pitch.",
  "Nervous about calls":"Practice your introduction and two questions aloud. A short, honest conversation is enough; you don’t need to close on the phone.",
  "Clicks but no signups":"If a follow-up was agreed, ask what was unclear: the service, the price, the fit, or checkout. Don’t assume the click tells you the reason.",
  "Checkout or activation":"Verify payment through the approved record. Route a missing link to the authorized team rather than promising new access yourself."
};
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const head = (eyebrow,title,sub) => `<div class="intro"><div><p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="sub">${sub}</p></div></div>`;
const navBtn = (view,label,cls="secondary") => `<button type="button" class="btn ${cls}" data-view="${view}">${label}</button>`;
const lessonBtn = (i,label,cls="primary") => `<button type="button" class="btn ${cls}" data-lesson="${i}">${label}</button>`;
const progress = () => `<section class="panel" aria-label="Progress"><p class="eyebrow">Your progress</p><div class="progress-line"><strong>${state.completed.size}/5</strong><span>steps complete</span></div><progress max="5" value="${state.completed.size}" aria-label="Training steps complete"></progress><p class="muted">Your first win is a qualified conversation with a clear next step.</p></section>`;

function home(){
  const i = lessons.findIndex((_,n)=>!state.completed.has(n));
  const next = lessons[i];
  return head("BAM field guide","Your training path","Get ready for your first qualified conversation, then build a routine you can repeat.") +
    `<div class="layout"><div class="stack">
      <section class="banner" data-index="${next ? String(i+1).padStart(2,"0") : "05"}">
        <p class="eyebrow">${next ? `Your next action / Step ${String(i+1).padStart(2,"0")}` : "Training path complete"}</p>
        <h2>${next?.title ?? "Plan your next session"}</h2>
        <p>${next?.desc ?? "Review your follow-ups and choose one concrete action for your next work session."}</p>
        ${next ? lessonBtn(i,`${i===0?"Start":"Continue"} training <span aria-hidden="true">→</span>`,"gold") : navBtn("plan","Open daily gameplan","gold")}
      </section>
      <section><div class="section-head"><h2>Fast Start</h2><span>5 practical steps</span></div>
      <ol class="roadmap">${lessons.map((l,n)=>{
        const d=state.completed.has(n), here=n===i;
        return `<li><button class="row ${d?"done":here?"next":""}" data-lesson="${n}"><span class="number" aria-hidden="true">${d?"✓":String(n+1).padStart(2,"0")}</span><span><strong>${l.title}</strong><small>${l.desc}</small></span><span class="status ${d||here?"":"time"}">${d?"Complete":here?"Up next":`${l.time} min`}</span></button></li>`;
      }).join("")}</ol></section>
    </div><aside class="stack">${progress()}<section class="panel"><h2>Daily Gameplan</h2><p class="muted">Set a focus, review your Hitlist, and leave yourself a next action.</p>${navBtn("plan","Open gameplan →")}</section><section class="panel"><h2>Need a hand?</h2><p class="muted">Get a next step when a call, follow-up, or signup stalls.</p>${navBtn("coach","I’m blocked →")}</section></aside></div>`;
}
function lesson(){
  const i=state.lesson, l=lessons[i], a=state.answers[i]??{}, done=state.completed.has(i);
  return `<div class="back">${navBtn("home","← My training")}</div>`+head(`Step ${String(i+1).padStart(2,"0")} / 05 · ${l.time} min`,l.title,l.desc)+
    `<div class="layout"><div class="stack"><article class="panel lesson-content"><h2>What to do</h2>
    <ol>${l.steps.map(s=>`<li>${s}</li>`).join("")}</ol>${l.quote?`<blockquote><p class="eyebrow">Practice script</p>${l.quote}</blockquote>`:""}
    ${i===3?navBtn("hitlist","Open my Hitlist"):""}
    ${i===4?(state.offer?`<div class="note"><strong>Current BAM offer</strong>${esc(state.offer.price)} with <code>${esc(state.offer.code)}</code>. Send the handoff to both ${state.offer.handoffs.map(esc).join(" and ")}.</div>`:`<div class="note"><strong>Confirm with the owner</strong>The offer and handoff details haven’t been configured. Ask for them before quoting an offer or sending a handoff.</div>`):""}
    ${l.resource?`<a class="btn quiet-link" href="${l.resource[1]}" target="_blank" rel="noopener">${l.resource[0]} ↗</a>`:""}</article>
    <section class="panel"><p class="eyebrow">Your checkpoint</p><h2>${l.question}</h2>
    <form id="lesson-form" class="labels">${l.fields.map(([id,label,placeholder])=>`<label for="${id}">${label}<input id="${id}" name="${id}" required maxlength="220" placeholder="${placeholder}" value="${esc(a[id])}"></label>`).join("")}
    ${l.quiz?`<label for="quiz">${l.quiz[0]}<select id="quiz" name="quiz" required><option value="">Choose an answer</option>${l.quiz.slice(1).map((opt,n)=>`<option value="${n}" ${a.quiz===String(n)?"selected":""}>${opt}</option>`).join("")}</select></label>`:""}
    <div class="actions"><button class="btn primary" type="submit">${done?"Save checkpoint":"Complete checkpoint"}</button>${done ? (i<lessons.length-1 ? lessonBtn(i+1,"Next step →","secondary") : navBtn("plan","Open daily gameplan →")) : ""}</div></form>
    <p class="message ${done?"success":""}" role="status" id="message">${done?"Checkpoint complete.":""}</p></section></div>
    <aside class="stack">${progress()}<div class="note"><strong>Practice checkpoint</strong>Use fictional details here. Saved answers stay with your BAM account.</div></aside></div>`;
}
function plan(){
  const p=state.plan??{};
  return head("Before you reach out","Daily Gameplan","Pick a focus and decide what you’ll do this session. Keep business contact details in your Hitlist.")+
    `<div class="layout"><section class="panel"><h2>Plan your session</h2><p class="muted">Choose a goal you control, like practicing a call or completing an agreed follow-up.</p>
    <form id="plan-form" class="labels"><div class="fields"><label for="market">Market<input id="market" name="market" required maxlength="100" placeholder="Junk removal · Dallas" value="${esc(p.market)}"></label><label for="goal">Session goal<input id="goal" name="goal" required maxlength="140" placeholder="Practice one call" value="${esc(p.goal)}"></label></div>
    <ul class="checklist">${tasks.map((t,n)=>`<li><label><input type="checkbox" name="task" value="${n}" ${state.checks.includes(String(n))?"checked":""}>${t}</label></li>`).join("")}</ul>
    <label for="nextAction">Next action<input id="nextAction" name="next" required maxlength="160" placeholder="What will you do first?" value="${esc(p.next)}"></label><div class="actions"><button class="btn primary" type="submit">Save gameplan</button></div></form><p id="message" class="message ${state.plan?"success":""}" role="status">${state.plan?"Gameplan saved.":""}</p></section>
    <aside class="stack"><section class="panel"><h2>Session focus</h2>${state.plan?`<p>${esc(p.market)}</p><p>${esc(p.goal)}</p><div class="note"><strong>Next action</strong>${esc(p.next)}</div>`:`<p class="muted">Save your plan to see your next action here.</p>`}</section>${progress()}</aside></div>`;
}
function coach(){
  const b=state.blocker;
  return head("Keep moving","Coaching","Pick the point where you’re stuck and get one action you can try next.")+
    `<div class="layout"><section class="panel"><h2>What’s blocking you?</h2><form id="coach-form" class="labels">
    <label for="block">Choose a blocker<select id="block" name="block" required><option value="">Choose an option</option>${Object.keys(blockers).map(s=>`<option ${s===b?"selected":""}>${s}</option>`).join("")}</select></label>
    <div class="actions"><button class="btn primary" type="submit">Save blocker and get a next step</button>${b?'<button type="button" class="btn secondary" data-action="resolve">Mark resolved</button>':""}</div></form>
    ${b?`<div class="note help-result" role="status"><strong>Try this next</strong>${blockers[b]}</div>`:""}</section>
    <aside class="stack"><section class="panel"><h2>Coaching note</h2><p class="muted">The owner can see your saved blocker in BAM Training. This does not send an email.</p>${navBtn("home","Back to training →")}</section></aside></div>`;
}
const teamMode=new URLSearchParams(location.search).get("view")==="team";
const statuses=["Interested","Follow-up agreed","Link sent","Signed up","Closed / not a fit","Do not contact"];
const date=(value)=>value?new Date(value).toLocaleString():"Not yet";
const msg=(text,fail=false)=>{
  let m=document.querySelector("#message");
  if(!m){
    m=document.createElement("p");m.id="message";m.setAttribute("role","status");main.prepend(m);
  }
  m.textContent=text;m.className=`message ${fail?"error":"success"}`;
};
const feedback='<p class="message" id="message" role="status"></p>';
const btn=(act,label,attrs="")=>`<button type="button" class="btn secondary" data-action="${act}" ${attrs}>${label}</button>`;
const businessLink='<a class="btn secondary" href="/admin.html">Back to Business</a>';
async function api(action, values={}){
  let res;
  try{res=await fetch("/api/bam-training",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,action})});}
  catch{throw new Error("Connection failed. Try again.");}
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
    const err=new Error(data.error||"BAM Training is unavailable. Try again.");
    err.status=res.status;throw err;
  }
  return data;
}
async function loadRep(){
  const d=await api("progress");
  Object.assign(state,{user:d.user,answers:d.answers,completed:new Set(Object.keys(d.answers).map(Number)),plan:d.plan,checks:d.plan?.checks||[],blocker:d.blocker,offer:d.offer,view:"home",rows:[],editing:null,showArchived:false});
}
function authView(){
  const join=state.view==="join";
  return head("Shedlr team access",join?"Activate BAM access":"BAM training sign-in",join?"Use the one-time invite or reset code issued by the Shedlr owner.":"Sign in to pick up your training, gameplan, and follow-ups.")+
    `<section class="panel access-card"><form id="auth-form" class="labels">
    <label>Email<input name="email" type="email" autocomplete="username" maxlength="254" required></label>
    ${join?'<label>Invite or reset code<input name="code" maxlength="128" autocomplete="off" required></label>':""}
    <label>Password<input name="password" type="password" autocomplete="${join?"new-password":"current-password"}" maxlength="160" ${join?'minlength="12"':""} required></label>
    <div class="actions"><button class="btn primary">${join?"Activate account":"Sign in"}</button>${navBtn(join?"signin":"join",join?"Back to sign-in":"Use an invite or reset code")}</div></form>
    ${feedback}<p class="muted">Need access? Ask the Shedlr owner for an invite. <a href="/connect">Back to Careers</a>.</p></section>`;
}
function table(rows, edit=false){
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Hitlist spreadsheet"><table><thead><tr>${["Business","Business contact","Market","Status","Follow-up","Notes",...(edit?["Actions"]:[])].map(x=>`<th scope="col">${x}</th>`).join("")}</tr></thead>
   <tbody>${rows.map(r=>`<tr><th scope="row">${esc(r.business)}</th><td>${esc(r.contact)}</td><td>${esc(r.market)}</td><td>${esc(r.status)}${r.archived?" · Archived":""}</td><td>${esc(r.followup)}</td><td>${esc(r.notes)}</td>${edit?`<td>${r.archived?"":btn("edit","Edit",`data-id="${r.id}"`)+btn("archive","Archive",`data-id="${r.id}"`)}</td>`:""}</tr>`).join("")||`<tr><td colspan="${edit?7:6}">No businesses to show.</td></tr>`}</tbody></table></div>`;
}
function hitlist(){
  const r=state.editing||{};
  const rows=(state.rows||[]).filter(row=>Boolean(row.archived)===Boolean(state.showArchived));
  return head("Your pipeline","Hitlist","Track interested businesses and agreed follow-ups. Keep passwords, card numbers, and private customer details out of the sheet.")+
    `<div class="stack"><section class="panel"><div class="section-head"><h2>${r.id?"Edit business":"Add a business"}</h2><span>${rows.length} ${state.showArchived?"archived":"active"}</span></div>
    <form id="hit-form" class="labels"><div class="fields">
    <label>Business<input name="business" required maxlength="140" value="${esc(r.business)}"></label>
    <label>Business contact<input name="contact" maxlength="200" placeholder="Name, work email or business phone" value="${esc(r.contact)}"></label>
    <label>Market<input name="market" maxlength="120" placeholder="Service and city" value="${esc(r.market)}"></label>
    <label>Status<select name="status">${statuses.map(s=>`<option ${s===r.status?"selected":""}>${s}</option>`).join("")}</select></label>
    <label>Agreed follow-up date<input name="followup" type="date" value="${esc(r.followup)}"></label></div>
    <label>Notes<textarea name="notes" maxlength="1000">${esc(r.notes)}</textarea></label>
    <div class="actions"><button class="btn primary">Save business</button>${r.id?btn("cancel-edit","Cancel edit"):""}</div></form>${feedback}</section>
    <section class="panel"><div class="section-head"><h2>${state.showArchived?"Archived businesses":"Active businesses"}</h2>${btn("toggle-archived",state.showArchived?"Show active":"Show archived")}</div>
    ${table(rows,true)}</section></div>`;
}
function team(){
  const d=state.team;
  return `<div class="back">${businessLink}</div>`+head("Shedlr owner workspace","BAM Training","Manage rep access and see who’s making progress without mixing training into your Business dashboard.")+
    (d?`<div class="stack">
    ${d.offerReady?"":'<div class="note"><strong>Offer setup needed</strong>The owner needs to configure the Worker’s BAM_TRAINING_OFFER secret before reps can see the offer and handoff details.</div>'}
    <section class="panel"><h2>Invite a BAM</h2><p class="muted">Create a one-time code and share it privately. Nothing is emailed automatically.</p>
    <form id="invite-form" class="labels"><div class="fields"><label>Name<input name="name" required maxlength="100"></label><label>Email<input name="email" type="email" required maxlength="254"></label></div><div class="actions"><button class="btn primary">Create invite</button></div></form>${feedback}
    ${state.invite?`<div class="note"><strong>One-time code for ${esc(state.invite.email)}</strong><code>${esc(state.invite.code)}</code><p>Expires in seven days. Send the code with the <a href="/bam-training">BAM sign-in page</a> and ask the rep to choose “Use an invite or reset code.”</p>${btn("copy-code","Copy code")}</div>`:""}</section>
    <section class="panel"><div class="section-head"><h2>Team roster</h2>${btn("refresh-team","Refresh")}</div>
    <div class="table-scroll" tabindex="0" role="region" aria-label="BAM team roster"><table><thead><tr>${["BAM","Access","Checkpoints","Sign-ins","Last sign-in","Last activity","Hitlist","Coaching blocker","Actions"].map(s=>`<th scope="col">${s}</th>`).join("")}</tr></thead>
    <tbody>${d.reps.map(r=>`<tr><th scope="row">${esc(r.name)}<br><small>${esc(r.email)}</small></th><td>${r.active?"Active":"Disabled"}</td><td>${r.completed}/5</td><td>${r.logins}</td><td>${esc(date(r.last_login_at))}</td><td>${esc(date(r.last_activity))}</td><td>${r.businesses}</td><td>${esc(r.blocker||"None")}</td><td>${btn("team-hit", "View Hitlist",`data-id="${r.id}"`)}${r.active?btn("reset", "Reset access",`data-id="${r.id}"`):""}${btn("account",r.active?"Disable":"Enable",`data-id="${r.id}"`)}</td></tr>`).join("")||'<tr><td colspan="9">No BAMs have activated their accounts yet.</td></tr>'}</tbody></table></div></section>
    ${state.teamRows?`<section class="panel" id="team-hit"><h2>${esc(state.teamRows.name)}’s Hitlist</h2>${table(state.teamRows.rows)}</section>`:""}
    <section class="panel"><h2>Recent activity</h2>${d.events.map(e=>`<div class="mini-item"><strong>${esc(e.name)}</strong> · ${esc(e.kind)}${e.detail?` (${esc(e.detail)})`:""} <span class="meta">${esc(date(e.happened_at))}</span></div>`).join("")||"<p>No training activity yet.</p>"}</section></div>`:`<section class="panel"><h2>Team view unavailable</h2><p class="error">${esc(state.teamError)}</p>${btn("refresh-team","Try again")}</section>`);
}
function render(focus=false){
  document.querySelector("#app-nav").hidden=!state.user||teamMode;
  document.querySelector("#sign-out").hidden=!state.user||teamMode;
  main.innerHTML=(teamMode?team:!state.user?authView:({home,lesson,plan,coach,hitlist})[state.view])();
  document.querySelectorAll("nav [data-view]").forEach(btn=>{
    const current=(state.view==="lesson"?"home":state.view)===btn.dataset.view;
    if(current) btn.setAttribute("aria-current","page"); else btn.removeAttribute("aria-current");
  });
  if(focus){main.focus({preventScroll:true});window.scrollTo(0,0);}
}
function handleError(e){
  if(e.status===401&&state.user&&!teamMode){
    Object.assign(state,{user:null,view:"signin",rows:[],editing:null,answers:{},offer:null,plan:null,checks:[],blocker:null,completed:new Set()});render(true);
  }
  msg(e.message,true);
}
async function loadTeam(){
  try{state.team=await api("team");}catch(e){state.team=null;state.invite=null;state.teamRows=null;state.teamError=e.message;}
}
async function loadRows(){state.rows=(await api("hitlist")).rows;}
let busy=false;
async function run(work){
  if(busy)return;
  busy=true;main.setAttribute("aria-busy","true");
  try{await work();}catch(e){handleError(e);}finally{busy=false;main.removeAttribute("aria-busy");}
}
document.addEventListener("click",(event)=>{
  const button=event.target.closest("button[data-view],button[data-lesson],button[data-action],#sign-out");
  if(!button)return;
  void run(async()=>{
    const id=Number(button.dataset.id);
    const action=button.dataset.action;
    if(teamMode){
      if(action==="refresh-team"){await loadTeam();render(true);}
      if(action==="copy-code"){
        try{await navigator.clipboard.writeText(state.invite.code);msg("Code copied.");}catch{msg("Copy the displayed code manually.",true);}
      }
      if(["reset","account","team-hit"].includes(action)){
        const r=state.team?.reps.find(x=>x.id===id);if(!r)return;
        if(action==="team-hit"){
          state.teamRows={name:r.name,rows:(await api("team_hitlist",{id})).rows};render();document.querySelector("#team-hit").scrollIntoView();return;
        }
        if(action==="reset"){
          state.invite=await api("reset",{email:r.email});render(true);msg("Reset code created. Existing sessions end when it’s redeemed.");return;
        }
        if(r.active&&!window.confirm(`Disable access for ${r.name}? This will sign them out.`))return;
        await api("account_status",{id,active:!r.active});state.invite=null;await loadTeam();render();msg(r.active?"BAM access disabled.":"BAM access enabled.");
      }
      return;
    }
    if(!state.user){state.view=button.dataset.view==="join"?"join":"signin";render(true);return;}
    if(button.id==="sign-out"){await api("signout");location.assign("/bam-training");return;}
    if(action==="resolve"){await api("clear_blocker");state.blocker=null;render();return;}
    if(action==="toggle-archived"){state.showArchived=!state.showArchived;render();return;}
    if(action==="edit"){state.editing=state.rows.find(x=>x.id===id);render(true);document.querySelector("#hit-form input").focus();return;}
    if(action==="cancel-edit"){state.editing=null;render(true);return;}
    if(action==="archive"){
      if(!window.confirm("Archive this business? It will move out of the active Hitlist."))return;
      await api("archive_business",{id});if(state.editing?.id===id)state.editing=null;await loadRows();render();msg("Business archived.");return;
    }
    if(button.dataset.lesson!==undefined){state.view="lesson";state.lesson=Number(button.dataset.lesson);}
    else if(button.dataset.view){if(button.dataset.view==="hitlist")await loadRows();state.view=button.dataset.view;}
    render(true);
  });
});
main.addEventListener("submit",(event)=>{
  event.preventDefault();
  const form=event.target, fd=new FormData(form);
  const values=Object.fromEntries([...fd].map(([k,v])=>[k,String(v).trim()]));
  void run(async()=>{
  if(form.id==="auth-form"){
    values.password=String(fd.get("password")??"");
    await api(state.view==="join"?"join":"signin",values);
    await loadRep();render(true);
  } else if(form.id==="invite-form"){
    state.invite=await api("invite",values);render();msg("Invite created.");
  } else if(form.id==="hit-form"){
    await api("save_business",{...values,id:state.editing?.id});state.editing=null;state.showArchived=false;await loadRows();render();msg("Business saved.");
  } else if(form.id==="lesson-form"){
    const i=state.lesson,l=lessons[i],message=document.querySelector("#message");
    if(l.fields.some(([key])=>!values[key]) || (l.quiz && values.quiz!==String(l.correct??1))){
      message.className="message error";
      message.textContent=l.fields.some(([key])=>!values[key])?"Fill in each practice field before continuing.":"Not quite. Review the steps above and try again.";
      return;
    }
    await api("complete",{lesson:i,answers:values});state.answers[i]=values;state.completed.add(i);render();
    document.querySelector("#message").setAttribute("tabindex","-1");document.querySelector("#message").focus();
  } else if(form.id==="plan-form"){
    if(!values.market||!values.goal||!values.next){const m=document.querySelector("#message");m.className="message error";m.textContent="Enter a market, a goal, and a next action.";return;}
    const checks=fd.getAll("task");await api("gameplan",{...values,checks});
    state.plan={market:values.market,goal:values.goal,next:values.next};state.checks=checks;render();
    document.querySelector("#message").setAttribute("tabindex","-1");document.querySelector("#message").focus();
  } else if(form.id==="coach-form" && Object.hasOwn(blockers,values.block)){
    await api("blocker",{topic:values.block});state.blocker=values.block;render();document.querySelector(".help-result").setAttribute("tabindex","-1");document.querySelector(".help-result").focus();
  }
  });
});
void run(async()=>{
  if(teamMode){await loadTeam();render();return;}
  try{await loadRep();render();}catch(e){state.view="signin";render();if(e.status!==401)msg(e.message,true);}
});
