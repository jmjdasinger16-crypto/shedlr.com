const SESSION_COOKIE = "shedlr_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const BUSINESS_SESSION_COOKIE = "shedlr_business";
const BUSINESS_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ACTIVATION_TTL_MS = 30 * 60 * 1000;
const LEAD_PRICE_CENTS = 100; // fallback default

const CATEGORY_PRICES = {
  "personal-trainer": 400,
  "life-coach": 100,
  "maintenance": 500,
  "dog-walker": 200,
  "house-cleaning": 600,
  "landscaping": 700,
  "tutoring": 400,
  "photography": 800,
  "handyman": 500,
  "moving": 900,
  "catering": 700,
  "event-planning": 1000
};
const getCategoryPriceCents = (slug) => CATEGORY_PRICES[slug] || 500;

const CATEGORIES = [
  "personal-trainer", "life-coach", "maintenance", "dog-walker",
  "house-cleaning", "landscaping", "tutoring", "photography",
  "handyman", "moving", "catering", "event-planning"
];

const CATEGORY_LABELS = {
  "personal-trainer": "Personal Trainer",
  "life-coach": "Life Coach",
  "maintenance": "Maintenance",
  "dog-walker": "Dog Walker",
  "house-cleaning": "House Cleaning",
  "landscaping": "Landscaping",
  "tutoring": "Tutoring",
  "photography": "Photography",
  "handyman": "Handyman",
  "moving": "Moving Services",
  "catering": "Catering",
  "event-planning": "Event Planning"
};

const json = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extraHeaders } });
const clean = (value, max = 2000) => String(value ?? "").trim().slice(0, max);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPhone = (value) => String(value ?? "").replace(/\D/g, "").length >= 10;
const uuid = () => crypto.randomUUID();
const encoder = new TextEncoder();

const b64url = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
const b64urlText = (text) => b64url(encoder.encode(text));
const b64urlToBytes = (str) => {
  const normalized = String(str || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};
const toHex = (bytes) => [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
const parseCookies = (request) => Object.fromEntries((request.headers.get("Cookie") || "").split(";").map(v => v.trim()).filter(Boolean).map(v => { const i = v.indexOf("="); return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))]; }));
const timingSafeEqual = (a, b) => {
  const aa = encoder.encode(String(a));
  const bb = encoder.encode(String(b));
  if (aa.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < aa.length; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
};

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

/* ══════════════════════════════ ADMIN AUTH ══════════════════════════════ */

async function createSession(env) {
  const payload = b64urlText(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, nonce: uuid() }));
  return `${payload}.${await hmac(env.ADMIN_SESSION_SECRET, payload)}`;
}

async function isAdmin(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token || !env.ADMIN_SESSION_SECRET) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!timingSafeEqual(signature, await hmac(env.ADMIN_SESSION_SECRET, payload))) return false;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    return decoded.exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
}

/* ══════════════════════════════ BUSINESS PORTAL AUTH ══════════════════════════════ */

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, keyMaterial, 256);
  return `pbkdf2$100000$${b64url(salt)}$${b64url(new Uint8Array(bits))}`;
}

async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]) || 100000;
  const salt = b64urlToBytes(parts[2]);
  const expected = b64url(b64urlToBytes(parts[3]));
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, keyMaterial, 256);
  return timingSafeEqual(b64url(new Uint8Array(bits)), expected);
}

async function createBusinessSessionToken(env, businessId) {
  const payload = b64urlText(JSON.stringify({ bid: businessId, exp: Math.floor(Date.now() / 1000) + BUSINESS_SESSION_TTL_SECONDS, nonce: uuid() }));
  return `${payload}.${await hmac(env.BUSINESS_SESSION_SECRET, payload)}`;
}

