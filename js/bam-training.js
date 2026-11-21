"use strict";
const main = document.querySelector("main");
const state = { view: "home", lesson: 0, completed: new Set(), answers: {}, plan: null, checks: [], blocker: null };
const promo = { price: "$199", code: "EARNOURBUSINESS" };
const lessons = [
  {title:"Choose a niche and city",time:5,desc:"Save a market and copy a search prompt to find local businesses."},
  {title:"Text businesses",time:10,desc:"Send a niche-specific inquiry and wait for your first reply."},
  {title:"Call the replies",time:8,desc:"Open with the text conversation, qualify fit, and offer the program link."},
  {title:"Send the link and follow up",time:5,desc:"Save only the businesses you sent a link to, then follow up if appropriate."},
  {title:"Hand off to Lead Acquisition",time:7,desc:"Verify signup, then draft the internal email and customer update."}
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
const currentMarket = () => state.answers[0]?.industry&&state.answers[0]?.city?`${state.answers[0].industry} · ${state.answers[0].city}`:"";
const activeCategory = () => state.categories?.find(c=>c.label.toLowerCase()===String(state.answers[0]?.industry||"").toLowerCase());
const searchLinks = () => {
  if(!currentMarket())return lessonBtn(0,"Choose a niche and city","secondary");
  const q=encodeURIComponent(`${state.answers[0].industry} businesses in ${state.answers[0].city}`);
  return `<a class="btn secondary" href="https://www.google.com/search?q=${q}" target="_blank" rel="noopener noreferrer">Search Google ↗</a>
          <a class="btn secondary" href="https://www.google.com/maps/search/?api=1&amp;query=${q}" target="_blank" rel="noopener noreferrer">Search Google Maps ↗</a>`;
};

function home(){
  const i = lessons.findIndex((_,n)=>!state.completed.has(n));
  const next = lessons[i];
  return head("BAM workspace","Your next actions","Pick a market, work your prospect list, and keep your follow-ups moving.") +
    `<div class="layout"><div class="stack">
      <section class="banner" data-index="${next ? String(i+1).padStart(2,"0") : "05"}">
        <p class="eyebrow">${next ? `Your next action / Step ${String(i+1).padStart(2,"0")}` : "Setup complete"}</p>
        <h2>${next?.title ?? "Work your prospect list"}</h2>
        <p>${next?.desc ?? "Review due follow-ups, contact the next business, or add prospects to your market."}</p>
        ${next ? lessonBtn(i,`${i===0?"Choose my market":"Continue setup"} <span aria-hidden="true">→</span>`,"gold") : navBtn("hitlist","Work my Hitlist","gold")}
      </section>
      <section><div class="section-head"><h2>Fast Start</h2><span>5 practical steps</span></div>
      <ol class="roadmap">${lessons.map((l,n)=>{
        const d=state.completed.has(n), here=n===i;
        return `<li><button class="row ${d?"done":here?"next":""}" data-lesson="${n}"><span class="number" aria-hidden="true">${d?"✓":String(n+1).padStart(2,"0")}</span><span><strong>${l.title}</strong><small>${l.desc}</small></span><span class="status ${d||here?"":"time"}">${d?"Complete":here?"Up next":`${l.time} min`}</span></button></li>`;
      }).join("")}</ol></section>
    </div><aside class="stack"><section class="panel"><h2>My Hitlist</h2><p class="muted">${esc(currentMarket()||"No market selected yet.")} Use the Hitlist to add prospects, log outreach, or check follow-ups.</p>${navBtn("hitlist","Open Hitlist")}</section>${progress()}<section class="panel"><h2>Daily Gameplan</h2><p class="muted">Set a focus and leave yourself a next action.</p>${navBtn("plan","Open gameplan →")}</section><section class="panel"><h2>Need a hand?</h2><p class="muted">Get a next step when a call, follow-up, or signup stalls.</p>${navBtn("coach","I’m blocked →")}</section></aside></div>`;
}
const scripts = {
  "auto-detailing":["do an interior and exterior detail","An SUV needs pet hair removed from its interior and a wash and wax before a weekend trip."],
  "auto-commercial-detailing":["detail fleet vehicles","A local company wants six work vans detailed on-site over two mornings."],
  "junk-removal":["haul away shed debris","Jim needs a demolished 10×12 shed hauled off so he can begin construction on a new one."],
  "house-cleaning":["handle a move-out clean","A renter needs a two-bedroom move-out clean after the furniture is removed."],
  "dog-training":["take on a dog-training client","A dog owner wants help with leash pulling and door manners for an energetic young dog."],
  "roofing":["schedule a roof inspection","A homeowner noticed water staining after a storm and wants an inspection and repair estimate."],
  "landscaping":["handle a lawn cleanup","A homeowner wants an overgrown front yard trimmed and the clippings hauled away."],
  "hvac":["take an A/C service call","A homeowner’s A/C runs but isn’t cooling and they want a diagnostic visit."],
  "moving":["help with a local move","A resident is moving from a two-bedroom apartment to a nearby house and needs a crew and truck."]
};
const copyBox=(id,title,value,label="Copy text")=>`<div class="note script-box"><label for="${id}"><strong>${title}</strong></label><textarea id="${id}" rows="${value.split("\n").length>4?9:4}" readonly>${esc(value)}</textarea><div class="actions">${btn("copy-script",label,`data-target="${id}"`)}</div><p class="message" id="${id}-feedback" role="status"></p></div>`;
const workflowDone=answers=>new Set(Object.keys(answers).map(Number).filter(i=>i===0||answers[i]?.workflow===2));
const linkedBusinesses=()=> (state.rows||[]).filter(r=>!r.archived&&["Link sent","Signed up"].includes(r.status));
const followupCandidates=()=>linkedBusinesses().filter(r=>r.status==="Link sent"&&r.last_link&&r.market.startsWith(`${activeCategory()?.label} · `)&&(!r.last_followup||r.last_followup<r.last_link));
function lesson(){
  const i=state.lesson,l=lessons[i],a=state.answers[0]||{},c=activeCategory(),done=state.completed.has(i);
  const niche=c?.label||a.industry||"your service",city=a.city||"your city";
  const [service,scenario]=scripts[c?.id]||[`take on ${niche.toLowerCase()} work`,`Jim is looking for a local ${niche.toLowerCase()} provider, wants a clear quote, and hopes to get started within two weeks.`];
  const name=String(state.user?.name||"").trim().split(/\s+/)[0]||"[your name]";
  const phoneField='<label>Business phone<input name="phone" type="tel" autocomplete="tel" required maxlength="40" placeholder="Public business number"></label>';
  let content;
  if(i===0){
    content=`<form id="lesson-form" class="labels"><label for="industry">Shedlr category<select id="industry" name="industry" required><option value="">Choose from ${state.categories?.length||0} categories</option>${(state.categories||[]).map(item=>`<option ${item===c?"selected":""}>${esc(item.label)}</option>`).join("")}</select></label>
      ${!state.categories?.length?'<p class="error">Category picker unavailable. Deploy the updated BAM Worker.</p>':""}
      <label for="city">City and state<input id="city" name="city" required maxlength="80" placeholder="Dallas, TX" value="${esc(a.city)}"></label><div class="actions"><button class="btn primary">Save market</button></div></form>
      ${c&&a.city?`${copyBox("google-query","Google search",`small independent ${niche.toLowerCase()} businesses in ${city}`,"Copy Google search")}
      ${copyBox("ai-query","AI research prompt",`Find 10 small independent ${niche.toLowerCase()} businesses serving ${city}. Use the businesses’ own websites or official pages. Return business name, city, public business phone, and the source URL in a table. Exclude chains, duplicate listings, and businesses that do not clearly offer the service. Do not guess missing details.`,"Copy AI prompt")}<div class="actions">${searchLinks()}</div>`:""}`;
  }else if(!c||!a.city){
    content=`<p>Save a supported category and city to generate your scripts.</p>${lessonBtn(0,"Choose my niche and city")}`;
  }else if(i===1){
    content=`<p>Use an approved texting channel only where you have permission. Introduce yourself as Shedlr, ask about availability, and honor opt-outs.</p>
      ${copyBox("intro-text","First text",`Hey, this is ${name} with Shedlr. Are you available to ${service} in ${city} this week or next? I’m checking availability for our local provider network. If you’re open to hearing about it, is there a good time for a quick call?`)}
      <div class="actions">${btn("workflow-done","I’ve gotten my first text response")}</div>`;
  }else if(i===2){
    content=`<p>Call businesses that replied and are open to talking. Confirm fit before sending a link.</p>
      <div class="note"><strong>Roleplay job brief</strong><p>Jim Stanly · ${esc(city)} · Practice site: 100 Example Lane (not a real address)</p><p>${esc(scenario)}</p><p>Use this to illustrate the kind of request Shedlr may match. Share a real address only for a verified lead when authorized.</p></div>
      ${copyBox("call-script","Phone call flow",`OPENER: Hey, this is ${name} with Shedlr. I was the one texting you about ${niche.toLowerCase()} work in ${city}. I just had a couple questions about your business.\n\nQUALIFY: Which ZIP codes do you cover? What types or sizes of jobs are a good fit? What’s your availability? Who’s the best person to contact about a new lead?\n\nEXAMPLE: Here’s the kind of request we look to match: ${scenario} Is that the kind of work you take?\n\nCLOSE: You sound like a good fit. Can I send you our Shedlr program page? It’s a paid lead service. If it looks right for your business, you can sign up there. I can share a promo code if you’d like.`, "Copy call flow")}
      <div class="actions">${btn("workflow-done","I’ve made a qualifying call")}</div>`;
  }else if(i===3){
    content=`<p>Send the program link only after the conversation went well and the business agreed to receive it.</p>
      ${c.page?copyBox("send-link","Landing-page text",`Here’s the Shedlr program page we discussed: https://shedlr.com${c.page}. It explains how our paid lead service works. Just let me know when you need the promo code.`):'<div class="note">This category has no dedicated public page. Ask the owner for the approved link before sending it.</div>'}
      ${copyBox("promo-text","When they ask for the code",`Use ${promo.code} at checkout for the ${promo.price} offer. Please review the billing and renewal terms at checkout before signing up. Let me know if you have any questions.`)}
      ${copyBox("followup-text","Follow-up after about two hours",`Hey, just following up on the Shedlr link I sent. Are you still interested in the ${niche.toLowerCase()} program in ${city}? If you have questions or want the promo code, I’m happy to help. If it’s not a fit, no worries.`)}
      <p class="muted">Follow up once if they agreed to hear from you and haven’t replied after about two hours. Stop if they decline or opt out. Nothing sends automatically.</p>
      ${followupCandidates().length?`<div class="note"><strong>Check for replies</strong>${followupCandidates().slice(0,12).map(r=>{const due=new Date(Date.parse(r.last_link)+7200000);return `<div class="mini-item">${esc(r.business)} · ${due.getTime()<=Date.now()?"Review now if no reply":`Review at ${esc(date(due))}`}${due.getTime()<=Date.now()?` <button type="button" class="btn secondary" data-action="log-outreach" data-id="${r.id}" data-channel="followup">Log follow-up sent</button>`:""}</div>`;}).join("")}</div>`:""}
      <form id="link-record-form" class="labels"><h2>Log a link you sent</h2><label>Business name<input name="business" required maxlength="140"></label><label>Business location<input name="location" required maxlength="${120-niche.length-3}" placeholder="${esc(city)}"></label>${phoneField}<div class="actions"><button class="btn primary">Record link sent</button>${navBtn("hitlist","Open Hitlist")}</div></form>`;
  }else{
    const recipients=state.handoffs||[];
    const draft=state.handoffDraft;
    content=`<p>Verify signup and payment in the approved system first. Then send the handoff email. Give an end-of-business commitment only if Acquisition confirms it.</p>
      <div class="note"><strong>Internal recipients</strong>${recipients.length?recipients.map(esc).join(" and "):"Internal routing isn’t configured. Ask the owner to confirm the two email addresses."}</div>
      <form id="handoff-form" class="labels"><label>Business<select name="row" required><option value="">Choose a business with a sent link</option>${linkedBusinesses().map(r=>`<option value="${r.id}" ${draft?.row===r.id?"selected":""}>${esc(r.business)} · ${esc(r.market)}</option>`).join("")}</select></label>
      <label>Industry<input name="industry" required maxlength="140" value="${esc(draft?.industry||niche)}"></label>
      <label>Work discussed and any verified commitments<textarea name="work" required maxlength="1000" placeholder="Services, job types, scope, and any specific commitments. Write “none” if no specific jobs were committed.">${esc(draft?.work)}</textarea></label>
      <label class="check-inline"><input name="verified" type="checkbox" required ${draft?"checked":""}> I verified signup and payment.</label>
      <label class="check-inline"><input name="confirmed" type="checkbox" ${draft?.confirmed?"checked":""}> Acquisition confirmed contact by end of business today.</label>
      <div class="actions"><button class="btn primary" ${linkedBusinesses().length?"":"disabled"}>Prepare handoff</button>${lessonBtn(3,"Back to link and follow-up","secondary")}</div></form>
      ${draft?`${copyBox("handoff-email","Internal email draft",draft.email,"Copy handoff email")}${copyBox("customer-update","Customer update",draft.customer)}
      <div class="actions">${btn("workflow-done","I sent the handoff email")}</div>`:""}`;
  }
  return `<div class="back">${navBtn("home","← My workspace")}</div>`+head(`Step ${String(i+1).padStart(2,"0")} / 05`,l.title,l.desc)+
    `<div class="layout"><article class="panel stack lesson-content">${content}${feedback}
    ${done?`<div class="actions">${i===4?navBtn("hitlist","Work my Hitlist"):lessonBtn(i+1,"Next step →","secondary")}</div>`:""}</article>
    <aside class="stack">${progress()}<div class="note"><strong>Saved market</strong>${esc(currentMarket()||"No market saved yet.")}${i!==0?`<div class="actions">${lessonBtn(0,"Change market","secondary")}</div>`:""}</div></aside></div>`;
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
const statuses=["Prospect","Interested","Follow-up agreed","Link sent","Signed up","Closed / not a fit","Do not contact"];
const terminal=new Set(statuses.slice(-3));
const localDay=()=>{
  const today=new Date();
  return `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
};
const date=(value)=>value?new Date(value).toLocaleString():"Not yet";
const msg=(text,fail=false,target="message")=>{
  let m=document.getElementById(target);
  if(!m){
    m=document.createElement("p");m.id=target;m.setAttribute("role","status");main.prepend(m);
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
  Object.assign(state,{user:d.user,answers:d.answers,completed:workflowDone(d.answers),plan:d.plan,checks:d.plan?.checks||[],blocker:d.blocker,handoffs:d.handoffs,categories:d.categories,view:"home",rows:[],editing:null,hitFilter:"all",handoffDraft:null});
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
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="Hitlist spreadsheet"><table><thead><tr>${["Business","Business contact","Market","Status","Next follow-up","Outreach logged","Notes",...(edit?["Actions"]:[])].map(x=>`<th scope="col">${x}</th>`).join("")}</tr></thead>
   <tbody>${rows.map(r=>`<tr><th scope="row">${esc(r.business)}</th><td>${esc(r.contact)}</td><td>${esc(r.market)}</td><td>${esc(r.status)}${r.archived?" · Archived":""}</td><td>${esc(r.followup)}</td><td>${[["Text",r.last_text],["Call",r.last_call],["Follow-up",r.last_followup]].filter(([,t])=>t).map(([label,t])=>`<div>${label}: ${esc(date(t))}</div>`).join("")||"None"}</td><td>${esc(r.notes).replaceAll("\n","<br>")}</td>${edit?`<td>${r.archived?"":(!terminal.has(r.status)?["text","call","followup"].map((channel,i)=>btn("log-outreach",["Log text","Log call","Log follow-up"][i],`data-id="${r.id}" data-channel="${channel}"`)).join(""):"")+btn("edit","Edit",`data-id="${r.id}"`)+btn("archive","Archive",`data-id="${r.id}"`)}</td>`:""}</tr>`).join("")||`<tr><td colspan="${edit?8:7}">No businesses to show.</td></tr>`}</tbody></table></div>`;
}
function hitlist(){
  const r=state.editing||{};
  const filters={all:"All active",due:"Due follow-ups",archive:"Archived"};
  const rows=(state.rows||[]).filter(row=>state.hitFilter==="archive"?row.archived:!row.archived&&(state.hitFilter!=="due"||row.followup&&row.followup<=localDay()&&!terminal.has(row.status)));
  return head("Your pipeline","Hitlist","Keep track of businesses you sent a link to. Outreach buttons record what you’ve done; they do not send texts or place calls.")+
    `<div class="stack">
    <section class="panel"><div class="section-head"><h2>${filters[state.hitFilter]||filters.all}</h2><span>${rows.length} businesses</span></div>
    <div class="actions" aria-label="Filter Hitlist">${Object.entries(filters).map(([k,label])=>btn("hit-filter",label,`data-filter="${k}" aria-pressed="${k===state.hitFilter}"`)).join("")}${lessonBtn(3,"Record a link sent","primary")}</div><p class="muted">Due follow-ups include dates through today. Don’t text without permission, and mark opt-outs Do not contact.</p>${feedback}
    ${table(rows,true)}</section>
    ${r.id?`<section class="panel"><h2>Edit business</h2>
    <form id="hit-form" class="labels"><div class="fields">
    <label>Business<input name="business" required maxlength="140" value="${esc(r.business)}"></label>
    <label>Business contact<input name="contact" maxlength="200" placeholder="Name, work email or business phone" value="${esc(r.contact)}"></label>
    <label>Market<input name="market" maxlength="120" placeholder="Service and city" value="${esc(r.id?r.market:currentMarket())}"></label>
    <label>Status<select name="status">${statuses.map(s=>`<option ${s===r.status?"selected":""}>${s}</option>`).join("")}</select></label>
    <label>Agreed follow-up date<input name="followup" type="date" value="${esc(r.followup)}"></label></div>
    <label>Notes<textarea name="notes" maxlength="1000">${esc(r.notes)}</textarea></label>
    <div class="actions"><button class="btn primary">Save business</button>${btn("cancel-edit","Cancel edit")}</div></form><p id="hit-form-message" class="message" role="status"></p></section>`:""}</div>`;
}
function team(){
  const d=state.team;
  return `<div class="back">${businessLink}</div>`+head("Shedlr owner workspace","BAM Training","Manage rep access and see who’s making progress without mixing training into your Business dashboard.")+
    (d?`<div class="stack">
    ${d.handoffsReady?"":'<div class="note"><strong>Internal handoff setup needed</strong>Configure the Worker’s BAM_TRAINING_HANDOFFS secret to show the two internal addresses in Step 5. Reps can see and share the promo code without it.</div>'}
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
    Object.assign(state,{user:null,view:"signin",rows:[],editing:null,answers:{},handoffs:null,handoffDraft:null,plan:null,checks:[],blocker:null,completed:new Set()});render(true);
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
    if(action==="copy-script"){
      const field=document.getElementById(button.dataset.target), status=document.getElementById(`${button.dataset.target}-feedback`);
      try{await navigator.clipboard.writeText(field.value);status.textContent="Copied.";}
      catch{field.focus();field.select();status.textContent="Copy the selected text manually.";}
      return;
    }
    if(action==="workflow-done"){
      const step=state.lesson,d=state.handoffDraft;
      if(step===4&&!d)return;
      await api("workflow_step",{step,...(step===4?{id:d.row,verified:true}:{})});
      if(step===4){await loadRows();state.handoffDraft=null;}
      state.completed.add(step);render();msg(step===4?"Handoff logged.":"Action marked complete.");
      return;
    }
    if(action==="resolve"){await api("clear_blocker");state.blocker=null;render();return;}
    if(action==="hit-filter"){state.hitFilter=button.dataset.filter;render();document.querySelector(`[data-filter="${state.hitFilter}"]`)?.focus();return;}
    if(action==="log-outreach"){
      const channel=button.dataset.channel;
      await api("log_outreach",{id,channel});await loadRows();render();msg("Outreach logged.");
      document.querySelector(`[data-id="${id}"][data-channel="${channel}"]`)?.focus({preventScroll:true});
      return;
    }
    if(action==="edit"){state.editing=state.rows.find(x=>x.id===id);render(true);document.querySelector("#hit-form input").focus();return;}
    if(action==="cancel-edit"){state.editing=null;render(true);return;}
    if(action==="archive"){
      if(!window.confirm("Archive this business? It will move out of the active Hitlist."))return;
      await api("archive_business",{id});if(state.editing?.id===id)state.editing=null;await loadRows();render();msg("Business archived.");return;
    }
    if(button.dataset.lesson!==undefined){
      const step=Number(button.dataset.lesson);
      if(step===3||step===4)await loadRows();
      state.view="lesson";state.lesson=step;state.handoffDraft=null;
    }
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
    try{await api("save_business",{...values,id:state.editing?.id});}catch(e){if(e.status===401)throw e;msg(e.message,true,"hit-form-message");return;}
    state.editing=null;state.hitFilter="all";await loadRows();render();msg("Business saved.",false,"hit-form-message");
  } else if(form.id==="lesson-form"){
    if(!values.city||!state.categories?.some(c=>c.label===values.industry)){msg("Choose a category and enter your city and state.",true);return;}
    await api("complete",{lesson:0,answers:values});
    state.answers[0]=values;state.completed.add(0);render();msg("Market saved. Your search prompts are ready.");
  } else if(form.id==="link-record-form"){
    await api("record_link",values);await loadRows();state.completed.add(3);render();msg("Business saved as Link sent.");
  } else if(form.id==="handoff-form"){
    const row=linkedBusinesses().find(r=>r.id===Number(values.row));
    if(!row||!/^[+()\d.\s-]+$/.test(row.contact)||!/^\d{10,15}$/.test(row.contact.replace(/\D/g,""))||!values.industry||!values.work||!fd.has("verified")){msg("Use a business with a valid phone number in the Hitlist and complete all handoff fields.",true);return;}
    const confirmed=fd.has("confirmed");
    const email=[`To: ${(state.handoffs||[]).join(", ")||"[confirm Lead Acquisition recipients with owner]"}`,`Subject: Shedlr signup handoff: ${row.business.replace(/[\r\n]+/g," ")}`,"","Hi Lead Acquisition,","I verified signup and payment for this business. Please reach out to confirm service fit and next steps.","",`Business: ${row.business}`,`Business phone: ${row.contact}`,`Market/location: ${row.market}`,`Industry: ${values.industry}`,`Work discussed and verified commitments: ${values.work}`,"",confirmed?"Please reach out by end of business today, as confirmed.":"Please confirm the expected contact time so I can update the business.",`Thanks, ${state.user.name}`].join("\n");
    const customer=confirmed?"Thanks for signing up with Shedlr. I’m sending your information to Lead Acquisition, and they’ve confirmed they’ll contact you by end of business today to go over the work you’re looking for and next steps.":"Thanks for signing up with Shedlr. I’m sending your information to Lead Acquisition. They’ll be in touch to go over the work you’re looking for and next steps. I’ll follow up once I have a confirmed timeframe.";
    state.handoffDraft={row:row.id,industry:values.industry,work:values.work,confirmed,email,customer};render();
    document.getElementById("handoff-email")?.focus();
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
