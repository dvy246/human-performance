-- CogniArena Sync Worker Database Schema
-- Run: npx wrangler d1 execute cogniarena_db --file=./schema.sql

-- ── User Accounts ────────────────────────────────────────────────────────────
-- Stores user records keyed by PBKDF2-derived recovery hash
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  last_sync_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_last_sync ON users(last_sync_at);

-- ── Test Attempts ─────────────────────────────────────────────────────────────
-- Stores all cognitive test attempts for syncing across devices
CREATE TABLE IF NOT EXISTS attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  category TEXT NOT NULL,
  raw_score REAL NOT NULL,
  percentile REAL NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test_id ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_created_at ON attempts(created_at);

-- ── Rate Limiting ────────────────────────────────────────────────────────────
-- SEC-07: D1-backed rate limiting table
-- This table supports persistent rate limiting that survives Worker cold starts.
-- Entries are pruned automatically by the Worker when they expire.
CREATE TABLE IF NOT EXISTS rate_limits (
  ip TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  reset_time INTEGER NOT NULL,
  PRIMARY KEY (ip)
);

-- Index for efficient pruning of expired entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);
