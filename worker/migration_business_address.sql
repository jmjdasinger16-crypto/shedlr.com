-- ═══════════════════════════════════════════════════════════════
-- Migration: Add address column to businesses
-- Run with: wrangler d1 execute shedlr-leads --file=worker/migration_business_address.sql --remote
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE businesses ADD COLUMN address TEXT;
