const SESSION_COOKIE = "shedlr_admin";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const BUSINESS_SESSION_COOKIE = "shedlr_business";
const BUSINESS_SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const ACTIVATION_TTL_MS = 72 * 60 * 60 * 1000;
const LEAD_PRICE_CENTS = 100; // fallback default

const CATEGORY_PRICES = {
  "nail-lash-stylist": 300,
  "car-sales": 1000,
  "cell-phone-sales": 400,
  "internet-cable-sales": 500,
  "tax-prep": 600,
  "gym-sales": 300,
  "home-remodeling": 900,
  "personal-trainer": 400,
  "life-coach": 100,
  "counseling": 500,
  "mental-health-clinician": 500,
  "maintenance": 500,
  "dog-walker": 200,
  "house-cleaning": 600,
  "landscaping": 700,
  "tutoring": 400,
  "photography": 800,
  "handyman": 500,
  "moving": 900,
  "catering": 700,
  "event-planning": 1000,
  "home-insurance": 100,
  "vehicle-insurance": 100,
  "roofing": 300,
  "auto-hail-damage": 1200,
  "home-services": 600,
  "hvac": 700,
  "plumbing": 700,
  "garage-door-services": 700,
  "auto-mechanic": 700,
  "pest-control": 500,
  "solar": 1000,
  "real-estate": 800,
  "junk-removal": 600,
  "auto-detailing": 400,
  "auto-commercial-detailing": 800,
  "insurance": 100,
  "meal-prep": 400
};
const getCategoryPriceCents = (slug) => CATEGORY_PRICES[slug] || 500;

const CATEGORIES = [
  "personal-trainer",
  "life-coach",
  "counseling",
  "mental-health-clinician",
  "maintenance",
  "dog-walker",
  "house-cleaning",
  "landscaping",
  "tutoring",
  "photography",
  "handyman",
  "moving",
  "catering",
  "event-planning",
  "home-insurance",
  "vehicle-insurance",
  "roofing",
  "auto-hail-damage",
  "home-services",
  "hvac",
  "plumbing",
  "garage-door-services",
  "auto-mechanic",
  "pest-control",
  "solar",
  "real-estate",
  "car-sales",
  "cell-phone-sales",
  "internet-cable-sales",
  "tax-prep",
  "gym-sales",
  "home-remodeling",
  "nail-lash-stylist",
  "junk-removal",
  "auto-detailing",
  "auto-commercial-detailing",
  "insurance",
  "meal-prep"];

const LEAD_TYPES = ["appointment-booking", "phone-call-scheduling", "raw-leads"];

const CATEGORY_LABELS = {
  "personal-trainer": "Personal Trainer",
  "life-coach": "Life Coach",
  "counseling": "Counseling",
  "mental-health-clinician": "Mental Health Clinician",
  "maintenance": "Maintenance",
  "dog-walker": "Dog Walker",
  "house-cleaning": "House Cleaning",
  "landscaping": "Landscaping",
  "tutoring": "Tutoring",
  "photography": "Photography",
  "handyman": "Handyman",
  "moving": "Moving Services",
  "catering": "Catering",
  "event-planning": "Event Planning",
  "home-insurance": "Home Insurance",
  "vehicle-insurance": "Vehicle Insurance",
  "roofing": "Roofing",
  "auto-hail-damage": "Auto Hail Damage",
  "home-services": "Home Services",
  "hvac": "HVAC",
  "plumbing": "Plumbing",
  "garage-door-services": "Garage Door Services",
  "auto-mechanic": "Auto Mechanic / Auto Repair",
  "pest-control": "Pest Control",
  "solar": "Solar",
  "real-estate": "Real Estate",
  "car-sales": "Car Sales",
  "cell-phone-sales": "Cell Phone Sales",
  "internet-cable-sales": "Internet & Cable Sales",
  "tax-prep": "Tax Preparation",
  "gym-sales": "Gym Membership Sales",
  "home-remodeling": "Home Remodeling",
  "nail-lash-stylist": "Nail & Lash Stylists",
  "junk-removal": "Junk Removal",
  "auto-detailing": "Auto Detailing",
  "auto-commercial-detailing": "Fleet & Commercial Detailing",
  "insurance": "Insurance (general)",
  "meal-prep": "Meal Prep"
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

async function createSession(env, role) {
  const payload = b64urlText(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS, nonce: uuid(), role }));
  return `${payload}.${await hmac(env.ADMIN_SESSION_SECRET, payload)}`;
}

async function getAdminSession(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token || !env.ADMIN_SESSION_SECRET) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  if (!timingSafeEqual(signature, await hmac(env.ADMIN_SESSION_SECRET, payload))) return null;
  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized + "=".repeat((4 - normalized.length % 4) % 4)));
    if (!(decoded.exp > Math.floor(Date.now() / 1000))) return null;
    if (decoded.role === "staff") return { role: "staff" };
    if (decoded.role === "retention") return { role: "retention" };
    if (decoded.role === "bam") return { role: "bam" };
    return { role: "admin" };
  } catch { return null; }
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

/* Canceled businesses are hidden from staff/VA sessions. Canonical value is "canceled"; the
   double-l spelling is accepted defensively. Admin/owner sessions always see every business. */
function isCanceledBusiness(business) {
  const status = String(business && business.status || "").trim().toLowerCase();
  return status === "canceled" || status === "cancelled";
}

/* Killswitch: when on, the client portal can no longer see or open its leads. The account
   itself stays live and visible to admin, BAM, retention, and (unless canceled) VA staff. */
const isLeadsLocked = (business) => Boolean(Number(business && business.leads_locked || 0));
const LEADS_LOCKED_MESSAGE = "Lead access for this account is paused. Please contact support@shedlr.com or (307) 303-7530.";

const normEmail = (value) => clean(value, 254).toLowerCase();

/* Never send password hashes or live activation tokens to any browser. */
function safeBusiness(business) {
  if (!business) return null;
  const { password_hash, activation_nonce, activation_nonce_expires, ...rest } = business;
  return { ...rest, portal_activated: Boolean(password_hash), leads_locked: isLeadsLocked(business) };
}

/* Case/whitespace-insensitive lookup so "Bob@X.com " and "bob@x.com" are the same account. */
async function findBusinessByEmail(env, email) {
  return env.DB.prepare("SELECT * FROM businesses WHERE lower(trim(email))=? ORDER BY id ASC LIMIT 1").bind(normEmail(email)).first();
}

const activationUrl = (token) => `https://shedlr.com/portal/activate.html?token=${token}`;

/* Delivers the portal activation link to a paying customer.
   Prefers a real transactional provider (Resend) because the Cloudflare send_email
   binding can only deliver to destination addresses verified in this account — it
   cannot reach arbitrary customers. When no provider is configured we alert the
   internal address instead so nobody is left waiting silently. */
async function sendActivationEmail(env, email, token) {
  const link = activationUrl(token);
  const subject = "Activate your Shedlr lead portal";
  const text = `Your Shedlr account is ready.\n\nSet your password and sign in here:\n${link}\n\nThis link expires in 72 hours. If it expires, go to https://shedlr.com/portal/ and use "Forgot password", or reply to this email and we will send a new one.\n\n— Shedlr\nsupport@shedlr.com · (307) 303-7530`;
  const html = `<div style="font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#16232e;line-height:1.5">
<h2 style="margin:0 0 12px">Your Shedlr account is ready</h2>
<p style="margin:0 0 18px">Set your password to access your lead portal.</p>
<p style="margin:0 0 22px"><a href="${link}" style="display:inline-block;background:#16232e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:6px;font-weight:600">Activate my account</a></p>
<p style="margin:0 0 6px;font-size:13px;color:#5a6a7a">Or paste this link into your browser:</p>
<p style="margin:0 0 18px;font-size:13px;word-break:break-all"><a href="${link}">${link}</a></p>
<p style="margin:0 0 18px;font-size:13px;color:#5a6a7a">This link expires in 72 hours.</p>
<p style="margin:0;font-size:13px;color:#5a6a7a">Shedlr &middot; support@shedlr.com &middot; (307) 303-7530</p>
</div>`;

  try {
    if (env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
        body: JSON.stringify({ from: env.ACTIVATION_EMAIL_FROM || "Shedlr <support@shedlr.com>", to: [email], subject, text, html })
      });
      if (res.ok) return true;
      console.error("Activation email provider rejected the send", res.status, await res.text().catch(() => ""));
    }
  } catch (error) { console.error("Activation email failed", error?.message || error); }

  try {
    if (env.EMAIL) {
      const alertTo = env.INTERNAL_ALERT_EMAIL || "support@liferise.cc";
      await env.EMAIL.send({
        from: env.ACTIVATION_EMAIL_FROM || "Shedlr <notifications@liferise.cc>", to: alertTo,
        subject: `Send activation link manually — ${email}`,
        text: `No customer-capable email provider is configured, so ${email} was not emailed automatically.\n\nSend them this activation link:\n${link}\n\nIt expires in 72 hours.`
      });
    }
  } catch (error) { console.error("Internal activation alert failed", error?.message || error); }
  return false;
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
  const referrer = clean(data.referrer, 500) || clean(data.metadata && data.metadata.referrer, 500) || clean(request.headers.get("Referer"), 500) || null;
  await env.DB.prepare(`INSERT INTO site_events
    (event_name,page_path,session_id,business_id,order_id,metadata,occurred_at,ip_address,user_agent,referrer)
    VALUES (?,?,?,?,?,?,?,?,?,?)`)
    .bind(clean(data.event_name,80), clean(data.page_path,500), clean(data.session_id,120), data.business_id || null,
      data.order_id || null, JSON.stringify(data.metadata || {}), occurredAt,
      request.headers.get("CF-Connecting-IP"), clean(request.headers.get("User-Agent"),500), referrer).run();
}

async function saveOrderLead(env, request, data) {
  const now = new Date().toISOString();
  const category = clean(data.category, 60);
  const quantity = Math.max(1, Math.min(10000, Number(data.quantity) || 0));
  const unitPriceCents = getCategoryPriceCents(category);
  const totalCents = quantity * unitPriceCents;
  const result = await env.DB.prepare(`INSERT INTO lead_orders
    (business_name, name, email, phone, category, lead_type, zip, quantity, unit_price_cents, total_cents, status, message, submitted_at, ip_address, user_agent)
    VALUES (?,?,?,?,?,?,?,?,?,?, 'pending_payment', ?, ?, ?, ?)`)
    .bind(clean(data.company || data.business_name, 200), clean(data.name, 120), clean(data.email, 254).toLowerCase(),
      clean(data.phone, 40), category, clean(data.lead_type, 40), clean(data.zip, 10).replace(/\D/g, "").slice(0, 5),
      quantity, unitPriceCents, totalCents,
      clean(data.message, 4000), now, request.headers.get("CF-Connecting-IP"),
      clean(request.headers.get("User-Agent"), 500)).run();
  return result.meta?.last_row_id;
}

async function notify(env, order) {
  try {
    if (env.EMAIL) {
      await env.EMAIL.send({
        /* Must be a destination address verified in this account's Email Routing,
           otherwise Cloudflare rejects it with E_RECIPIENT_NOT_ALLOWED. */
        from: "Shedlr Orders <notifications@liferise.cc>", to: env.INTERNAL_ALERT_EMAIL || "support@liferise.cc", replyTo: order.email,
        subject: `New Shedlr order — ${order.name} (${order.quantity} ${order.category} leads)`,
        text: `Name: ${order.name}\nEmail: ${order.email}\nPhone: ${order.phone}\nBusiness: ${order.business_name || '(none)'}\nCategory: ${order.category}\nLead Type: ${order.lead_type || '(not specified)'}\nZIP: ${order.zip || '(not specified)'}\nQuantity: ${order.quantity}\nTotal: $${(order.total_cents / 100).toFixed(2)}\nMessage: ${order.message || '(none)'}`
      });
    }
  } catch (error) { console.error("Email notification failed", error); }
}

