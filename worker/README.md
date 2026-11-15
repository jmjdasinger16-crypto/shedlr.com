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
   - `BAM_PASSWORD` — optional business account manager (sales) password: sees only the current day's sign-ups (business accounts created today and Stripe checkouts from today, window rolls forward automatically at midnight America/Chicago), today's website visits, and can edit today's sign-ups; cannot create accounts, generate activation / password-reset links, change status, or see leads/reports
   - `STRIPE_REPORT_PAYMENT_LINKS` — optional comma-separated `plink_...` ids; limits the sign-up lists to Shedlr's payment links if the Stripe account is shared
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
- `GET  /api/admin/stripe-report?from=&to=` — live Stripe report (admin only): completed sign-ups, gross from sign-ups, payments numbered 1st/2nd/3rd/4th+ per customer, failed payments, refunds, disputes, Stripe fees, gross to net, plus attrition totals — new sign-up EFT (subscriptions created in range, at their actual first billed amount) + scheduled billing EFT (renewal payments collected in range) = period projection, cancelled EFT (actual recurring amount of subscriptions canceled in range), and net EFT after cancellations; includes a canceled-subscriptions detail list. EFT amounts are discount-aware — actual charges first, falling back to the coupon-adjusted subscription price — so a $399 program discounted to $199 or $99 reports what really bills, and failed payments are deduplicated by invoice so Stripe retries of one payment count once toward gross billed
- `GET  /api/admin/stripe-signups?from=&to=` — completed Stripe Checkout sign-ups matched to Shedlr accounts (admin + BAM; the BAM range is always forced to the current day, any requested range is ignored)
- `GET  /api/admin/salespeople` — list salesmen with how many businesses are credited to each (admin only; needs `migration_salespeople.sql`)
- `POST /api/admin/salespeople` — `{ "name", "email"?, "phone"? }` add a salesman (admin only; names are unique, case-insensitive)
- `PATCH /api/admin/salespeople/:id` — `{ "name"?, "email"?, "phone"?, "active"? }` edit / deactivate / reactivate (admin only)
- `DELETE /api/admin/salespeople/:id` — delete a salesman; their businesses become unassigned (admin only)
- `POST /api/admin/salespeople/:id/assign-emails` — `{ "emails": "<pasted text>", "reassign": false }` nightly BAM check-in: credits every business whose email appears in the text; returns credited / already credited / conflicts (credited to someone else) / not found (admin only)
- `POST /api/admin/businesses/:id/stripe-email` — `{ "stripe_email": "..." | null }` the email the client used in Stripe when it differs from their portal login; used for Stripe report matching and the nightly check-in, never for login (admin only; needs `migration_stripe_email.sql`)
- `POST /api/admin/businesses/:id/salesperson` — `{ "salesperson_id": 3 | null }` credit one business (admin only)
- The Stripe report response now includes `by_salesperson` (monthly/range sales totals per salesman) and each matched business carries `salesperson_name`. Every credit change is written to `salesperson_assignment_log`.
- `DELETE /api/admin/businesses/:id` — delete a business account (admin only; leads return to the unassigned pool)
- `POST /api/admin/businesses/:id/killswitch` — `{ "enabled": true|false }` block / restore client portal lead access (admin only; needs `migration_killswitch.sql`)
- `GET  /api/admin/visits` — today's website visits: page-view totals, top pages, top referrers, and the latest events with timestamps (admin + BAM; window is the current day in America/Chicago)
- `POST /api/admin/businesses` — create an account; if the email already exists (case-insensitive) no duplicate is created and a fresh link for the existing account is returned (admin only)
- `GET  /api/admin/businesses` — list businesses (BAM receives only accounts created today; no archive of active/canceled accounts)
- `GET  /api/admin/businesses/:id` — business detail with orders and assignments (BAM can only open accounts created today)
- `PATCH /api/admin/businesses/:id` — update business (BAM can only edit accounts created today; only the owner changes status)
- `POST /api/admin/businesses/:id/reset-password` — generate activation / password-reset link (owner admin + retention manager; not available to BAM)
- `GET  /api/admin/leads` — list leads (optional `?category=` filter)
- `POST /api/admin/leads` — create a lead manually
- `PATCH /api/admin/leads/:id` — update lead status
- `POST /api/admin/leads/:id/assign` — assign lead to business/order
- `GET  /api/admin/orders` — list orders (optional `?status=` filter)
- `PATCH /api/admin/orders/:id` — update order status
- `GET  /api/admin/leads/:id/notes` — view notes for a lead
- `POST /api/admin/leads/backfill-notes` — owner admin only: catch up lead note histories. For every assigned lead whose last note (or delivery date) is older than `minGapHours` (default 18), fills the gap up to now with contact-attempt notes: no-answer calls, voicemails left, and short conversations that end in a reschedule, refusal, or other non-book — each attributed to a fictitious rep. Existing notes are never modified. Optional body: `{ "maxLeads": 500, "maxNotesPerLead": 12, "minGapHours": 18, "dryRun": false }`

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
