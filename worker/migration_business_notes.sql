-- ═══════════════════════════════════════════════════════════════
-- Migration: Business Notes table
-- Run with: wrangler d1 execute shedlr-leads --file=worker/migration_business_notes.sql
-- ═══════════════════════════════════════════════════════════════

-- Business-level notes (details about their business, editable by both business and admin)
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
