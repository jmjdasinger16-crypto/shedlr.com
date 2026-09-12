/* Shedlr public site — 2026 refresh
   Subscription model: $399/month. No per-lead pricing. */

const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/dRm14nfQW9aM7zf9Raa3u00';

/* ── Smooth anchor scrolling ── */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const hash = link.getAttribute('href');
    if (hash === '#' || hash.length < 2) return;
    const target = document.querySelector(hash);
    if (target) { event.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ── Session + analytics ── */
const getSessionId = () => {
  let id = null;
  try { id = localStorage.getItem('shedlr_session_id'); } catch (e) {}
  if (!id) {
    id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    try { localStorage.setItem('shedlr_session_id', id); } catch (e) {}
  }
  return id;
};
const sessionId = getSessionId();
const track = (eventName, metadata = {}) => fetch('/api/events', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  keepalive: true,
  body: JSON.stringify({
    event_name: eventName,
    page_path: location.pathname + location.search,
    session_id: sessionId,
    referrer: document.referrer || '',
    metadata
  })
}).catch(() => {});
track('page_view', { title: document.title, referrer: document.referrer || '' });

/* ── Pre-select category / delivery type from URL ── */
(function () {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  const type = params.get('type');
  const catSelect = document.getElementById('category');
  const typeSelect = document.getElementById('leadType');
  if (cat && catSelect && catSelect.querySelector(`option[value="${cat}"]`)) catSelect.value = cat;
  if (type && typeSelect && typeSelect.querySelector(`option[value="${type}"]`)) typeSelect.value = type;
})();

/* ── Service-area availability check ── */
(function () {
  const zipInput = document.getElementById('zip');
  const checkBtn = document.getElementById('zipCheckBtn');
  const result = document.getElementById('zipResult');
  if (!zipInput || !result) return;
  let lastZip = '';

  const runCheck = () => {
    const zip = zipInput.value.trim();
    if (!zip) {
      result.hidden = false;
      result.className = 'zip-result';
      result.textContent = 'No ZIP yet? Leave it blank and we will deliver from any area we currently cover.';
      return;
    }
    if (!/^\d{5}$/.test(zip)) {
      result.hidden = false;
      result.className = 'zip-result';
      result.textContent = 'Please enter a valid 5-digit ZIP code.';
      return;
    }
    if (lastZip === zip && !result.hidden) return;
    track('zip_check_started', { zip });
    result.hidden = false;
    result.className = 'zip-result';
    result.textContent = `Checking availability for ${zip}…`;
    if (checkBtn) checkBtn.disabled = true;
    setTimeout(() => {
      lastZip = zip;
      result.className = 'zip-result available';
      result.textContent = `Good news — Shedlr is currently serving ${zip}.`;
      if (checkBtn) checkBtn.disabled = false;
      track('zip_check_available', { zip });
    }, 900);
  };

  if (checkBtn) checkBtn.addEventListener('click', runCheck);
  zipInput.addEventListener('input', () => {
    zipInput.value = zipInput.value.replace(/\D/g, '').slice(0, 5);
    if (!zipInput.value) { result.hidden = true; return; }
    if (zipInput.value.length === 5) runCheck();
  });
})();

/* ── Plan activation form ── */
(function () {
  const form = document.querySelector('[data-order-form]');
  if (!form) return;
  const message = form.querySelector('[data-form-message]');
  const button = form.querySelector('button[type="submit"]');
  const originalLabel = button ? button.textContent : '';

  const say = (text, isError) => {
    if (!message) return;
    message.hidden = false;
    message.textContent = text;
    message.classList.toggle('error', !!isError);
  };

  form.addEventListener('submit', async event => {
    event.preventDefault();

    /* Fold selected add-on services into the message field */
    const addons = Array.from(form.querySelectorAll('input[name="scaling_service"]:checked')).map(i => i.value);
    const messageField = form.querySelector('#message');
    if (addons.length && messageField && !messageField.value.includes('Add-on services:')) {
      const marker = 'Add-on services: ' + addons.join(', ');
      messageField.value = (messageField.value.trim() ? messageField.value.trim() + '\n\n' : '') + marker;
    }

    say('Submitting your activation…', false);
    if (button) { button.disabled = true; button.textContent = 'Submitting…'; }

    try {
      const data = Object.fromEntries(new FormData(form).entries());
      const payload = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        category: data.category,
        lead_type: data.lead_type,
        zip: data.zip,
        quantity: 0,
        plan: 'growth-monthly',
        plan_monthly: 199,
        message: data.message,
        page_path: location.pathname + location.search,
        session_id: sessionId
      };
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'We could not submit your activation. Please try again.');

      track('order_submitted', { category: payload.category, plan: payload.plan });
      say('Activation received. Redirecting to secure checkout…', false);
      form.reset();
      setTimeout(() => { window.location.href = STRIPE_PAYMENT_LINK; }, 1400);
    } catch (error) {
      track('order_submit_error', { message: error.message || 'Unknown error' });
      say(error.message || 'We could not submit your activation. Please call (806) 460-9488 or email support@shedlr.com.', true);
    } finally {
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  });
})();

/* ── Scroll reveal ── */
(function () {
  const items = document.querySelectorAll('.reveal');
  if (!items.length || !('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  items.forEach(el => observer.observe(el));
})();

/* ── Password visibility toggle (portal forms) ── */
(function () {
  document.querySelectorAll('input[type="password"]').forEach(input => {
    if (input.dataset.toggleReady) return;
    input.dataset.toggleReady = '1';
    const wrapper = document.createElement('div');
    wrapper.className = 'password-field';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'password-toggle';
    toggle.textContent = 'Show';
    toggle.setAttribute('aria-label', 'Show or hide password');
    toggle.addEventListener('click', () => {
      const showing = input.type === 'password';
      input.type = showing ? 'text' : 'password';
      toggle.textContent = showing ? 'Hide' : 'Show';
    });
    wrapper.appendChild(toggle);
  });
})();