/* Turns a completed Stripe Checkout session into a live business account and a fresh
   activation token. Shared by the webhook and the post-checkout activation endpoint so
   a customer still gets in even if the webhook is missing, delayed, or misconfigured.
   Safe to run more than once for the same session. */
async function provisionBusinessFromCheckout(env, session) {
  const email = clean(session.customer_details?.email || session.customer_email || "", 254).toLowerCase();
  if (!validEmail(email)) return { ok: false, error: "That checkout session has no customer email." };

  const now = new Date().toISOString();

  /* Payment Links carry our order id in client_reference_id; the Checkout API uses metadata. */
  let orderId = session.metadata?.order_id ? Number(session.metadata.order_id) : null;
  if (!orderId) {
    const reference = clean(session.client_reference_id || "", 200);
    const match = reference.match(/^order[_-]?(\d+)$/i);
    if (match) orderId = Number(match[1]);
  }

  let order = orderId ? await env.DB.prepare("SELECT * FROM lead_orders WHERE id=?").bind(orderId).first() : null;
  /* Last resort: the most recent order submitted with this email. */
  if (!order) order = await env.DB.prepare("SELECT * FROM lead_orders WHERE email=? ORDER BY id DESC LIMIT 1").bind(email).first();

  if (order && order.status !== "refunded") {
    await env.DB.prepare("UPDATE lead_orders SET status='paid', stripe_session_id=COALESCE(stripe_session_id,?), stripe_payment_intent=COALESCE(stripe_payment_intent,?), paid_at=COALESCE(paid_at,?) WHERE id=?")
      .bind(session.id || null, session.payment_intent || null, now, order.id).run();
  }

  const name = clean(session.customer_details?.name || "", 120) || order?.name || null;
  const phone = clean(session.customer_details?.phone || "", 40) || order?.phone || null;
  const customerId = session.customer || null;

  const existing = await findBusinessByEmail(env, email);
  let businessId = existing?.id || null;
  let created = false;

  if (existing) {
    await env.DB.prepare("UPDATE businesses SET stripe_customer_id=COALESCE(stripe_customer_id,?), name=COALESCE(name,?), phone=COALESCE(phone,?), company_name=COALESCE(company_name,?), preferred_category=COALESCE(preferred_category,?), status='active', updated_at=? WHERE id=?")
      .bind(customerId, name, phone, order?.business_name || null, order?.category || null, now, existing.id).run();
  } else {
    const result = await env.DB.prepare(`INSERT INTO businesses
      (stripe_customer_id, email, name, phone, company_name, preferred_category, status, created_at, updated_at)
      VALUES (?,?,?,?,?,?,'active',?,?)`)
      .bind(customerId, email, name, phone, order?.business_name || null, order?.category || null, now, now).run();
    businessId = result.meta?.last_row_id || null;
    created = true;
  }

  if (!businessId) return { ok: false, error: "We could not create the business account." };

  const business = await findBusinessById(env, businessId);
  if (business?.password_hash) return { ok: true, email, business_id: businessId, created, already_activated: true };

  const token = await issueActivationToken(env, businessId);
  return { ok: true, email, business_id: businessId, created, already_activated: false, token, activation_url: activationUrl(token) };
}

function mapOrderStatus(stripeStatus) {
  if (stripeStatus === "paid") return "paid";
  return null;
}

/* ══════════════════════════════ STRIPE REPORTS ══════════════════════════════ */

/* Accepts YYYY-MM-DD (whole UTC day) or a full ISO timestamp (the admin UI sends the
   browser's local midnight / 23:59:59 as ISO, so ranges follow the user's time zone). */
function parseReportRange(url, defaultDays = 30) {
  const now = new Date();
  const parseBound = (raw, fallback, endOfDay) => {
    if (!raw) return fallback;
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
    return new Date(raw);
  };
  const fromDate = parseBound(url.searchParams.get("from"), new Date(now.getTime() - defaultDays * 86400000), false);
  const toDate = parseBound(url.searchParams.get("to"), now, true);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return { error: "Invalid date range." };
  if (fromDate > toDate) return { error: "The start date must be before the end date." };
  return { fromDate, toDate, fromSec: Math.floor(fromDate.getTime() / 1000), toSec: Math.floor(toDate.getTime() / 1000) };
}

/* Pages through a Stripe list endpoint. `params` is an array of [key, value] pairs so
   repeated keys like expand[] survive. Capped so one report stays inside the Worker
   subrequest budget; `truncated` tells the UI when the cap was hit. */
async function stripeListAll(env, path, params = [], maxPages = 10) {
  const items = [];
  let startingAfter = null; let pages = 0; let hasMore = true;
  while (hasMore && pages < maxPages) {
    const qs = new URLSearchParams(params);
    qs.set("limit", "100");
    if (startingAfter) qs.set("starting_after", startingAfter);
    const res = await stripeApi(env, `${path}?${qs.toString()}`);
    if (!res.ok) {
      const err = res.data && res.data.error;
      throw new Error((err && err.message) || (typeof err === "string" ? err : `Stripe request failed (${res.status}).`));
    }
    const batch = Array.isArray(res.data && res.data.data) ? res.data.data : [];
    items.push(...batch);
    pages++;
    hasMore = Boolean(res.data.has_more) && batch.length > 0;
    startingAfter = batch.length ? batch[batch.length - 1].id : null;
  }
  return { items, truncated: hasMore };
}

const stripeId = (value) => (typeof value === "string" ? value : (value && value.id) || null);
const isoFromUnix = (sec) => (sec ? new Date(Number(sec) * 1000).toISOString() : null);
const sumBy = (rows, pick) => rows.reduce((total, row) => total + Number(pick(row) || 0), 0);

/* ── Salesmen (commission credit) ──
   Needs worker/migration_salespeople.sql. Every helper degrades to "no salesmen" before the
   migration runs so the existing reports keep working. */
const SALES_MIGRATION_MESSAGE = "Salesmen are not set up yet. Run worker/migration_salespeople.sql on the shedlr-leads database first.";
async function loadSalespeople(env) {
  try {
    const rows = (await env.DB.prepare("SELECT id, name, email, phone, active, created_at, updated_at FROM salespeople ORDER BY lower(name) ASC").all()).results || [];
    return rows.map((r) => ({ ...r, active: Boolean(Number(r.active)) }));
  } catch { return null; }
}
async function findSalesperson(env, id) {
  try { return await env.DB.prepare("SELECT * FROM salespeople WHERE id=?").bind(Number(id)).first(); } catch { return null; }
}
/* Pulls every email-looking token out of whatever the BAM sent (commas, new lines, a pasted email body...). */
function parseEmailList(text) {
  const found = String(text || "").toLowerCase().match(/[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}/g) || [];
  return [...new Set(found.map((e) => e.replace(/^[.'-]+|[.'-]+$/g, "")))].filter(validEmail);
}
async function logSalesAssignments(env, entries) {
  if (!entries.length) return;
  const now = new Date().toISOString();
  try {
    await env.DB.batch(entries.map((e) => env.DB.prepare("INSERT INTO salesperson_assignment_log (business_id, salesperson_id, previous_salesperson_id, source, created_at) VALUES (?,?,?,?,?)").bind(e.business_id, e.salesperson_id ?? null, e.previous_salesperson_id ?? null, e.source || "manual", now)));
  } catch { /* the audit log must never block an assignment */ }
}

/* Matches Stripe customers/emails to Shedlr business accounts (customer id first, then email).
   With withSales, each match also carries the credited salesman. */
async function loadBusinessMatcher(env, { withSales = false } = {}) {
  const rows = (await env.DB.prepare("SELECT * FROM businesses").all()).results || [];
  const loaded = withSales ? await loadSalespeople(env) : null;
  const salespeople = loaded || [];
  const spById = new Map(salespeople.map((sp) => [Number(sp.id), sp]));
  const byCustomer = new Map(); const byEmail = new Map();
  const assignedCounts = new Map();
  for (const b of rows) {
    if (b.stripe_customer_id) byCustomer.set(b.stripe_customer_id, b);
    const key = normEmail(b.email);
    if (key && !byEmail.has(key)) byEmail.set(key, b);
    if (b.salesperson_id) assignedCounts.set(Number(b.salesperson_id), (assignedCounts.get(Number(b.salesperson_id)) || 0) + 1);
  }
  /* Stripe billing email (set by the owner when a client paid with a different email than
     their portal login). Portal emails win if the same address is on two accounts. */
  for (const b of rows) {
    const key = normEmail(b.stripe_email || "");
    if (key && !byEmail.has(key)) byEmail.set(key, b);
  }
  const matcher = (customerId, email) => {
    const b = (customerId && byCustomer.get(customerId)) || (email && byEmail.get(normEmail(email))) || null;
    if (!b) return null;
    const out = { id: b.id, email: b.email, name: b.name, company_name: b.company_name, status: b.status, portal_activated: Boolean(b.password_hash), leads_locked: isLeadsLocked(b), last_login_at: b.last_login_at };
    if (withSales) {
      const sp = b.salesperson_id ? spById.get(Number(b.salesperson_id)) : null;
      out.salesperson_id = sp ? sp.id : null;
      out.salesperson_name = sp ? sp.name : null;
    }
    return out;
  };
  matcher.salespeople = salespeople;
  matcher.salesReady = Array.isArray(loaded);
  matcher.assignedCounts = assignedCounts;
  return matcher;
}

/* Month (or any range) sales totals per salesman, built from the same Stripe data as the
   Stripe report so the two always agree. Payments are credited to whoever the business is
   assigned to right now; anything without a salesman lands in "Unassigned". */
