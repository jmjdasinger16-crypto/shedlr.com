const $=(selector)=>document.querySelector(selector);
const loginSection=$('[data-admin-login]');
const dashboard=$('[data-admin-dashboard]');
const loginForm=$('[data-admin-login-form]');
const loginMessage=$('[data-admin-login-message]');
const metrics=$('[data-admin-metrics]');
const pagesTable=$('[data-pages-table]');
const ordersTable=$('[data-orders-table]');
const leadsTable=$('[data-leads-table]');
const businessesTable=$('[data-businesses-table]');
const eventsTable=$('[data-events-table]');
const orderSearch=$('[data-order-search]');
const search=$('[data-lead-search]');
const leadCategoryFilter=$('[data-lead-category-filter]');
const businessSearch=$('[data-business-search]');
const filterForm=$('[data-dashboard-filter]');
const filterFrom=$('[data-filter-from]');
const filterTo=$('[data-filter-to]');
const filterStatus=$('[data-filter-status]');
const leadDialog=$('[data-lead-dialog]');
const businessDialog=$('[data-business-dialog]');
const orderDialog=$('[data-order-dialog]');
let orders=[];let leads=[];let businesses=[];
let activeLead=null;let activeBusiness=null;let activeBusinessDetail=null;let activeOrder=null;

const CATEGORIES=["personal-trainer","life-coach","counseling","mental-health-clinician","maintenance","dog-walker","house-cleaning","landscaping","tutoring","photography","handyman","moving","catering","event-planning","home-insurance","vehicle-insurance","roofing","auto-hail-damage","home-services","hvac","plumbing","garage-door-services","auto-mechanic","pest-control","solar","real-estate","car-sales","cell-phone-sales","internet-cable-sales","tax-prep","gym-sales","home-remodeling","nail-lash-stylist","junk-removal","auto-detailing","auto-commercial-detailing","insurance","meal-prep"];
const CATEGORY_LABELS={"personal-trainer":"Personal Trainer","life-coach":"Life Coach","counseling":"Counseling","mental-health-clinician":"Mental Health Clinician","maintenance":"Maintenance","dog-walker":"Dog Walker","house-cleaning":"House Cleaning","landscaping":"Landscaping","tutoring":"Tutoring","photography":"Photography","handyman":"Handyman","moving":"Moving Services","catering":"Catering","event-planning":"Event Planning","home-insurance":"Home Insurance","vehicle-insurance":"Vehicle Insurance","roofing":"Roofing","auto-hail-damage":"Auto Hail Damage","home-services":"Home Services","hvac":"HVAC","plumbing":"Plumbing","garage-door-services":"Garage Door Services","auto-mechanic":"Auto Mechanic / Auto Repair","pest-control":"Pest Control","solar":"Solar","real-estate":"Real Estate","car-sales":"Car Sales","cell-phone-sales":"Cell Phone Sales","internet-cable-sales":"Internet & Cable Sales","tax-prep":"Tax Preparation","gym-sales":"Gym Membership Sales","home-remodeling":"Home Remodeling","nail-lash-stylist":"Nail & Lash Stylists","junk-removal":"Junk Removal","auto-detailing":"Auto Detailing","auto-commercial-detailing":"Fleet & Commercial Detailing","insurance":"Insurance (general)","meal-prep":"Meal Prep"};
const catLabel=(c)=>CATEGORY_LABELS[c]||c||'—';

const esc=(value)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=(value)=>value?new Date(value).toLocaleString():'—';
const fmtMoney=(cents)=>`$${(Number(cents||0)/100).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const toLocalInput=(date)=>{const offset=date.getTimezoneOffset();return new Date(date.getTime()-offset*60000).toISOString().slice(0,16);};

async function api(path,options={}){
  const response=await fetch(path,{credentials:'same-origin',...options,headers:{'content-type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));
  const isLoginRequest=path==='/api/admin/login';
  if(response.status===401&&!isLoginRequest){showLogin();throw new Error('Your session has expired. Please sign in again.');}
  if(!response.ok)throw new Error(data.error||`Request failed with status ${response.status}.`);
  return data;
}

function showLogin(){loginSection.hidden=false;dashboard.hidden=true;}
function showDashboard(){loginSection.hidden=true;dashboard.hidden=false;}

function renderMetrics(data){
  const items=[['Visits',data.visits],['Unique visitors',data.unique_visitors],['Orders',data.orders],['Revenue',fmtMoney(data.revenue_cents)],['Paid',fmtMoney(data.paid_cents)]];
  metrics.innerHTML=items.map(([label,value])=>`<article class="metric"><strong>${esc(label==='Visits'||label==='Unique visitors'||label==='Orders'?Number(value||0).toLocaleString():value)}</strong><span>${esc(label)}</span></article>`).join('');
}

function renderPages(rows){
  pagesTable.innerHTML=rows.map(page=>`<tr><td><strong>${esc(page.page_path||'—')}</strong></td><td>${Number(page.views||0).toLocaleString()}</td><td>${Number(page.unique_visitors||0).toLocaleString()}</td><td>${fmt(page.last_activity)}</td></tr>`).join('')||'<tr><td colspan="4">No page activity found.</td></tr>';
}

function renderOrders(rows){
  ordersTable.innerHTML=rows.map(order=>`<tr><td><strong>${esc(order.business_name||order.name)}</strong></td><td>${esc(order.email)}<br>${esc(order.phone)}</td><td>${esc(catLabel(order.category))}</td><td>${order.quantity}</td><td>${fmtMoney(order.total_cents)}</td><td><span class="status">${esc(order.status)}</span></td><td>${order.fulfilled_leads||0}/${order.quantity}</td><td>${fmt(order.submitted_at)}</td><td><button type="button" data-open-order="${order.id}">View</button></td></tr>`).join('')||'<tr><td colspan="9">No orders found.</td></tr>';
}

/* ── Lead multi-select: pick leads straight from the table and delete them in bulk,
      without opening each one. Selection is keyed on lead id so it survives re-renders
      (search, category filter, reload) and only ever deletes ids still in `leads`. ── */
const selectedLeadIds=new Set();
let renderedLeadIds=[];
let lastClickedLeadId=null;

function currentLeadRows(){
  const q=(search?.value||'').trim().toLowerCase();
  return !q?leads:leads.filter(l=>[l.name,l.email,l.phone,l.category,l.city].some(v=>String(v||'').toLowerCase().includes(q)));
}

function renderLeads(rows){
  renderedLeadIds=rows.map(l=>String(l.id));
  leadsTable.innerHTML=rows.map(lead=>`<tr${selectedLeadIds.has(String(lead.id))?' class="row-selected"':''}><td class="select-col"><input type="checkbox" data-lead-select="${lead.id}"${selectedLeadIds.has(String(lead.id))?' checked':''} aria-label="Select ${esc(lead.name||'lead')}"></td><td><strong>${esc(lead.name)}</strong></td><td>${esc(lead.email||'—')}<br>${esc(lead.phone||'—')}</td><td>${esc(catLabel(lead.category))}</td><td>${esc(lead.city||'—')}${lead.state?', '+esc(lead.state):''}</td><td><span class="status">${esc(lead.status||'new')}</span></td><td>${esc(lead.assigned_to||'—')}</td><td>${fmt(lead.submitted_at)}</td><td><button type="button" data-open-lead="${lead.id}">View</button></td></tr>`).join('')||'<tr><td colspan="9">No leads found.</td></tr>';
  syncLeadSelectionUi();
}

function visibleSelectedLeadIds(){
  return renderedLeadIds.filter(id=>selectedLeadIds.has(id));
}

function syncLeadSelectionUi(){
  const count=visibleSelectedLeadIds().length;
  const button=$('[data-leads-delete-selected]');
  const status=$('[data-leads-selection-status]');
  const selectAll=$('[data-leads-select-all]');
  if(button){
    button.hidden=count===0;
    button.textContent=count?`Delete ${count} selected`:'Delete selected';
  }
  if(status&&!status.dataset.busy){
    status.textContent=count?`${count} of ${renderedLeadIds.length} shown lead${renderedLeadIds.length===1?'':'s'} selected. Shift-click a checkbox to select a range.`:'';
  }
  if(selectAll){
    selectAll.checked=count>0&&count===renderedLeadIds.length;
    selectAll.indeterminate=count>0&&count<renderedLeadIds.length;
  }
}

function setLeadSelected(id,selected){
  id=String(id);
  if(selected)selectedLeadIds.add(id);else selectedLeadIds.delete(id);
  const box=leadsTable.querySelector(`[data-lead-select="${id}"]`);
  if(box){box.checked=selected;box.closest('tr')?.classList.toggle('row-selected',selected);}
}

leadsTable.addEventListener('click',event=>{
  const box=event.target.closest('[data-lead-select]');
  if(!box)return;
  const id=String(box.dataset.leadSelect);
  if(event.shiftKey&&lastClickedLeadId!==null){
    const from=renderedLeadIds.indexOf(lastClickedLeadId), to=renderedLeadIds.indexOf(id);
    if(from!==-1&&to!==-1){
      renderedLeadIds.slice(Math.min(from,to),Math.max(from,to)+1).forEach(rid=>setLeadSelected(rid,box.checked));
    }
  }else{
    setLeadSelected(id,box.checked);
  }
  lastClickedLeadId=id;
  syncLeadSelectionUi();
});

$('[data-leads-select-all]')?.addEventListener('change',event=>{
  renderedLeadIds.forEach(id=>setLeadSelected(id,event.target.checked));
  lastClickedLeadId=null;
  syncLeadSelectionUi();
});

async function deleteSelectedLeads(){
  const button=$('[data-leads-delete-selected]');
  const status=$('[data-leads-selection-status]');
  if(!button||!status)return;
  const ids=visibleSelectedLeadIds();
  if(!ids.length)return;
  const names=ids.slice(0,3).map(id=>leads.find(l=>String(l.id)===id)?.name).filter(Boolean).join(', ');
  const preview=names?`${names}${ids.length>3?` and ${ids.length-3} more`:''}`:`${ids.length} leads`;
  if(!confirm(`Delete ${ids.length} lead${ids.length===1?'':'s'} (${preview})? This also removes their notes and assignments, and can't be undone.`))return;
  button.disabled=true;
  status.dataset.busy='1';
  const failed=[];
  let done=0;
  for(const id of ids){
    status.textContent=`Deleting ${done+1} of ${ids.length}…`;
    try{
      await api(`/api/admin/leads/${id}`,{method:'DELETE'});
      selectedLeadIds.delete(id);
      leads=leads.filter(l=>String(l.id)!==id);
      done++;
    }catch(error){
      failed.push(`${leads.find(l=>String(l.id)===id)?.name||`#${id}`}: ${error.message}`);
    }
  }
  button.disabled=false;
  delete status.dataset.busy;
  renderLeads(currentLeadRows());
  status.textContent=failed.length
    ? `Deleted ${done} of ${ids.length}. Failed: ${failed.join('; ')}`
    : `Deleted ${done} lead${done===1?'':'s'}.`;
  await refreshBusinessLeads().catch(()=>{});
}

$('[data-leads-delete-selected]')?.addEventListener('click',()=>{deleteSelectedLeads().catch(error=>{
  const status=$('[data-leads-selection-status]');
  if(status){delete status.dataset.busy;status.textContent=error.message;}
  const button=$('[data-leads-delete-selected]');
  if(button)button.disabled=false;
});});

function renderBusinesses(rows){
  businessesTable.innerHTML=rows.map(b=>`<tr><td><strong>${esc(b.name||'—')}</strong></td><td>${esc(b.email)}<br>${esc(b.phone||'')}</td><td>${esc(b.company_name||'—')}</td><td>${esc(catLabel(b.preferred_category))}</td><td><span class="status">${esc(b.status)}</span>${b.leads_locked?'<span class="status locked" title="Killswitch on: client portal cannot see leads">Leads locked</span>':''}</td><td>${salesmanCell(b)}</td><td>${b.total_leads||0}</td><td>${fmt(b.last_login_at)}</td><td><button type="button" data-open-business="${b.id}">View</button></td></tr>`).join('')||'<tr><td colspan="9">No business accounts yet.</td></tr>';
}

function renderEvents(rows){
  eventsTable.innerHTML=rows.map(event=>`<tr><td>${esc(event.event_name)}</td><td>${esc(event.page_path||'—')}</td><td>${esc(event.referrer||'Direct / none')}</td><td>${esc((event.session_id||'').slice(0,12)||'—')}</td><td>${fmt(event.occurred_at)}</td></tr>`).join('')||'<tr><td colspan="5">No events recorded.</td></tr>';
}

function populateCategoryFilters(){
  const opts=CATEGORIES.map(c=>`<option value="${c}">${catLabel(c)}</option>`).join('');
  leadCategoryFilter.innerHTML='<option value="">All categories</option>'+opts;
  const bizCat=$('[data-business-category]');
  if(bizCat)bizCat.innerHTML='<option value="">— None —</option>'+opts;
  const leadCat=$('[data-lead-category]');
  if(leadCat)leadCat.innerHTML=opts;
  const staffLeadCat=$('[data-staff-lead-category]');
  if(staffLeadCat)staffLeadCat.innerHTML='<option value="">Select category</option>'+opts;
  ['[data-bam-category]','[data-bam-create-category]'].forEach(sel=>{const el=$(sel);if(el)el.innerHTML='<option value="">— None —</option>'+opts;});
}

/* ── Role-based view (admin / VA staff / retention manager) ── */
function applyRole(role){
  const isAdmin=role==='admin';
  const isStaff=role==='staff';
  const isRetention=role==='retention';
  const isBam=role==='bam';
  document.body.dataset.role=role;
  document.querySelectorAll('[data-bam-only]').forEach(el=>{el.hidden=!isBam;});
  document.querySelectorAll('[data-bam-hide]').forEach(el=>{el.hidden=isBam;});
  document.querySelectorAll('[data-admin-only]').forEach(el=>{el.hidden=!isAdmin;});
  document.querySelectorAll('[data-staff-only]').forEach(el=>{el.hidden=!isStaff;});
  document.querySelectorAll('[data-retention-only]').forEach(el=>{el.hidden=!isRetention;});
  document.querySelectorAll('[data-retention-hide]').forEach(el=>{el.hidden=isRetention;});
  /* Owner and retention manager can both generate activation / password-reset links. */
  document.querySelectorAll('[data-reset-access]').forEach(el=>{el.hidden=!(isAdmin||isRetention||isBam);});
  const tag=document.querySelectorAll('.admin-tag');
  const label=isAdmin?'Admin':isStaff?'VA':isBam?'Account Manager':'Retention';
  tag.forEach(el=>{el.textContent=label;});
}

/* Canonical status from the worker is "canceled"; accept the double-l spelling too. */
const CANCELED_STATUSES=['canceled','cancelled'];
function isCanceledBusiness(business){
  return CANCELED_STATUSES.includes(String(business&&business.status||'').trim().toLowerCase());
}

async function loadStaffBusinesses(){
  const data=await api('/api/admin/businesses');
  const allBusinesses=data.businesses||[];
  /* Owner/admin keeps the full list (incl. canceled); VA/staff never see canceled accounts. */
  const isStaffView=document.body.dataset.role==='staff';
  const visibleBusinesses=isStaffView?allBusinesses.filter(business=>!isCanceledBusiness(business)):allBusinesses;
  businesses=visibleBusinesses;
  renderStaffBusinesses(visibleBusinesses);
  populateStaffLeadBusiness();
}

function populateStaffLeadBusiness(){
  const sel=$('[data-staff-lead-business]');
  if(!sel)return;
  sel.innerHTML='<option value="">— Leave unassigned —</option>'+businesses.map(b=>`<option value="${b.id}">${esc(b.name||b.company_name)}</option>`).join('');
}

function renderStaffBusinesses(rows){
  const tbody=$('[data-staff-businesses-table]');
  if(!tbody)return;
  tbody.innerHTML=rows.map(b=>`<tr><td><strong>${esc(b.name||b.company_name||'—')}</strong></td><td>${esc(catLabel(b.preferred_category))}</td><td>${esc(b.address||'—')}</td><td><button type="button" data-open-business="${b.id}">View / edit leads</button></td></tr>`).join('')||'<tr><td colspan="4">No businesses found.</td></tr>';
}

const staffBusinessesTable=$('[data-staff-businesses-table]');
if(staffBusinessesTable){
  staffBusinessesTable.addEventListener('click',event=>{const button=event.target.closest('[data-open-business]');if(!button)return;openBusiness(button.dataset.openBusiness);});
}

