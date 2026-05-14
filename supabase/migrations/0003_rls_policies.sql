-- UK Estate Agent Index - row-level security policies
-- Apply after 0001_initial.sql and 0002_auth.sql.
--
-- The public site reads via the anon key. Without explicit SELECT policies,
-- RLS blocks every row. Writes always go through the service role key, which
-- bypasses RLS, so we only need read policies here.

-- Make sure RLS is on for every table (idempotent — safe if already enabled).
ALTER TABLE towns             ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE agency_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens       ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriber_cache  ENABLE ROW LEVEL SECURITY;

-- Public-readable tables: anon can SELECT.
DROP POLICY IF EXISTS "Public read"  ON towns;
CREATE POLICY "Public read"          ON towns             FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read"  ON agencies;
CREATE POLICY "Public read"          ON agencies          FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Public read"  ON agency_snapshots;
CREATE POLICY "Public read"          ON agency_snapshots  FOR SELECT TO anon USING (true);

-- refresh_log, auth_tokens, subscriber_cache: no anon policy.
-- Only the service role (which bypasses RLS) can touch them.