function buildSalesBySalesperson(matcher, signups, payments, disputes) {
  const buckets = new Map();
  const bucket = (b) => {
    const key = b && b.salesperson_id ? String(b.salesperson_id) : "unassigned";
    if (!buckets.has(key)) {
      const sp = key === "unassigned" ? null : (matcher.salespeople || []).find((x) => String(x.id) === key);
      buckets.set(key, {
        salesperson: sp ? { id: sp.id, name: sp.name, email: sp.email || null, active: sp.active } : null,
        businesses_assigned: sp ? (matcher.assignedCounts.get(Number(sp.id)) || 0) : 0,
        signups: 0, signup_gross_cents: 0,
        payments: 0, gross_collected_cents: 0,
        first_payments: 0, first_payment_cents: 0, recurring_payments: 0, recurring_cents: 0,
        refunds_cents: 0, stripe_fees_cents: 0, disputes: 0, dispute_loss_cents: 0, net_cents: 0,
        paying_businesses: 0, _biz: new Map()
      });
    }
    return buckets.get(key);
  };
  for (const sp of matcher.salespeople || []) if (sp.active || matcher.assignedCounts.get(Number(sp.id))) bucket({ salesperson_id: sp.id });
  const bizRow = (row, p) => {
    const key = p.business ? `b${p.business.id}` : `e${p.email || p.customer_id || p.charge_id || p.session_id}`;
    if (!row._biz.has(key)) row._biz.set(key, { business: p.business || null, email: p.email || null, name: p.name || null, signed_up_at: null, signup_cents: 0, payments: 0, gross_cents: 0, refunds_cents: 0, fees_cents: 0, net_cents: 0 });
    return row._biz.get(key);
  };
  for (const s of signups) {
    const row = bucket(s.business); row.signups++; row.signup_gross_cents += Number(s.amount_cents || 0);
    const br = bizRow(row, s); br.signed_up_at = br.signed_up_at || s.created_at; br.signup_cents += Number(s.amount_cents || 0);
  }
  for (const p of payments) {
    const row = bucket(p.business);
    const amount = Number(p.amount_cents || 0); const refunded = Number(p.refunded_cents || 0); const fee = Number(p.fee_cents || 0);
    row.payments++; row.gross_collected_cents += amount; row.refunds_cents += refunded; row.stripe_fees_cents += fee;
    if (p.payment_number === 1) { row.first_payments++; row.first_payment_cents += amount; } else { row.recurring_payments++; row.recurring_cents += amount; }
    const br = bizRow(row, p); br.payments++; br.gross_cents += amount; br.refunds_cents += refunded; br.fees_cents += fee; br.net_cents += amount - refunded - fee;
  }
  for (const d of disputes) {
    const row = bucket(d.business); row.disputes++;
    row.dispute_loss_cents += Math.max(0, -Number(d.net_impact_cents || 0));
  }
  const out = [];
  for (const row of buckets.values()) {
    row.net_cents = row.gross_collected_cents - row.refunds_cents - row.stripe_fees_cents - row.dispute_loss_cents;
    row.businesses = [...row._biz.values()].sort((a, b) => b.gross_cents - a.gross_cents || String(a.business?.company_name || a.email || "").localeCompare(String(b.business?.company_name || b.email || "")));
    row.paying_businesses = row.businesses.filter((b) => b.payments > 0).length;
    delete row._biz;
    out.push(row);
  }
  return out.sort((a, b) => (a.salesperson ? 0 : 1) - (b.salesperson ? 0 : 1) || b.gross_collected_cents - a.gross_collected_cents || String(a.salesperson?.name || "").localeCompare(String(b.salesperson?.name || "")));
}

/* Completed Stripe Checkout sessions = completed sign-ups. Optional STRIPE_REPORT_PAYMENT_LINKS
   (comma-separated plink_... ids) limits this to Shedlr's own payment links when the Stripe
   account is shared with another business. */
async function fetchStripeSignups(env, fromSec, toSec, matchBusiness) {
  const { items, truncated } = await stripeListAll(env, "checkout/sessions", [["status", "complete"], ["created[gte]", String(fromSec)], ["created[lte]", String(toSec)]], 10);
  const allowedLinks = String(env.STRIPE_REPORT_PAYMENT_LINKS || "").split(",").map((v) => v.trim()).filter(Boolean);
  const sessions = allowedLinks.length ? items.filter((s) => allowedLinks.includes(stripeId(s.payment_link))) : items;
  const signups = sessions.map((s) => {
    const email = normEmail((s.customer_details && s.customer_details.email) || s.customer_email || "");
    const customerId = stripeId(s.customer);
    return {
      session_id: s.id, created_at: isoFromUnix(s.created), email,
      name: (s.customer_details && s.customer_details.name) || null,
      phone: (s.customer_details && s.customer_details.phone) || null,
      amount_cents: Number(s.amount_total || 0), currency: s.currency || "usd",
      payment_status: s.payment_status, mode: s.mode, customer_id: customerId,
      business: matchBusiness(customerId, email)
    };
  }).sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return { signups, truncated };
}

async function buildStripeReport(env, range) {
  const { fromSec, toSec } = range;
  const matchBusiness = await loadBusinessMatcher(env, { withSales: true });
  /* Charges are fetched from the start of the account up to the end of the range so every
     payment can be numbered (1st, 2nd, 3rd...) against the customer's full history. */
  const [signupRes, chargeRes, disputeRes] = await Promise.all([
    fetchStripeSignups(env, fromSec, toSec, matchBusiness),
    stripeListAll(env, "charges", [["created[lte]", String(toSec)], ["expand[]", "data.balance_transaction"]], 25),
    stripeListAll(env, "disputes", [["created[gte]", String(fromSec)], ["created[lte]", String(toSec)], ["expand[]", "data.charge"]], 5)
  ]);

  const chargeEmail = (c) => normEmail((c.billing_details && c.billing_details.email) || c.receipt_email || "");
  const customerKey = (c) => stripeId(c.customer) || chargeEmail(c) || `charge:${c.id}`;

  const succeededAll = chargeRes.items.filter((c) => c.status === "succeeded" && c.paid)
    .sort((a, b) => (a.created - b.created) || String(a.id).localeCompare(String(b.id)));
  const paymentNumber = new Map(); const perCustomer = new Map();
  for (const c of succeededAll) {
    const key = customerKey(c);
    const n = (perCustomer.get(key) || 0) + 1;
    perCustomer.set(key, n);
    paymentNumber.set(c.id, n);
  }

  const toPayment = (c) => {
    const bt = c.balance_transaction && typeof c.balance_transaction === "object" ? c.balance_transaction : null;
    const email = chargeEmail(c); const customerId = stripeId(c.customer);
    return {
      charge_id: c.id, created_at: isoFromUnix(c.created), email,
      name: (c.billing_details && c.billing_details.name) || null,
      description: c.description || null, amount_cents: Number(c.amount || 0),
      fee_cents: bt ? Number(bt.fee || 0) : 0, net_cents: bt ? Number(bt.net || 0) : null,
      refunded_cents: Number(c.amount_refunded || 0), disputed: Boolean(c.disputed), status: c.status,
      payment_number: paymentNumber.get(c.id) || null,
      failure_code: c.failure_code || null,
      failure_message: c.failure_message || (c.outcome && c.outcome.seller_message) || null,
      customer_id: customerId, business: matchBusiness(customerId, email)
    };
  };

  const inRange = chargeRes.items.filter((c) => c.created >= fromSec && c.created <= toSec);
  const byNewest = (a, b) => String(b.created_at).localeCompare(String(a.created_at));
  const payments = inRange.filter((c) => c.status === "succeeded" && c.paid).map(toPayment).sort(byNewest);
  const failed = inRange.filter((c) => c.status === "failed").map(toPayment).sort(byNewest);

  const disputes = disputeRes.items.map((d) => {
    const bts = Array.isArray(d.balance_transactions) ? d.balance_transactions : [];
    const charge = d.charge && typeof d.charge === "object" ? d.charge : null;
    const email = charge ? chargeEmail(charge) : "";
    const customerId = charge ? stripeId(charge.customer) : null;
    return {
      dispute_id: d.id, charge_id: stripeId(d.charge), created_at: isoFromUnix(d.created), email,
      amount_cents: Number(d.amount || 0), status: d.status, reason: d.reason,
      fee_cents: sumBy(bts, (b) => b.fee), net_impact_cents: sumBy(bts, (b) => b.net),
      evidence_due_by: isoFromUnix(d.evidence_details && d.evidence_details.due_by),
      business: matchBusiness(customerId, email)
    };
  }).sort(byNewest);

  const grossCollected = sumBy(payments, (p) => p.amount_cents);
  const failedCents = sumBy(failed, (p) => p.amount_cents);
  /* Stripe retries a declined renewal several times, so raw failed attempts overstate what was
     lost. "Unrecovered" counts each customer + amount once, and drops it if a later retry for
     the same customer and amount succeeded. This is what gets deducted from gross billed. */
  const unrecovered = new Map();
  for (const f of failed) {
    const key = `${f.customer_id || f.email || f.charge_id}|${f.amount_cents}`;
    const failedAt = Date.parse(f.created_at) / 1000;
    const recovered = succeededAll.some((c) => customerKey(c) === (f.customer_id || f.email || `charge:${f.charge_id}`) && Number(c.amount) === f.amount_cents && c.created >= failedAt);
    f.recovered = recovered;
    if (!recovered && !unrecovered.has(key)) unrecovered.set(key, f.amount_cents);
  }
  const unrecoveredCents = [...unrecovered.values()].reduce((a, b) => a + b, 0);
  const refunds = sumBy(payments, (p) => p.refunded_cents);
  const fees = sumBy(payments, (p) => p.fee_cents);
  const disputeLoss = Math.max(0, -sumBy(disputes, (d) => d.net_impact_cents));
  const lists = { first: [], second: [], third: [], fourth_plus: [] };
  for (const p of payments) {
    if (p.payment_number === 1) lists.first.push(p);
    else if (p.payment_number === 2) lists.second.push(p);
    else if (p.payment_number === 3) lists.third.push(p);
    else lists.fourth_plus.push(p);
  }

  return {
    range: { from: range.fromDate.toISOString(), to: range.toDate.toISOString() },
    generated_at: new Date().toISOString(),
    currency: "usd",
    truncated: { signups: signupRes.truncated, charges: chargeRes.truncated, disputes: disputeRes.truncated },
    totals: {
      signups: signupRes.signups.length,
      signup_gross_cents: sumBy(signupRes.signups, (s) => s.amount_cents),
      payments: payments.length,
      gross_attempted_cents: grossCollected + unrecoveredCents,
      failed_unrecovered_cents: unrecoveredCents,
      failed_unrecovered_customers: new Set([...unrecovered.keys()].map((k) => k.split("|")[0])).size,
      failed_payments: failed.length,
      failed_customers: new Set(failed.map((f) => f.customer_id || f.email || f.charge_id)).size,
      failed_cents: failedCents,
      gross_collected_cents: grossCollected,
      refunds_cents: refunds,
      stripe_fees_cents: fees,
      disputes: disputes.length,
      disputed_cents: sumBy(disputes, (d) => d.amount_cents),
      dispute_fees_cents: sumBy(disputes, (d) => d.fee_cents),
      dispute_loss_cents: disputeLoss,
      net_cents: grossCollected - refunds - fees - disputeLoss,
      first_payments: lists.first.length, second_payments: lists.second.length,
      third_payments: lists.third.length, fourth_plus_payments: lists.fourth_plus.length
    },
    salespeople_ready: Boolean(matchBusiness.salesReady),
    by_salesperson: buildSalesBySalesperson(matchBusiness, signupRes.signups, payments, disputes),
    signups: signupRes.signups,
    payments,
    payment_lists: lists,
    failed_payments: failed,
    disputes
  };
}

