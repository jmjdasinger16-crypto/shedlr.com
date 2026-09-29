-- ═══════════════════════════════════════════════════════════════
-- Migration: salesmen + commission credit on business accounts
-- Run ONCE against production BEFORE deploying the worker that uses it:
--   npx wrangler d1 execute shedlr-leads --remote --file=worker/migration_salespeople.sql --config worker/wrangler.jsonc
-- Re-running errors with "duplicate column name" at the ALTER lines — that is expected
-- and harmless (the tables and indexes use IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS salespeople (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_salespeople_name ON salespeople(lower(trim(name)));

-- Audit trail: every time a business is credited to (or taken off) a salesman.
CREATE TABLE IF NOT EXISTS salesperson_assignment_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_id INTEGER NOT NULL,
  salesperson_id INTEGER,
  previous_salesperson_id INTEGER,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sp_log_business ON salesperson_assignment_log(business_id);

ALTER TABLE businesses ADD COLUMN salesperson_id INTEGER;
ALTER TABLE businesses ADD COLUMN salesperson_assigned_at TEXT;
CREATE INDEX IF NOT EXISTS idx_businesses_salesperson ON businesses(salesperson_id);
