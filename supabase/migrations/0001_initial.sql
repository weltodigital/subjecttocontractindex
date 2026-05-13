-- UK Estate Agent Index - initial schema
-- Apply in Supabase SQL editor or via `supabase db push`

CREATE TABLE towns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  county TEXT,
  latitude FLOAT,
  longitude FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_place_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  town_id UUID REFERENCES towns(id),
  address TEXT,
  latitude FLOAT,
  longitude FLOAT,
  category TEXT CHECK (category IN ('sales', 'lettings', 'both')),
  google_profile_url TEXT,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agency_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  average_rating FLOAT,
  review_count INTEGER,
  recent_reviews_count INTEGER,
  recency_score FLOAT,
  volume_score FLOAT,
  rating_score FLOAT,
  composite_score FLOAT,
  sales_rank INTEGER,
  lettings_rank INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(agency_id, snapshot_date)
);

CREATE INDEX idx_snapshots_agency_date ON agency_snapshots(agency_id, snapshot_date DESC);
CREATE INDEX idx_snapshots_date ON agency_snapshots(snapshot_date DESC);
CREATE INDEX idx_agencies_town ON agencies(town_id);
CREATE INDEX idx_agencies_place_id ON agencies(google_place_id);

-- Operational log for the monthly refresh (helpful from day one for debugging)
CREATE TABLE refresh_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  town_id UUID REFERENCES towns(id),
  level TEXT CHECK (level IN ('info', 'warn', 'error')),
  stage TEXT,
  message TEXT,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_log_created ON refresh_log(created_at DESC);

-- Seed: Brighton (the MVP town)
INSERT INTO towns (slug, name, county, latitude, longitude)
VALUES ('brighton', 'Brighton', 'East Sussex', 50.8225, -0.1372)
ON CONFLICT (slug) DO NOTHING;