/* ── Retention manager view: read-only, every account in every status ── */
function filterBusinessRows(q,status){
  q=String(q||'').trim().toLowerCase();
  status=String(status||'').trim().toLowerCase();
  return businesses.filter(b=>{
    const statusValue=String(b.status||'').trim().toLowerCase();
    const statusMatch=!status?true:(status==='canceled'?CANCELED_STATUSES.includes(statusValue):statusValue===status);
    if(!statusMatch)return false;
    if(!q)return true;
    return [b.name,b.email,b.phone,b.company_name,b.address,b.status,b.preferred_category].some(v=>String(v||'').toLowerCase().includes(q));
  });
}

function retentionFilteredRows(){
  return filterBusinessRows($('[data-retention-search]')?.value,$('[data-retention-status-filter]')?.value);
}

function adminFilteredRows(){
  const rows=filterBusinessRows(businessSearch?.value,$('[data-business-status-filter]')?.value);
  const sp=$('[data-business-salesman-filter]')?.value||'';
  if(!sp)return rows;
  if(sp==='none')return rows.filter(b=>!b.salesperson_id);
  return rows.filter(b=>String(b.salesperson_id||'')===sp);
}

function renderRetentionBusinesses(rows){
  const tbody=$('[data-retention-businesses-table]');
  if(!tbody)return;
  tbody.innerHTML=rows.map(b=>`<tr><td><strong>${esc(b.name||b.company_name||'—')}</strong></td><td>${esc(b.email||'—')}<br>${esc(b.phone||'—')}</td><td>${esc(b.company_name||'—')}</td><td>${esc(catLabel(b.preferred_category))}</td><td><span class="status">${esc(b.status||'—')}</span></td><td>${b.total_leads||0}</td><td>${fmt(b.created_at)}</td><td>${fmt(b.last_login_at)}</td><td><button type="button" data-open-business="${b.id}">View details</button></td></tr>`).join('')||'<tr><td colspan="9">No business accounts found.</td></tr>';
}

async function loadRetentionBusinesses(){
  const data=await api('/api/admin/businesses');
  businesses=data.businesses||[];
  renderRetentionBusinesses(retentionFilteredRows());
}

const retentionTable=$('[data-retention-businesses-table]');
if(retentionTable){
  retentionTable.addEventListener('click',event=>{const button=event.target.closest('[data-open-business]');if(!button)return;openBusiness(button.dataset.openBusiness);});
}
$('[data-retention-search]')?.addEventListener('input',()=>renderRetentionBusinesses(retentionFilteredRows()));
$('[data-retention-status-filter]')?.addEventListener('change',()=>renderRetentionBusinesses(retentionFilteredRows()));

/* ── Account report: printable roster of business accounts, shared by the admin and
      retention panels. Built from the rows already loaded for the table, so it honours
      each panel's active search and status filter and needs no extra endpoint (the
      retention role stays strictly read-only). ── */
function filterLabelFor(searchSel,statusSel){
  const q=($(searchSel)?.value||'').trim();
  const status=($(statusSel)?.value||'').trim();
  const statusText=status?statusLabel(status):'All statuses';
  return q?`${statusText} · matching “${q}”`:statusText;
}

const STATUS_LABELS={active:'Active',past_due:'Past due',canceled:'Canceled',cancelled:'Canceled',suspended:'Suspended'};
const statusLabel=(value)=>{const key=String(value||'').trim().toLowerCase();return STATUS_LABELS[key]||(key?key.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()):'—');};

function countBy(rows,pick){
  const map=new Map();
  rows.forEach(r=>{const key=pick(r);map.set(key,(map.get(key)||0)+1);});
  return [...map.entries()].sort((a,b)=>b[1]-a[1]||String(a[0]).localeCompare(String(b[0])));
}

