-- UK Estate Agent Index - phase 2 auth tables
-- Apply after 0001_initial.sql

CREATE TABLE auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP
);

CREATE INDEX idx_tokens_token ON auth_tokens(token);
CREATE INDEX idx_tokens_email ON auth_tokens(email);

CREATE TABLE subscriber_cache (
  email TEXT PRIMARY KEY,
  beehiiv_subscription_id TEXT,
  referral_count INTEGER DEFAULT 0,
  has_access BOOLEAN DEFAULT FALSE,
  last_verified TIMESTAMP DEFAULT NOW()
);
