-- Career applications from shedlr.com/connect (Business Account Manager role).
-- Every submission is stored here so applications survive email delivery failures.
-- Run with: wrangler d1 execute shedlr-leads --remote --file=worker/migration_career_applications.sql
CREATE TABLE IF NOT EXISTS career_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  resume_filename TEXT,
  resume_content_type TEXT,
  resume_data TEXT,
  resume_too_large INTEGER NOT NULL DEFAULT 0,
  email_status TEXT NOT NULL DEFAULT 'pending',
  email_detail TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_career_applications_created ON career_applications(created_at);
