-- ═══════════════════════════════════════════════════════════════
-- Migration: Stripe billing email on business accounts
-- For clients who paid in Stripe with a different email than their portal login.
-- Run ONCE against production BEFORE deploying the worker that uses it:
--   npx wrangler d1 execute shedlr-leads --remote --file=worker/migration_stripe_email.sql --config worker/wrangler.jsonc
-- Re-running errors with "duplicate column name" — that is expected and harmless.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE businesses ADD COLUMN stripe_email TEXT;
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_email ON businesses(stripe_email);
