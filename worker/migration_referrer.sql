-- Migration: add referrer column to site_events
-- Run once against the existing production database via the Cloudflare dashboard
-- D1 console (Workers & Pages -> D1 -> shedlr-leads -> Console), or with:
--   wrangler d1 execute shedlr-leads --file=worker/migration_referrer.sql
-- Safe to skip if the column already exists (re-running will error, that's expected).
ALTER TABLE site_events ADD COLUMN referrer TEXT;
