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

const CATEGORIES=["personal-trainer","life-coach","maintenance","dog-walker","house-cleaning","landscaping","tutoring","photography","handyman","moving","catering","event-planning","home-insurance","vehicle-insurance","roofing","auto-hail-damage","home-services","hvac","plumbing","pest-control","solar","real-estate"];
const CATEGORY_LABELS={"personal-trainer":"Personal Trainer","life-coach":"Life Coach","maintenance":"Maintenance","dog-walker":"Dog Walker","house-cleaning":"House Cleaning","landscaping":"Landscaping","tutoring":"Tutoring","photography":"Photography","handyman":"Handyman","moving":"Moving Services","catering":"Catering","event-planning":"Event Planning","home-insurance":"Home Insurance","vehicle-insurance":"Vehicle Insurance","roofing":"Roofing","auto-hail-damage":"Auto Hail Damage","home-services":"Home Services","hvac":"HVAC","plumbing":"Plumbing","pest-control":"Pest Control","solar":"Solar","real-estate":"Real Estate"};
const catLabel=(c)=>CATEGORY_LABELS[c]||c||'—';

const esc=(value)=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=(value)=>value?new Date(value).toLocaleString():'—';
const fmtMoney=(cents)=>`$${(Number(cents||0)/100).toFixed(2)}`;
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

function renderLeads(rows){
  leadsTable.innerHTML=rows.map(lead=>`<tr><td><strong>${esc(lead.name)}</strong></td><td>${esc(lead.email||'—')}<br>${esc(lead.phone||'—')}</td><td>${esc(catLabel(lead.category))}</td><td>${esc(lead.city||'—')}${lead.state?', '+esc(lead.state):''}</td><td><span class="status">${esc(lead.status||'new')}</span></td><td>${esc(lead.assigned_to||'—')}</td><td>${fmt(lead.submitted_at)}</td><td><button type="button" data-open-lead="${lead.id}">View</button></td></tr>`).join('')||'<tr><td colspan="8">No leads found.</td></tr>';
}

function renderBusinesses(rows){
  businessesTable.innerHTML=rows.map(b=>`<tr><td><strong>${esc(b.name||'—')}</strong></td><td>${esc(b.email)}<br>${esc(b.phone||'')}</td><td>${esc(b.company_name||'—')}</td><td>${esc(catLabel(b.preferred_category))}</td><td><span class="status">${esc(b.status)}</span></td><td>${b.total_leads||0}</td><td>${fmt(b.last_login_at)}</td><td><button type="button" data-open-business="${b.id}">View</button></td></tr>`).join('')||'<tr><td colspan="8">No business accounts yet.</td></tr>';
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
}

/* ── Role-based view (admin vs. restricted staff) ── */
function applyRole(role){
  const isStaff=role==='staff';
  document.body.dataset.role=role;
  document.querySelectorAll('[data-admin-only]').forEach(el=>{el.hidden=isStaff;});
  document.querySelectorAll('[data-staff-only]').forEach(el=>{el.hidden=!isStaff;});
}

async function loadStaffBusinesses(){
  const data=await api('/api/admin/businesses');
  businesses=data.businesses||[];
  renderStaffBusinesses(businesses);
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
  renderLeads(leads);
}

async function loadBusinesses(){
  const data=await api('/api/admin/businesses');
  businesses=data.businesses||[];
  renderBusinesses(businesses);
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
  const isStaff=document.body.dataset.role==='staff';
  api(`/api/admin/businesses/${id}`).then(detail=>{
    activeBusinessDetail=detail;
    $('[data-business-title]').textContent=detail.business.name||detail.business.email||detail.business.company_name;
    renderBusinessLeads(detail.assignments||[]);
    if(!isStaff){
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
    }
    businessDialog.showModal();
  }).catch(error=>{alert(error.message);});
}

function renderBusinessOrders(orders){
  const list=$('[data-business-orders-list]');
  list.innerHTML=orders.length?orders.map(o=>`<div class="note-item"><strong>${catLabel(o.category)} — ${o.quantity} leads</strong><div>${fmtMoney(o.total_cents)} · Status: ${esc(o.status)} · Fulfilled: ${o.fulfilled_leads||0}/${o.quantity}</div><div class="meta">Submitted ${fmt(o.created_at)}${o.paid_at?` · Paid ${fmt(o.paid_at)}`:''}</div></div>`).join(''):'<p class="empty-hint">No orders yet.</p>';
}

function renderBusinessLeads(assignments){
  const list=$('[data-business-leads-list]');
  list.innerHTML=assignments.length?assignments.map(a=>`<div class="note-item"><strong>${esc(a.name)}</strong><div>${esc(a.email||'—')} · ${esc(a.phone||'—')}</div><div>${esc(a.message||'')}</div><div class="meta">${catLabel(a.category)} · Assigned ${fmt(a.assigned_at)}</div><button type="button" data-edit-business-lead="${a.lead_id}" style="margin-top:6px">Edit lead</button></div>`).join(''):'<p class="empty-hint">No leads assigned yet.</p>';
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
  const message=$('[data-business-save-message]');message.hidden=false;message.textContent='Generating link...';
  try{
    const data=await api(`/api/admin/businesses/${activeBusiness.id}/reset-password`,{method:'POST',body:'{}'});
    message.textContent=`Share this link: ${data.activation_url}`;
    if(navigator.clipboard)navigator.clipboard.writeText(data.activation_url).catch(()=>{});
  }catch(error){message.textContent=error.message;}
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
      preferred_category:$('[data-create-business-category]').value||null
    })});
    createBusinessMessage.textContent=`Business created (ID ${res.business.id}).`;
    createBusinessResult.hidden=false;
    createBusinessResult.innerHTML=`Activation link — share this with the client so they can set a password and log in:<br><strong>${esc(res.activation_url)}</strong>`;
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

search.addEventListener('input',()=>{
  const q=search.value.trim().toLowerCase();
  renderLeads(!q?leads:leads.filter(l=>[l.name,l.email,l.phone,l.category,l.city].some(v=>String(v||'').toLowerCase().includes(q))));
});

leadCategoryFilter.addEventListener('change',()=>loadLeads().catch(()=>{}));

businessSearch.addEventListener('input',()=>{
  const q=businessSearch.value.trim().toLowerCase();
  renderBusinesses(!q?businesses:businesses.filter(b=>[b.name,b.email,b.phone,b.company_name,b.status].some(v=>String(v||'').toLowerCase().includes(q))));
});

/* ── Quick ranges ── */
function setRange(hours){const now=new Date();filterTo.value=toLocalInput(now);filterFrom.value=toLocalInput(new Date(now.getTime()-hours*60*60*1000));}
function resetRange(){setRange(30*24);}
async function applyQuickRange(hours){setRange(hours);await loadDashboard().catch(error=>{filterStatus.textContent=error.message;});}

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
    resetRange();populateBulkCategory();
    await loadDashboard();
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
      await api('/api/admin/leads',{method:'POST',body:JSON.stringify({
        name:form.name.value,category:form.category.value,phone:form.phone.value,
        email:form.email.value,city:form.city.value,state:form.state.value,message:form.message.value
      })});
      statusEl.textContent='Lead added. An admin will review and assign it.';
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