/* ══════════════════════════════ MAIN HANDLER ══════════════════════════════ */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") return json({ ok: true, service: "shedlr-api" });

    if (request.method === "POST" && url.pathname === "/api/events") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      if (!clean(data.event_name,80)) return json({ error: "Event name is required." }, 400);
      ctx.waitUntil(saveEvent(env, request, data));
      return json({ success: true }, 202);
    }

    if (request.method === "POST" && url.pathname === "/api/admin/login") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      if (!env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: "Admin secrets are not configured." }, 503);
      const password = clean(data.password, 500);
      let role = null;
      if (timingSafeEqual(password, env.ADMIN_PASSWORD)) role = "admin";
      else if (env.STAFF_PASSWORD && timingSafeEqual(password, env.STAFF_PASSWORD)) role = "staff";
      else if (env.RETENTION_PASSWORD && timingSafeEqual(password, env.RETENTION_PASSWORD)) role = "retention";
      else if (env.BAM_PASSWORD && timingSafeEqual(password, env.BAM_PASSWORD)) role = "bam";
      if (!role) return json({ error: "Incorrect password." }, 401);
      const token = await createSession(env, role);
      return json({ success: true, role }, 200, { "set-cookie": `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}` });
    }

    if (request.method === "POST" && url.pathname === "/api/admin/logout") {
      return json({ success: true }, 200, { "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0` });
    }

    if (request.method === "POST" && url.pathname === "/api/stripe/webhook") {
      if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: "Stripe webhook is not configured." }, 503);
      const rawBody = await request.text();
      const sig = request.headers.get("Stripe-Signature");
      if (!(await verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET))) return json({ error: "Invalid signature." }, 400);
      let event; try { event = JSON.parse(rawBody); } catch { return json({ error: "Invalid payload." }, 400); }

      try {
        if (event.type === "checkout.session.completed") {
          const outcome = await provisionBusinessFromCheckout(env, event.data?.object || {});
          /* Without this the account exists but the customer is never told how to get in. */
          if (outcome.ok && outcome.token) await sendActivationEmail(env, outcome.email, outcome.token);
        }
      } catch (error) { console.error("Stripe webhook processing error:", error?.message || error); }

      return json({ received: true });
    }

    if (request.method === "POST" && url.pathname === "/api/orders") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      const order = {
        name: clean(data.name, 120), email: clean(data.email, 254).toLowerCase(), phone: clean(data.phone, 40),
        company: clean(data.company || data.business_name, 200), category: clean(data.category, 60),
        lead_type: clean(data.lead_type, 40), zip: clean(data.zip, 10).replace(/\D/g, "").slice(0, 5),
        quantity: Number(data.quantity) || 0, message: clean(data.message, 4000)
      };
      if (!validEmail(order.email) || !validPhone(order.phone)) return json({ error: "Please provide a valid email address and phone number." }, 400);
      if (order.category && !CATEGORIES.includes(order.category)) return json({ error: "Please select a valid lead category." }, 400);
      if (order.lead_type && !LEAD_TYPES.includes(order.lead_type)) return json({ error: "Please select a valid lead type." }, 400);

      const id = await saveOrderLead(env, request, order);
      const orderRecord = { ...order, total_cents: order.quantity * getCategoryPriceCents(order.category), unit_price_cents: getCategoryPriceCents(order.category), business_name: order.company };
      ctx.waitUntil(Promise.all([
        notify(env, orderRecord),
        saveEvent(env, request, { event_name: "order_submitted", page_path: clean(data.page_path,500), session_id: clean(data.session_id,120), order_id: id, metadata: { category: order.category, quantity: order.quantity } })
      ]));
      return json({ success: true, order_id: id, message: "Thank you. Your order has been received. You will get a payment link by email shortly, and once payment is processed, our team will begin verifying leads for you." }, 201);
    }

    /* Post-checkout self-activation. Stripe redirects the buyer here with their own
       Checkout Session id, which we verify against the Stripe API before handing back an
       activation link — so activation never depends on an email arriving. */
    if (request.method === "GET" && url.pathname === "/api/portal/checkout-activation") {
      const sessionId = clean(url.searchParams.get("session_id") || "", 200);
      if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: "Missing or malformed checkout session id." }, 400);
      const stripeResult = await stripeApi(env, `checkout/sessions/${sessionId}`);
      if (!stripeResult.ok) return json({ error: "We could not verify that checkout session with Stripe." }, 502);
      const session = stripeResult.data || {};
      if (session.payment_status !== "paid" && session.status !== "complete") return json({ error: "This checkout has not been paid yet." }, 409);
      const outcome = await provisionBusinessFromCheckout(env, session);
      if (!outcome.ok) return json({ error: outcome.error }, 400);
      /* Awaited, not fire-and-forget, so the page only claims an email was sent when one was. */
      const emailed = outcome.token ? await sendActivationEmail(env, outcome.email, outcome.token) : false;
      return json({
        success: true, email: outcome.email, already_activated: outcome.already_activated, emailed,
        activation_token: outcome.token || null, activation_url: outcome.activation_url || null
      });
    }

    if (request.method === "POST" && url.pathname === "/api/portal/activate") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      const token = clean(data.token, 200);
      if (!token) return json({ error: "Missing activation token." }, 400);
      const business = await env.DB.prepare("SELECT * FROM businesses WHERE activation_nonce=?").bind(token).first();
      if (!business || !business.activation_nonce_expires || new Date(business.activation_nonce_expires).getTime() < Date.now()) return json({ error: "This activation link is invalid or has expired. Please contact support@shedlr.com for a new link." }, 400);
      /* A valid, unexpired token is always usable — whether the account is brand new or
         an admin/retention manager generated a fresh link to reset an existing password.
         `mode` lets the page show the right copy instead of a false "already activated" error. */
      const hasPassword = Boolean(business.password_hash);
      return json({ activation_token: business.activation_nonce, email: business.email, name: business.name, already_has_password: hasPassword, mode: hasPassword ? "reset" : "activate" });
    }

    if (request.method === "POST" && url.pathname === "/api/portal/set-password") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      const token = clean(data.token, 200); const password = String(data.password || "");
      if (!token) return json({ error: "Missing activation token." }, 400);
      if (password.length < 8) return json({ error: "Password must be at least 8 characters." }, 400);
      const business = await env.DB.prepare("SELECT * FROM businesses WHERE activation_nonce=?").bind(token).first();
      if (!business || !business.activation_nonce_expires || new Date(business.activation_nonce_expires).getTime() < Date.now()) return json({ error: "This activation link is invalid or has expired. Please contact support@shedlr.com for a new link." }, 400);
      const passwordHash = await hashPassword(password); const now = new Date().toISOString();
      await env.DB.prepare("UPDATE businesses SET password_hash=?, activation_nonce=NULL, activation_nonce_expires=NULL, last_login_at=?, updated_at=? WHERE id=?").bind(passwordHash, now, now, business.id).run();
      const sessionToken = await createBusinessSessionToken(env, business.id);
      return json({ success: true }, 200, { "set-cookie": businessCookieHeader(sessionToken) });
    }

    if (request.method === "POST" && url.pathname === "/api/portal/login") {
      let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
      if (!env.BUSINESS_SESSION_SECRET) return json({ error: "Business portal is not configured." }, 503);
      const email = clean(data.email, 254).toLowerCase(); const password = String(data.password || "");
      if (!validEmail(email) || !password) return json({ error: "Please provide a valid email and password." }, 400);
      const business = await findBusinessByEmail(env, email);
      if (!business || !business.password_hash || !(await verifyPassword(password, business.password_hash))) return json({ error: "Incorrect email or password." }, 401);
      await env.DB.prepare("UPDATE businesses SET last_login_at=? WHERE id=?").bind(new Date().toISOString(), business.id).run();
      const token = await createBusinessSessionToken(env, business.id);
      return json({ success: true }, 200, { "set-cookie": businessCookieHeader(token) });
    }

    if (request.method === "POST" && url.pathname === "/api/portal/logout") return json({ success: true }, 200, { "set-cookie": businessCookieHeader("", 0) });

    if (url.pathname.startsWith("/api/portal/") && !["/api/portal/activate", "/api/portal/set-password", "/api/portal/login", "/api/portal/logout", "/api/portal/checkout-activation"].includes(url.pathname)) {
      const business = await getAuthedBusiness(request, env);
      if (!business) return json({ error: "Unauthorized." }, 401);
      if (request.method === "GET" && url.pathname === "/api/portal/me") return json({ business: { id: business.id, email: business.email, name: business.name, phone: business.phone, company_name: business.company_name, address: business.address, preferred_category: business.preferred_category, status: business.status, leads_locked: isLeadsLocked(business) } });
      if (request.method === "PATCH" && url.pathname === "/api/portal/me") {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const name = data.name !== undefined ? clean(data.name, 120) : business.name; const phone = data.phone !== undefined ? clean(data.phone, 40) : business.phone; const companyName = data.company_name !== undefined ? clean(data.company_name, 200) : business.company_name; const address = data.address !== undefined ? clean(data.address, 300) : business.address; const now = new Date().toISOString();
        await env.DB.prepare("UPDATE businesses SET name=?, phone=?, company_name=?, address=?, updated_at=? WHERE id=?").bind(name, phone, companyName, address, now, business.id).run();
        return json({ success: true, business: { id: business.id, email: business.email, name, phone, company_name: companyName, address, preferred_category: business.preferred_category, status: business.status, leads_locked: isLeadsLocked(business) } });
      }
      if (request.method === "GET" && url.pathname === "/api/portal/orders") { const orders = await env.DB.prepare("SELECT id, category, quantity, unit_price_cents, total_cents, status, paid_at, created_at, fulfilled_leads FROM lead_orders WHERE email=? ORDER BY created_at DESC LIMIT 200").bind(business.email).all(); return json({ orders: orders.results || [] }); }
      /* Killswitch: every lead read/write from the client portal is blocked while it is on. */
      if (isLeadsLocked(business) && url.pathname.startsWith("/api/portal/leads")) {
        if (request.method === "GET" && url.pathname === "/api/portal/leads") return json({ leads: [], leads_locked: true, message: LEADS_LOCKED_MESSAGE });
        return json({ error: LEADS_LOCKED_MESSAGE, leads_locked: true }, 403);
      }
      if (request.method === "GET" && url.pathname === "/api/portal/leads") { const leads = await env.DB.prepare(`SELECT la.id AS assignment_id, la.status AS assignment_status, la.assigned_at, l.id AS lead_id, l.name, l.email, l.phone, l.category, l.message, l.source, l.city, l.state, l.submitted_at FROM lead_assignments la JOIN leads l ON l.id = la.lead_id WHERE la.business_id=? ORDER BY la.assigned_at DESC LIMIT 500`).bind(business.id).all(); return json({ leads: leads.results || [] }); }
      const leadNotesMatch = url.pathname.match(/^\/api\/portal\/leads\/(\d+)$/);
      if (request.method === "GET" && leadNotesMatch) { const leadId = Number(leadNotesMatch[1]); const assignment = await env.DB.prepare("SELECT id FROM lead_assignments WHERE business_id=? AND lead_id=?").bind(business.id, leadId).first(); if (!assignment) return json({ error: "Lead not found in your account." }, 404); const notes = await env.DB.prepare("SELECT id, author, content, created_at, updated_at FROM lead_notes WHERE assignment_id=? ORDER BY created_at DESC LIMIT 200").bind(assignment.id).all(); return json({ notes: notes.results || [] }); }
      const leadNoteAddMatch = url.pathname.match(/^\/api\/portal\/leads\/(\d+)\/notes$/);
      if (request.method === "POST" && leadNoteAddMatch) { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const leadId = Number(leadNoteAddMatch[1]); const assignment = await env.DB.prepare("SELECT id FROM lead_assignments WHERE business_id=? AND lead_id=?").bind(business.id, leadId).first(); if (!assignment) return json({ error: "Lead not found in your account." }, 404); const content = clean(data.content, 5000); if (!content) return json({ error: "Note content is required." }, 400); const now = new Date().toISOString(); const result = await env.DB.prepare("INSERT INTO lead_notes (assignment_id, business_id, lead_id, author, content, created_at, updated_at) VALUES (?,?,?,'business',?,?,?)").bind(assignment.id, business.id, leadId, content, now, now).run(); return json({ success: true, note: { id: result.meta?.last_row_id, author: "business", content, created_at: now } }, 201); }
      if (request.method === "GET" && url.pathname === "/api/portal/business-notes") { const note = await env.DB.prepare("SELECT id, content, updated_by, created_at, updated_at FROM business_notes WHERE business_id=?").bind(business.id).first(); return json({ note: note || { content: "", updated_by: null, created_at: null, updated_at: null } }); }
      if (request.method === "PUT" && url.pathname === "/api/portal/business-notes") { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const content = clean(data.content, 10000); const now = new Date().toISOString(); await env.DB.prepare(`INSERT INTO business_notes (business_id, content, updated_by, created_at, updated_at) VALUES (?,?, 'business', ?, ?) ON CONFLICT(business_id) DO UPDATE SET content=excluded.content, updated_by='business', updated_at=excluded.updated_at`).bind(business.id, content, now, now).run(); return json({ success: true, note: { content, updated_by: "business", updated_at: now } }); }
      return json({ error: "Not found" }, 404);
    }

    if (url.pathname.startsWith("/api/admin/")) {
      const session = await getAdminSession(request, env);
      if (!session) return json({ error: "Unauthorized." }, 401);
      const STAFF_ALLOWED = (request.method === "GET" && url.pathname === "/api/admin/session") || (request.method === "GET" && url.pathname === "/api/admin/businesses") || (request.method === "GET" && /^\/api\/admin\/businesses\/\d+$/.test(url.pathname)) || (request.method === "POST" && url.pathname === "/api/admin/leads") || (request.method === "POST" && url.pathname === "/api/admin/leads/bulk") || (request.method === "PATCH" && /^\/api\/admin\/leads\/\d+$/.test(url.pathname));
      /* Retention manager: read-only. Sees every business account in any status, with full
         contact details, business info, orders, assigned leads, and business notes.
         Cannot create or edit leads, businesses, orders, or notes. Exception: may generate
         activation / password-reset links for an account, same as admin. */
      const RETENTION_ALLOWED = (request.method === "GET" && url.pathname === "/api/admin/session") || (request.method === "GET" && url.pathname === "/api/admin/businesses") || (request.method === "GET" && /^\/api\/admin\/businesses\/\d+$/.test(url.pathname)) || (request.method === "GET" && /^\/api\/admin\/businesses\/\d+\/notes$/.test(url.pathname)) || (request.method === "GET" && /^\/api\/admin\/leads\/\d+\/notes$/.test(url.pathname)) || (request.method === "POST" && /^\/api\/admin\/businesses\/\d+\/reset-password$/.test(url.pathname));
      /* Business account manager (BAM / sales): sees every account and Stripe sign-ups for any
         date range, creates accounts (never duplicates — a matching email returns a fresh link
         for the existing account), edits name/contact/address/type, and generates activation /
         password-reset links. Cannot change status, delete, killswitch, or see leads/reports. */
      const BAM_ALLOWED = (request.method === "GET" && url.pathname === "/api/admin/session") || (request.method === "GET" && url.pathname === "/api/admin/businesses") || (request.method === "POST" && url.pathname === "/api/admin/businesses") || (request.method === "GET" && /^\/api\/admin\/businesses\/\d+$/.test(url.pathname)) || (request.method === "PATCH" && /^\/api\/admin\/businesses\/\d+$/.test(url.pathname)) || (request.method === "POST" && /^\/api\/admin\/businesses\/\d+\/reset-password$/.test(url.pathname)) || (request.method === "GET" && url.pathname === "/api/admin/stripe-signups");
      if (session.role === "bam" && !BAM_ALLOWED) return json({ error: "Your account does not have permission for this action." }, 403);
      if (session.role === "staff" && !STAFF_ALLOWED) return json({ error: "Your account does not have permission for this action." }, 403);
      if (session.role === "retention" && !RETENTION_ALLOWED) return json({ error: "Your account does not have permission for this action." }, 403);
      if (session.role !== "admin" && session.role !== "staff" && session.role !== "retention" && session.role !== "bam") return json({ error: "Your account does not have permission for this action." }, 403);
      if (request.method === "GET" && url.pathname === "/api/admin/session") return json({ role: session.role });
      if (request.method === "GET" && url.pathname === "/api/admin/dashboard") {
        const now = new Date(); const defaultFrom = new Date(now.getTime() - 30 * 86400000); const fromRaw = url.searchParams.get("from"); const toRaw = url.searchParams.get("to"); const fromDate = fromRaw ? new Date(fromRaw) : defaultFrom; const toDate = toRaw ? new Date(toRaw) : now;
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return json({ error: "Invalid date range." }, 400); if (fromDate > toDate) return json({ error: "The start date must be before the end date." }, 400); const from = fromDate.toISOString(); const to = toDate.toISOString();
        const metrics = await env.DB.prepare(`SELECT SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) visits, COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) unique_visitors, SUM(CASE WHEN event_name='order_submitted' THEN 1 ELSE 0 END) order_submissions, SUM(CASE WHEN event_name='lead_delivered' THEN 1 ELSE 0 END) leads_delivered FROM site_events WHERE occurred_at >= ? AND occurred_at <= ?`).bind(from, to).first();
        const orderCount = await env.DB.prepare("SELECT COUNT(*) total, COALESCE(SUM(total_cents),0) revenue_cents, COALESCE(SUM(CASE WHEN status='paid' THEN total_cents ELSE 0 END),0) paid_cents FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ?").bind(from, to).first();
        const orders = await env.DB.prepare(`SELECT id, business_name, name, email, phone, category, quantity, unit_price_cents, total_cents, status, message, submitted_at, paid_at, fulfilled_leads, stripe_session_id FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ? ORDER BY submitted_at DESC LIMIT 250`).bind(from, to).all();
        const events = await env.DB.prepare(`SELECT id, event_name, page_path, session_id, business_id, order_id, metadata, occurred_at, referrer FROM site_events WHERE occurred_at >= ? AND occurred_at <= ? ORDER BY occurred_at DESC LIMIT 500`).bind(from, to).all();
        const pages = await env.DB.prepare(`SELECT page_path, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) views, COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) unique_visitors, MAX(occurred_at) last_activity FROM site_events WHERE page_path IS NOT NULL AND page_path <> '' GROUP BY page_path ORDER BY views DESC, last_activity DESC`).all();
        return json({ metrics: { ...metrics, orders: orderCount?.total || 0, revenue_cents: orderCount?.revenue_cents || 0, paid_cents: orderCount?.paid_cents || 0 }, pages: pages.results || [], orders: orders.results || [], events: events.results || [], range: { from, to } });
      }
      /* Printable backend report for a date range (admin only). */
      if (request.method === "GET" && url.pathname === "/api/admin/report") {
        const now = new Date();
        const parseBound = (raw, fallback, endOfDay) => {
          if (!raw) return fallback;
          if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(`${raw}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
          return new Date(raw);
        };
        const fromDate = parseBound(url.searchParams.get("from"), new Date(now.getTime() - 30 * 86400000), false);
        const toDate = parseBound(url.searchParams.get("to"), now, true);
        if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return json({ error: "Invalid date range." }, 400);
        if (fromDate > toDate) return json({ error: "The start date must be before the end date." }, 400);
        const from = fromDate.toISOString(); const to = toDate.toISOString();

        const traffic = await env.DB.prepare(`SELECT SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) visits, COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) unique_visitors, SUM(CASE WHEN event_name='order_submitted' THEN 1 ELSE 0 END) order_submissions, SUM(CASE WHEN event_name='lead_delivered' THEN 1 ELSE 0 END) leads_delivered FROM site_events WHERE occurred_at >= ? AND occurred_at <= ?`).bind(from, to).first();
        const orderTotals = await env.DB.prepare(`SELECT COUNT(*) total_orders, COALESCE(SUM(quantity),0) leads_ordered, COALESCE(SUM(fulfilled_leads),0) leads_fulfilled, COALESCE(SUM(total_cents),0) revenue_cents, COALESCE(SUM(CASE WHEN status='paid' OR status='fulfilling' OR status='completed' THEN total_cents ELSE 0 END),0) paid_cents, COALESCE(SUM(CASE WHEN status='pending_payment' THEN total_cents ELSE 0 END),0) pending_cents, COALESCE(SUM(CASE WHEN status='refunded' THEN total_cents ELSE 0 END),0) refunded_cents FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ?`).bind(from, to).first();
        const ordersByStatus = await env.DB.prepare(`SELECT status, COUNT(*) orders, COALESCE(SUM(total_cents),0) revenue_cents FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ? GROUP BY status ORDER BY revenue_cents DESC`).bind(from, to).all();
        const ordersByCategory = await env.DB.prepare(`SELECT category, COUNT(*) orders, COALESCE(SUM(quantity),0) leads_ordered, COALESCE(SUM(total_cents),0) revenue_cents FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ? GROUP BY category ORDER BY revenue_cents DESC`).bind(from, to).all();
        const orders = await env.DB.prepare(`SELECT id, business_name, name, email, phone, category, quantity, unit_price_cents, total_cents, status, fulfilled_leads, submitted_at, paid_at FROM lead_orders WHERE submitted_at >= ? AND submitted_at <= ? ORDER BY submitted_at DESC LIMIT 1000`).bind(from, to).all();
        const leadTotals = await env.DB.prepare(`SELECT COUNT(*) total_leads FROM leads WHERE submitted_at >= ? AND submitted_at <= ?`).bind(from, to).first();
        const leadsByCategory = await env.DB.prepare(`SELECT category, COUNT(*) leads FROM leads WHERE submitted_at >= ? AND submitted_at <= ? GROUP BY category ORDER BY leads DESC`).bind(from, to).all();
        const leadsByStatus = await env.DB.prepare(`SELECT status, COUNT(*) leads FROM leads WHERE submitted_at >= ? AND submitted_at <= ? GROUP BY status ORDER BY leads DESC`).bind(from, to).all();
        const assignments = await env.DB.prepare(`SELECT COUNT(*) delivered FROM lead_assignments WHERE assigned_at >= ? AND assigned_at <= ?`).bind(from, to).first();
        const newBusinesses = await env.DB.prepare(`SELECT id, email, name, company_name, phone, preferred_category, status, created_at FROM businesses WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC LIMIT 500`).bind(from, to).all();
        const businessStatuses = await env.DB.prepare(`SELECT status, COUNT(*) businesses FROM businesses GROUP BY status ORDER BY businesses DESC`).all();
        const pages = await env.DB.prepare(`SELECT page_path, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) views, COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) unique_visitors FROM site_events WHERE occurred_at >= ? AND occurred_at <= ? AND page_path IS NOT NULL AND page_path <> '' GROUP BY page_path ORDER BY views DESC LIMIT 100`).bind(from, to).all();
        const referrers = await env.DB.prepare(`SELECT COALESCE(NULLIF(referrer,''),'Direct / none') referrer, COUNT(*) hits FROM site_events WHERE occurred_at >= ? AND occurred_at <= ? AND event_name='page_view' GROUP BY referrer ORDER BY hits DESC LIMIT 50`).bind(from, to).all();
        const daily = await env.DB.prepare(`SELECT substr(occurred_at,1,10) day, SUM(CASE WHEN event_name='page_view' THEN 1 ELSE 0 END) views, COUNT(DISTINCT CASE WHEN event_name='page_view' THEN session_id END) unique_visitors, SUM(CASE WHEN event_name='order_submitted' THEN 1 ELSE 0 END) orders, SUM(CASE WHEN event_name='lead_delivered' THEN 1 ELSE 0 END) leads_delivered FROM site_events WHERE occurred_at >= ? AND occurred_at <= ? GROUP BY day ORDER BY day DESC LIMIT 400`).bind(from, to).all();

        return json({
          range: { from, to },
          generated_at: new Date().toISOString(),
          traffic: traffic || {},
          order_totals: orderTotals || {},
          orders_by_status: ordersByStatus.results || [],
          orders_by_category: ordersByCategory.results || [],
          orders: orders.results || [],
          lead_totals: { ...(leadTotals || {}), delivered: assignments?.delivered || 0 },
          leads_by_category: leadsByCategory.results || [],
          leads_by_status: leadsByStatus.results || [],
          new_businesses: newBusinesses.results || [],
          business_statuses: businessStatuses.results || [],
          pages: pages.results || [],
          referrers: referrers.results || [],
          daily: daily.results || []
        });
      }
      /* Stripe reports: full gross-to-net report is owner-only; the sign-up list is shared with BAM. */
      if (request.method === "GET" && (url.pathname === "/api/admin/stripe-report" || url.pathname === "/api/admin/stripe-signups")) {
        if (url.pathname === "/api/admin/stripe-report" && session.role !== "admin") return json({ error: "Your account does not have permission for this action." }, 403);
        if (!env.STRIPE_SECRET_KEY) return json({ error: "Stripe is not configured. Add STRIPE_SECRET_KEY to the shedlr-api Worker." }, 503);
        const range = parseReportRange(url);
        if (range.error) return json({ error: range.error }, 400);
        try {
          if (url.pathname === "/api/admin/stripe-report") return json(await buildStripeReport(env, range));
          const matchBusiness = await loadBusinessMatcher(env);
          const { signups, truncated } = await fetchStripeSignups(env, range.fromSec, range.toSec, matchBusiness);
          return json({ range: { from: range.fromDate.toISOString(), to: range.toDate.toISOString() }, generated_at: new Date().toISOString(), truncated, totals: { signups: signups.length, signup_gross_cents: sumBy(signups, (s) => s.amount_cents), without_account: signups.filter((s) => !s.business).length, not_activated: signups.filter((s) => s.business && !s.business.portal_activated).length }, signups });
        } catch (error) { return json({ error: `Stripe error: ${error.message}` }, 502); }
      }
      /* Owner-only: the email the client used in Stripe, when it differs from their portal login.
         Used only to match Stripe payments and nightly check-in emails; never changes the login. */
      const stripeEmailMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)\/stripe-email$/);
      if (request.method === "POST" && stripeEmailMatch) {
        if (session.role !== "admin") return json({ error: "Only the owner admin can set the Stripe billing email." }, 403);
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const id = Number(stripeEmailMatch[1]); const business = await findBusinessById(env, id);
        if (!business) return json({ error: "Business not found." }, 404);
        if (!Object.prototype.hasOwnProperty.call(business, "stripe_email")) return json({ error: "Run worker/migration_stripe_email.sql on the shedlr-leads database first." }, 500);
        const stripeEmail = data.stripe_email ? normEmail(data.stripe_email) : null;
        if (stripeEmail && !validEmail(stripeEmail)) return json({ error: "Please enter a valid email address." }, 400);
        if (stripeEmail && stripeEmail === normEmail(business.email)) return json({ error: "That is already this account's portal email, so it matches Stripe without this field." }, 400);
        if (stripeEmail) {
          const clash = await env.DB.prepare("SELECT id, company_name, name FROM businesses WHERE id<>? AND (lower(trim(email))=? OR lower(trim(stripe_email))=?) LIMIT 1").bind(id, stripeEmail, stripeEmail).first();
          if (clash) return json({ error: `${stripeEmail} is already used by another account (ID ${clash.id}${clash.company_name ? `, ${clash.company_name}` : ""}).`, duplicate_business_id: clash.id }, 409);
        }
        await env.DB.prepare("UPDATE businesses SET stripe_email=?, updated_at=? WHERE id=?").bind(stripeEmail, new Date().toISOString(), id).run();
        return json({ success: true, business: safeBusiness(await findBusinessById(env, id)) });
      }
      /* ── Salesmen + commission credit (owner admin only) ── */
      const salespersonMatch = url.pathname.match(/^\/api\/admin\/salespeople\/(\d+)$/);
      const salespersonAssignMatch = url.pathname.match(/^\/api\/admin\/salespeople\/(\d+)\/assign-emails$/);
      const businessSalespersonMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)\/salesperson$/);
      if (url.pathname === "/api/admin/salespeople" || salespersonMatch || salespersonAssignMatch || businessSalespersonMatch) {
        if (session.role !== "admin") return json({ error: "Only the owner admin can manage salesmen." }, 403);
        const salespeople = await loadSalespeople(env);
        if (!salespeople) return json({ error: SALES_MIGRATION_MESSAGE }, 500);
        const now = new Date().toISOString();
        const withCounts = async () => {
          const counts = (await env.DB.prepare("SELECT salesperson_id, COUNT(*) n FROM businesses WHERE salesperson_id IS NOT NULL GROUP BY salesperson_id").all()).results || [];
          const byId = new Map(counts.map((c) => [Number(c.salesperson_id), Number(c.n)]));
          return (await loadSalespeople(env)).map((sp) => ({ ...sp, businesses_assigned: byId.get(Number(sp.id)) || 0 }));
        };
        const nameTaken = (name, exceptId) => salespeople.some((sp) => sp.name.trim().toLowerCase() === name.toLowerCase() && Number(sp.id) !== Number(exceptId || 0));

        if (request.method === "GET" && url.pathname === "/api/admin/salespeople") return json({ salespeople: await withCounts() });

        if (request.method === "POST" && url.pathname === "/api/admin/salespeople") {
          let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
          const name = clean(data.name, 120);
          if (!name) return json({ error: "Enter the salesman's name." }, 400);
          if (nameTaken(name)) return json({ error: `A salesman named ${name} already exists.` }, 409);
          const email = data.email ? normEmail(data.email) : null;
          if (email && !validEmail(email)) return json({ error: "That salesman email is not valid." }, 400);
          const phone = clean(data.phone, 40) || null;
          await env.DB.prepare("INSERT INTO salespeople (name, email, phone, active, created_at, updated_at) VALUES (?,?,?,1,?,?)").bind(name, email, phone, now, now).run();
          return json({ success: true, salespeople: await withCounts() }, 201);
        }

        if (salespersonMatch && (request.method === "PATCH" || request.method === "DELETE")) {
          const id = Number(salespersonMatch[1]);
          const sp = salespeople.find((x) => Number(x.id) === id);
          if (!sp) return json({ error: "Salesman not found." }, 404);
          if (request.method === "PATCH") {
            let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
            const name = data.name !== undefined ? clean(data.name, 120) : sp.name;
            if (!name) return json({ error: "The salesman needs a name." }, 400);
            if (nameTaken(name, id)) return json({ error: `A salesman named ${name} already exists.` }, 409);
            const email = data.email !== undefined ? (data.email ? normEmail(data.email) : null) : sp.email;
            if (email && !validEmail(email)) return json({ error: "That salesman email is not valid." }, 400);
            const phone = data.phone !== undefined ? (clean(data.phone, 40) || null) : sp.phone;
            const active = data.active !== undefined ? (data.active ? 1 : 0) : (sp.active ? 1 : 0);
            await env.DB.prepare("UPDATE salespeople SET name=?, email=?, phone=?, active=?, updated_at=? WHERE id=?").bind(name, email, phone, active, now, id).run();
            return json({ success: true, salespeople: await withCounts() });
          }
          /* Delete: their businesses become unassigned (logged), then the salesman is removed. */
          const credited = (await env.DB.prepare("SELECT id FROM businesses WHERE salesperson_id=?").bind(id).all()).results || [];
          await env.DB.batch([
            env.DB.prepare("UPDATE businesses SET salesperson_id=NULL, salesperson_assigned_at=NULL, updated_at=? WHERE salesperson_id=?").bind(now, id),
            env.DB.prepare("DELETE FROM salespeople WHERE id=?").bind(id)
          ]);
          await logSalesAssignments(env, credited.map((b) => ({ business_id: b.id, salesperson_id: null, previous_salesperson_id: id, source: "salesman_deleted" })));
          return json({ success: true, unassigned_businesses: credited.length, salespeople: await withCounts() });
        }

        /* Credit one business to a salesman (or clear it with salesperson_id: null). */
        if (request.method === "POST" && businessSalespersonMatch) {
          let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
          const id = Number(businessSalespersonMatch[1]); const business = await findBusinessById(env, id);
          if (!business) return json({ error: "Business not found." }, 404);
          const nextId = data.salesperson_id === null || data.salesperson_id === "" || data.salesperson_id === undefined ? null : Number(data.salesperson_id);
          if (nextId !== null && !salespeople.some((sp) => Number(sp.id) === nextId)) return json({ error: "Salesman not found." }, 404);
          const prevId = business.salesperson_id ? Number(business.salesperson_id) : null;
          if (prevId !== nextId) {
            await env.DB.prepare("UPDATE businesses SET salesperson_id=?, salesperson_assigned_at=?, updated_at=? WHERE id=?").bind(nextId, nextId ? now : null, now, id).run();
            await logSalesAssignments(env, [{ business_id: id, salesperson_id: nextId, previous_salesperson_id: prevId, source: "manual" }]);
          }
          return json({ success: true, business: safeBusiness(await findBusinessById(env, id)) });
        }

        /* Nightly BAM check-in: paste the emails a salesman signed up and credit them all at once.
           Businesses already credited to a different salesman are left alone unless reassign=true. */
        if (request.method === "POST" && salespersonAssignMatch) {
          let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
          const spId = Number(salespersonAssignMatch[1]);
          const sp = salespeople.find((x) => Number(x.id) === spId);
          if (!sp) return json({ error: "Salesman not found." }, 404);
          const emails = parseEmailList(data.emails);
          if (!emails.length) return json({ error: "No email addresses found. Paste one email per line (or separated by commas)." }, 400);
          if (emails.length > 500) return json({ error: "Paste 500 emails or fewer at a time." }, 400);
          const reassign = Boolean(data.reassign);
          const spName = new Map(salespeople.map((x) => [Number(x.id), x.name]));
          const result = { credited: [], already_credited: [], reassigned: [], conflicts: [], not_found: [] };
          const updates = []; const logs = [];
          for (const email of emails) {
            let b = await findBusinessByEmail(env, email); let viaStripeEmail = false;
            if (!b) {
              try { b = await env.DB.prepare("SELECT * FROM businesses WHERE lower(trim(stripe_email))=? ORDER BY id ASC LIMIT 1").bind(email).first(); } catch { b = null; }
              viaStripeEmail = Boolean(b);
            }
            if (!b) { result.not_found.push({ email }); continue; }
            const row = { email, business_id: b.id, company_name: b.company_name || b.name || null, matched_by: viaStripeEmail ? "stripe_email" : "portal_email" };
            const prevId = b.salesperson_id ? Number(b.salesperson_id) : null;
            if (prevId === spId) { result.already_credited.push(row); continue; }
            if (prevId && !reassign) { result.conflicts.push({ ...row, current_salesperson: spName.get(prevId) || `ID ${prevId}` }); continue; }
            updates.push(env.DB.prepare("UPDATE businesses SET salesperson_id=?, salesperson_assigned_at=?, updated_at=? WHERE id=?").bind(spId, now, now, b.id));
            logs.push({ business_id: b.id, salesperson_id: spId, previous_salesperson_id: prevId, source: "email_list" });
            if (prevId) result.reassigned.push({ ...row, previous_salesperson: spName.get(prevId) || `ID ${prevId}` }); else result.credited.push(row);
          }
          if (updates.length) await env.DB.batch(updates);
          await logSalesAssignments(env, logs);
          return json({ success: true, salesperson: { id: sp.id, name: sp.name }, emails_checked: emails.length, ...result, salespeople: await withCounts() });
        }
        return json({ error: "Not found." }, 404);
      }
      if (request.method === "GET" && url.pathname === "/api/admin/businesses") {
        /* SELECT b.* keeps this working before and after the killswitch migration; secrets are stripped by safeBusiness. */
        const businesses = await env.DB.prepare(`SELECT b.*, (SELECT COUNT(*) FROM lead_assignments la WHERE la.business_id = b.id) total_leads FROM businesses b ORDER BY b.created_at DESC LIMIT 1000`).all();
        const rows = (businesses.results || []).map(safeBusiness);
        if (session.role === "staff") return json({ businesses: rows.filter(b => !isCanceledBusiness(b)).map(b => ({ id: b.id, name: b.name || b.company_name, company_name: b.company_name, preferred_category: b.preferred_category, address: b.address })) });
        return json({ businesses: rows });
      }
      /* Create a business account. Never creates a duplicate: if the email already exists (any
         case/spacing), the existing account gets a fresh activation / password-reset link instead. */
      if (request.method === "POST" && url.pathname === "/api/admin/businesses") {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const email = normEmail(data.email);
        if (!validEmail(email)) return json({ error: "A valid email is required." }, 400);
        const name = clean(data.name, 120) || null; const phone = clean(data.phone, 40) || null; const companyName = clean(data.company_name, 200) || null; const address = clean(data.address, 300) || null;
        const preferredCategory = data.preferred_category && CATEGORIES.includes(clean(data.preferred_category, 60)) ? clean(data.preferred_category, 60) : null;
        const now = new Date().toISOString();
        const existing = await findBusinessByEmail(env, email);
        if (existing) {
          /* Only fill blanks — never overwrite what is already on the account. */
          await env.DB.prepare("UPDATE businesses SET name=COALESCE(NULLIF(name,''),?), phone=COALESCE(NULLIF(phone,''),?), company_name=COALESCE(NULLIF(company_name,''),?), address=COALESCE(NULLIF(address,''),?), preferred_category=COALESCE(NULLIF(preferred_category,''),?), updated_at=? WHERE id=?").bind(name, phone, companyName, address, preferredCategory, now, existing.id).run();
          const token = await issueActivationToken(env, existing.id);
          const mode = existing.password_hash ? "reset" : "activate";
          return json({ success: true, existing: true, link_mode: mode, business: safeBusiness(await findBusinessById(env, existing.id)), activation_url: activationUrl(token), message: `An account with ${email} already exists (ID ${existing.id}), so no duplicate was created. Here is a fresh ${mode === "reset" ? "password-reset" : "activation"} link for that account.` });
        }
        let result;
        try {
          result = await env.DB.prepare(`INSERT INTO businesses (email, name, phone, company_name, address, preferred_category, status, created_at, updated_at) VALUES (?,?,?,?,?,?,'active',?,?)`).bind(email, name, phone, companyName, address, preferredCategory, now, now).run();
        } catch (error) {
          /* Race with the Stripe webhook creating the same email: fall back to the existing row. */
          const raced = await findBusinessByEmail(env, email);
          if (!raced) throw error;
          const token = await issueActivationToken(env, raced.id);
          return json({ success: true, existing: true, link_mode: raced.password_hash ? "reset" : "activate", business: safeBusiness(raced), activation_url: activationUrl(token), message: `An account with ${email} already exists (ID ${raced.id}), so no duplicate was created.` });
        }
        const businessId = result.meta?.last_row_id;
        if (!businessId) return json({ error: "Failed to create business." }, 500);
        const token = await issueActivationToken(env, businessId);
        return json({ success: true, existing: false, link_mode: "activate", business: safeBusiness(await findBusinessById(env, businessId)), activation_url: activationUrl(token) }, 201);
      }
      const businessDetailMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)$/);
      if (request.method === "GET" && businessDetailMatch) { const id = Number(businessDetailMatch[1]); const business = await findBusinessById(env, id); if (!business) return json({ error: "Business not found." }, 404); const assignments = await env.DB.prepare(`SELECT la.id, la.lead_id, la.status AS assignment_status, la.assigned_at, l.name, l.email, l.phone, l.category, l.message, l.source, l.city, l.state, l.status AS lead_status FROM lead_assignments la JOIN leads l ON l.id = la.lead_id WHERE la.business_id=? ORDER BY la.assigned_at DESC LIMIT 200`).bind(id).all(); if (session.role === "bam") { const bamOrders = await env.DB.prepare("SELECT id, category, quantity, unit_price_cents, total_cents, status, paid_at, created_at, fulfilled_leads FROM lead_orders WHERE lower(email)=? ORDER BY created_at DESC LIMIT 200").bind(normEmail(business.email)).all(); return json({ business: safeBusiness(business), orders: bamOrders.results || [], assignments: [] }); } if (session.role === "staff") { if (isCanceledBusiness(business)) return json({ error: "Business not found." }, 404); return json({ business: { id: business.id, name: business.name, company_name: business.company_name, preferred_category: business.preferred_category, address: business.address }, orders: [], assignments: assignments.results || [] }); } const orders = await env.DB.prepare("SELECT id, category, quantity, unit_price_cents, total_cents, status, paid_at, created_at, fulfilled_leads FROM lead_orders WHERE email=? ORDER BY created_at DESC LIMIT 200").bind(business.email).all(); return json({ business: safeBusiness(business), orders: orders.results || [], assignments: assignments.results || [] }); }
      if (request.method === "PATCH" && businessDetailMatch) {
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const id = Number(businessDetailMatch[1]); const business = await findBusinessById(env, id); if (!business) return json({ error: "Business not found." }, 404);
        const allowedStatuses = ["active", "past_due", "canceled", "suspended"];
        /* Only the owner can change status (e.g. cancel an account). BAM edits details only. */
        const status = session.role === "admin" && allowedStatuses.includes(clean(data.status, 30)) ? clean(data.status, 30) : business.status;
        const name = data.name !== undefined ? clean(data.name, 120) : business.name; const phone = data.phone !== undefined ? clean(data.phone, 40) : business.phone; const companyName = data.company_name !== undefined ? clean(data.company_name, 200) : business.company_name; const address = data.address !== undefined ? clean(data.address, 300) : business.address;
        const preferredCategory = data.preferred_category !== undefined && CATEGORIES.includes(clean(data.preferred_category, 60)) ? clean(data.preferred_category, 60) : business.preferred_category;
        const oldEmail = normEmail(business.email);
        let email = business.email;
        if (data.email !== undefined) {
          const nextEmail = normEmail(data.email);
          if (!validEmail(nextEmail)) return json({ error: "Please enter a valid email address." }, 400);
          if (nextEmail !== oldEmail) {
            const clash = await env.DB.prepare("SELECT id, company_name, name FROM businesses WHERE lower(trim(email))=? AND id<>? LIMIT 1").bind(nextEmail, id).first();
            if (clash) return json({ error: `Another account already uses ${nextEmail} (ID ${clash.id}${clash.company_name ? `, ${clash.company_name}` : ""}). Open that account instead of creating a duplicate.`, duplicate_business_id: clash.id }, 409);
          }
          email = nextEmail;
        }
        const now = new Date().toISOString();
        await env.DB.prepare("UPDATE businesses SET status=?, email=?, name=?, phone=?, company_name=?, address=?, preferred_category=?, updated_at=? WHERE id=?").bind(status, email, name, phone, companyName, address, preferredCategory, now, id).run();
        /* Orders are keyed by email, so carry them over when an email typo is fixed. */
        if (normEmail(email) !== oldEmail) await env.DB.prepare("UPDATE lead_orders SET email=?, updated_at=? WHERE lower(email)=?").bind(normEmail(email), now, oldEmail).run();
        return json({ success: true, business: safeBusiness(await findBusinessById(env, id)) });
      }
      /* Owner-only: permanently delete a business account (for duplicates created by sales).
         Its delivered leads go back to the unassigned pool; orders stay in the order history. */
      if (request.method === "DELETE" && businessDetailMatch) {
        if (session.role !== "admin") return json({ error: "Only the owner admin can delete business accounts." }, 403);
        const id = Number(businessDetailMatch[1]); const business = await findBusinessById(env, id); if (!business) return json({ error: "Business not found." }, 404);
        const assignments = (await env.DB.prepare("SELECT lead_id, order_id FROM lead_assignments WHERE business_id=?").bind(id).all()).results || [];
        const now = new Date().toISOString();
        const statements = [];
        for (const a of assignments) if (a.order_id) statements.push(env.DB.prepare("UPDATE lead_orders SET fulfilled_leads = MAX(fulfilled_leads - 1, 0) WHERE id=?").bind(a.order_id));
        statements.push(env.DB.prepare("DELETE FROM lead_notes WHERE business_id=?").bind(id));
        statements.push(env.DB.prepare("DELETE FROM lead_assignments WHERE business_id=?").bind(id));
        statements.push(env.DB.prepare("DELETE FROM business_notes WHERE business_id=?").bind(id));
        statements.push(env.DB.prepare("UPDATE leads SET status='new', assigned_to='unassigned', updated_at=? WHERE assigned_to=? AND NOT EXISTS (SELECT 1 FROM lead_assignments la WHERE la.lead_id = leads.id)").bind(now, String(id)));
        statements.push(env.DB.prepare("DELETE FROM businesses WHERE id=?").bind(id));
        await env.DB.batch(statements);
        return json({ success: true, deleted: { id, email: business.email, company_name: business.company_name }, leads_released: assignments.length });
      }
      /* Owner-only killswitch: blocks the client portal from its leads without hiding the account. */
      const killswitchMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)\/killswitch$/);
      if (request.method === "POST" && killswitchMatch) {
        if (session.role !== "admin") return json({ error: "Only the owner admin can use the killswitch." }, 403);
        let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const id = Number(killswitchMatch[1]); const business = await findBusinessById(env, id); if (!business) return json({ error: "Business not found." }, 404);
        if (!Object.prototype.hasOwnProperty.call(business, "leads_locked")) return json({ error: "Run worker/migration_killswitch.sql on the shedlr-leads database first." }, 500);
        const enabled = Boolean(data.enabled); const now = new Date().toISOString();
        await env.DB.prepare("UPDATE businesses SET leads_locked=?, leads_locked_at=?, updated_at=? WHERE id=?").bind(enabled ? 1 : 0, enabled ? now : null, now, id).run();
        return json({ success: true, business: safeBusiness(await findBusinessById(env, id)) });
      }
      const resetPasswordMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)\/reset-password$/);
      if (request.method === "POST" && resetPasswordMatch) { const id = Number(resetPasswordMatch[1]); const business = await findBusinessById(env, id); if (!business) return json({ error: "Business not found." }, 404); const token = await issueActivationToken(env, id); return json({ success: true, link_mode: business.password_hash ? "reset" : "activate", activation_url: activationUrl(token) }); }
      const businessNotesAdminMatch = url.pathname.match(/^\/api\/admin\/businesses\/(\d+)\/notes$/);
      if (businessNotesAdminMatch) { const bizId = Number(businessNotesAdminMatch[1]); const business = await findBusinessById(env, bizId); if (!business) return json({ error: "Business not found." }, 404); if (request.method === "GET") { const note = await env.DB.prepare("SELECT id, content, updated_by, created_at, updated_at FROM business_notes WHERE business_id=?").bind(bizId).first(); return json({ note: note || { content: "", updated_by: null, created_at: null, updated_at: null } }); } if (request.method === "PUT") { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const content = clean(data.content, 10000); const now = new Date().toISOString(); await env.DB.prepare(`INSERT INTO business_notes (business_id, content, updated_by, created_at, updated_at) VALUES (?,?, 'admin', ?, ?) ON CONFLICT(business_id) DO UPDATE SET content=excluded.content, updated_by='admin', updated_at=excluded.updated_at`).bind(bizId, content, now, now).run(); return json({ success: true, note: { content, updated_by: "admin", updated_at: now } }); } }
      if (request.method === "GET" && url.pathname === "/api/admin/leads") { const category = clean(url.searchParams.get("category"), 60); const clause = category ? " WHERE category = ?" : ""; const bindings = category ? [category] : []; const leads = await env.DB.prepare(`SELECT id, name, email, phone, category, message, source, city, state, status, submitted_at, assigned_to FROM leads${clause} ORDER BY submitted_at DESC LIMIT 500`).bind(...bindings).all(); return json({ leads: leads.results || [] }); }
      if (request.method === "POST" && url.pathname === "/api/admin/leads") { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const name = clean(data.name, 120); const email = clean(data.email, 254).toLowerCase(); const phone = clean(data.phone, 40); const category = clean(data.category, 60); if (!name) return json({ error: "Lead name is required." }, 400); if (!CATEGORIES.includes(category)) return json({ error: "Valid category is required." }, 400); const businessId = data.business_id ? Number(data.business_id) : null; let business = null; if (businessId) { business = await findBusinessById(env, businessId); if (!business) return json({ error: "Business not found." }, 404); } const now = new Date().toISOString(); const result = await env.DB.prepare(`INSERT INTO leads (name, email, phone, category, message, source, city, state, status, submitted_at, assigned_to) VALUES (?,?,?,?,?,'manual',?,?,?,?,?)`).bind(name, email, phone, category, clean(data.message, 4000), clean(data.city, 120), clean(data.state, 60), business ? "assigned" : "new", now, business ? String(businessId) : "unassigned").run(); const leadId = result.meta?.last_row_id; if (business) await env.DB.prepare("INSERT INTO lead_assignments (lead_id, business_id, order_id, status, assigned_at) VALUES (?,?,?,'delivered',?)").bind(leadId, businessId, null, now).run(); return json({ success: true, lead_id: leadId }, 201); }
      if (request.method === "POST" && url.pathname === "/api/admin/leads/bulk") { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const rawLeads = Array.isArray(data.leads) ? data.leads : []; if (!rawLeads.length) return json({ error: "No leads provided. Paste or upload CSV data first." }, 400); const defaultCategory = clean(data.default_category, 60); if (!CATEGORIES.includes(defaultCategory)) return json({ error: "A valid default category is required." }, 400); const businessId = data.business_id ? Number(data.business_id) : null; const orderId = data.order_id ? Number(data.order_id) : null; if (businessId) { const biz = await findBusinessById(env, businessId); if (!biz) return json({ error: "Business not found." }, 404); } if (orderId && businessId) { const order = await env.DB.prepare("SELECT * FROM lead_orders WHERE id=? AND email=(SELECT email FROM businesses WHERE id=?)").bind(orderId, businessId).first(); if (!order) return json({ error: "Order not found for this business." }, 404); } const now = new Date().toISOString(); const results = []; let assignedCount = 0; for (let i = 0; i < rawLeads.length; i++) { const row = rawLeads[i]; const name = clean(row.name, 120); const category = clean(row.category, 60) || defaultCategory; if (!name) { results.push({ row: i + 1, success: false, error: "Name is required." }); continue; } if (!CATEGORIES.includes(category)) { results.push({ row: i + 1, success: false, error: `Invalid category: ${category}` }); continue; } const email = clean(row.email, 254).toLowerCase(); const phone = clean(row.phone, 40); const city = clean(row.city, 120); const state = clean(row.state, 60); const message = clean(row.message, 4000); try { const insertResult = await env.DB.prepare(`INSERT INTO leads (name, email, phone, category, message, source, city, state, status, submitted_at, assigned_to) VALUES (?,?,?,?,?,'manual',?,?,?,?,'unassigned')`).bind(name, email, phone, category, message, city, state, "new", now).run(); const leadId = insertResult.meta?.last_row_id; if (businessId) { const existingAsg = await env.DB.prepare("SELECT id FROM lead_assignments WHERE lead_id=? AND business_id=?").bind(leadId, businessId).first(); if (!existingAsg) { const asgResult = await env.DB.prepare("INSERT INTO lead_assignments (lead_id, business_id, order_id, status, assigned_at) VALUES (?,?,?,'delivered',?)").bind(leadId, businessId, orderId, now).run(); await env.DB.prepare("UPDATE leads SET status='assigned', assigned_to=?, updated_at=? WHERE id=?").bind(String(businessId), now, leadId).run(); if (orderId) assignedCount++; results.push({ row: i + 1, success: true, lead_id: leadId, assignment_id: asgResult.meta?.last_row_id }); } else results.push({ row: i + 1, success: true, lead_id: leadId, error: "Already assigned to this business." }); } else results.push({ row: i + 1, success: true, lead_id: leadId }); } catch (err) { results.push({ row: i + 1, success: false, error: err.message || "Database error." }); } } if (orderId && assignedCount > 0) await env.DB.prepare("UPDATE lead_orders SET fulfilled_leads = fulfilled_leads + ? WHERE id=?").bind(assignedCount, orderId).run(); const succeeded = results.filter(r => r.success).length; const failed = results.length - succeeded; return json({ success: true, total: rawLeads.length, succeeded, failed, assigned: assignedCount, results }, 201); }
      const leadMatch = url.pathname.match(/^\/api\/admin\/leads\/(\d+)$/);
      if (request.method === "PATCH" && leadMatch) { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const id = Number(leadMatch[1]); const existing = await env.DB.prepare("SELECT * FROM leads WHERE id=?").bind(id).first(); if (!existing) return json({ error: "Lead not found." }, 404); const allowedStatuses = ["new", "verified", "assigned", "delivered", "archived"]; const status = data.status !== undefined ? (allowedStatuses.includes(clean(data.status, 30)) ? clean(data.status, 30) : existing.status) : existing.status; const assignedTo = data.assigned_to !== undefined ? clean(data.assigned_to, 120) : existing.assigned_to; const name = data.name !== undefined ? clean(data.name, 120) : existing.name; if (!name) return json({ error: "Lead name is required." }, 400); const email = data.email !== undefined ? clean(data.email, 254).toLowerCase() : existing.email; const phone = data.phone !== undefined ? clean(data.phone, 40) : existing.phone; const category = data.category !== undefined ? clean(data.category, 60) : existing.category; if (data.category !== undefined && !CATEGORIES.includes(category)) return json({ error: "Please select a valid lead type." }, 400); const city = data.city !== undefined ? clean(data.city, 120) : existing.city; const state = data.state !== undefined ? clean(data.state, 60) : existing.state; const message = data.message !== undefined ? clean(data.message, 4000) : existing.message; await env.DB.prepare("UPDATE leads SET name=?, email=?, phone=?, category=?, city=?, state=?, message=?, status=?, assigned_to=?, updated_at=? WHERE id=?").bind(name, email, phone, category, city, state, message, status, assignedTo, new Date().toISOString(), id).run(); const lead = await env.DB.prepare("SELECT * FROM leads WHERE id=?").bind(id).first(); return json({ success: true, lead }); }
      if (request.method === "DELETE" && leadMatch) { const id = Number(leadMatch[1]); const existing = await env.DB.prepare("SELECT * FROM leads WHERE id=?").bind(id).first(); if (!existing) return json({ error: "Lead not found." }, 404); const linkedOrders = await env.DB.prepare("SELECT order_id FROM lead_assignments WHERE lead_id=? AND order_id IS NOT NULL").bind(id).all(); for (const row of linkedOrders.results || []) await env.DB.prepare("UPDATE lead_orders SET fulfilled_leads = MAX(fulfilled_leads - 1, 0) WHERE id=?").bind(row.order_id).run(); await env.DB.prepare("DELETE FROM lead_notes WHERE lead_id=?").bind(id).run(); await env.DB.prepare("DELETE FROM lead_assignments WHERE lead_id=?").bind(id).run(); await env.DB.prepare("DELETE FROM leads WHERE id=?").bind(id).run(); return json({ success: true }); }
      const assignMatch = url.pathname.match(/^\/api\/admin\/leads\/(\d+)\/assign$/);
      if (request.method === "POST" && assignMatch) { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const leadId = Number(assignMatch[1]); const businessId = Number(data.business_id); const orderId = data.order_id ? Number(data.order_id) : null; if (!businessId) return json({ error: "Business ID is required." }, 400); const lead = await env.DB.prepare("SELECT * FROM leads WHERE id=?").bind(leadId).first(); if (!lead) return json({ error: "Lead not found." }, 404); const business = await findBusinessById(env, businessId); if (!business) return json({ error: "Business not found." }, 404); const existing = await env.DB.prepare("SELECT id FROM lead_assignments WHERE lead_id=? AND business_id=?").bind(leadId, businessId).first(); if (existing) return json({ error: "This lead is already assigned to this business." }, 409); const now = new Date().toISOString(); const result = await env.DB.prepare("INSERT INTO lead_assignments (lead_id, business_id, order_id, status, assigned_at) VALUES (?,?,?,'delivered',?)").bind(leadId, businessId, orderId, now).run(); await env.DB.prepare("UPDATE leads SET status='assigned', assigned_to=?, updated_at=? WHERE id=?").bind(String(businessId), now, leadId).run(); if (orderId) await env.DB.prepare("UPDATE lead_orders SET fulfilled_leads = fulfilled_leads + 1 WHERE id=?").bind(orderId).run(); ctx.waitUntil(saveEvent(env, request, { event_name: "lead_delivered", session_id: "", business_id: businessId, order_id: orderId, metadata: { lead_id: leadId, category: lead.category } })); return json({ success: true, assignment_id: result.meta?.last_row_id }, 201); }
      if (request.method === "GET" && url.pathname === "/api/admin/orders") { const status = clean(url.searchParams.get("status"), 30); const clause = status ? " WHERE status = ?" : ""; const bindings = status ? [status] : []; const orders = await env.DB.prepare(`SELECT * FROM lead_orders${clause} ORDER BY submitted_at DESC LIMIT 500`).bind(...bindings).all(); return json({ orders: orders.results || [] }); }
      const orderMatch = url.pathname.match(/^\/api\/admin\/orders\/(\d+)$/);
      if (request.method === "PATCH" && orderMatch) { let data; try { data = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); } const id = Number(orderMatch[1]); const allowedStatuses = ["pending_payment", "paid", "fulfilling", "completed", "canceled", "refunded"]; const status = allowedStatuses.includes(clean(data.status,30)) ? clean(data.status,30) : "pending_payment"; await env.DB.prepare("UPDATE lead_orders SET status=?, updated_at=? WHERE id=?").bind(status, new Date().toISOString(), id).run(); return json({ success: true }); }
      const leadNotesAdminMatch = url.pathname.match(/^\/api\/admin\/leads\/(\d+)\/notes$/);
      if (request.method === "GET" && leadNotesAdminMatch) { const leadId = Number(leadNotesAdminMatch[1]); const notes = await env.DB.prepare(`SELECT ln.id, ln.author, ln.content, ln.created_at, ln.updated_at, b.company_name, b.name AS business_name FROM lead_notes ln LEFT JOIN businesses b ON b.id = ln.business_id WHERE ln.lead_id=? ORDER BY ln.created_at DESC LIMIT 200`).bind(leadId).all(); return json({ notes: notes.results || [] }); }
      return json({ error: "Not found" }, 404);
    }

    return json({ error: "Not found" }, 404);
  }
};