function businessCookieHeader(token, maxAge = BUSINESS_SESSION_TTL_SECONDS) {
  return `${BUSINESS_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

async function getAuthedBusiness(request, env) {
  const token = parseCookies(request)[BUSINESS_SESSION_COOKIE];
  if (!token || !env.BUSINESS_SESSION_SECRET) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!timingSafeEqual(signature, await hmac(env.BUSINESS_SESSION_SECRET, payload))) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    if (!decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000) || !decoded.bid) return null;
    return await env.DB.prepare("SELECT * FROM businesses WHERE id=?").bind(decoded.bid).first();
  } catch { return null; }
}

async function findBusinessById(env, id) {
  return env.DB.prepare("SELECT * FROM businesses WHERE id=?").bind(id).first();
}

async function issueActivationToken(env, businessId) {
  const token = uuid().replace(/-/g, "") + uuid().replace(/-/g, "");
  const expires = new Date(Date.now() + ACTIVATION_TTL_MS).toISOString();
  await env.DB.prepare("UPDATE businesses SET activation_nonce=?, activation_nonce_expires=?, updated_at=? WHERE id=?").bind(token, expires, new Date().toISOString(), businessId).run();
  return token;
}

/* ══════════════════════════════ STRIPE ══════════════════════════════ */

async function stripeApi(env, path, method = "GET", body = null) {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, status: 503, data: { error: "Stripe is not configured." } };
  const opts = { method, headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } };
  if (body) { opts.headers["content-type"] = "application/x-www-form-urlencoded"; opts.body = body; }
  const res = await fetch(`https://api.stripe.com/v1/${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function verifyStripeSignature(rawBody, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map((p) => { const i = p.indexOf("="); return [p.slice(0, i), p.slice(i + 1)]; }));
  if (!parts.t || !parts.v1) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${parts.t}.${rawBody}`));
  return timingSafeEqual(toHex(signature), parts.v1);
}

/* ══════════════════════════════ HELPERS ══════════════════════════════ */

async function saveEvent(env, request, data) {
  const occurredAt = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO site_events
    (event_name,page_path,session_id,business_id,order_id,metadata,occurred_at,ip_address,user_agent)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .bind(clean(data.event_name,80), clean(data.page_path,500), clean(data.session_id,120), data.business_id || null,
      data.order_id || null, JSON.stringify(data.metadata || {}), occurredAt,
      request.headers.get("CF-Connecting-IP"), clean(request.headers.get("User-Agent"),500)).run();
}

async function saveOrderLead(env, request, data) {
  const now = new Date().toISOString();
  const category = clean(data.category, 60);
  const quantity = Math.max(1, Math.min(10000, Number(data.quantity) || 0));
  const unitPriceCents = getCategoryPriceCents(category);
  const totalCents = quantity * unitPriceCents;
  const result = await env.DB.prepare(`INSERT INTO lead_orders
    (business_name, name, email, phone, category, quantity, unit_price_cents, total_cents, status, message, submitted_at, ip_address, user_agent)
    VALUES (?,?,?,?,?,?,?,?, 'pending_payment', ?, ?, ?, ?)`)
    .bind(clean(data.company || data.business_name, 200), clean(data.name, 120), clean(data.email, 254).toLowerCase(),
      clean(data.phone, 40), category, quantity, unitPriceCents, totalCents,
      clean(data.message, 4000), now, request.headers.get("CF-Connecting-IP"),
      clean(request.headers.get("User-Agent"), 500)).run();
  return result.meta?.last_row_id;
}

async function notify(env, order) {
  try {
    if (env.EMAIL) {
      await env.EMAIL.send({
        from: "Shedlr Orders <notifications@liferise.cc>", to: "support@liferise.cc", replyTo: order.email,
        subject: `New Shedlr order — ${order.name} (${order.quantity} ${order.category} leads)`,
        text: `Name: ${order.name}\nEmail: ${order.email}\nPhone: ${order.phone}\nBusiness: ${order.business_name || '(none)'}\nCategory: ${order.category}\nQuantity: ${order.quantity}\nTotal: $${(order.total_cents / 100).toFixed(2)}\nMessage: ${order.message || '(none)'}`
      });
    }
  } catch (error) { console.error("Email notification failed", error); }
}

function mapOrderStatus(stripeStatus) {
  if (stripeStatus === "paid") return "paid";
  return null;
}

/* ══════════════════════════════ MAIN HANDLER ══════════════════════════════ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") return json({ ok: true, service: "shedlr-api" });

    /* ── Event tracking ── */
    if (request.method === "POST" && url.pathname === "/api/events") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      if (!clean(data.event_name,80)) return json({ error: "Event name is required." }, 400);
      ctx.waitUntil(saveEvent(env, request, data));
      return json({ success: true }, 202);
    }

    /* ── Admin auth ── */
    if (request.method === "POST" && url.pathname === "/api/admin/login") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: "Admin secrets are not configured." }, 503);
      if (!timingSafeEqual(clean(data.password,500), env.ADMIN_PASSWORD)) return json({ error: "Incorrect password." }, 401);
      const token = await createSession(env);
      return json({ success: true }, 200, { "set-cookie": `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}` });
    }

    if (request.method === "POST" && url.pathname === "/api/admin/logout") {
      return json({ success: true }, 200, { "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
    }

    /* ── Stripe webhook ── */
    if (request.method === "POST" && url.pathname === "/api/stripe/webhook") {
      if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "Stripe webhook is not configured." }, 503);
      const rawBody = await request.text();
      const sig = request.headers.get("Stripe-Signature");
      if (!(await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET))) return json({ error: "Invalid signature." }, 400);
      let event; try { event = JSON.parse(rawBody); } catch { return json({ error: "Invalid payload." }, 400); }

      try {
        if (event.type === "checkout.session.completed") {
          const session = event.data?.object || {};
          const email = clean(session.customer_details?.email || session.customer_email || "", 254).toLowerCase();
          if (!validEmail(email)) return json({ received: true });

          const orderId = session.metadata?.order_id ? Number(session.metadata.order_id) : null;
          if (orderId) {
            await env.DB.prepare("UPDATE lead_orders SET status='paid', stripe_session_id=?, stripe_payment_intent=?, paid_at=? WHERE id=?")
              .bind(session.id, session.payment_intent || null, new Date().toISOString(), orderId).run();
          }

          const existing = await env.DB.prepare("SELECT * FROM businesses WHERE email=?").bind(email).first();
          const name = clean(session.customer_details?.name || "", 120) || null;
          const phone = clean(session.customer_details?.phone || "", 40) || null;
          const customerId = session.customer || null;
          const now = new Date().toISOString();

          if (existing) {
            await env.DB.prepare("UPDATE businesses SET stripe_customer_id=COALESCE(stripe_customer_id,?), name=COALESCE(name,?), phone=COALESCE(phone,?), updated_at=? WHERE id=?")
              .bind(customerId, name, phone, now, existing.id).run();
            if (!existing.password_hash) await issueActivationToken(env, existing.id);
          } else {
            const order = orderId ? await env.DB.prepare("SELECT * FROM lead_orders WHERE id=?").bind(orderId).first() : null;
            const result = await env.DB.prepare(`INSERT INTO businesses
              (stripe_customer_id, email, name, phone, company_name, preferred_category, status, created_at, updated_at)
              VALUES (?,?,?,?,?,?,'active',?,?)`)
              .bind(customerId, email, name, phone, order?.business_name || null, order?.category || null, now, now).run();
            if (result.meta?.last_row_id) await issueActivationToken(env, result.meta.last_row_id);
          }
        }
      } catch (error) { console.error("Stripe webhook processing error:", error?.message || error); }

      return json({ received: true });
    }

    /* ── Public order submission ── */
    if (request.method === "POST" && url.pathname === "/api/orders") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      const order = {
        name: clean(data.name, 120), email: clean(data.email, 254).toLowerCase(), phone: clean(data.phone, 40),
        company: clean(data.company || data.business_name, 200), category: clean(data.category, 60),
        quantity: Number(data.quantity) || 0, message: clean(data.message, 4000)
      };
      if (!order.name || !validEmail(order.email) || !validPhone(order.phone)) return json({ error: "Please provide a valid name, email, and phone number." }, 400);
      if (!order.category || !CATEGORIES.includes(order.category)) return json({ error: "Please select a valid lead category." }, 400);

      const id = await saveOrderLead(env, request, order);
      const orderRecord = { ...order, total_cents: order.quantity * getCategoryPriceCents(order.category), unit_price_cents: getCategoryPriceCents(order.category), business_name: order.company };
      ctx.waitUntil(Promise.all([
        notify(env, orderRecord),
        saveEvent(env, request, { event_name: "order_submitted", page_path: clean(data.page_path,500), session_id: clean(data.session_id,120), order_id: id, metadata: { category: order.category, quantity: order.quantity } })
      ]));
      return json({ success: true, order_id: id, message: "Thank you. Your order has been received. You will get a payment link by email shortly, and once payment is processed, our team will begin verifying leads for you." }, 201);
    }

    /* ══════════════ PUBLIC BUSINESS-PORTAL ROUTES ══════════════ */

    if (request.method === "POST" && url.pathname === "/api/portal/activate") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      const token = clean(data.token, 200);
      if (!token) return json({ error: "Missing activation token." }, 400);
      const business = await env.DB.prepare("SELECT * FROM businesses WHERE activation_nonce=?").bind(token).first();
      if (!business || !business.activation_nonce_expires || new Date(business.activation_nonce_expires).getTime() < Date.now()) {
        return json({ error: "This activation link is invalid or has expired. Please contact support@liferise.cc for a new link." }, 400);
      }
      return json({
        activation_token: business.activation_nonce,
        email: business.email,
        name: business.name,
        already_has_password: Boolean(business.password_hash)
      });
    }

    if (request.method === "POST" && url.pathname === "/api/portal/set-password") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      const token = clean(data.token, 200);
      const password = String(data.password || "");
      if (!token) return json({ error: "Missing activation token." }, 400);
      if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);

      const business = await env.DB.prepare("SELECT * FROM businesses WHERE activation_nonce=?").bind(token).first();
      if (!business || !business.activation_nonce_expires || new Date(business.activation_nonce_expires).getTime() < Date.now()) {
        return json({ error: "This activation link is invalid or has expired. Please contact support@liferise.cc for a new link." }, 400);
      }

      const passwordHash = await hashPassword(password);
      const now = new Date().toISOString();
      await env.DB.prepare("UPDATE businesses SET password_hash=?, activation_nonce=NULL, activation_nonce_expires=NULL, last_login_at=?, updated_at=? WHERE id=?")
        .bind(passwordHash, now, now, business.id).run();

      const sessionToken = await createBusinessSessionToken(env, business.id);
      return json({ success: true }, 200, { "set-cookie": businessCookieHeader(sessionToken) });
    }

    if (request.method === "POST" && url.pathname === "/api/portal/login") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      if (!env.BUSINESS_SESSION_SECRET) return json({ error: "Business portal is not configured." }, 503);
      const email = clean(data.email, 254).toLowerCase();
      const password = String(data.password || "");
      if (!validEmail(email) || !password) return json({ error: "Please provide a valid email and password." }, 400);

      const business = await env.DB.prepare("SELECT * FROM businesses WHERE email=?").bind(email).first();
      if (!business || !business.password_hash || !(await verifyPassword(password, business.password_hash))) {
        return json({ error: "Incorrect email or password." }, 401);
      }
      await env.DB.prepare("UPDATE businesses SET last_login_at=? WHERE id=?").bind(new Date().toISOString(), business.id).run();
      const token = await createBusinessSessionToken(env, business.id);
      return json({ success: true }, 200, { "set-cookie": businessCookieHeader(token) });
    }

    if (request.method === "POST" && url.pathname === "/api/portal/logout") {
      return json({ success: true }, 200, { "set-cookie": businessCookieHeader("", 0) });
    }

    /* ══════════════ AUTHENTICATED BUSINESS-PORTAL ROUTES ══════════════ */

    if (url.pathname.startsWith("/api/portal/") && !["/api/portal/activate", "/api/portal/set-password", "/api/portal/login", "/api/portal/logout"].includes(url.pathname)) {
      const business = await getAuthedBusiness(request, env);
      if (!business) return json({ error: "Unauthorized." }, 401);

      if (request.method === "GET" && url.pathname === "/api/portal/me") {
        return json({ business: { id: business.id, email: business.email, name: business.name, phone: business.phone, company_name: business.company_name, preferred_category: business.preferred_category, status: business.status } });
      }

      if (request.method === "GET" && url.pathname === "/api/portal/orders") {
        const orders = await env.DB.prepare("SELECT id, category, quantity, unit_price_cents, total_cents, status, paid_at, created_at, fulfilled_leads FROM lead_orders WHERE email=? ORDER BY created_at DESC LIMIT 200").bind(business.email).all();
        return json({ orders: orders.results || [] });
      }

      if (request.method === "GET" && url.pathname === "/api/portal/leads") {
        const leads = await env.DB.prepare(`SELECT la.id AS assignment_id, la.status AS assignment_status, la.assigned_at,
          l.id AS lead_id, l.name, l.email, l.phone, l.category, l.message, l.source, l.city, l.state, l.submitted_at
          FROM lead_assignments la JOIN leads l ON l.id = la.lead_id
          WHERE la.business_id=? ORDER BY la.assigned_at DESC LIMIT 500`).bind(business.id).all();
        return json({ leads: leads.results || [] });
      }

      const leadNotesMatch = url.pathname.match(/^\/api\/portal\/leads\/(\d+)$/);
      if (request.method === "GET" && leadNotesMatch) {
        const leadId = Number(leadNotesMatch[1]);
        const assignment = await env.DB.prepare("SELECT id FROM lead_assignments WHERE business_id=? AND lead_id=?").bind(business.id, leadId).first();
        if (!assignment) return json({ error: "Lead not found in your account." }, 404);
        const notes = await env.DB.prepare("SELECT id, author, content, created_at, updated_at FROM lead_notes WHERE assignment_id=? ORDER BY created_at DESC LIMIT 200").bind(assignment.id).all();
        return json({ notes: notes.results || [] });
      }

      const leadNoteAddMatch = url.pathname.match(/^\/api\/portal\/leads\/(\d+)\/notes$/);
      if (request.method === "POST" && leadNoteAddMatch) {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const leadId = Number(leadNoteAddMatch[1]);
        const assignment = await env.DB.prepare("SELECT id FROM lead_assignments WHERE business_id=? AND lead_id=?").bind(business.id, leadId).first();
        if (!assignment) return json({ error: "Lead not found in your account." }, 404);
        const content = clean(data.content, 5000);
        if (!content) return json({ error: "Note content is required." }, 400);
        const now = new Date().toISOString();
        const result = await env.DB.prepare("INSERT INTO lead_notes (assignment_id, business_id, lead_id, author, content, created_at, updated_at) VALUES (?,?,?,'business',?,?,?)")
          .bind(assignment.id, business.id, leadId, content, now, now).run();
        return json({ success: true, note: { id: result.meta?.last_row_id, author: "business", content, created_at: now } }, 201);
      }

      return json({ error: "Not found" }, 404);
    }

    /* ══════════════ ADMIN ROUTES ══════════════ */

    if (url.pathname.startsWith("/api/admin/")) {
      if (!(await isAdmin(request, env))) return json({ error: "Unauthorized." }, 401);

      if (request.method === "GET" && url.pathname === "/api/admin/dashboard") {
        const now = new Date();
        const defaultFrom = new Date(now.getTime() - 30 * 86400000);
        const fromRaw = url.searchParams.get("from");
        const toRaw = url.searchParams.get("to");
        const fromDate = fromRaw ? new Date(fromRaw) : defaultFrom;
        const toDate = toRaw ? new Date(toRaw) : now;
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return json({ error: "Invalid date range." }, 400);
        if (fromDate > toDate) return json({ error: "The start date must be before the end date." }, 400);
        const from = fromDate.toISOString();
        const to = toDate.toISOString();

        const metrics = await env.DB.prepare(`SELECT
          SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) visits,
          COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) unique_visitors,
          SUM(CASE WHEN event_name='order_submitted' THEN 1 ELSE 0 END) order_submissions,
          SUM(CASE WHEN event_name='lead_delivered' THEN 1 ELSE 0 END) leads_delivered
          FROM site_events WHERE occurred_at >= ? AND occurred_at <= ?`).bind(from, to).first();
        const orderCount = await env.DB.prepare("SELECT COUNT(*) total, COALESCE(SUM(total_cents),0) revenue_cents, COALESCE(SUM(CASE WHEN status='paid' THEN total_cents ELSE 0 END),0) paid_cents FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ?").bind(from, to).first();
        const orders = await env.DB.prepare(`SELECT id, business_name, name, email, phone, category, quantity, unit_price_cents, total_cents, status, message, submitted_at, paid_at, fulfilled_leads, stripe_session_id FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ? ORDER BY submitted_at DESC LIMIT 250`).bind(from, to).all();
        const events = await env.DB.prepare(`SELECT id, event_name, page_path, session_id, business_id, order_id, metadata, occurred_at FROM site_events WHERE occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at DESC LIMIT 500`).bind(from, to).all();
        const pages = await env.DB.prepare(`SELECT page_path,
          SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) views,
          COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) unique_visitors,
          MAX(occurred_at) last_activity
          FROM site_events WHERE page_path IS NOT NULL AND page_path <> ''
          GROUP BY page_path ORDER BY views DESC, last_activity DESC`).all();
        return json({
          metrics: { ...metrics, orders: orderCount?.total || 0, revenue_cents: orderCount?.revenue_cents || 0, paid_cents: orderCount?.paid_cents || 0 },
          pages: pages.results || [],
          orders: orders.results || [],
          events: events.results || [],
          range: { from, to }
        });
      }

      if (request.method === "GET" && url.pathname === "/api/admin/businesses") {
        const businesses = await env.DB.prepare(`SELECT id, email, name, phone, company_name, preferred_category, status, created_at, last_login_at,
          (SELECT COUNT(*) FROM lead_assignments la WHERE la.business_id = businesses.id) total_leads
          FROM businesses ORDER BY created_at DESC LIMIT 500`).all();
        return json({ businesses: businesses.results || [] });
      }

      const businessDetailMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)$/);
      if (request.method === "GET" && businessDetailMatch) {
        const id = Number(businessDetailMatch[1]);
        const business = await findBusinessById(env, id);
        if (!business) return json({ error: "Business not found." }, 404);
        const orders = await env.DB.prepare("SELECT id, category, quantity, unit_price_cents, total_cents, status, paid_at, created_at, fulfilled_leads FROM lead_orders WHERE email=? ORDER BY created_at DESC LIMIT 200").bind(business.email).all();
        const assignments = await env.DB.prepare(`SELECT la.id, la.lead_id, la.status, la.assigned_at,
          l.name, l.email, l.phone, l.category, l.message, l.source, l.city, l.state
          FROM lead_assignments la JOIN leads l ON l.id = la.lead_id
          WHERE la.business_id=? ORDER BY la.assigned_at DESC LIMIT 200`).bind(id).all();
        const { password_hash, activation_nonce, activation_nonce_expires, ...safeBusiness } = business;
        return json({ business: safeBusiness, orders: orders.results || [], assignments: assignments.results || [] });
      }

      if (request.method === "PATCH" && businessDetailMatch) {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const id = Number(businessDetailMatch[1]);
        const business = await findBusinessById(env, id);
        if (!business) return json({ error: "Business not found." }, 404);
        const allowedStatuses = ["active", "past_due", "canceled", "suspended"];
        const status = allowedStatuses.includes(clean(data.status, 30)) ? clean(data.status, 30) : business.status;
        const name = data.name !== undefined ? clean(data.name, 120) : business.name;
        const phone = data.phone !== undefined ? clean(data.phone, 40) : business.phone;
        const companyName = data.company_name !== undefined ? clean(data.company_name, 200) : business.company_name;
        const preferredCategory = data.preferred_category !== undefined && CATEGORIES.includes(clean(data.preferred_category, 60)) ? clean(data.preferred_category, 60) : business.preferred_category;
        await env.DB.prepare("UPDATE businesses SET status=?, name=?, phone=?, company_name=?, preferred_category=?, updated_at=? WHERE id=?")
          .bind(status, name, phone, companyName, preferredCategory, new Date().toISOString(), id).run();
        return json({ success: true, business: await findBusinessById(env, id) });
      }

      const resetPasswordMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)\/reset-password$/);
      if (request.method === "POST" && resetPasswordMatch) {
        const id = Number(resetPasswordMatch[1]);
        const business = await findBusinessById(env, id);
        if (!business) return json({ error: "Business not found." }, 404);
        const token = await issueActivationToken(env, id);
        return json({ success: true, activation_url: `https://shedlr.com/portal/activate.html?token=${token}` });
      }

      /* ── Lead management ── */
      if (request.method === "GET" && url.pathname === "/api/admin/leads") {
        const category = clean(url.searchParams.get("category"), 60);
        const clause = category ? " WHERE category = ?" : "";
        const bindings = category ? [category] : [];
        const leads = await env.DB.prepare(`SELECT id, name, email, phone, category, message, source, city, state, status, submitted_at, assigned_to FROM leads${clause} ORDER BY submitted_at DESC LIMIT 500`).bind(...bindings).all();
        return json({ leads: leads.results || [] });
      }

      if (request.method === "POST" && url.pathname === "/api/admin/leads") {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const name = clean(data.name, 120);
        const email = clean(data.email, 254).toLowerCase();
        const phone = clean(data.phone, 40);
        const category = clean(data.category, 60);
        if (!name) return json({ error: "Lead name is required." }, 400);
        if (!CATEGORIES.includes(category)) return json({ error: "Valid category is required." }, 400);
        const now = new Date().toISOString();
        const result = await env.DB.prepare(`INSERT INTO leads
          (name, email, phone, category, message, source, city, state, status, submitted_at, assigned_to)
          VALUES (?,?,?,?,?,?,'manual',?,?,?,'unassigned')`)
          .bind(name, email, phone, category, clean(data.message, 4000), clean(data.city, 120), clean(data.state, 60), "new", now).run();
        return json({ success: true, lead_id: result.meta?.last_row_id }, 201);
      }

      const leadMatch = url.pathname.match(/^\/api\/admin\/leads\/(\d+)$/);
      if (request.method === "PATCH" && leadMatch) {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const id = Number(leadMatch[1]);
        const allowedStatuses = ["new", "verified", "assigned", "delivered", "archived"];
        const status = allowedStatuses.includes(clean(data.status,30)) ? clean(data.status,30) : "new";
        const assignedTo = data.assigned_to !== undefined ? clean(data.assigned_to, 120) : null;
        await env.DB.prepare("UPDATE leads SET status=?, assigned_to=?, updated_at=? WHERE id=?")
          .bind(status, assignedTo, new Date().toISOString(), id).run();
        const lead = await env.DB.prepare("SELECT * FROM leads WHERE id=?").bind(id).first();
        if (!lead) return json({ error: "Lead not found." }, 404);
        return json({ success: true, lead });
      }

      /* ── Lead assignment ── */
      const assignMatch = url.pathname.match(/^\/api\/admin\/leads\/(\d+)\/assign$/);
      if (request.method === "POST" && assignMatch) {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const leadId = Number(assignMatch[1]);
        const businessId = Number(data.business_id);
        const orderId = data.order_id ? Number(data.order_id) : null;
        if (!businessId) return json({ error: "Business ID is required." }, 400);

        const lead = await env.DB.prepare("SELECT * FROM leads WHERE id=?").bind(leadId).first();
        if (!lead) return json({ error: "Lead not found." }, 404);
        const business = await findBusinessById(env, businessId);
        if (!business) return json({ error: "Business not found." }, 404);

        const existing = await env.DB.prepare("SELECT id FROM lead_assignments WHERE lead_id=? AND business_id=?").bind(leadId, businessId).first();
        if (existing) return json({ error: "This lead is already assigned to this business." }, 409);

        const now = new Date().toISOString();
        const result = await env.DB.prepare("INSERT INTO lead_assignments (lead_id, business_id, order_id, status, assigned_at) VALUES (?,?,?,'delivered',?)")
          .bind(leadId, businessId, orderId, now).run();
        await env.DB.prepare("UPDATE leads SET status='assigned', assigned_to=?, updated_at=? WHERE id=?").bind(String(businessId), now, leadId).run();

        if (orderId) {
          await env.DB.prepare("UPDATE lead_orders SET fulfilled_leads = fulfilled_leads + 1 WHERE id=?").bind(orderId).run();
        }

        ctx.waitUntil(saveEvent(env, request, { event_name: "lead_delivered", session_id: "", business_id: businessId, order_id: orderId, metadata: { lead_id: leadId, category: lead.category } }));

        return json({ success: true, assignment_id: result.meta?.last_row_id }, 201);
      }

      /* ── Orders management ── */
      if (request.method === "GET" && url.pathname === "/api/admin/orders") {
        const status = clean(url.searchParams.get("status"), 30);
        const clause = status ? " WHERE status = ?" : "";
        const bindings = status ? [status] : [];
        const orders = await env.DB.prepare(`SELECT * FROM lead_orders${clause} ORDER BY submitted_at DESC LIMIT 500`).bind(...bindings).all();
        return json({ orders: orders.results || [] });
      }

      const orderMatch = url.pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
      if (request.method === "PATCH" && orderMatch) {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const id = Number(orderMatch[1]);
        const allowedStatuses = ["pending_payment", "paid", "fulfilling", "completed", "canceled", "refunded"];
        const status = allowedStatuses.includes(clean(data.status,30)) ? clean(data.status,30) : "pending_payment";
        await env.DB.prepare("UPDATE lead_orders SET status=?, updated_at=? WHERE id=?").bind(status, new Date().toISOString(), id).run();
        return json({ success: true });
      }

      /* ── Lead notes (admin view) ── */
      const leadNotesAdminMatch = url.pathname.match(/^\/api\/admin\/leads\/(\d+)\/notes$/);
      if (request.method === "GET" && leadNotesAdminMatch) {
        const leadId = Number(leadNotesAdminMatch[1]);
        const notes = await env.DB.prepare(`SELECT ln.id, ln.author, ln.content, ln.created_at, ln.updated_at, b.company_name, b.name AS business_name
          FROM lead_notes ln LEFT JOIN businesses b ON b.id = ln.business_id
          WHERE ln.lead_id=? ORDER BY ln.created_at DESC LIMIT 200`).bind(leadId).all();
        return json({ notes: notes.results || [] });
      }

      return json({ error: "Not found" }, 404);
    }

    return json({ error: "Not found" }, 404);
  }
};
