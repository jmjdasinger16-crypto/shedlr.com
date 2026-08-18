-- ═══════════════════════════════════════════════════════════════
-- Shedlr D1 Database Schema
-- Run with: wrangler d1 execute shedlr-leads --file=worker/schema.sql
-- ═══════════════════════════════════════════════════════════════

-- Business accounts (clients who purchase leads)
CREATE TABLE IF NOT EXISTS businesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  name TEXT,
  phone TEXT,
  company_name TEXT,
  preferred_category TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  activation_nonce TEXT,
  activation_nonce_expires TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_activation ON businesses(activation_nonce);

-- Lead orders (businesses purchase lead credits)
CREATE TABLE IF NOT EXISTS lead_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL,
  lead_type TEXT,
  zip TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL DEFAULT 100,
  total_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  fulfilled_leads INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  paid_at TEXT,
  submitted_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_orders_email ON lead_orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON lead_orders(status);

-- Individual leads (manually researched and verified)
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  category TEXT NOT NULL,
  message TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  city TEXT,
  state TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to TEXT,
  submitted_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Lead assignments (connects leads to businesses/orders)
CREATE TABLE IF NOT EXISTS lead_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  business_id INTEGER NOT NULL,
  order_id INTEGER,
  status TEXT NOT NULL DEFAULT 'delivered',
  assigned_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (order_id) REFERENCES lead_orders(id)
);
CREATE INDEX IF NOT EXISTS idx_assignments_business ON lead_assignments(business_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_assignments_order ON lead_assignments(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignments_unique ON lead_assignments(lead_id, business_id);

-- Lead notes (by businesses on their assigned leads)
CREATE TABLE IF NOT EXISTS lead_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assignment_id INTEGER NOT NULL,
  business_id INTEGER NOT NULL,
  lead_id INTEGER NOT NULL,
  author TEXT NOT NULL DEFAULT 'business',
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (assignment_id) REFERENCES lead_assignments(id),
  FOREIGN KEY (business_id) REFERENCES businesses(id),
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
CREATE INDEX IF NOT EXISTS idx_notes_assignment ON lead_notes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_notes_lead ON lead_notes(lead_id);

-- Business notes (business-level details/profile notes written by the business or admin)
CREATE TABLE IF NOT EXISTS business_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  updated_by TEXT NOT NULL DEFAULT 'business',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);
CREATE INDEX IF NOT EXISTS idx_business_notes_business ON business_notes(business_id);

-- Site events (analytics)
CREATE TABLE IF NOT EXISTS site_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_name TEXT NOT NULL,
  page_path TEXT,
  session_id TEXT,
  business_id INTEGER,
  order_id INTEGER,
  metadata TEXT,
  occurred_at TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_events_occurred ON site_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_name ON site_events(event_name);
