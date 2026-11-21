"use strict";
const main = document.querySelector("main");
const state = { view: "home", lesson: 0, completed: new Set(), answers: {}, plan: null, checks: [], blocker: null };
const promo = { price: "$199", code: "EARNOURBUSINESS" };
const handoffRecipients = ["mgarcia@shedlr.com", "dhernandez@shedlr.com"];
const handoffMail = `mailto:${handoffRecipients.join(",")}?subject=${encodeURIComponent("Shedlr handoff")}&body=${encodeURIComponent("Hi Lead Acquisition,\r\n\r\nBusiness name:\r\nIndustry:\r\nJobs discussed:\r\n\r\nThanks!")}`;
const lessons = [
  {title:"Choose a niche and city",time:5,desc:"Save a market and copy a search prompt to find local businesses."},
  {title:"Text businesses",time:10,desc:"Send a niche-specific inquiry and mark the step after your first reply."},
  {title:"Call the replies",time:8,desc:"Open with the text conversation, qualify fit, and offer the program link."},
  {title:"Send the link and follow up",time:5,desc:"Save only the businesses you sent a link to, then follow up if appropriate."},
  {title:"Hand off to Lead Acquisition",time:2,desc:"Send one email. Lead Acquisition takes it from there."}
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
const playbookFor = (category) => window.SHEDLR_BAM_PLAYBOOKS?.[category?.id];
const searchLinks = (query) => {
  const q=encodeURIComponent(query);
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
function marketOptions(categories, selected) {
  const groups = new Map();
  for (const item of categories) {
    const group = item.group || "";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(`<option${item===selected?" selected":""}>${esc(item.label)}</option>`);
  }
  return Array.from(groups, ([label, options]) =>
    label ? `<optgroup label="${esc(label)}">${options.join("")}</optgroup>` : options.join("")
  ).join("");
}
const copyBox=(id,title,value,label="Copy text")=>`<div class="note script-box"><label for="${id}"><strong>${title}</strong></label><textarea id="${id}" rows="${value.split("\n").length>4?9:4}" readonly>${esc(value)}</textarea><div class="actions">${btn("copy-script",label,`data-target="${id}"`)}</div><p class="message" id="${id}-feedback" role="status"></p></div>`;
const workflowDone=answers=>new Set(Object.keys(answers).map(Number).filter(i=>i===0||answers[i]?.workflow===2));
const linkedBusinesses=()=> (state.rows||[]).filter(r=>!r.archived&&["Link sent","Signed up"].includes(r.status));
const followupCandidates=()=>linkedBusinesses().filter(r=>r.status==="Link sent"&&r.last_link&&r.market.startsWith(`${activeCategory()?.label} · `)&&(!r.last_followup||r.last_followup<r.last_link));
function lesson(){
  const i=state.lesson,l=lessons[i],a=state.answers[0]||{},c=activeCategory(),done=state.completed.has(i);
  const niche=c?.label||a.industry||"your service",city=a.city||"your city",p=playbookFor(c);
  const page=c?.page, query=p?`${p.search} ${city}`:"";
  const name=String(state.user?.name||"").trim().split(/\s+/)[0]||"[your name]";
  const phoneField='<label>Business phone<input name="phone" type="tel" autocomplete="tel" required maxlength="40" placeholder="Public business number"></label>';
  let content;
  if(i===0){
    content=`<form id="lesson-form" class="labels"><label for="industry">Shedlr category<select id="industry" name="industry" required><option value="">Choose from ${state.categories?.length||0} categories</option>${marketOptions(state.categories||[],c)}</select></label>
      ${!state.categories?.length?'<p class="error">Category picker unavailable. Deploy the updated BAM Worker.</p>':""}
      <label for="city">City and state<input id="city" name="city" required maxlength="80" placeholder="Dallas, TX" value="${esc(a.city)}"></label><div class="actions"><button class="btn primary">Save market</button></div></form>
      ${p&&a.city?`<div class="note"><strong>Who to look for</strong><p>${esc(p.target)}</p></div>${copyBox("google-query","Google search",query,"Copy Google search")}
      ${copyBox("ai-query","AI research prompt",`Find up to 10 prospects in ${city} using this search: ${query}.\n\nWho to look for: ${p.target}\n\nReturn business name, city, public business phone and the URL that supports the fit. Use first-party websites or official business pages. Omit duplicates and leave missing fields blank.`,"Copy AI prompt")}<div class="actions">${searchLinks(query)}${page?`<a class="btn secondary" href="${esc(page)}" target="_blank" rel="noopener noreferrer">View program page ↗</a>`:""}</div>`:c&&a.city?'<p class="error">This playbook did not load. Refresh the page or try another category.</p>':""}`;
  }else if(i!==4&&(!c||!a.city)){
    content=`<p>Save a supported category and city to generate your scripts.</p>${lessonBtn(0,"Choose my niche and city")}`;
  }else if(i!==4&&!p){
    content=`<p class="error">This playbook did not load. Refresh the page or choose another category.</p>${lessonBtn(0,"Change category","secondary")}`;
  }else if(i===1){
    content=`<p>On an approved channel, send one short availability question. Introduce yourself and Shedlr when they reply, before discussing the program. Honor opt-outs.</p>
      ${copyBox("intro-text","First text",p.text)}
      <div class="actions">${btn("workflow-done","I’ve gotten my first text response")}</div>`;
  }else if(i===2){
    const example=`Here’s the kind of request we look to send your way: ${p.example} Would you take something like that? If this week is already full, would next week work better for a request like this?`;
    const close=`Like I said, I’m ${name} with Shedlr. If those are the kinds of requests you want, can I text you our website link? You can check it out and sign up there if it’s a fit. I’ll send you a promo code as a thank-you for helping us out.`;
    const send="Thanks, I’ll text you the link right now.";
    content=`<p>Call businesses that replied and are open to talking. Confirm fit before sending a link.</p>
      ${copyBox("call-script","Phone call flow",`OPENER: Hey, this is ${name} with Shedlr. We texted about ${p.focus} in ${city}. I just had a couple questions about your business.\n\nQUALIFY:\n${p.questions.join("\n")}\n\nEXAMPLE: ${example}\n\nCLOSE: ${close}\n\nIF THEY SAY YES: ${send}`, "Copy call flow")}
      <div class="note"><strong>How the conversation might sound</strong>
        <p><strong>Rep:</strong> ${esc(example)}</p>
        <p><strong>Business:</strong> ${esc(p.answer)}</p>
        <p><strong>Rep:</strong> ${esc(close)}</p>
        <p><strong>Business:</strong> Sure, send it over.</p>
        <p><strong>Rep:</strong> ${esc(send)}</p>
      </div>
      <div class="actions">${btn("workflow-done","I’ve made a qualifying call")}</div>`;
  }else if(i===3){
    content=`<p>Send the program link after the business agrees to receive it. Use your approved number so they can text you back directly.</p>
      ${page?copyBox("send-link","Landing-page text",`Here’s the link:\nhttps://shedlr.com${page}\n\nIt’s month to month with no long-term commitment. Just enter your business info to sign up. Let me know when you’re ready and I’ll send you the promo code as a thank-you for helping us out. It’ll help lower the cost of getting started.\n\nOnce you’re signed up, I’ll get our Lead Acquisition team set up to send you matching client inquiries. Looking forward to working with you!\n\nIt’s ${name} again. If you need anything, you can text me right here.`):'<p class="error">The program link is unavailable for this category. Ask the owner for the approved link.</p>'}
      ${copyBox("promo-text","When they ask for the code",`Use ${promo.code} at checkout for the ${promo.price} offer.`)}
      ${copyBox("followup-text","Follow-up after about two hours",`Hey, following up on the Shedlr link. ${p.nudge} Happy to answer questions or send the promo code.`)}
      <p class="muted">Follow up once if they agreed to hear from you and haven’t replied after about two hours. Stop if they decline or opt out. Nothing sends automatically.</p>
      ${followupCandidates().length?`<div class="note"><strong>Check for replies</strong>${followupCandidates().slice(0,12).map(r=>{const due=new Date(Date.parse(r.last_link)+7200000);return `<div class="mini-item">${esc(r.business)} · ${due.getTime()<=Date.now()?"Review now if no reply":`Review at ${esc(date(due))}`}${due.getTime()<=Date.now()?` <button type="button" class="btn secondary" data-action="log-outreach" data-id="${r.id}" data-channel="followup">Log follow-up sent</button>`:""}</div>`;}).join("")}</div>`:""}
      <form id="link-record-form" class="labels"><h2>Log a link you sent</h2><label>Business name<input name="business" required maxlength="140"></label><label>Business location<input name="location" required maxlength="${120-niche.length-3}" placeholder="${esc(city)}"></label>${phoneField}<div class="actions"><button class="btn primary">Record link sent</button>${navBtn("hitlist","Open Hitlist")}</div></form>`;
  }else{
    content=`<div class="note"><strong>Send one email to both</strong><p>${handoffRecipients.join("<br>")}</p>
      <strong>Include these three details</strong><ul><li>Business name</li><li>Industry</li><li>Jobs discussed</li></ul></div>
      <div class="actions"><a class="btn primary" href="${esc(handoffMail)}">Open email draft</a>${done?"":btn("workflow-done","I sent the handoff email")}</div>
      <p class="muted">Fill in the three details and send it from your email app. No customer update is needed; Lead Acquisition handles the next steps.</p>`;
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
  Object.assign(state,{user:d.user,answers:d.answers,completed:workflowDone(d.answers),plan:d.plan,checks:d.plan?.checks||[],blocker:d.blocker,categories:d.categories,view:"home",rows:[],editing:null,hitFilter:"all"});
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
    Object.assign(state,{user:null,view:"signin",rows:[],editing:null,answers:{},plan:null,checks:[],blocker:null,completed:new Set()});render(true);
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
      const step=state.lesson;
      await api("workflow_step",{step,...(step===4?{sent:true}:{})});
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
      if(step===3)await loadRows();
      state.view="lesson";state.lesson=step;
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
