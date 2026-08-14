-- Migration: add lead_type and zip columns to lead_orders
-- Run once against the existing production database with:
--   wrangler d1 execute shedlr-leads --file=worker/migration_lead_type_zip.sql
-- Safe to skip if the columns already exist (re-running will error, that's expected).
ALTER TABLE lead_orders ADD COLUMN lead_type TEXT;
ALTER TABLE lead_orders ADD COLUMN zip TEXT;
