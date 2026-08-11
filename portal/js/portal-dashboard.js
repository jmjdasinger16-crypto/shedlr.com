const $ = (selector) => document.querySelector(selector);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fmt = (value) => value ? new Date(value).toLocaleString() : '—';
const fmtMoney = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;

const CATEGORY_LABELS = {
  "personal-trainer": "Personal Trainer", "life-coach": "Life Coach", "maintenance": "Maintenance",
  "dog-walker": "Dog Walker", "house-cleaning": "House Cleaning", "landscaping": "Landscaping",
  "tutoring": "Tutoring", "photography": "Photography", "handyman": "Handyman",
  "moving": "Moving Services", "catering": "Catering", "event-planning": "Event Planning"
};
const catLabel = (c) => CATEGORY_LABELS[c] || c || '—';

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) { window.location.href = 'index.html'; throw new Error('Session expired.'); }
  if (!response.ok) throw new Error(data.error || `Request failed with status ${response.status}.`);
  return data;
}

const statusLabels = { active: 'Active', past_due: 'Past due', canceled: 'Canceled', suspended: 'Suspended' };

function renderLeads(leads) {
  const list = $('[data-leads-list]');
  if (!leads.length) { list.innerHTML = '<p class="empty-state">No leads have been delivered to your account yet. Once your order is paid and our team verifies leads, they will appear here.</p>'; return; }
  list.innerHTML = leads.map((lead) => `
    <div class="goal-card" data-lead-card="${lead.lead_id}" style="cursor:pointer;border-left-color:#d4af37">
      <h3>${esc(lead.name)}</h3>
      <p>${esc(lead.email || '—')} · ${esc(lead.phone || '—')}</p>
      <p>${esc(lead.message || '')}</p>
      <div class="goal-meta">${catLabel(lead.category)}${lead.city ? ` · ${esc(lead.city)}${lead.state ? ', ' + esc(lead.state) : ''}` : ''} · Delivered ${fmt(lead.assigned_at)}</div>
    </div>
  `).join('');
}

function renderOrders(orders) {
  const list = $('[data-orders-list]');
  if (!orders.length) { list.innerHTML = '<p class="empty-state">No orders yet. <a href="../contact.html">Purchase leads</a> to get started.</p>'; return; }
  list.innerHTML = orders.map((order) => `
    <div class="goal-card ${order.status === 'completed' ? 'completed' : ''}">
      <h3>${catLabel(order.category)} — ${order.quantity} leads</h3>
      <p>${fmtMoney(order.total_cents)} · ${esc(order.status)}</p>
      <div class="goal-meta">Fulfilled: ${order.fulfilled_leads || 0}/${order.quantity} · Ordered ${fmt(order.created_at)}</div>
    </div>
  `).join('');
}

/* ── Lead detail dialog ── */
const leadDialog = $('[data-lead-dialog]');
let activeLeadId = null;

async function openLead(leadId) {
  activeLeadId = leadId;
  const leadsRes = await api('/api/portal/leads');
  const lead = (leadsRes.leads || []).find(l => String(l.lead_id) === String(leadId));
  if (!lead) return;

  $('[data-lead-title]').textContent = lead.name;
  $('[data-lead-details]').innerHTML = [
    ['Email', lead.email], ['Phone', lead.phone], ['Category', catLabel(lead.category)],
    ['City', lead.city], ['State', lead.state], ['Source', lead.source],
    ['Message', lead.message], ['Delivered', fmt(lead.assigned_at)]
  ].map(([label, value]) => `<div><strong>${esc(label)}</strong>${esc(value || '—')}</div>`).join('');

  $('[data-note-content]').value = '';
  await loadLeadNotes(leadId);
  leadDialog.showModal();
}

async function loadLeadNotes(leadId) {
  try {
    const res = await api(`/api/portal/leads/${leadId}`);
    const notes = res.notes || [];
    const list = $('[data-lead-notes-list]');
    list.innerHTML = notes.length ? notes.map(note => `
      <div class="note-item">
        <div>${esc(note.content)}</div>
        <div class="meta">${esc(note.author === 'business' ? 'You' : 'Shedlr')} · ${fmt(note.created_at)}</div>
      </div>
    `).join('') : '<p class="empty-hint">No notes yet. Add one below.</p>';
  } catch (error) {
    $('[data-lead-notes-list]').innerHTML = `<p class="empty-hint">${esc(error.message)}</p>`;
  }
}

document.addEventListener('click', async (event) => {
  const card = event.target.closest('[data-lead-card]');
  if (!card) return;
  await openLead(card.dataset.leadCard);
});

$('[data-note-add]').addEventListener('click', async () => {
  if (!activeLeadId) return;
  const input = $('[data-note-content]');
  if (!input.value.trim()) { input.focus(); return; }
  try {
    await api(`/api/portal/leads/${activeLeadId}/notes`, { method: 'POST', body: JSON.stringify({ content: input.value }) });
    input.value = '';
    await loadLeadNotes(activeLeadId);
  } catch (error) {
    alert(error.message);
  }
});

/* ── Init ── */
$('[data-logout]').addEventListener('click', async () => {
  try { await api('/api/portal/logout', { method: 'POST', body: '{}' }); } finally { window.location.href = 'index.html'; }
});

async function loadDashboard() {
  const { business } = await api('/api/portal/me');
  $('[data-business-name-suffix]').textContent = business.name ? `, ${business.name}` : '';
  const pill = $('[data-status-pill]');
  pill.hidden = false;
  pill.className = `status-pill ${business.status}`;
  pill.textContent = statusLabels[business.status] || business.status;

  const [leadsRes, ordersRes] = await Promise.all([
    api('/api/portal/leads'),
    api('/api/portal/orders')
  ]);

  renderLeads(leadsRes.leads || []);
  renderOrders(ordersRes.orders || []);
}

loadDashboard().catch((error) => {
  if (error.message !== 'Session expired.') {
    $('[data-leads-list]').innerHTML = `<p class="empty-state">${esc(error.message)}</p>`;
  }
});