function buildAccountReportHtml(rows,filterLabel){
  const generated=new Date().toISOString();
  const activated=rows.filter(b=>b.last_login_at).length;
  const totalLeads=rows.reduce((sum,b)=>sum+Number(b.total_leads||0),0);
  const canceled=rows.filter(b=>CANCELED_STATUSES.includes(String(b.status||'').trim().toLowerCase())).length;

  const cards=[
    ['Accounts in report',rows.length.toLocaleString()],
    ['Portal activated',`${activated.toLocaleString()} of ${rows.length.toLocaleString()}`],
    ['Never logged in',(rows.length-activated).toLocaleString()],
    ['Canceled',canceled.toLocaleString()],
    ['Total leads delivered',totalLeads.toLocaleString()],
    ['Avg leads per account',rows.length?(totalLeads/rows.length).toFixed(1):'0']
  ];

  const sections=[];
  sections.push(`<h2>Summary</h2><div class="report-cards">${cards.map(([label,value])=>`<div class="report-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`);

  sections.push(`<h2>Accounts by status</h2>${reportTable(['Status','Accounts','Share'],
    countBy(rows,b=>String(b.status||'').trim().toLowerCase()).map(([status,count])=>[esc(statusLabel(status)),count.toLocaleString(),pct(count,rows.length)]),
    'No accounts in this view.')}`);

  sections.push(`<h2>Accounts by business type</h2>${reportTable(['Business type','Accounts','Leads delivered'],
    countBy(rows,b=>b.preferred_category||'').map(([category,count])=>[
      esc(category?catLabel(category):'Not set'),count.toLocaleString(),
      rows.filter(b=>(b.preferred_category||'')===category).reduce((s,b)=>s+Number(b.total_leads||0),0).toLocaleString()
    ]),'No accounts in this view.')}`);

  sections.push(`<h2>Account roster</h2>${reportTable(
    ['Contact','Company','Business type','Status','Email','Phone','Address','Leads','Portal','Created','Last login'],
    rows.map(b=>[
      esc(b.name||'—'),esc(b.company_name||'—'),esc(catLabel(b.preferred_category)),
      `<span class="report-status-tag">${esc(statusLabel(b.status))}</span>`,
      esc(b.email||'—'),esc(b.phone||'—'),esc(b.address||'—'),
      Number(b.total_leads||0).toLocaleString(),
      b.last_login_at?'Activated':'Not activated',
      fmt(b.created_at),b.last_login_at?fmt(b.last_login_at):'Never'
    ]),'No accounts match the current filter.')}`);

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shedlr retention report</title>
<style>
*{box-sizing:border-box}
body{font:13px/1.45 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#16232e;margin:0;padding:26px}
header{border-bottom:2px solid #16232e;padding-bottom:12px;margin-bottom:18px}
h1{font-size:22px;margin:0 0 6px}
header p{margin:2px 0;font-size:12px;color:#5a6a7a}
h2{font-size:15px;margin:22px 0 8px;padding-bottom:4px;border-bottom:1px solid #d8e0e5}
.report-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.report-card{border:1px solid #d8e0e5;border-radius:6px;padding:8px 10px}
.report-card span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a6a7a}
.report-card strong{display:block;font-size:17px;margin-top:2px}
table.report-table{width:100%;border-collapse:collapse;font-size:11.5px}
table.report-table th{text-align:left;background:#f4f7f8;border:1px solid #d8e0e5;padding:5px 7px}
table.report-table td{border:1px solid #e3e9ec;padding:5px 7px;vertical-align:top}
.report-status-tag{font-weight:700}
.report-empty{font-size:12px;color:#5a6a7a;margin:4px 0 0}
.report-actions{margin-bottom:16px}
.report-actions button{font:inherit;font-size:13px;padding:8px 14px;border:1px solid #16232e;background:#16232e;color:#fff;border-radius:6px;cursor:pointer}
footer{margin-top:26px;padding-top:10px;border-top:1px solid #d8e0e5;font-size:11px;color:#5a6a7a}
@media print{.report-actions{display:none}body{padding:0}@page{size:landscape}table.report-table{page-break-inside:auto}tr{page-break-inside:avoid}}
</style></head><body>
<div class="report-actions"><button type="button" onclick="window.print()">Print this report</button></div>
<header><h1>Shedlr account report</h1><p><strong>Filter:</strong> ${esc(filterLabel)}</p><p><strong>Accounts:</strong> ${rows.length.toLocaleString()}</p><p><strong>Generated:</strong> ${esc(fmt(generated))}</p></header>
${sections.join('')}
<footer>Shedlr · shedlr.com · Confidential internal report</footer>
</body></html>`;
}

function openAccountReport(cfg){
  const out=$(cfg.statusOut);
  if(!out)return;
  const rows=cfg.rows();
  if(!rows.length){out.textContent='No accounts match the current filter, so there is nothing to report.';return;}
  const label=filterLabelFor(cfg.search,cfg.status);
  out.textContent='Building report…';
  const win=window.open('','_blank');
  if(!win){out.textContent='Your browser blocked the report window. Allow pop-ups for shedlr.com and try again.';return;}
  win.document.write(buildAccountReportHtml(rows,label));
  win.document.close();
  out.textContent=`Report ready for ${rows.length} account${rows.length===1?'':'s'} (${label}).`;
}

function downloadAccountCsv(cfg){
  const out=$(cfg.statusOut);
  if(!out)return;
  const rows=cfg.rows();
  if(!rows.length){out.textContent='No accounts match the current filter, so there is nothing to export.';return;}
  const lines=[['Shedlr account report'],['Filter',filterLabelFor(cfg.search,cfg.status)],['Generated',new Date().toISOString()],['Accounts',rows.length],[]];
  lines.push(['Business ID','Contact name','Company','Business type','Status','Email','Phone','Address','Leads delivered','Portal activated','Created','Last login']);
  rows.forEach(b=>lines.push([b.id,b.name||'',b.company_name||'',b.preferred_category||'',b.status||'',b.email||'',b.phone||'',b.address||'',Number(b.total_leads||0),b.last_login_at?'Yes':'No',b.created_at||'',b.last_login_at||'']));
  const csv=lines.map(row=>row.map(csvCell).join(',')).join('\r\n');
  const blob=new Blob([`\ufeff${csv}`],{type:'text/csv;charset=utf-8'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);
  link.download=`shedlr-account-report-${dateOnly(new Date())}.csv`;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(link.href),2000);
  out.textContent=`CSV downloaded for ${rows.length} account${rows.length===1?'':'s'}.`;
}

function wireAccountReport(cfg){
  $(cfg.button)?.addEventListener('click',()=>openAccountReport(cfg));
  $(cfg.csvButton)?.addEventListener('click',()=>downloadAccountCsv(cfg));
}

wireAccountReport({rows:retentionFilteredRows,search:'[data-retention-search]',status:'[data-retention-status-filter]',
  button:'[data-retention-report]',csvButton:'[data-retention-report-csv]',statusOut:'[data-retention-report-status]'});

wireAccountReport({rows:adminFilteredRows,search:'[data-business-search]',status:'[data-business-status-filter]',
  button:'[data-business-report]',csvButton:'[data-business-report-csv]',statusOut:'[data-business-report-status]'});

function renderRetentionBusinessDetail(detail){
  const b=detail.business||{};
  const grid=$('[data-retention-business-details]');
  if(grid){
    grid.innerHTML=[['Contact name',b.name],['Email',b.email],['Phone',b.phone],['Company',b.company_name],['Address',b.address],['Preferred category',catLabel(b.preferred_category)],['Status',b.status],['Stripe customer',b.stripe_customer_id],['Portal access',b.last_login_at?'Activated':'Not yet activated'],['Created',fmt(b.created_at)],['Last updated',fmt(b.updated_at)],['Last login',fmt(b.last_login_at)],['Total leads delivered',(detail.assignments||[]).length]].map(([label,value])=>`<div><strong>${esc(label)}</strong>${esc(value===0?'0':(value||'—'))}</div>`).join('');
  }
  const orderList=$('[data-retention-orders-list]');
  if(orderList){
    const orders=detail.orders||[];
    orderList.innerHTML=orders.length?orders.map(o=>`<div class="note-item"><strong>${catLabel(o.category)} — ${o.quantity} leads</strong><div>${fmtMoney(o.total_cents)} · Status: ${esc(o.status)} · Fulfilled: ${o.fulfilled_leads||0}/${o.quantity}</div><div class="meta">Submitted ${fmt(o.created_at)}${o.paid_at?` · Paid ${fmt(o.paid_at)}`:''}</div></div>`).join(''):'<p class="empty-hint">No orders yet.</p>';
  }
}

async function loadRetentionNotes(bizId){
  const box=$('[data-retention-notes]');
  if(!box)return;
  box.innerHTML='<p class="empty-hint">Loading notes…</p>';
  try{
    const res=await api(`/api/admin/businesses/${bizId}/notes`);
    const content=res.note?.content||'';
    if(!content){box.innerHTML='<p class="empty-hint">No notes recorded for this account.</p>';return;}
    const author=res.note?.updated_by==='admin'?'Admin':'Business';
    box.innerHTML=`<div class="note-item"><div style="white-space:pre-wrap">${esc(content)}</div><div class="meta">Last updated by ${esc(author)}${res.note?.updated_at?` on ${fmt(res.note.updated_at)}`:''}</div></div>`;
  }catch(error){box.innerHTML=`<p class="empty-hint">${esc(error.message)}</p>`;}
}

function getFilters(){
  const params=new URLSearchParams();
  if(filterFrom.value)params.set('from',new Date(filterFrom.value).toISOString());
  if(filterTo.value)params.set('to',new Date(filterTo.value).toISOString());
  return params;
}

async function loadDashboard(){
  filterStatus.textContent='Loading…';
  const params=getFilters();
  const data=await api(`/api/admin/dashboard${params.toString()?`?${params}`:''}`);
  showDashboard();
  renderMetrics(data.metrics||{});
  renderPages(data.pages||[]);
  orders=data.orders||[];
  renderOrders(orders);
  renderEvents(data.events||[]);
  filterStatus.textContent=`Showing ${fmt(data.range?.from)} through ${fmt(data.range?.to)}.`;
  loadLeads().catch(()=>{});
  loadBusinesses().catch(()=>{});
}

async function loadLeads(){
  const cat=leadCategoryFilter.value;
  const data=await api(`/api/admin/leads${cat?`?category=${cat}`:''}`);
  leads=data.leads||[];
  const live=new Set(leads.map(l=>String(l.id)));
  [...selectedLeadIds].forEach(id=>{if(!live.has(id))selectedLeadIds.delete(id);});
  renderLeads(currentLeadRows());
}

async function loadBusinesses(){
  const data=await api('/api/admin/businesses');
  businesses=data.businesses||[];
  renderBusinesses(adminFilteredRows());
}

/* ── Lead dialog ── */
function fillLeadDialog(lead,metaText){
  activeLead=lead;
  $('[data-lead-title]').textContent=lead.name||'Lead details';
  $('[data-lead-meta]').textContent=metaText||'';
  $('[data-lead-name]').value=lead.name||'';
  $('[data-lead-email]').value=lead.email||'';
  $('[data-lead-phone]').value=lead.phone||'';
  $('[data-lead-category]').value=lead.category||'';
  $('[data-lead-city]').value=lead.city||'';
  $('[data-lead-state]').value=lead.state||'';
  $('[data-lead-message]').value=lead.message||'';
  $('[data-lead-status]').value=lead.status||'new';
  $('[data-lead-save-message]').hidden=true;

  const assignSelect=$('[data-lead-assign-business]');
  assignSelect.innerHTML='<option value="">— Select business —</option>'+businesses.map(b=>`<option value="${b.id}">${esc(b.name||b.email)}${b.company_name?` (${esc(b.company_name)})`:''}</option>`).join('');
  $('[data-lead-assign-order]').innerHTML='<option value="">— Select order —</option>';
  assignSelect.onchange=async()=>{
    const bizId=assignSelect.value;
    const orderSelect=$('[data-lead-assign-order]');
    if(!bizId){orderSelect.innerHTML='<option value="">— Select order —</option>';return;}
    try{
      const detail=await api(`/api/admin/businesses/${bizId}`);
      orderSelect.innerHTML='<option value="">— Select order —</option>'+(detail.orders||[]).filter(o=>o.status==='paid'||o.status==='fulfilling').map(o=>`<option value="${o.id}">${catLabel(o.category)} — ${o.quantity} leads ($${(o.total_cents/100).toFixed(2)})</option>`).join('');
    }catch{orderSelect.innerHTML='<option value="">— Select order —</option>';}
  };

  leadDialog.showModal();
}

function openLead(id){
  const lead=leads.find(l=>String(l.id)===String(id));
  if(!lead)return;
  fillLeadDialog(lead,`${catLabel(lead.category)} · Source: ${lead.source||'—'} · Added ${fmt(lead.submitted_at)}`);
}

function openBusinessAssignedLead(assignment){
  fillLeadDialog({
    id:assignment.lead_id,
    name:assignment.name,
    email:assignment.email,
    phone:assignment.phone,
    category:assignment.category,
    city:assignment.city,
    state:assignment.state,
    message:assignment.message,
    status:assignment.lead_status,
    source:assignment.source
  },`Assigned to ${activeBusiness?(activeBusiness.name||activeBusiness.email):'this business'} on ${fmt(assignment.assigned_at)}`);
}

leadsTable.addEventListener('click',event=>{const button=event.target.closest('[data-open-lead]');if(!button)return;openLead(button.dataset.openLead);});

async function refreshBusinessLeads(){
  if(!activeBusiness)return;
  try{
    const detail=await api(`/api/admin/businesses/${activeBusiness.id}`);
    activeBusinessDetail=detail;
    renderBusinessLeads(detail.assignments||[]);
  }catch{}
}

$('[data-lead-save]').addEventListener('click',async()=>{
  if(!activeLead)return;
  const message=$('[data-lead-save-message]');
  const name=$('[data-lead-name]').value.trim();
  if(!name){message.hidden=false;message.textContent='Name is required.';return;}
  message.hidden=false;message.textContent='Saving...';
  try{
    const updated=await api(`/api/admin/leads/${activeLead.id}`,{method:'PATCH',body:JSON.stringify({
      name,
      email:$('[data-lead-email]').value.trim(),
      phone:$('[data-lead-phone]').value.trim(),
      category:$('[data-lead-category]').value,
      city:$('[data-lead-city]').value.trim(),
      state:$('[data-lead-state]').value.trim(),
      message:$('[data-lead-message]').value.trim(),
      status:$('[data-lead-status]').value
    })});
    Object.assign(activeLead,updated.lead);
    const existing=leads.find(l=>String(l.id)===String(updated.lead.id));
    if(existing)Object.assign(existing,updated.lead);
    renderLeads(leads);
    message.textContent='Saved.';
    await refreshBusinessLeads();
  }catch(error){message.textContent=error.message;}
});

$('[data-lead-delete]').addEventListener('click',async()=>{
  if(!activeLead)return;
  if(!confirm(`Delete the lead "${activeLead.name||''}"? This can't be undone.`))return;
  const message=$('[data-lead-save-message]');message.hidden=false;message.textContent='Deleting...';
  try{
    await api(`/api/admin/leads/${activeLead.id}`,{method:'DELETE'});
    leads=leads.filter(l=>String(l.id)!==String(activeLead.id));
    selectedLeadIds.delete(String(activeLead.id));
    renderLeads(currentLeadRows());
    leadDialog.close();
    await refreshBusinessLeads();
  }catch(error){message.textContent=error.message;}
});

$('[data-lead-assign]').addEventListener('click',async()=>{
  if(!activeLead)return;
  const message=$('[data-lead-save-message]');message.hidden=false;message.textContent='Assigning...';
  const bizId=$('[data-lead-assign-business]').value;
  const orderId=$('[data-lead-assign-order]').value||null;
  if(!bizId){message.textContent='Please select a business.';return;}
  try{
    await api(`/api/admin/leads/${activeLead.id}/assign`,{method:'POST',body:JSON.stringify({business_id:Number(bizId),order_id:orderId?Number(orderId):null})});
    message.textContent='Lead assigned successfully.';
    await loadLeads();
  }catch(error){message.textContent=error.message;}
});

/* ── Order dialog ── */
ordersTable.addEventListener('click',event=>{
  const button=event.target.closest('[data-open-order]');if(!button)return;
  activeOrder=orders.find(o=>String(o.id)===button.dataset.openOrder);
  if(!activeOrder)return;
  $('[data-order-title]').textContent=`${activeOrder.name} — ${activeOrder.quantity} ${catLabel(activeOrder.category)} leads`;
  $('[data-order-details]').innerHTML=[['Business',activeOrder.business_name],['Email',activeOrder.email],['Phone',activeOrder.phone],['Category',catLabel(activeOrder.category)],['Quantity',activeOrder.quantity],['Unit price',fmtMoney(activeOrder.unit_price_cents)],['Total',fmtMoney(activeOrder.total_cents)],['Fulfilled',`${activeOrder.fulfilled_leads||0}/${activeOrder.quantity}`],['Submitted',fmt(activeOrder.submitted_at)],['Paid at',fmt(activeOrder.paid_at)],['Stripe session',activeOrder.stripe_session_id]].map(([label,value])=>`<div><strong>${esc(label)}</strong>${esc(value||'—')}</div>`).join('');
  $('[data-order-status]').value=activeOrder.status||'pending_payment';
  $('[data-order-save-message]').hidden=true;
  orderDialog.showModal();
});

$('[data-order-save]').addEventListener('click',async()=>{
  if(!activeOrder)return;
  const message=$('[data-order-save-message]');message.hidden=false;message.textContent='Saving...';
  try{
    await api(`/api/admin/orders/${activeOrder.id}`,{method:'PATCH',body:JSON.stringify({status:$('[data-order-status]').value})});
    activeOrder.status=$('[data-order-status]').value;renderOrders(orders);message.textContent='Saved.';
  }catch(error){message.textContent=error.message;}
});

/* ── Business dialog ── */
function openBusiness(id){
  activeBusiness=businesses.find(b=>String(b.id)===String(id));
  if(!activeBusiness)return;
  const role=document.body.dataset.role;
  api(`/api/admin/businesses/${id}`).then(detail=>{
    activeBusinessDetail=detail;
    $('[data-business-title]').textContent=detail.business.name||detail.business.email||detail.business.company_name;
    renderBusinessLeads(detail.assignments||[]);
    const resetMessage=$('[data-reset-link-message]');
    if(resetMessage){resetMessage.hidden=true;resetMessage.textContent='';}
    if(role==='retention'){
      renderRetentionBusinessDetail(detail);
      loadRetentionNotes(id);
    }
    if(role==='admin'){
      $('[data-business-details]').innerHTML=[['Email',detail.business.email],['Phone',detail.business.phone],['Company',detail.business.company_name],['Category',catLabel(detail.business.preferred_category)],['Status',detail.business.status],['Created',fmt(detail.business.created_at)],['Last login',fmt(detail.business.last_login_at)]].map(([label,value])=>`<div><strong>${esc(label)}</strong>${esc(value||'—')}</div>`).join('');
      $('[data-business-status]').value=detail.business.status||'active';
      $('[data-business-name]').value=detail.business.name||'';
      $('[data-business-phone]').value=detail.business.phone||'';
      $('[data-business-company]').value=detail.business.company_name||'';
      $('[data-business-address]').value=detail.business.address||'';
      $('[data-business-category]').value=detail.business.preferred_category||'';
      $('[data-business-save-message]').hidden=true;
      renderBusinessOrders(detail.orders||[]);
      loadAdminBusinessNotes(id);
      renderKillswitch(detail.business);
      renderBusinessSalesman(detail.business);
      const del=$('[data-business-delete-message]');if(del){del.hidden=true;del.textContent='';}
    }
    if(role==='bam')renderBamBusinessDetail(detail);
    businessDialog.showModal();
  }).catch(error=>{alert(error.message);});
}

function renderBusinessOrders(orders){
  const list=$('[data-business-orders-list]');
  list.innerHTML=orders.length?orders.map(o=>`<div class="note-item"><strong>${catLabel(o.category)} — ${o.quantity} leads</strong><div>${fmtMoney(o.total_cents)} · Status: ${esc(o.status)} · Fulfilled: ${o.fulfilled_leads||0}/${o.quantity}</div><div class="meta">Submitted ${fmt(o.created_at)}${o.paid_at?` · Paid ${fmt(o.paid_at)}`:''}</div></div>`).join(''):'<p class="empty-hint">No orders yet.</p>';
}

function renderBusinessLeads(assignments){
  const list=$('[data-business-leads-list]');
  const readOnly=document.body.dataset.role==='retention';
  list.innerHTML=assignments.length?assignments.map(a=>`<div class="note-item"><strong>${esc(a.name)}</strong><div>${esc(a.email||'—')} · ${esc(a.phone||'—')}</div><div>${esc(a.message||'')}</div><div class="meta">${catLabel(a.category)} · ${esc(a.city||'—')}${a.state?', '+esc(a.state):''} · Status: ${esc(a.lead_status||a.assignment_status||'—')} · Assigned ${fmt(a.assigned_at)}</div>${readOnly?'':`<button type="button" data-edit-business-lead="${a.lead_id}" style="margin-top:6px">Edit lead</button>`}</div>`).join(''):'<p class="empty-hint">No leads assigned yet.</p>';
}

$('[data-business-leads-list]').addEventListener('click',event=>{
  const button=event.target.closest('[data-edit-business-lead]');
  if(!button)return;
  const assignment=(activeBusinessDetail?.assignments||[]).find(a=>String(a.lead_id)===String(button.dataset.editBusinessLead));
  if(assignment)openBusinessAssignedLead(assignment);
});

businessesTable.addEventListener('click',event=>{const button=event.target.closest('[data-open-business]');if(!button)return;openBusiness(button.dataset.openBusiness);});

/* ── Admin business notes ── */
async function loadAdminBusinessNotes(bizId){
  const input=$('[data-admin-business-notes-content]');
  const meta=$('[data-admin-business-notes-meta]');
  input.value='';
  meta.hidden=true;
  try{
    const res=await api(`/api/admin/businesses/${bizId}/notes`);
    input.value=res.note?.content||'';
    if(res.note?.updated_at){
      meta.hidden=false;
      const author=res.note.updated_by==='admin'?'Admin':'Business';
      meta.textContent=`Last updated by ${author} on ${fmt(res.note.updated_at)}`;
    }
  }catch(error){meta.hidden=false;meta.textContent=error.message;}
}

$('[data-admin-business-notes-save]').addEventListener('click',async()=>{
  if(!activeBusiness)return;
  const input=$('[data-admin-business-notes-content]');
  const meta=$('[data-admin-business-notes-meta]');
  const btn=$('[data-admin-business-notes-save]');
  const originalText=btn.textContent;
  btn.textContent='Saving...';
  try{
    const res=await api(`/api/admin/businesses/${activeBusiness.id}/notes`,{method:'PUT',body:JSON.stringify({content:input.value})});
    meta.hidden=false;
    meta.textContent=`Saved on ${fmt(res.note.updated_at)}`;
  }catch(error){meta.hidden=false;meta.textContent=error.message;}
  btn.textContent=originalText;
});

$('[data-business-save]').addEventListener('click',async()=>{
  if(!activeBusiness)return;
  const message=$('[data-business-save-message]');message.hidden=false;message.textContent='Saving...';
  try{
    const updated=await api(`/api/admin/businesses/${activeBusiness.id}`,{method:'PATCH',body:JSON.stringify({status:$('[data-business-status]').value,name:$('[data-business-name]').value,phone:$('[data-business-phone]').value,company_name:$('[data-business-company]').value,address:$('[data-business-address]').value,preferred_category:$('[data-business-category]').value})});
    Object.assign(activeBusiness,updated.business);renderBusinesses(businesses);message.textContent='Saved.';
  }catch(error){message.textContent=error.message;}
});

$('[data-business-reset-password]').addEventListener('click',async()=>{
  if(!activeBusiness)return;
  const message=$('[data-reset-link-message]');
  message.hidden=false;message.className='form-message';message.textContent='Generating link...';
  try{
    const data=await api(`/api/admin/businesses/${activeBusiness.id}/reset-password`,{method:'POST',body:'{}'});
    const kind=data.link_mode==='reset'?'Password-reset link':data.link_mode==='activate'?'Activation link':'Link';
    message.textContent=`${kind} copied. Send this to the client (valid 72 hours): ${data.activation_url}`;
    if(navigator.clipboard)navigator.clipboard.writeText(data.activation_url).catch(()=>{});
  }catch(error){message.className='form-message error';message.textContent=error.message;}
});

/* ── Bulk import ── */
const bulkDialog=$('[data-bulk-import-dialog]');
const bulkPaste=$('[data-bulk-paste]');
const bulkFile=$('[data-bulk-file]');
const bulkPreview=$('[data-bulk-preview]');
const bulkMessage=$('[data-bulk-import-message]');
let bulkParsedLeads=[]

function populateBulkCategory(){
  const sel=$('[data-bulk-default-category]');
  sel.innerHTML='<option value="">— Select category —</option>'+CATEGORIES.map(c=>`<option value="${c}">${catLabel(c)}</option>`).join('');
}

function populateBulkBusinesses(){
  const sel=$('[data-bulk-business]');
  sel.innerHTML='<option value="">— None —</option>'+businesses.map(b=>`<option value="${b.id}">${esc(b.name||b.email)}${b.company_name?` (${esc(b.company_name)})`:''}</option>`).join('');
}

$('[data-bulk-business]').addEventListener('change',async()=>{
  const bizId=$('[data-bulk-business]').value;
  const orderSelect=$('[data-bulk-order]');
  if(!bizId){orderSelect.innerHTML='<option value="">— None —</option>';return;}
  try{
    const detail=await api(`/api/admin/businesses/${bizId}`);
    orderSelect.innerHTML='<option value="">— None —</option>'+(detail.orders||[]).filter(o=>o.status==='paid'||o.status==='fulfilling').map(o=>`<option value="${o.id}">${catLabel(o.category)} — ${o.quantity} leads ($${(o.total_cents/100).toFixed(2)})</option>`).join('');
  }catch{orderSelect.innerHTML='<option value="">— None —</option>';}
});

function parseCSV(text){
  const lines=text.trim().split(/\r?\n/).filter(l=>l.trim());
  if(!lines.length)return [];
  const detectDelimiter=(line)=>{const comma=(line.match(/,/g)||[]).length;const tab=(line.match(/\t/g)||[]).length;return tab>comma?'\t':',';};
  const delim=detectDelimiter(lines[0]);
  const parseLine=(line)=>{
    const result=[];let cur='';let inQuotes=false;
    for(let i=0;i<line.length;i++){
      const ch=line[i];
      if(ch==='"'){if(inQuotes&&line[i+1]==='"'){cur+='"';i++;}else{inQuotes=!inQuotes;}}
      else if(ch===delim&&!inQuotes){result.push(cur);cur='';}
      else{cur+=ch;}
    }
    result.push(cur);
    return result.map(c=>c.trim());
  };
  const header=parseLine(lines[0]).map(h=>h.toLowerCase().replace(/\s+/g,'_'));
  const hasHeader=header.some(h=>['name','email','phone','category','city','state','message'].includes(h));
  const rows=hasHeader?lines.slice(1):lines;
  const fieldOrder=['name','email','phone','category','city','state','message'];
  const leads=rows.map(line=>{
    const vals=parseLine(line);
    if(hasHeader){
      const obj={};header.forEach((h,i)=>{if(fieldOrder.includes(h))obj[h]=vals[i]||'';});
      return obj;
    }
    const obj={};fieldOrder.forEach((f,i)=>{obj[f]=vals[i]||'';});return obj;
  }).filter(l=>l.name);
  return leads;
}

function renderBulkPreview(leads){
  bulkParsedLeads=leads;
  if(!leads.length){bulkPreview.innerHTML='<p class="empty-hint">No valid leads parsed. Make sure each row has at least a name.</p>';return;}
  bulkPreview.innerHTML=`<p class="meta" style="margin-bottom:4px">${leads.length} lead${leads.length===1?'':'s'} parsed:</p>`+
    `<table style="width:100%;font-size:12px;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:4px">Name</th><th style="text-align:left;padding:4px">Email</th><th style="text-align:left;padding:4px">Phone</th><th style="text-align:left;padding:4px">Category</th><th style="text-align:left;padding:4px">City</th><th style="text-align:left;padding:4px">State</th></tr></thead><tbody>`+
    leads.slice(0,50).map(l=>`<tr><td style="padding:4px">${esc(l.name||'—')}</td><td style="padding:4px">${esc(l.email||'—')}</td><td style="padding:4px">${esc(l.phone||'—')}</td><td style="padding:4px">${esc(l.category||'(default)')}</td><td style="padding:4px">${esc(l.city||'—')}</td><td style="padding:4px">${esc(l.state||'—')}</td></tr>`).join('')+
    (leads.length>50?`<tr><td colspan="6" style="padding:4px;color:#888">...and ${leads.length-50} more</td></tr>`:'')+
    `</tbody></table>`;
}

function openBulkImportDialog(){
  populateBulkCategory();
  populateBulkBusinesses();
  $('[data-bulk-order]').innerHTML='<option value="">— None —</option>';
  bulkPaste.value='';
  bulkFile.value='';
  bulkPreview.innerHTML='';
  bulkMessage.hidden=true;
  bulkParsedLeads=[];
  bulkDialog.showModal();
}

$('[data-bulk-import-open]').addEventListener('click',openBulkImportDialog);
const staffBulkImportOpen=$('[data-staff-bulk-import-open]');
if(staffBulkImportOpen)staffBulkImportOpen.addEventListener('click',openBulkImportDialog);

bulkFile.addEventListener('change',async()=>{
  const file=bulkFile.files[0];
  if(!file)return;
  const text=await file.text();
  bulkPaste.value=text;
  renderBulkPreview(parseCSV(text));
});

$('[data-bulk-preview-btn]').addEventListener('click',()=>{
  const text=bulkPaste.value;
  if(!text.trim()){bulkPreview.innerHTML='<p class="empty-hint">Paste data first.</p>';return;}
  renderBulkPreview(parseCSV(text));
});

$('[data-bulk-import-submit]').addEventListener('click',async()=>{
  const defaultCat=$('[data-bulk-default-category]').value;
  if(!defaultCat){bulkMessage.hidden=false;bulkMessage.textContent='Please select a default category.';return;}
  if(!bulkParsedLeads.length){
    const text=bulkPaste.value;
    if(text.trim()){renderBulkPreview(parseCSV(text));}
    if(!bulkParsedLeads.length){bulkMessage.hidden=false;bulkMessage.textContent='No valid leads to import.';return;}
  }
  const bizId=$('[data-bulk-business]').value||null;
  const orderId=$('[data-bulk-order]').value||null;
  const btn=$('[data-bulk-import-submit]');
  const originalText=btn.textContent;
  btn.textContent='Importing...';
  bulkMessage.hidden=false;bulkMessage.textContent='Importing leads...';
  try{
    const res=await api('/api/admin/leads/bulk',{method:'POST',body:JSON.stringify({leads:bulkParsedLeads,default_category:defaultCat,business_id:bizId?Number(bizId):null,order_id:orderId?Number(orderId):null})});
    bulkMessage.textContent=`Imported ${res.succeeded} of ${res.total} leads${res.assigned?` (${res.assigned} assigned)`:''}.${res.failed?` ${res.failed} failed.`:''}`;
    if(res.failed){
      const failures=res.results.filter(r=>!r.success);
      bulkPreview.innerHTML='<p class="meta" style="margin-bottom:4px">Failures:</p>'+failures.map(f=>`<div class="note-item"><div>Row ${f.row}: ${esc(f.error)}</div></div>`).join('');
    }else{
      bulkPreview.innerHTML='<p class="empty-hint">All leads imported successfully.</p>';
    }
    await loadLeads();
  }catch(error){bulkMessage.textContent=error.message;}
  btn.textContent=originalText;
});

/* ── Create business ── */
const createBusinessDialog=$('[data-create-business-dialog]');
const createBusinessMessage=$('[data-create-business-message]');
const createBusinessResult=$('[data-create-business-result]');

function populateCreateBusinessCategory(){
  const sel=$('[data-create-business-category]');
  sel.innerHTML='<option value="">— None —</option>'+CATEGORIES.map(c=>`<option value="${c}">${catLabel(c)}</option>`).join('');
}

$('[data-open-create-business]').addEventListener('click',()=>{
  populateCreateBusinessCategory();
  $('[data-create-business-email]').value='';
  $('[data-create-business-name]').value='';
  $('[data-create-business-phone]').value='';
  $('[data-create-business-company]').value='';
  $('[data-create-business-address]').value='';
  $('[data-create-business-category]').value='';
  createBusinessMessage.hidden=true;
  createBusinessResult.hidden=true;
  createBusinessDialog.showModal();
});

$('[data-create-business-submit]').addEventListener('click',async()=>{
  const email=$('[data-create-business-email]').value.trim();
  if(!email){createBusinessMessage.hidden=false;createBusinessMessage.textContent='Email is required.';return;}
  const btn=$('[data-create-business-submit]');
  const originalText=btn.textContent;
  btn.textContent='Creating...';
  createBusinessMessage.hidden=false;createBusinessMessage.textContent='Creating account...';
  createBusinessResult.hidden=true;
  try{
    const res=await api('/api/admin/businesses',{method:'POST',body:JSON.stringify({
      email,
      name:$('[data-create-business-name]').value.trim(),
      phone:$('[data-create-business-phone]').value.trim(),
      company_name:$('[data-create-business-company]').value.trim(),
      address:$('[data-create-business-address]').value.trim(),
      preferred_category:$('[data-create-business-category]').value||null
    })});
    createBusinessMessage.textContent=res.existing?`No duplicate created — this email already belongs to business ID ${res.business.id}.`:`Business created (ID ${res.business.id}).`;
    createBusinessResult.hidden=false;
    createBusinessResult.innerHTML=res.existing
      ?`${esc(res.message||'')}<br>${res.link_mode==='reset'?'Password-reset':'Activation'} link (copied, valid 72 hours):<br><strong>${esc(res.activation_url)}</strong>`
      :`Activation link — share this with the client so they can set a password and log in:<br><strong>${esc(res.activation_url)}</strong>`;
    if(navigator.clipboard)navigator.clipboard.writeText(res.activation_url).catch(()=>{});
    await loadBusinesses().catch(()=>{});
  }catch(error){createBusinessMessage.textContent=error.message;}
  btn.textContent=originalText;
});

/* ── Search/filters ── */
orderSearch.addEventListener('input',()=>{
  const q=orderSearch.value.trim().toLowerCase();
  renderOrders(!q?orders:orders.filter(o=>[o.name,o.email,o.phone,o.business_name,o.category].some(v=>String(v||'').toLowerCase().includes(q))));
});

search.addEventListener('input',()=>renderLeads(currentLeadRows()));

leadCategoryFilter.addEventListener('change',()=>loadLeads().catch(()=>{}));

businessSearch.addEventListener('input',()=>renderBusinesses(adminFilteredRows()));
$('[data-business-status-filter]')?.addEventListener('change',()=>renderBusinesses(adminFilteredRows()));

/* ── Quick ranges ── */
function setRange(hours){const now=new Date();filterTo.value=toLocalInput(now);filterFrom.value=toLocalInput(new Date(now.getTime()-hours*60*60*1000));}
function resetRange(){setRange(30*24);}
async function applyQuickRange(hours){setRange(hours);await loadDashboard().catch(error=>{filterStatus.textContent=error.message;});}

/* ── Printable backend reports (admin only) ── */
const reportForm=$('[data-report-form]');
const reportFrom=$('[data-report-from]');
const reportTo=$('[data-report-to]');
const reportDetail=$('[data-report-detail]');
const reportStatus=$('[data-report-status]');
const dateOnly=(date)=>{const offset=date.getTimezoneOffset();return new Date(date.getTime()-offset*60000).toISOString().slice(0,10);};
const fmtDay=(value)=>value?new Date(`${value}T12:00:00`).toLocaleDateString():'—';
const fmtLocalDay=(value)=>{if(!value)return '—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString();};
const pct=(part,whole)=>whole?`${((Number(part||0)/Number(whole))*100).toFixed(1)}%`:'—';

function resetReportRange(){
  const now=new Date();
  reportTo.value=dateOnly(now);
  reportFrom.value=dateOnly(new Date(now.getFullYear(),now.getMonth(),1));
}

function setReportRange(key){
  const now=new Date();
  if(key==='this-month'){reportFrom.value=dateOnly(new Date(now.getFullYear(),now.getMonth(),1));reportTo.value=dateOnly(now);}
  else if(key==='last-month'){reportFrom.value=dateOnly(new Date(now.getFullYear(),now.getMonth()-1,1));reportTo.value=dateOnly(new Date(now.getFullYear(),now.getMonth(),0));}
  else if(key==='last-7'){reportFrom.value=dateOnly(new Date(now.getTime()-6*86400000));reportTo.value=dateOnly(now);}
  else if(key==='ytd'){reportFrom.value=dateOnly(new Date(now.getFullYear(),0,1));reportTo.value=dateOnly(now);}
}

async function fetchReport(){
  if(!reportFrom.value||!reportTo.value)throw new Error('Please choose a start and end date.');
  if(reportFrom.value>reportTo.value)throw new Error('The start date must be on or before the end date.');
  const params=new URLSearchParams({from:new Date(`${reportFrom.value}T00:00:00`).toISOString(),to:new Date(`${reportTo.value}T23:59:59.999`).toISOString()});
  return api(`/api/admin/report?${params}`);
}

function reportTable(headers,rows,emptyText){
  if(!rows.length)return `<p class="report-empty">${esc(emptyText)}</p>`;
  return `<table class="report-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(cells=>`<tr>${cells.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

function buildReportHtml(data,detailLevel){
  const t=data.traffic||{};const o=data.order_totals||{};const l=data.lead_totals||{};
  const rangeLabel=`${fmtLocalDay(data.range?.from)} – ${fmtLocalDay(data.range?.to)}`;
  const cards=[
    ['Visits',Number(t.visits||0).toLocaleString()],
    ['Unique visitors',Number(t.unique_visitors||0).toLocaleString()],
    ['Orders submitted',Number(o.total_orders||0).toLocaleString()],
    ['Gross order value',fmtMoney(o.revenue_cents)],
    ['Paid revenue',fmtMoney(o.paid_cents)],
    ['Awaiting payment',fmtMoney(o.pending_cents)],
    ['Refunded',fmtMoney(o.refunded_cents)],
    ['Leads ordered',Number(o.leads_ordered||0).toLocaleString()],
    ['Leads fulfilled',Number(o.leads_fulfilled||0).toLocaleString()],
    ['Fulfillment rate',pct(o.leads_fulfilled,o.leads_ordered)],
    ['Leads added to database',Number(l.total_leads||0).toLocaleString()],
    ['Leads delivered to clients',Number(l.delivered||0).toLocaleString()],
    ['New business accounts',Number((data.new_businesses||[]).length).toLocaleString()],
    ['Visit-to-order rate',pct(o.total_orders,t.visits)]
  ];

  const sections=[];
  sections.push(`<h2>Summary</h2><div class="report-cards">${cards.map(([label,value])=>`<div class="report-card"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('')}</div>`);

  sections.push(`<h2>Revenue by order status</h2>${reportTable(['Status','Orders','Value'],(data.orders_by_status||[]).map(r=>[esc(r.status||'—'),Number(r.orders||0).toLocaleString(),fmtMoney(r.revenue_cents)]),'No orders in this date range.')}`);
  sections.push(`<h2>Revenue by category</h2>${reportTable(['Category','Orders','Leads ordered','Value'],(data.orders_by_category||[]).map(r=>[esc(catLabel(r.category)),Number(r.orders||0).toLocaleString(),Number(r.leads_ordered||0).toLocaleString(),fmtMoney(r.revenue_cents)]),'No orders in this date range.')}`);
  sections.push(`<h2>Leads added by category</h2>${reportTable(['Category','Leads'],(data.leads_by_category||[]).map(r=>[esc(catLabel(r.category)),Number(r.leads||0).toLocaleString()]),'No leads added in this date range.')}`);
  sections.push(`<h2>Leads by status</h2>${reportTable(['Status','Leads'],(data.leads_by_status||[]).map(r=>[esc(r.status||'—'),Number(r.leads||0).toLocaleString()]),'No leads added in this date range.')}`);
  sections.push(`<h2>Daily activity</h2>${reportTable(['Day','Views','Unique visitors','Orders','Leads delivered'],(data.daily||[]).map(r=>[fmtDay(r.day),Number(r.views||0).toLocaleString(),Number(r.unique_visitors||0).toLocaleString(),Number(r.orders||0).toLocaleString(),Number(r.leads_delivered||0).toLocaleString()]),'No site activity in this date range.')}`);
  sections.push(`<h2>Top pages</h2>${reportTable(['Page','Views','Unique visitors'],(data.pages||[]).map(r=>[esc(r.page_path||'—'),Number(r.views||0).toLocaleString(),Number(r.unique_visitors||0).toLocaleString()]),'No page views in this date range.')}`);
  sections.push(`<h2>Traffic sources</h2>${reportTable(['Referrer','Page views'],(data.referrers||[]).map(r=>[esc(r.referrer||'Direct / none'),Number(r.hits||0).toLocaleString()]),'No referrer data in this date range.')}`);
  sections.push(`<h2>Account status (all time)</h2>${reportTable(['Status','Accounts'],(data.business_statuses||[]).map(r=>[esc(r.status||'—'),Number(r.businesses||0).toLocaleString()]),'No business accounts yet.')}`);

  if(detailLevel==='full'){
    sections.push(`<h2>Orders in range</h2>${reportTable(['Submitted','Business','Contact','Category','Qty','Total','Status','Fulfilled'],(data.orders||[]).map(r=>[fmt(r.submitted_at),esc(r.business_name||r.name||'—'),`${esc(r.email||'—')}<br>${esc(r.phone||'—')}`,esc(catLabel(r.category)),Number(r.quantity||0).toLocaleString(),fmtMoney(r.total_cents),esc(r.status||'—'),`${r.fulfilled_leads||0}/${r.quantity||0}`]),'No orders in this date range.')}`);
    sections.push(`<h2>New business accounts in range</h2>${reportTable(['Created','Name','Company','Contact','Category','Status'],(data.new_businesses||[]).map(r=>[fmt(r.created_at),esc(r.name||'—'),esc(r.company_name||'—'),`${esc(r.email||'—')}<br>${esc(r.phone||'—')}`,esc(catLabel(r.preferred_category)),esc(r.status||'—')]),'No new accounts in this date range.')}`);
  }

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Shedlr backend report ${esc(rangeLabel)}</title>
<style>
*{box-sizing:border-box}
body{font-family:Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16232e;margin:0;padding:28px 32px;background:#fff}
header{border-bottom:2px solid #16232e;padding-bottom:12px;margin-bottom:18px}
h1{font-size:22px;margin:0 0 4px}
header p{margin:2px 0;color:#5a6a7a;font-size:13px}
h2{font-size:15px;margin:22px 0 8px;padding-bottom:4px;border-bottom:1px solid #d8e0e5;page-break-after:avoid}
.report-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.report-card{border:1px solid #d8e0e5;border-radius:6px;padding:8px 10px}
.report-card span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a6a7a}
.report-card strong{display:block;font-size:17px;margin-top:2px}
table.report-table{width:100%;border-collapse:collapse;font-size:12px}
table.report-table th{text-align:left;background:#f4f7f8;border:1px solid #d8e0e5;padding:5px 7px}
table.report-table td{border:1px solid #e3e9ec;padding:5px 7px;vertical-align:top}
.report-empty{font-size:12px;color:#5a6a7a;margin:4px 0 0}
.report-actions{margin-bottom:16px}
.report-actions button{font:inherit;font-size:13px;padding:8px 14px;border:1px solid #16232e;background:#16232e;color:#fff;border-radius:6px;cursor:pointer}
footer{margin-top:24px;border-top:1px solid #d8e0e5;padding-top:8px;font-size:11px;color:#5a6a7a}
@media print{.report-actions{display:none}body{padding:0}table.report-table{page-break-inside:auto}tr{page-break-inside:avoid}}
</style></head><body>
<div class="report-actions"><button type="button" onclick="window.print()">Print this report</button></div>
<header><h1>Shedlr backend report</h1><p><strong>Date range:</strong> ${esc(rangeLabel)}</p><p><strong>Generated:</strong> ${esc(fmt(data.generated_at))}</p><p><strong>Detail level:</strong> ${detailLevel==='full'?'Summary plus order and account detail':'Summary totals only'}</p></header>
${sections.join('\n')}
<footer>Shedlr admin · shedlr.com · Confidential internal report</footer>
</body></html>`;
}

async function openReport(autoPrint){
  reportStatus.textContent='Building report…';
  try{
    const data=await fetchReport();
    const html=buildReportHtml(data,reportDetail.value);
    const win=window.open('','shedlrReport');
    if(!win){reportStatus.textContent='Your browser blocked the report window. Allow pop-ups for shedlr.com and try again.';return;}
    win.document.open();win.document.write(html);win.document.close();
    win.focus();
    if(autoPrint)setTimeout(()=>{try{win.print();}catch{}},600);
    reportStatus.textContent=`Report ready for ${fmtDay(reportFrom.value)} through ${fmtDay(reportTo.value)}.`;
  }catch(error){reportStatus.textContent=error.message;}
}

function csvCell(value){const str=String(value??'');return /[",\n]/.test(str)?`"${str.replace(/"/g,'""')}"`:str;}

async function downloadReportCsv(){
  reportStatus.textContent='Building CSV…';
  try{
    const data=await fetchReport();
    const t=data.traffic||{};const o=data.order_totals||{};const l=data.lead_totals||{};
    const lines=[];
    lines.push(['Shedlr backend report']);
    lines.push(['Range from',data.range?.from,'Range to',data.range?.to]);
    lines.push([]);
    lines.push(['Summary metric','Value']);
    [['Visits',t.visits||0],['Unique visitors',t.unique_visitors||0],['Orders submitted',o.total_orders||0],['Gross order value',(Number(o.revenue_cents||0)/100).toFixed(2)],['Paid revenue',(Number(o.paid_cents||0)/100).toFixed(2)],['Awaiting payment',(Number(o.pending_cents||0)/100).toFixed(2)],['Refunded',(Number(o.refunded_cents||0)/100).toFixed(2)],['Leads ordered',o.leads_ordered||0],['Leads fulfilled',o.leads_fulfilled||0],['Leads added',l.total_leads||0],['Leads delivered',l.delivered||0],['New accounts',(data.new_businesses||[]).length]].forEach(row=>lines.push(row));
    lines.push([]);
    lines.push(['Orders in range']);
    lines.push(['Order ID','Submitted','Business','Contact name','Email','Phone','Category','Quantity','Total','Status','Fulfilled','Paid at']);
    (data.orders||[]).forEach(r=>lines.push([r.id,r.submitted_at,r.business_name||'',r.name||'',r.email||'',r.phone||'',r.category||'',r.quantity||0,(Number(r.total_cents||0)/100).toFixed(2),r.status||'',r.fulfilled_leads||0,r.paid_at||'']));
    lines.push([]);
    lines.push(['New business accounts in range']);
    lines.push(['Business ID','Created','Name','Company','Email','Phone','Category','Status']);
    (data.new_businesses||[]).forEach(r=>lines.push([r.id,r.created_at,r.name||'',r.company_name||'',r.email||'',r.phone||'',r.preferred_category||'',r.status||'']));
    const csv=lines.map(row=>row.map(csvCell).join(',')).join('\r\n');
    const blob=new Blob([`\ufeff${csv}`],{type:'text/csv;charset=utf-8'});
    const link=document.createElement('a');
    link.href=URL.createObjectURL(blob);
    link.download=`shedlr-report-${reportFrom.value}-to-${reportTo.value}.csv`;
    document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(link.href),2000);
    reportStatus.textContent='CSV downloaded.';
  }catch(error){reportStatus.textContent=error.message;}
}

if(reportForm){
  reportForm.addEventListener('submit',event=>{event.preventDefault();openReport(true);});
  $('[data-report-preview]').addEventListener('click',()=>openReport(false));
  $('[data-report-csv]').addEventListener('click',downloadReportCsv);
  document.querySelectorAll('[data-report-range]').forEach(button=>{
    button.addEventListener('click',()=>{setReportRange(button.dataset.reportRange);reportStatus.textContent=`Range set to ${fmtDay(reportFrom.value)} through ${fmtDay(reportTo.value)}. Choose Print report or Preview report.`;});
  });
}

/* ══════════════════════════════════════════════════════════════════════
   Killswitch + delete (owner admin only)
   ══════════════════════════════════════════════════════════════════════ */
const digitsOnly=(v)=>String(v||'').replace(/\D/g,'');
function findPossibleDuplicates(b){
  if(!b)return [];
  const phone=digitsOnly(b.phone).slice(-10);
  const company=String(b.company_name||'').trim().toLowerCase();
  const name=String(b.name||'').trim().toLowerCase();
  return businesses.filter(x=>String(x.id)!==String(b.id)&&(
    (phone.length===10&&digitsOnly(x.phone).slice(-10)===phone)||
    (company&&String(x.company_name||'').trim().toLowerCase()===company)||
    (name&&company===''&&String(x.name||'').trim().toLowerCase()===name)
  ));
}

function renderKillswitch(b){
  const state=$('[data-killswitch-state]');const btn=$('[data-business-killswitch]');const msg=$('[data-killswitch-message]');
  if(!state||!btn||!b)return;
  if(msg){msg.hidden=true;msg.textContent='';}
  const on=!!b.leads_locked;
  state.innerHTML=on
    ?`<strong style="color:#b42318">ON</strong>${b.leads_locked_at?` since ${esc(fmt(b.leads_locked_at))}`:''}. The client can still sign in and see their account, but cannot see or open any leads. The account stays visible to admin, account managers, retention, and VAs (VAs until it is canceled).`
    :'<strong>OFF</strong>. The client can see their delivered leads normally.';
  btn.textContent=on?'Turn killswitch off (restore lead access)':'Turn killswitch on (block lead access)';
  btn.classList.toggle('is-on',!on);
  const hint=$('[data-duplicate-hint]');
  if(hint){
    const dups=findPossibleDuplicates(b);
    hint.hidden=!dups.length;
    hint.innerHTML=dups.length?`<strong>Possible duplicates:</strong> ${dups.slice(0,5).map(d=>`${esc(d.company_name||d.name||d.email)} (ID ${d.id}, ${esc(d.email)}${d.portal_activated?', activated':''})`).join('; ')}`:'';
  }
}

$('[data-business-killswitch]')?.addEventListener('click',async()=>{
  if(!activeBusiness||!activeBusinessDetail)return;
  const b=activeBusinessDetail.business;
  const next=!b.leads_locked;
  const label=b.company_name||b.name||b.email;
  if(next&&!confirm(`Turn the killswitch ON for ${label}?\n\nTheir client portal immediately stops showing leads. The account stays visible to everyone else, and you can turn it back off any time.`))return;
  const btn=$('[data-business-killswitch]');const msg=$('[data-killswitch-message]');
  btn.disabled=true;
  try{
    const res=await api(`/api/admin/businesses/${b.id}/killswitch`,{method:'POST',body:JSON.stringify({enabled:next})});
    activeBusinessDetail.business={...b,...res.business};
    Object.assign(activeBusiness,res.business);
    renderKillswitch(activeBusinessDetail.business);
    renderBusinesses(adminFilteredRows());
    msg.hidden=false;msg.className='form-message';
    msg.textContent=next?'Killswitch on. The client portal can no longer see leads.':'Killswitch off. The client can see their leads again.';
  }catch(error){msg.hidden=false;msg.className='form-message error';msg.textContent=error.message;}
  btn.disabled=false;
});

$('[data-business-delete]')?.addEventListener('click',async()=>{
  if(!activeBusiness)return;
  const b=activeBusinessDetail?.business||activeBusiness;
  const label=b.company_name||b.name||b.email;
  const leadCount=(activeBusinessDetail?.assignments||[]).length;
  const warning=[
    `Permanently delete ${label} (${b.email}, ID ${b.id})?`,
    leadCount?`${leadCount} delivered lead${leadCount===1?'':'s'} will go back to the unassigned pool.`:'',
    b.stripe_customer_id?`WARNING: this account is linked to Stripe customer ${b.stripe_customer_id}. Make sure this is the duplicate and not the paying account. Deleting here does not cancel anything in Stripe.`:'',
    'This cannot be undone. Type DELETE to confirm.'
  ].filter(Boolean).join('\n\n');
  const typed=prompt(warning);
  if(typed===null)return;
  const msg=$('[data-business-delete-message]');
  if(typed.trim().toUpperCase()!=='DELETE'){msg.hidden=false;msg.className='form-message error';msg.textContent='Not deleted. Type DELETE exactly to confirm.';return;}
  const btn=$('[data-business-delete]');btn.disabled=true;
  msg.hidden=false;msg.className='form-message';msg.textContent='Deleting…';
  try{
    const res=await api(`/api/admin/businesses/${b.id}`,{method:'DELETE'});
    businesses=businesses.filter(x=>String(x.id)!==String(b.id));
    renderBusinesses(adminFilteredRows());
    activeBusiness=null;activeBusinessDetail=null;
    businessDialog.close();
    const out=$('[data-business-report-status]');
    if(out)out.textContent=`Deleted ${label} (ID ${res.deleted?.id??b.id}).${res.leads_released?` ${res.leads_released} lead${res.leads_released===1?'':'s'} returned to the unassigned pool.`:''}`;
    loadLeads().catch(()=>{});
  }catch(error){msg.className='form-message error';msg.textContent=error.message;}
  btn.disabled=false;
});

/* ══════════════════════════════════════════════════════════════════════
   Shared report page shell (Stripe + sign-up reports)
   ══════════════════════════════════════════════════════════════════════ */
function reportPage(title,headerLines,body){
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
*{box-sizing:border-box}
body{font-family:Inter,-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#16232e;margin:0;padding:28px 32px;background:#fff}
header{border-bottom:2px solid #16232e;padding-bottom:12px;margin-bottom:18px}
h1{font-size:22px;margin:0 0 4px}
header p{margin:2px 0;color:#5a6a7a;font-size:13px}
h2{font-size:15px;margin:22px 0 8px;padding-bottom:4px;border-bottom:1px solid #d8e0e5;page-break-after:avoid}
.report-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px}
.report-card{border:1px solid #d8e0e5;border-radius:6px;padding:8px 10px}
.report-card span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#5a6a7a}
.report-card strong{display:block;font-size:17px;margin-top:2px}
table.report-table{width:100%;border-collapse:collapse;font-size:12px}
table.report-table th{text-align:left;background:#f4f7f8;border:1px solid #d8e0e5;padding:5px 7px}
table.report-table td{border:1px solid #e3e9ec;padding:5px 7px;vertical-align:top}
table.report-table td.num{text-align:right;white-space:nowrap}
tr.total td{font-weight:700;background:#f4f7f8}
.neg{color:#b42318}
.warn{background:#fff4d6;border:1px solid #f0d58a;padding:8px 10px;border-radius:6px;font-size:12px;margin:8px 0}
.report-empty{font-size:12px;color:#5a6a7a;margin:4px 0 0}
.report-actions{margin-bottom:16px}
.report-actions button{font:inherit;font-size:13px;padding:8px 14px;border:1px solid #16232e;background:#16232e;color:#fff;border-radius:6px;cursor:pointer}
footer{margin-top:24px;border-top:1px solid #d8e0e5;padding-top:8px;font-size:11px;color:#5a6a7a}
@media print{.report-actions{display:none}body{padding:0}@page{size:landscape}table.report-table{page-break-inside:auto}tr{page-break-inside:avoid}}
</style></head><body>
<div class="report-actions"><button type="button" onclick="window.print()">Print this report</button></div>
<header><h1>${esc(title)}</h1>${headerLines.map(([k,v])=>`<p><strong>${esc(k)}:</strong> ${esc(v)}</p>`).join('')}</header>
${body}
<footer>Shedlr · shedlr.com · Confidential internal report · Amounts in USD</footer>
</body></html>`;
}

function openHtmlWindow(html,name,autoPrint,statusEl){
  const win=window.open('',name);
  if(!win){if(statusEl)statusEl.textContent='Your browser blocked the report window. Allow pop-ups for shedlr.com and try again.';return false;}
  win.document.open();win.document.write(html);win.document.close();win.focus();
  if(autoPrint)setTimeout(()=>{try{win.print();}catch{}},600);
  return true;
}

function downloadCsv(lines,filename){
  const csv=lines.map(row=>row.map(csvCell).join(',')).join('\r\n');
  const blob=new Blob([`\ufeff${csv}`],{type:'text/csv;charset=utf-8'});
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);link.download=filename;
  document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(link.href),2000);
}

const dollars=(cents)=>(Number(cents||0)/100).toFixed(2);
const accountLabel=(b)=>b?`${b.company_name||b.name||b.email} (ID ${b.id})`:'No Shedlr account';
const portalLabel=(b)=>!b?'—':b.portal_activated?'Activated':'Not activated';
const localRangeParams=(fromValue,toValue)=>new URLSearchParams({from:new Date(`${fromValue}T00:00:00`).toISOString(),to:new Date(`${toValue}T23:59:59.999`).toISOString()});
function quickRange(key){
  const now=new Date();
  if(key==='today')return [dateOnly(now),dateOnly(now)];
  if(key==='last-7')return [dateOnly(new Date(now.getTime()-6*86400000)),dateOnly(now)];
  if(key==='last-month')return [dateOnly(new Date(now.getFullYear(),now.getMonth()-1,1)),dateOnly(new Date(now.getFullYear(),now.getMonth(),0))];
  if(key==='ytd')return [dateOnly(new Date(now.getFullYear(),0,1)),dateOnly(now)];
  return [dateOnly(new Date(now.getFullYear(),now.getMonth(),1)),dateOnly(now)];
}

/* ══════════════════════════════════════════════════════════════════════
   Stripe reports (owner admin only) — separate from the site report
   ══════════════════════════════════════════════════════════════════════ */
const stripeForm=$('[data-stripe-report-form]');
const stripeFrom=$('[data-stripe-from]');
const stripeTo=$('[data-stripe-to]');
const stripeMonth=$('[data-stripe-month]');
const stripeDetail=$('[data-stripe-detail]');
const stripeStatus=$('[data-stripe-status]');

function setStripeRange(key){
  if(!stripeFrom)return;
  const [from,to]=quickRange(key);
  stripeFrom.value=from;stripeTo.value=to;
  if(stripeMonth)stripeMonth.value=(key==='this-month'||key==='last-month')?from.slice(0,7):'';
}
function resetStripeRange(){setStripeRange('this-month');}

stripeMonth?.addEventListener('change',()=>{
  if(!stripeMonth.value)return;
  const [y,m]=stripeMonth.value.split('-').map(Number);
  stripeFrom.value=dateOnly(new Date(y,m-1,1));
  stripeTo.value=dateOnly(new Date(y,m,0));
  stripeStatus.textContent=`Range set to ${fmtDay(stripeFrom.value)} through ${fmtDay(stripeTo.value)}.`;
});

async function fetchStripeReport(){
  if(!stripeFrom.value||!stripeTo.value)throw new Error('Please choose a start and end date.');
  if(stripeFrom.value>stripeTo.value)throw new Error('The start date must be on or before the end date.');
  return api(`/api/admin/stripe-report?${localRangeParams(stripeFrom.value,stripeTo.value)}`);
}

function truncationNotes(data){
  const t=data.truncated||{};const notes=[];
  if(t.charges)notes.push('Stripe returned more charges than one report can load. Totals may be incomplete and 1st/2nd/3rd numbering may start late. Use a shorter date range.');
  if(t.signups)notes.push('More than 1,000 sign-ups in range. The sign-up list is incomplete; use a shorter date range.');
  if(t.disputes)notes.push('More than 500 disputes in range. The dispute list is incomplete.');
  return notes;
}

const PAYMENT_LIST_LABELS=[['first','1st payments'],['second','2nd payments'],['third','3rd payments'],['fourth_plus','4th+ payments']];

function buildStripeReportHtml(data,detailLevel){
  const t=data.totals||{};
  const rangeLabel=`${fmtLocalDay(data.range?.from)} – ${fmtLocalDay(data.range?.to)}`;
  const money=(c)=>fmtMoney(c);const neg=(c)=>`<span class="neg">−${fmtMoney(c)}</span>`;
  const cards=[
    ['Completed sign-ups',Number(t.signups||0).toLocaleString()],
    ['Gross from sign-ups',money(t.signup_gross_cents)],
    ['Payments collected',Number(t.payments||0).toLocaleString()],
    ['Gross collected',money(t.gross_collected_cents)],
    ['Failed, not recovered',`${Number(t.failed_unrecovered_customers||0).toLocaleString()} · ${money(t.failed_unrecovered_cents)}`],
    ['Disputes',`${Number(t.disputes||0).toLocaleString()} · ${money(t.disputed_cents)}`],
    ['Stripe fees',money(t.stripe_fees_cents)],
    ['Net after deductions',money(t.net_cents)]
  ];
  const sections=[];
  truncationNotes(data).forEach(n=>sections.push(`<div class="warn">${esc(n)}</div>`));
  sections.push(`<h2>Summary</h2><div class="report-cards">${cards.map(([l,v])=>`<div class="report-card"><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`);

  sections.push(`<h2>Gross to net</h2><table class="report-table"><tbody>
<tr><td>Total gross billed (collected + unrecovered failed payments)</td><td class="num">${money(t.gross_attempted_cents)}</td></tr>
<tr><td>Less failed payments not recovered (${Number(t.failed_unrecovered_customers||0)} customer${t.failed_unrecovered_customers===1?'':'s'}; ${Number(t.failed_payments||0)} total failed attempt${t.failed_payments===1?'':'s'} worth ${money(t.failed_cents)} including Stripe retries)</td><td class="num">${neg(t.failed_unrecovered_cents)}</td></tr>
<tr class="total"><td>Gross collected</td><td class="num">${money(t.gross_collected_cents)}</td></tr>
<tr><td>Less refunds</td><td class="num">${neg(t.refunds_cents)}</td></tr>
<tr><td>Less disputes (${Number(t.disputes||0)} opened; ${money(t.disputed_cents)} disputed incl. ${money(t.dispute_fees_cents)} dispute fees; shown as net loss after any won disputes)</td><td class="num">${neg(t.dispute_loss_cents)}</td></tr>
<tr><td>Less Stripe processing fees</td><td class="num">${neg(t.stripe_fees_cents)}</td></tr>
<tr class="total"><td>Net after deductions</td><td class="num">${money(t.net_cents)}</td></tr>
</tbody></table>`);

  const lists=data.payment_lists||{};
  sections.push(`<h2>Payment number breakdown</h2>${reportTable(['Payment #','Payments','Gross','Stripe fees','Net'],
    PAYMENT_LIST_LABELS.map(([key,label])=>{const rows=lists[key]||[];return [esc(label),rows.length.toLocaleString(),money(rows.reduce((s,p)=>s+Number(p.amount_cents||0),0)),money(rows.reduce((s,p)=>s+Number(p.fee_cents||0),0)),money(rows.reduce((s,p)=>s+Number(p.net_cents||0),0))];}),'No payments in this date range.')}`);

  if(data.salespeople_ready!==false)sections.push(salesSummaryHtml(data));

  if(detailLevel==='full'){
    sections.push(`<h2>Completed sign-ups (${(data.signups||[]).length})</h2>${reportTable(['Signed up','Customer','Email','Phone','Paid at checkout','Shedlr account','Salesman','Portal'],
      (data.signups||[]).map(s=>[fmt(s.created_at),esc(s.name||'—'),esc(s.email||'—'),esc(s.phone||'—'),money(s.amount_cents),esc(accountLabel(s.business)),esc(salesmanOf(s.business)),esc(portalLabel(s.business))]),'No completed sign-ups in this date range.')}`);
    PAYMENT_LIST_LABELS.forEach(([key,label])=>{
      const rows=lists[key]||[];
      sections.push(`<h2>${esc(label)} (${rows.length})</h2>${reportTable(['Paid','Customer','Email','Amount','Stripe fee','Net','Refunded','Shedlr account','Salesman'],
        rows.map(p=>[fmt(p.created_at),esc(p.business?.company_name||p.name||'—'),esc(p.email||'—'),money(p.amount_cents),money(p.fee_cents),p.net_cents==null?'—':money(p.net_cents),p.refunded_cents?money(p.refunded_cents):'—',esc(accountLabel(p.business)),esc(salesmanOf(p.business))]),`No ${label.toLowerCase()} in this date range.`)}`);
    });
    sections.push(`<h2>Failed payments (${(data.failed_payments||[]).length} attempts)</h2>${reportTable(['Attempted','Customer','Email','Amount','Reason','Recovered later?','Shedlr account'],
      (data.failed_payments||[]).map(p=>[fmt(p.created_at),esc(p.business?.company_name||p.name||'—'),esc(p.email||'—'),money(p.amount_cents),esc(p.failure_message||p.failure_code||'—'),p.recovered?'Yes, a retry succeeded':'<strong>No</strong>',esc(accountLabel(p.business))]),'No failed payments in this date range.')}`);
    sections.push(`<h2>Disputes (${(data.disputes||[]).length})</h2>${reportTable(['Opened','Email','Amount','Status','Reason','Dispute fee','Net impact','Evidence due','Shedlr account'],
      (data.disputes||[]).map(d=>[fmt(d.created_at),esc(d.email||'—'),money(d.amount_cents),esc(String(d.status||'—').replace(/_/g,' ')),esc(String(d.reason||'—').replace(/_/g,' ')),money(d.fee_cents),`${d.net_impact_cents<0?'−':''}${fmtMoney(Math.abs(d.net_impact_cents||0))}`,d.evidence_due_by?fmt(d.evidence_due_by):'—',esc(accountLabel(d.business))]),'No disputes opened in this date range.')}`);
  }
  return reportPage('Shedlr Stripe report',[['Date range',rangeLabel],['Generated',fmt(data.generated_at)],['Source','Live from Stripe (charges, Checkout sessions, disputes)']],sections.join('\n'));
}

async function openStripeReport(autoPrint){
  stripeStatus.textContent='Pulling from Stripe…';
  try{
    const data=await fetchStripeReport();
    if(openHtmlWindow(buildStripeReportHtml(data,stripeDetail.value),'shedlrStripeReport',autoPrint,stripeStatus)){
      const notes=truncationNotes(data);
      stripeStatus.textContent=`Stripe report ready for ${fmtDay(stripeFrom.value)} through ${fmtDay(stripeTo.value)}: ${data.totals.signups} sign-ups, ${fmtMoney(data.totals.gross_collected_cents)} collected, ${fmtMoney(data.totals.net_cents)} net.${notes.length?' '+notes[0]:''}`;
    }
  }catch(error){stripeStatus.textContent=error.message;}
}

async function downloadStripeCsv(){
  stripeStatus.textContent='Building Stripe CSV…';
  try{
    const data=await fetchStripeReport();const t=data.totals||{};
    const lines=[['Shedlr Stripe report'],['Range from',data.range?.from,'Range to',data.range?.to],['Generated',data.generated_at],[]];
    truncationNotes(data).forEach(n=>lines.push(['WARNING',n]));
    lines.push(['Gross to net','Amount (USD)']);
    [['Total gross billed (collected + unrecovered failed)',t.gross_attempted_cents],['Less failed payments not recovered',-t.failed_unrecovered_cents],['Gross collected',t.gross_collected_cents],['Less refunds',-t.refunds_cents],['Less disputes (net loss)',-t.dispute_loss_cents],['Less Stripe fees',-t.stripe_fees_cents],['Net after deductions',t.net_cents]].forEach(([k,v])=>lines.push([k,dollars(v)]));
    lines.push([]);
    lines.push(['Metric','Value']);
    [['Completed sign-ups',t.signups],['Gross from sign-ups',dollars(t.signup_gross_cents)],['Payments collected',t.payments],['Failed payment attempts (incl. retries)',t.failed_payments],['Failed attempts amount (incl. retries)',dollars(t.failed_cents)],['Customers with failed payments',t.failed_customers],['Customers still unrecovered',t.failed_unrecovered_customers],['Disputes opened',t.disputes],['Disputed amount',dollars(t.disputed_cents)],['Dispute fees',dollars(t.dispute_fees_cents)],['1st payments',t.first_payments],['2nd payments',t.second_payments],['3rd payments',t.third_payments],['4th+ payments',t.fourth_plus_payments]].forEach(r=>lines.push(r));
    lines.push([]);
    salesCsvLines(data).forEach(r=>lines.push(r));
    lines.push([]);
    lines.push(['Completed sign-ups']);
    lines.push(['Signed up','Customer','Email','Phone','Paid at checkout','Stripe session','Stripe customer','Shedlr business ID','Salesman','Portal']);
    (data.signups||[]).forEach(s=>lines.push([s.created_at,s.name||'',s.email||'',s.phone||'',dollars(s.amount_cents),s.session_id,s.customer_id||'',s.business?.id||'',salesmanOf(s.business,''),portalLabel(s.business)]));
    lines.push([]);
    lines.push(['Payments (all, with payment number)']);
    lines.push(['Paid','Payment #','Customer','Email','Amount','Stripe fee','Net','Refunded','Disputed','Stripe charge','Stripe customer','Shedlr business ID','Salesman']);
    (data.payments||[]).forEach(p=>lines.push([p.created_at,p.payment_number||'',p.business?.company_name||p.name||'',p.email||'',dollars(p.amount_cents),dollars(p.fee_cents),p.net_cents==null?'':dollars(p.net_cents),dollars(p.refunded_cents),p.disputed?'Yes':'No',p.charge_id,p.customer_id||'',p.business?.id||'',salesmanOf(p.business,'')]));
    lines.push([]);
    lines.push(['Failed payments']);
    lines.push(['Attempted','Customer','Email','Amount','Reason','Recovered later','Stripe charge','Stripe customer','Shedlr business ID']);
    (data.failed_payments||[]).forEach(p=>lines.push([p.created_at,p.business?.company_name||p.name||'',p.email||'',dollars(p.amount_cents),p.failure_message||p.failure_code||'',p.recovered?'Yes':'No',p.charge_id,p.customer_id||'',p.business?.id||'']));
    lines.push([]);
    lines.push(['Disputes']);
    lines.push(['Opened','Email','Amount','Status','Reason','Dispute fee','Net impact','Evidence due','Stripe dispute','Stripe charge','Shedlr business ID']);
    (data.disputes||[]).forEach(d=>lines.push([d.created_at,d.email||'',dollars(d.amount_cents),d.status||'',d.reason||'',dollars(d.fee_cents),dollars(d.net_impact_cents),d.evidence_due_by||'',d.dispute_id,d.charge_id||'',d.business?.id||'']));
    downloadCsv(lines,`shedlr-stripe-report-${stripeFrom.value}-to-${stripeTo.value}.csv`);
    stripeStatus.textContent='Stripe CSV downloaded.';
  }catch(error){stripeStatus.textContent=error.message;}
}

if(stripeForm){
  stripeForm.addEventListener('submit',event=>{event.preventDefault();openStripeReport(true);});
  $('[data-stripe-preview]').addEventListener('click',()=>openStripeReport(false));
  $('[data-stripe-csv]').addEventListener('click',downloadStripeCsv);
  document.querySelectorAll('[data-stripe-range]').forEach(button=>button.addEventListener('click',()=>{
    setStripeRange(button.dataset.stripeRange);
    stripeStatus.textContent=`Range set to ${fmtDay(stripeFrom.value)} through ${fmtDay(stripeTo.value)}. Choose Print or Preview.`;
  }));
}

/* ══════════════════════════════════════════════════════════════════════
   Business account manager (BAM / sales) portal
   ══════════════════════════════════════════════════════════════════════ */
let bamSignups=[];let bamSignupData=null;
const bamFrom=$('[data-bam-from]');const bamTo=$('[data-bam-to]');
const bamSignupsStatus=$('[data-bam-signups-status]');
const bamSignupsTable=$('[data-bam-signups-table]');
const bamBusinessesTable=$('[data-bam-businesses-table]');

const portalPill=(b)=>!b?'<span class="status warn">No account yet</span>':b.portal_activated?'<span class="status ok">Activated</span>':'<span class="status warn">Not activated</span>';
function bamFilteredRows(){return filterBusinessRows($('[data-bam-search]')?.value,$('[data-bam-status-filter]')?.value);}

function renderBamBusinesses(rows){
  if(!bamBusinessesTable)return;
  bamBusinessesTable.innerHTML=rows.map(b=>`<tr><td><strong>${esc(b.company_name||b.name||'—')}</strong>${b.company_name&&b.name?`<span class="row-note">${esc(b.name)}</span>`:''}</td><td>${esc(b.email||'—')}<br>${esc(b.phone||'—')}</td><td>${esc(catLabel(b.preferred_category))}</td><td>${esc(b.address||'—')}</td><td><span class="status">${esc(statusLabel(b.status))}</span></td><td>${portalPill(b)}</td><td>${fmt(b.created_at)}</td><td><button type="button" data-open-business="${b.id}">View / edit</button></td></tr>`).join('')||'<tr><td colspan="8">No business accounts found.</td></tr>';
}

async function loadBamBusinesses(){
  const data=await api('/api/admin/businesses');
  businesses=data.businesses||[];
  renderBamBusinesses(bamFilteredRows());
}

function setBamRange(key){
  if(!bamFrom)return;
  const [from,to]=quickRange(key);bamFrom.value=from;bamTo.value=to;
}

function bamSignupRows(){
  const q=($('[data-bam-signup-search]')?.value||'').trim().toLowerCase();
  const rows=bamSignups.map((s,i)=>({...s,_i:i}));
  if(!q)return rows;
  return rows.filter(s=>[s.name,s.email,s.phone,s.business?.company_name,s.business?.name].some(v=>String(v||'').toLowerCase().includes(q)));
}

function renderBamSignups(){
  if(!bamSignupsTable)return;
  const rows=bamSignupRows();
  bamSignupsTable.innerHTML=rows.map(s=>{
    const b=s.business;
    const account=b?`<strong>${esc(b.company_name||b.name||b.email)}</strong><span class="row-note">ID ${b.id} · ${esc(statusLabel(b.status))}</span>`:'<span class="status warn">No account yet</span>';
    const action=b
      ?`<button type="button" data-bam-signup-link="${s._i}">${b.portal_activated?'Get reset link':'Get activation link'}</button> <button type="button" data-open-business="${b.id}">View</button>`
      :`<button type="button" data-bam-signup-link="${s._i}">Create account &amp; link</button>`;
    return `<tr><td>${fmt(s.created_at)}</td><td><strong>${esc(s.name||'—')}</strong><span class="row-note">${esc(s.email||'—')}</span>${s.phone?`<span class="row-note">${esc(s.phone)}</span>`:''}</td><td>${fmtMoney(s.amount_cents)}</td><td>${account}</td><td>${b?portalPill(b):'—'}</td><td>${action}</td></tr>`;
  }).join('')||'<tr><td colspan="6">No Stripe sign-ups in this date range.</td></tr>';
}

async function loadBamSignups(){
  if(!bamFrom.value||!bamTo.value)throw new Error('Please choose a start and end date.');
  if(bamFrom.value>bamTo.value)throw new Error('The start date must be on or before the end date.');
  bamSignupsStatus.textContent='Checking Stripe…';
  const data=await api(`/api/admin/stripe-signups?${localRangeParams(bamFrom.value,bamTo.value)}`);
  bamSignupData=data;bamSignups=data.signups||[];
  renderBamSignups();
  const t=data.totals||{};
  bamSignupsStatus.textContent=`${t.signups||0} sign-up${t.signups===1?'':'s'} (${fmtMoney(t.signup_gross_cents)}) from ${fmtDay(bamFrom.value)} through ${fmtDay(bamTo.value)}. ${t.not_activated||0} not activated yet, ${t.without_account||0} without a Shedlr account.${data.truncated?' More sign-ups exist than one list can show; use a shorter range.':''}`;
}

async function requestLinkForEmail(payload){
  const res=await api('/api/admin/businesses',{method:'POST',body:JSON.stringify(payload)});
  if(navigator.clipboard)navigator.clipboard.writeText(res.activation_url).catch(()=>{});
  const kind=res.link_mode==='reset'?'Password-reset link':'Activation link';
  const lead=res.existing?`Existing account found for ${res.business.email} (ID ${res.business.id}), so no duplicate was created.`:`New account created for ${res.business.email} (ID ${res.business.id}).`;
  return {res,text:`${lead} ${kind} copied (valid 72 hours): ${res.activation_url}`};
}

bamSignupsTable?.addEventListener('click',async event=>{
  const open=event.target.closest('[data-open-business]');
  if(open){openBusiness(open.dataset.openBusiness);return;}
  const btn=event.target.closest('[data-bam-signup-link]');
  if(!btn)return;
  const s=bamSignups[Number(btn.dataset.bamSignupLink)];
  if(!s||!s.email){bamSignupsStatus.textContent='That Stripe sign-up has no email address.';return;}
  btn.disabled=true;bamSignupsStatus.textContent='Generating link…';
  try{
    const {text}=await requestLinkForEmail({email:s.email,name:s.name||'',phone:s.phone||''});
    bamSignupsStatus.textContent=text;
    await loadBamBusinesses().catch(()=>{});
    await loadBamSignups().then(()=>{bamSignupsStatus.textContent=text;}).catch(()=>{});
  }catch(error){bamSignupsStatus.textContent=error.message;}
  btn.disabled=false;
});

$('[data-bam-signups-form]')?.addEventListener('submit',event=>{event.preventDefault();loadBamSignups().catch(error=>{bamSignupsStatus.textContent=error.message;});});
document.querySelectorAll('[data-bam-range]').forEach(button=>button.addEventListener('click',()=>{setBamRange(button.dataset.bamRange);loadBamSignups().catch(error=>{bamSignupsStatus.textContent=error.message;});}));
$('[data-bam-signup-search]')?.addEventListener('input',renderBamSignups);

function bamSignupReportHtml(){
  const rows=bamSignupRows();const t=bamSignupData?.totals||{};
  const cards=[['Sign-ups',String(rows.length)],['Paid at checkout',fmtMoney(rows.reduce((s,r)=>s+Number(r.amount_cents||0),0))],['Portal activated',String(rows.filter(r=>r.business?.portal_activated).length)],['Not activated',String(rows.filter(r=>r.business&&!r.business.portal_activated).length)],['No Shedlr account',String(rows.filter(r=>!r.business).length)]];
  const body=`<h2>Summary</h2><div class="report-cards">${cards.map(([l,v])=>`<div class="report-card"><span>${esc(l)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>
<h2>Stripe sign-ups</h2>${reportTable(['Signed up','Customer','Email','Phone','Paid','Shedlr account','Portal'],rows.map(s=>[fmt(s.created_at),esc(s.name||'—'),esc(s.email||'—'),esc(s.phone||'—'),fmtMoney(s.amount_cents),esc(accountLabel(s.business)),esc(portalLabel(s.business))]),'No sign-ups in this date range.')}`;
  return reportPage('Shedlr Stripe sign-up report',[['Date range',`${fmtDay(bamFrom.value)} – ${fmtDay(bamTo.value)}`],['Generated',fmt(new Date().toISOString())],['All sign-ups in range',String(t.signups||0)]],body);
}

$('[data-bam-signups-print]')?.addEventListener('click',()=>{
  if(!bamSignupData){bamSignupsStatus.textContent='Select Show sign-ups first.';return;}
  openHtmlWindow(bamSignupReportHtml(),'shedlrSignupReport',false,bamSignupsStatus);
});
$('[data-bam-signups-csv]')?.addEventListener('click',()=>{
  if(!bamSignupData){bamSignupsStatus.textContent='Select Show sign-ups first.';return;}
  const lines=[['Shedlr Stripe sign-up report'],['From',bamFrom.value,'To',bamTo.value],[],['Signed up','Customer','Email','Phone','Paid','Shedlr business ID','Business','Portal']];
  bamSignupRows().forEach(s=>lines.push([s.created_at,s.name||'',s.email||'',s.phone||'',dollars(s.amount_cents),s.business?.id||'',s.business?.company_name||'',portalLabel(s.business)]));
  downloadCsv(lines,`shedlr-signups-${bamFrom.value}-to-${bamTo.value}.csv`);
});

$('[data-bam-create-form]')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target;const out=$('[data-bam-create-status]');
  out.textContent='Checking for an existing account…';
  try{
    const {text}=await requestLinkForEmail({email:form.email.value.trim(),company_name:form.company_name.value.trim(),name:form.name.value.trim(),phone:form.phone.value.trim(),address:form.address.value.trim(),preferred_category:form.preferred_category.value||null});
    out.textContent=text;form.reset();
    await loadBamBusinesses().catch(()=>{});
  }catch(error){out.textContent=error.message;}
});

bamBusinessesTable?.addEventListener('click',event=>{const b=event.target.closest('[data-open-business]');if(b)openBusiness(b.dataset.openBusiness);});
$('[data-bam-search]')?.addEventListener('input',()=>renderBamBusinesses(bamFilteredRows()));
$('[data-bam-status-filter]')?.addEventListener('change',()=>renderBamBusinesses(bamFilteredRows()));

function renderBamBusinessDetail(detail){
  const b=detail.business||{};
  const grid=$('[data-bam-business-details]');
  if(grid)grid.innerHTML=[['Status',statusLabel(b.status)],['Portal',b.portal_activated?'Activated':'Not activated'],['Paid in Stripe',b.stripe_customer_id?'Yes (linked to Stripe)':'Not linked yet'],['Created',fmt(b.created_at)],['Last login',b.last_login_at?fmt(b.last_login_at):'Never'],['Account ID',b.id]].map(([l,v])=>`<div><strong>${esc(l)}</strong>${esc(v??'—')}</div>`).join('');
  $('[data-bam-company]').value=b.company_name||'';
  $('[data-bam-name]').value=b.name||'';
  $('[data-bam-email]').value=b.email||'';
  $('[data-bam-phone]').value=b.phone||'';
  $('[data-bam-address]').value=b.address||'';
  $('[data-bam-category]').value=b.preferred_category||'';
  const msg=$('[data-bam-save-message]');if(msg){msg.hidden=true;msg.textContent='';}
  const list=$('[data-bam-orders-list]');
  if(list){const orders=detail.orders||[];list.innerHTML=orders.length?orders.map(o=>`<div class="note-item"><strong>${catLabel(o.category)} — ${o.quantity} leads</strong><div>${fmtMoney(o.total_cents)} · Status: ${esc(o.status)}</div><div class="meta">Submitted ${fmt(o.created_at)}${o.paid_at?` · Paid ${fmt(o.paid_at)}`:''}</div></div>`).join(''):'<p class="empty-hint">No orders on file.</p>';}
}

$('[data-bam-save]')?.addEventListener('click',async()=>{
  if(!activeBusiness)return;
  const msg=$('[data-bam-save-message]');msg.hidden=false;msg.className='form-message';msg.textContent='Saving…';
  try{
    const res=await api(`/api/admin/businesses/${activeBusiness.id}`,{method:'PATCH',body:JSON.stringify({
      company_name:$('[data-bam-company]').value.trim(),name:$('[data-bam-name]').value.trim(),email:$('[data-bam-email]').value.trim(),
      phone:$('[data-bam-phone]').value.trim(),address:$('[data-bam-address]').value.trim(),preferred_category:$('[data-bam-category]').value
    })});
    Object.assign(activeBusiness,res.business);
    if(activeBusinessDetail)activeBusinessDetail.business=res.business;
    $('[data-business-title]').textContent=res.business.company_name||res.business.name||res.business.email;
    renderBamBusinessDetail({business:res.business,orders:activeBusinessDetail?.orders||[]});
    renderBamBusinesses(bamFilteredRows());
    if(bamSignupData)renderBamSignups();
    msg.hidden=false;msg.textContent='Saved.';
  }catch(error){msg.hidden=false;msg.className='form-message error';msg.textContent=error.message;}
});

async function enterBamPortal(){
  setBamRange('this-month');
  await loadBamBusinesses();
  await loadBamSignups().catch(error=>{bamSignupsStatus.textContent=error.message;});
}


/* ══════════════════════════════════════════════════════════════════════
   Salesmen & commissions (owner admin only)
   ══════════════════════════════════════════════════════════════════════ */
let salespeople=[];let salesReport=null;let salesSetupError='';
const salesTable=$('[data-sales-table]');
const salesAssignSelect=$('[data-sales-assign-select]');
const salesFrom=$('[data-sales-from]');const salesTo=$('[data-sales-to]');const salesMonth=$('[data-sales-month]');
const salesReportStatus=$('[data-sales-report-status]');
const salesReportTable=$('[data-sales-report-table]');

const salesmanById=(id)=>salespeople.find(sp=>String(sp.id)===String(id));
function salesmanOf(b,empty='Unassigned'){if(!b)return empty;if(b.salesperson_name)return b.salesperson_name;const sp=b.salesperson_id?salesmanById(b.salesperson_id):null;return sp?sp.name:empty;}
function salesmanCell(b){
  if(!b.salesperson_id)return '<span class="status muted">None</span>';
  const sp=salesmanById(b.salesperson_id);
  return sp?`<strong>${esc(sp.name)}</strong>${sp.active?'':'<span class="row-note">inactive</span>'}`:`ID ${esc(b.salesperson_id)}`;
}

function renderSalesmanOptions(){
  const active=salespeople.filter(sp=>sp.active);const inactive=salespeople.filter(sp=>!sp.active);
  const opts=(list)=>list.map(sp=>`<option value="${sp.id}">${esc(sp.name)}</option>`).join('');
  if(salesAssignSelect){const cur=salesAssignSelect.value;salesAssignSelect.innerHTML='<option value="">Select a salesman</option>'+opts(active);salesAssignSelect.value=salesmanById(cur)?.active?cur:'';}
  const filter=$('[data-business-salesman-filter]');
  if(filter){const cur=filter.value;filter.innerHTML='<option value="">All salesmen</option><option value="none">No salesman</option>'+opts(salespeople);filter.value=(cur==='none'||salesmanById(cur))?cur:'';}
  const dlg=$('[data-business-salesman]');
  if(dlg){const cur=dlg.value;dlg.innerHTML='<option value="">— No salesman —</option>'+opts(active)+(inactive.length?`<optgroup label="Inactive">${opts(inactive)}</optgroup>`:'');dlg.value=salesmanById(cur)?cur:'';}
}

function renderSalesTable(){
  if(!salesTable)return;
  if(salesSetupError){salesTable.innerHTML=`<tr><td colspan="5">${esc(salesSetupError)}</td></tr>`;return;}
  salesTable.innerHTML=salespeople.map(sp=>`<tr class="${sp.active?'':'sales-inactive'}"><td><strong>${esc(sp.name)}</strong><span class="row-note">Added ${esc(fmtLocalDay(sp.created_at))}</span></td><td>${esc(sp.email||'—')}<br>${esc(sp.phone||'')}</td><td>${Number(sp.businesses_assigned||0).toLocaleString()}</td><td>${sp.active?'<span class="status ok">Active</span>':'<span class="status muted">Inactive</span>'}</td><td><div class="sales-actions"><button type="button" data-sales-view="${sp.id}">Show businesses</button><button type="button" data-sales-edit="${sp.id}">Edit</button><button type="button" data-sales-toggle="${sp.id}">${sp.active?'Deactivate':'Reactivate'}</button><button type="button" class="danger-link" data-sales-delete="${sp.id}">Delete</button></div></td></tr>`).join('')||'<tr><td colspan="5">No salesmen yet. Add one above.</td></tr>';
}

function applySalespeople(list){
  salespeople=(list||[]).map(sp=>({...sp,active:!!sp.active}));
  salesSetupError='';
  renderSalesTable();renderSalesmanOptions();
  if(businessesTable&&businesses.length)renderBusinesses(adminFilteredRows());
}

async function loadSalespeople(){
  try{const data=await api('/api/admin/salespeople');applySalespeople(data.salespeople);}
  catch(error){salesSetupError=error.message;salespeople=[];renderSalesTable();renderSalesmanOptions();}
}

$('[data-business-salesman-filter]')?.addEventListener('change',()=>renderBusinesses(adminFilteredRows()));

$('[data-sales-add-form]')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target;const out=$('[data-sales-add-status]');
  out.textContent='Adding…';
  try{
    const data=await api('/api/admin/salespeople',{method:'POST',body:JSON.stringify({name:form.name.value.trim(),email:form.email.value.trim(),phone:form.phone.value.trim()})});
    applySalespeople(data.salespeople);
    out.textContent=`${form.name.value.trim()} added. You can now credit businesses to them.`;
    form.reset();
  }catch(error){out.textContent=error.message;}
});

salesTable?.addEventListener('click',async event=>{
  const out=$('[data-sales-add-status]');
  const view=event.target.closest('[data-sales-view]');
  if(view){
    const filter=$('[data-business-salesman-filter]');if(filter)filter.value=view.dataset.salesView;
    if(businessSearch)businessSearch.value='';const st=$('[data-business-status-filter]');if(st)st.value='';
    renderBusinesses(adminFilteredRows());
    businessesTable.closest('.panel')?.scrollIntoView({behavior:'smooth',block:'start'});
    return;
  }
  const edit=event.target.closest('[data-sales-edit]');
  const toggle=event.target.closest('[data-sales-toggle]');
  const del=event.target.closest('[data-sales-delete]');
  const sp=salesmanById((edit||toggle||del)?.dataset.salesEdit||(edit||toggle||del)?.dataset.salesToggle||(edit||toggle||del)?.dataset.salesDelete);
  if(!sp)return;
  try{
    if(edit){
      const name=prompt('Salesman name',sp.name);if(name===null)return;
      const email=prompt('Salesman email (optional)',sp.email||'');if(email===null)return;
      const phone=prompt('Salesman phone (optional)',sp.phone||'');if(phone===null)return;
      const data=await api(`/api/admin/salespeople/${sp.id}`,{method:'PATCH',body:JSON.stringify({name:name.trim(),email:email.trim(),phone:phone.trim()})});
      applySalespeople(data.salespeople);out.textContent=`Saved ${name.trim()}.`;
    }else if(toggle){
      if(sp.active&&!confirm(`Deactivate ${sp.name}?\n\nTheir ${sp.businesses_assigned||0} credited business${sp.businesses_assigned===1?'':'es'} stay credited to them and still count in their sales totals. They just won't show up in the pick lists for new credits.`))return;
      const data=await api(`/api/admin/salespeople/${sp.id}`,{method:'PATCH',body:JSON.stringify({active:!sp.active})});
      applySalespeople(data.salespeople);out.textContent=`${sp.name} ${sp.active?'deactivated':'reactivated'}.`;
    }else if(del){
      const typed=prompt(`Delete ${sp.name}?\n\nTheir ${sp.businesses_assigned||0} credited business${sp.businesses_assigned===1?'':'es'} will become unassigned and stop counting toward any salesman. To keep their history, choose Deactivate instead.\n\nType DELETE to confirm.`);
      if(typed===null)return;
      if(typed.trim().toUpperCase()!=='DELETE'){out.textContent='Not deleted. Type DELETE exactly to confirm.';return;}
      const data=await api(`/api/admin/salespeople/${sp.id}`,{method:'DELETE'});
      applySalespeople(data.salespeople);
      out.textContent=`${sp.name} deleted. ${data.unassigned_businesses||0} business${data.unassigned_businesses===1?'':'es'} unassigned.`;
      await loadBusinesses().catch(()=>{});
    }
  }catch(error){out.textContent=error.message;}
});

/* Nightly BAM check-in */
function salesResultList(title,rows,fmtRow){
  if(!rows.length)return '';
  return `<p><strong>${esc(title)} (${rows.length})</strong></p><ul>${rows.map(r=>`<li>${fmtRow(r)}</li>`).join('')}</ul>`;
}
$('[data-sales-assign-form]')?.addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.target;const out=$('[data-sales-assign-status]');
  const spId=form.salesperson_id.value;
  if(!spId){out.textContent='Pick a salesman first.';return;}
  out.textContent='Matching emails to business accounts…';
  const btn=form.querySelector('button[type=submit]');btn.disabled=true;
  try{
    const res=await api(`/api/admin/salespeople/${spId}/assign-emails`,{method:'POST',body:JSON.stringify({emails:form.emails.value,reassign:form.reassign.checked})});
    applySalespeople(res.salespeople);
    const biz=(r)=>`${esc(r.email)} → ${esc(r.company_name||'business')} (ID ${r.business_id})`;
    const newly=res.credited.length+res.reassigned.length;
    out.innerHTML=`<p><strong>${esc(res.salesperson.name)}:</strong> checked ${res.emails_checked} email${res.emails_checked===1?'':'s'} — ${newly} newly credited, ${res.already_credited.length} already theirs, ${res.conflicts.length} credited to someone else, ${res.not_found.length} with no Shedlr account.</p>`
      +salesResultList('Newly credited',res.credited,biz)
      +salesResultList('Moved from another salesman',res.reassigned,r=>`${biz(r)} — was ${esc(r.previous_salesperson)}`)
      +salesResultList('Already credited to someone else (not changed)',res.conflicts,r=>`${biz(r)} — currently ${esc(r.current_salesperson)}. Tick “Move businesses already credited…” and run again if this should change.`)
      +salesResultList('No Shedlr account with this email',res.not_found,r=>`${esc(r.email)} — check the spelling with the BAM, or look it up in Stripe sign-ups. It hasn't been credited.`)
      +salesResultList('Already credited to this salesman',res.already_credited,biz);
    if(newly)form.emails.value='';
    await loadBusinesses().catch(()=>{});
  }catch(error){out.textContent=error.message;}
  btn.disabled=false;
});

/* Business dialog: credit one business */
function renderBusinessSalesman(b){
  const state=$('[data-business-salesman-state]');const sel=$('[data-business-salesman]');const msg=$('[data-business-salesman-message]');
  if(!state||!sel||!b)return;
  if(msg){msg.hidden=true;msg.textContent='';}
  renderSalesmanOptions();
  if(salesSetupError){state.textContent=salesSetupError;sel.disabled=true;return;}
  sel.disabled=false;
  const sp=b.salesperson_id?salesmanById(b.salesperson_id):null;
  sel.value=sp?String(sp.id):'';
  state.innerHTML=sp?`Credited to <strong>${esc(sp.name)}</strong>${b.salesperson_assigned_at?` since ${esc(fmt(b.salesperson_assigned_at))}`:''}. Their Stripe payments count toward ${esc(sp.name)}'s sales totals.`:'Not credited to a salesman. Its Stripe payments show under “Unassigned” in the sales totals.';
}
$('[data-business-salesman-save]')?.addEventListener('click',async()=>{
  if(!activeBusiness)return;
  const msg=$('[data-business-salesman-message]');const sel=$('[data-business-salesman]');
  msg.hidden=false;msg.className='form-message';msg.textContent='Saving…';
  try{
    const res=await api(`/api/admin/businesses/${activeBusiness.id}/salesperson`,{method:'POST',body:JSON.stringify({salesperson_id:sel.value?Number(sel.value):null})});
    Object.assign(activeBusiness,res.business);
    if(activeBusinessDetail)activeBusinessDetail.business={...activeBusinessDetail.business,...res.business};
    renderBusinessSalesman(res.business);
    msg.hidden=false;msg.className='form-message';
    msg.textContent=sel.value?`Credited to ${salesmanById(sel.value)?.name||'salesman'}.`:'Salesman removed.';
    await loadSalespeople();
  }catch(error){msg.hidden=false;msg.className='form-message error';msg.textContent=error.message;}
});

/* Monthly sales totals (same live Stripe data as the Stripe report) */
function setSalesRange(key){
  if(!salesFrom)return;
  const [from,to]=quickRange(key);salesFrom.value=from;salesTo.value=to;
  if(salesMonth)salesMonth.value=from.slice(0,7);
}
function resetSalesRange(){setSalesRange('this-month');}
salesMonth?.addEventListener('change',()=>{
  if(!salesMonth.value)return;
  const [y,m]=salesMonth.value.split('-').map(Number);
  salesFrom.value=dateOnly(new Date(y,m-1,1));
  const end=new Date(y,m,0);const today=new Date();
  salesTo.value=dateOnly(end>today&&y===today.getFullYear()&&m-1===today.getMonth()?today:end);
});
[salesFrom,salesTo].forEach(el=>el?.addEventListener('change',()=>{if(salesMonth)salesMonth.value='';}));

const salesRowName=(r)=>r.salesperson?`${r.salesperson.name}${r.salesperson.active===false?' (inactive)':''}`:'Unassigned / no salesman';
function salesTotalsRow(rows){
  const sum=(k)=>rows.reduce((t,r)=>t+Number(r[k]||0),0);
  return {signups:sum('signups'),signup_gross_cents:sum('signup_gross_cents'),paying_businesses:sum('paying_businesses'),first_payments:sum('first_payments'),first_payment_cents:sum('first_payment_cents'),recurring_payments:sum('recurring_payments'),recurring_cents:sum('recurring_cents'),payments:sum('payments'),gross_collected_cents:sum('gross_collected_cents'),refunds_cents:sum('refunds_cents'),stripe_fees_cents:sum('stripe_fees_cents'),dispute_loss_cents:sum('dispute_loss_cents'),net_cents:sum('net_cents')};
}
function salesCells(r){
  return [
    `${Number(r.signups||0)}${r.signup_gross_cents?`<span class="row-note">${fmtMoney(r.signup_gross_cents)} at checkout</span>`:''}`,
    String(Number(r.paying_businesses||0)),
    `${Number(r.first_payments||0)} · ${fmtMoney(r.first_payment_cents)}`,
    `${Number(r.recurring_payments||0)} · ${fmtMoney(r.recurring_cents)}`,
    `<strong>${fmtMoney(r.gross_collected_cents)}</strong>`,
    r.refunds_cents?`−${fmtMoney(r.refunds_cents)}`:'—',
    r.stripe_fees_cents?`−${fmtMoney(r.stripe_fees_cents)}`:'—',
    r.dispute_loss_cents?`−${fmtMoney(r.dispute_loss_cents)}`:'—',
    `<strong>${fmtMoney(r.net_cents)}</strong>`
  ];
}
function renderSalesReportTable(data){
  if(!salesReportTable)return;
  const rows=data.by_salesperson||[];
  if(!rows.length){salesReportTable.innerHTML='<tr><td colspan="10">No salesmen or Stripe activity in this range.</td></tr>';return;}
  const total=salesTotalsRow(rows);
  salesReportTable.innerHTML=rows.map(r=>`<tr class="${r.salesperson?'':'sales-inactive'}"><td><strong>${esc(salesRowName(r))}</strong>${r.salesperson?`<span class="row-note">${Number(r.businesses_assigned||0)} business${r.businesses_assigned===1?'':'es'} credited</span>`:''}</td>${salesCells(r).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')
    +`<tr class="sales-total"><td>All salesmen</td>${salesCells(total).map(c=>`<td>${c}</td>`).join('')}</tr>`;
}

async function fetchSalesReport(){
  if(!salesFrom.value||!salesTo.value)throw new Error('Please choose a month or a start and end date.');
  if(salesFrom.value>salesTo.value)throw new Error('The start date must be on or before the end date.');
  const data=await api(`/api/admin/stripe-report?${localRangeParams(salesFrom.value,salesTo.value)}`);
  if(data.salespeople_ready===false)throw new Error('Salesmen are not set up yet. Run worker/migration_salespeople.sql on the shedlr-leads database first.');
  salesReport=data;return data;
}

function salesSummaryHtml(data){
  const rows=data.by_salesperson||[];
  const total=salesTotalsRow(rows);
  const header=['Salesman','Credited accounts','New sign-ups','Paying businesses','1st payments','Recurring payments','Gross collected','Refunds','Stripe fees','Dispute loss','Net'];
  const line=(name,r,credited)=>[`<strong>${esc(name)}</strong>`,credited,`${Number(r.signups||0)} (${fmtMoney(r.signup_gross_cents)})`,String(Number(r.paying_businesses||0)),`${Number(r.first_payments||0)} · ${fmtMoney(r.first_payment_cents)}`,`${Number(r.recurring_payments||0)} · ${fmtMoney(r.recurring_cents)}`,`<strong>${fmtMoney(r.gross_collected_cents)}</strong>`,r.refunds_cents?`<span class="neg">−${fmtMoney(r.refunds_cents)}</span>`:'—',r.stripe_fees_cents?`<span class="neg">−${fmtMoney(r.stripe_fees_cents)}</span>`:'—',r.dispute_loss_cents?`<span class="neg">−${fmtMoney(r.dispute_loss_cents)}</span>`:'—',`<strong>${fmtMoney(r.net_cents)}</strong>`];
  const body=rows.map(r=>line(salesRowName(r),r,r.salesperson?String(Number(r.businesses_assigned||0)):'—'));
  let html=`<h2>Sales by salesman</h2>`;
  if(!rows.length)return html+'<p class="report-empty">No salesmen or Stripe activity in this date range.</p>';
  html+=`<table class="report-table"><thead><tr>${header.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${body.map(c=>`<tr>${c.map((v,i)=>`<td${i>1?' class="num"':''}>${v}</td>`).join('')}</tr>`).join('')}<tr class="total">${line('All salesmen',total,'—').map((v,i)=>`<td${i>1?' class="num"':''}>${v}</td>`).join('')}</tr></tbody></table>`;
  html+='<p class="report-empty">Payments are credited to the salesman the business is assigned to now. Net = gross collected − refunds − Stripe fees − dispute losses. “1st payments” are each customer\'s first-ever Stripe payment; “Recurring” are their 2nd and later payments.</p>';
  return html;
}

function salesDetailHtml(data){
  return (data.by_salesperson||[]).map(r=>{
    const list=r.businesses||[];
    return `<h2>${esc(salesRowName(r))} — ${fmtMoney(r.gross_collected_cents)} collected, ${fmtMoney(r.net_cents)} net</h2>${reportTable(['Business','Email','Signed up in range','Payments','Gross','Refunded','Stripe fees','Net'],
      list.map(b=>[esc(b.business?(b.business.company_name||b.business.name||b.business.email):(b.name||'No Shedlr account')),esc(b.business?.email||b.email||'—'),b.signed_up_at?`${esc(fmt(b.signed_up_at))} (${fmtMoney(b.signup_cents)})`:'—',String(b.payments),fmtMoney(b.gross_cents),b.refunds_cents?fmtMoney(b.refunds_cents):'—',fmtMoney(b.fees_cents),fmtMoney(b.net_cents)]),'No sign-ups or payments in this date range.')}`;
  }).join('\n');
}

function salesCsvLines(data){
  const rows=data.by_salesperson||[];const lines=[];
  if(data.salespeople_ready===false)return lines;
  lines.push(['Sales by salesman']);
  lines.push(['Salesman','Active','Credited accounts','New sign-ups','Sign-up gross','Paying businesses','1st payments','1st payment gross','Recurring payments','Recurring gross','Gross collected','Refunds','Stripe fees','Dispute loss','Net']);
  const push=(name,active,credited,r)=>lines.push([name,active,credited,r.signups,dollars(r.signup_gross_cents),r.paying_businesses,r.first_payments,dollars(r.first_payment_cents),r.recurring_payments,dollars(r.recurring_cents),dollars(r.gross_collected_cents),dollars(r.refunds_cents),dollars(r.stripe_fees_cents),dollars(r.dispute_loss_cents),dollars(r.net_cents)]);
  rows.forEach(r=>push(r.salesperson?r.salesperson.name:'Unassigned',r.salesperson?(r.salesperson.active===false?'No':'Yes'):'',r.salesperson?r.businesses_assigned:'',r));
  push('All salesmen','','',salesTotalsRow(rows));
  return lines;
}

$('[data-sales-report-form]')?.addEventListener('submit',async event=>{
  event.preventDefault();
  salesReportStatus.textContent='Pulling from Stripe…';
  try{
    const data=await fetchSalesReport();renderSalesReportTable(data);
    const t=salesTotalsRow(data.by_salesperson||[]);
    salesReportStatus.textContent=`${fmtDay(salesFrom.value)} through ${fmtDay(salesTo.value)}: ${fmtMoney(t.gross_collected_cents)} collected, ${fmtMoney(t.net_cents)} net across ${(data.by_salesperson||[]).filter(r=>r.salesperson).length} salesmen.${truncationNotes(data).length?' '+truncationNotes(data)[0]:''}`;
  }catch(error){salesReportStatus.textContent=error.message;}
});
document.querySelectorAll('[data-sales-range]').forEach(button=>button.addEventListener('click',()=>{setSalesRange(button.dataset.salesRange);$('[data-sales-report-form]').requestSubmit();}));
$('[data-sales-print]')?.addEventListener('click',async()=>{
  salesReportStatus.textContent='Building commission report…';
  try{
    const data=await fetchSalesReport();renderSalesReportTable(data);
    const notes=truncationNotes(data).map(n=>`<div class="warn">${esc(n)}</div>`).join('');
    const html=reportPage('Shedlr commission report',[['Date range',`${fmtDay(salesFrom.value)} – ${fmtDay(salesTo.value)}`],['Generated',fmt(data.generated_at)],['Source','Live from Stripe, credited by salesman assignment in Shedlr']],notes+salesSummaryHtml(data)+salesDetailHtml(data));
    if(openHtmlWindow(html,'shedlrCommissionReport',false,salesReportStatus))salesReportStatus.textContent='Commission report opened in a new window.';
  }catch(error){salesReportStatus.textContent=error.message;}
});
$('[data-sales-csv]')?.addEventListener('click',async()=>{
  salesReportStatus.textContent='Building CSV…';
  try{
    const data=await fetchSalesReport();renderSalesReportTable(data);
    const lines=[['Shedlr commission report'],['From',salesFrom.value,'To',salesTo.value],['Generated',data.generated_at],[]];
    truncationNotes(data).forEach(n=>lines.push(['WARNING',n]));
    salesCsvLines(data).forEach(r=>lines.push(r));
    lines.push([]);
    lines.push(['Detail by business']);
    lines.push(['Salesman','Business','Shedlr business ID','Email','Signed up in range','Sign-up amount','Payments','Gross','Refunded','Stripe fees','Net']);
    (data.by_salesperson||[]).forEach(r=>(r.businesses||[]).forEach(b=>lines.push([r.salesperson?r.salesperson.name:'Unassigned',b.business?(b.business.company_name||b.business.name||''):(b.name||''),b.business?.id||'',b.business?.email||b.email||'',b.signed_up_at||'',dollars(b.signup_cents),b.payments,dollars(b.gross_cents),dollars(b.refunds_cents),dollars(b.fees_cents),dollars(b.net_cents)])));
    downloadCsv(lines,`shedlr-commissions-${salesFrom.value}-to-${salesTo.value}.csv`);
    salesReportStatus.textContent='Commission CSV downloaded.';
  }catch(error){salesReportStatus.textContent=error.message;}
});

/* ── Init ── */
loginForm.addEventListener('submit',async event=>{
  event.preventDefault();
  loginMessage.hidden=false;loginMessage.textContent='Signing in...';
  try{
    const{role}=await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:loginForm.password.value})});
    loginForm.reset();loginMessage.hidden=true;
    await enterDashboard(role);
  }catch(error){loginMessage.textContent=error.message;}
});

async function enterDashboard(role){
  applyRole(role);
  showDashboard();
  populateCategoryFilters();
  if(role==='admin'){
    resetRange();resetReportRange();resetStripeRange();resetSalesRange();populateBulkCategory();
    loadSalespeople().catch(()=>{});
    await loadDashboard();
  }else if(role==='retention'){
    await loadRetentionBusinesses();
  }else if(role==='bam'){
    await enterBamPortal();
  }else{
    await loadStaffBusinesses();
  }
}

const staffLeadForm=$('[data-staff-lead-form]');
if(staffLeadForm){
  staffLeadForm.addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.target;
    const statusEl=$('[data-staff-lead-status]');
    statusEl.hidden=false;statusEl.textContent='Saving...';
    try{
      const businessId=form.business_id.value;
      await api('/api/admin/leads',{method:'POST',body:JSON.stringify({
        name:form.name.value,category:form.category.value,phone:form.phone.value,
        email:form.email.value,city:form.city.value,state:form.state.value,message:form.message.value,
        business_id:businessId||undefined
      })});
      statusEl.textContent=businessId?'Lead added and assigned.':'Lead added. An admin will review and assign it.';
      form.reset();
    }catch(error){statusEl.textContent=error.message;}
  });
}

$('[data-admin-logout]').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST',body:'{}'});}finally{showLogin();}});

filterForm.addEventListener('submit',async event=>{event.preventDefault();await loadDashboard().catch(error=>{filterStatus.textContent=error.message;});});
$('[data-filter-24h]').addEventListener('click',()=>applyQuickRange(24));
$('[data-filter-12h]').addEventListener('click',()=>applyQuickRange(12));
$('[data-filter-reset]').addEventListener('click',()=>applyQuickRange(30*24));

/* ── Panel collapse ── */
const PANEL_COLLAPSE_KEY='shedlr_admin_collapsed_panels';
function getCollapsedPanels(){try{return JSON.parse(localStorage.getItem(PANEL_COLLAPSE_KEY)||'{}');}catch{return{};}}
function saveCollapsedPanels(state){try{localStorage.setItem(PANEL_COLLAPSE_KEY,JSON.stringify(state));}catch{}}
function panelKey(panel){return(panel.querySelector('h2')?.textContent||'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-');}
function setPanelCollapsed(panel,button,collapsed){panel.classList.toggle('collapsed',collapsed);button.textContent=collapsed?'Expand':'Minimize';button.setAttribute('aria-expanded',String(!collapsed));}
document.querySelectorAll('[data-panel-toggle]').forEach(button=>{
  const panel=button.closest('.panel');if(!panel)return;
  const key=panelKey(panel);const collapsedState=getCollapsedPanels();
  setPanelCollapsed(panel,button,!!collapsedState[key]);
  button.addEventListener('click',()=>{
    const collapsed=!panel.classList.contains('collapsed');
    setPanelCollapsed(panel,button,collapsed);
    const state=getCollapsedPanels();state[key]=collapsed;saveCollapsedPanels(state);
  });
});

(async()=>{
  try{
    const{role}=await api('/api/admin/session');
    await enterDashboard(role);
  }catch{
    showLogin();
  }
})();

/* ── Password visibility toggle ── */
document.querySelectorAll('input[type="password"]').forEach(input=>{
  const wrapper=document.createElement('div');
  wrapper.className='password-field';
  wrapper.style.position='relative';
  input.parentNode.insertBefore(wrapper,input);
  wrapper.appendChild(input);
  const toggle=document.createElement('button');
  toggle.type='button';
  toggle.className='password-toggle';
  toggle.innerHTML='\u25C9';
  toggle.setAttribute('aria-label','Show or hide password');
  toggle.addEventListener('click',()=>{
    if(input.type==='password'){input.type='text';toggle.innerHTML='\u25CD';}else{input.type='password';toggle.innerHTML='\u25C9';}
  });
  wrapper.appendChild(toggle);
});