-- SEC-07: D1-backed rate limiting table
-- Run: npx wrangler d1 execute cogniarena_db --file=./schema.sql
--
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
