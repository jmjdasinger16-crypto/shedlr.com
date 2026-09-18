# Shedlr Worker — Cloudflare Worker Backend

This worker powers the Shedlr API: admin authentication, business portal auth, lead management, order processing, Stripe webhooks, and analytics.

## Setup

1. **Create D1 database:**
   ```bash
   wrangler d1 create shedlr-leads
   ```
   Copy the returned database ID into `wrangler.jsonc`.

2. **Run schema:**
   ```bash
   wrangler d1 execute shedlr-leads --file=schema.sql
   ```

3. **Set environment variables** (Cloudflare dashboard → Workers → shedlr-api → Settings → Variables):
   - `ADMIN_PASSWORD` — admin dashboard password (full access)
   - `STAFF_PASSWORD` — optional VA password (view active accounts, add leads only)
   - `RETENTION_PASSWORD` — optional retention manager password (read-only view of every business account in any status, including contact info and notes)
   - `ADMIN_SESSION_SECRET` — random string for signing admin sessions
   - `BUSINESS_SESSION_SECRET` — random string for signing business sessions
   - `STRIPE_SECRET_KEY` — Stripe API key (optional, for payment processing)
   - `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret (optional)

4. **Deploy:**
   ```bash
   wrangler deploy
   ```

## API Routes

### Public
- `GET  /api/health` — health check
- `POST /api/events` — track site events
- `POST /api/orders` — submit a lead order

### Admin (requires session cookie)
- `POST /api/admin/login` — authenticate
- `POST /api/admin/logout` — sign out
- `GET  /api/admin/dashboard` — metrics, orders, events, pages
- `GET  /api/admin/report?from=&to=` — backend report for a date range (admin only; printable/CSV source for the dashboard)
- `GET  /api/admin/businesses` — list businesses
- `GET  /api/admin/businesses/:id` — business detail with orders and assignments
- `PATCH /api/admin/businesses/:id` — update business
- `POST /api/admin/businesses/:id/reset-password` — generate activation link
- `GET  /api/admin/leads` — list leads (optional `?category=` filter)
- `POST /api/admin/leads` — create a lead manually
- `PATCH /api/admin/leads/:id` — update lead status
- `POST /api/admin/leads/:id/assign` — assign lead to business/order
- `GET  /api/admin/orders` — list orders (optional `?status=` filter)
- `PATCH /api/admin/orders/:id` — update order status
- `GET  /api/admin/leads/:id/notes` — view notes for a lead

### Business Portal (public activation endpoints)
- `GET  /api/portal/checkout-activation?session_id=cs_...` — verifies a Stripe Checkout
  session against the Stripe API, provisions/updates the business, marks the matching
  order paid, and returns a fresh activation token. Backs `portal/welcome.html`, the
  post-payment redirect target, so a paying customer can always reach their portal even
  if the webhook or the activation email fails. Requires `STRIPE_SECRET_KEY`.
- `POST /api/portal/activate` — verify activation token
- `POST /api/portal/set-password` — set password after activation
- `POST /api/portal/login` — authenticate
- `POST /api/portal/logout` — sign out
- `GET  /api/portal/me` — business profile
- `GET  /api/portal/orders` — business orders
- `GET  /api/portal/leads` — assigned leads
- `GET  /api/portal/leads/:id` — lead notes
- `POST /api/portal/leads/:id/notes` — add note to lead

### Stripe Webhook
- `POST /api/stripe/webhook` — handles `checkout.session.completed`: provisions the
  business, marks the order paid (matched via `client_reference_id` = `order_<id>`,
  falling back to `metadata.order_id` then the newest order for that email), issues an
  activation token and emails the activation link.

### Activation delivery
Activation tokens live for 72 hours. Delivery order:
1. `RESEND_API_KEY` set → the activation link is emailed to the customer.
2. Otherwise → an alert with the link goes to `INTERNAL_ALERT_EMAIL` to send by hand.
3. Independently, the Stripe post-payment redirect to
   `https://shedlr.com/portal/welcome.html?session_id={CHECKOUT_SESSION_ID}` lets the
   customer activate immediately without any email.

Cloudflare's `send_email` binding cannot reach unverified addresses, so it is used only
for internal alerts — never for customer mail.
