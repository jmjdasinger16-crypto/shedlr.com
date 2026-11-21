CREATE TABLE IF NOT EXISTS bam_training_reps (
  id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS bam_training_invites (
  email TEXT PRIMARY KEY, name TEXT NOT NULL, code_hash TEXT NOT NULL UNIQUE, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS bam_training_sessions (
  token_hash TEXT PRIMARY KEY, rep_id INTEGER NOT NULL REFERENCES bam_training_reps(id),
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bam_training_sessions_rep ON bam_training_sessions(rep_id);
CREATE INDEX IF NOT EXISTS bam_training_sessions_expiry ON bam_training_sessions(expires_at);
CREATE TABLE IF NOT EXISTS bam_training_lessons (
  rep_id INTEGER NOT NULL REFERENCES bam_training_reps(id), lesson INTEGER NOT NULL, answers TEXT NOT NULL,
  completed_at TEXT NOT NULL, PRIMARY KEY(rep_id,lesson)
);
CREATE TABLE IF NOT EXISTS bam_training_work (
  rep_id INTEGER PRIMARY KEY REFERENCES bam_training_reps(id), gameplan TEXT, blocker TEXT
);
CREATE TABLE IF NOT EXISTS bam_training_hitlist (
  id INTEGER PRIMARY KEY, rep_id INTEGER NOT NULL REFERENCES bam_training_reps(id), business TEXT NOT NULL,
  contact TEXT NOT NULL, market TEXT NOT NULL, status TEXT NOT NULL, followup TEXT NOT NULL,
  notes TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bam_training_hitlist_rep ON bam_training_hitlist(rep_id,archived,followup);
CREATE TABLE IF NOT EXISTS bam_training_events (
  id INTEGER PRIMARY KEY, rep_id INTEGER NOT NULL REFERENCES bam_training_reps(id), kind TEXT NOT NULL,
  detail TEXT NOT NULL, happened_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS bam_training_events_rep ON bam_training_events(rep_id,id DESC);
CREATE TABLE IF NOT EXISTS bam_training_rate (
  bucket TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS bam_training_rate_expiry ON bam_training_rate(expires_at);
