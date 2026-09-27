-- ═══════════════════════════════════════════════════════════════
-- Migration: business killswitch (client portal lead access)
-- Run ONCE against production BEFORE deploying the worker that uses it:
--   npx wrangler d1 execute shedlr-leads --remote --file=worker/migration_killswitch.sql --config worker/wrangler.jsonc
-- Re-running errors with "duplicate column name" — that is expected and harmless.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE businesses ADD COLUMN leads_locked INTEGER NOT NULL DEFAULT 0;
ALTER TABLE businesses ADD COLUMN leads_locked_at TEXT;
