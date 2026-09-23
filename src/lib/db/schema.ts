// §23 DATABASE — scalable schema design (documentation + types)
// In production: Postgres + Prisma/Drizzle + migrations + indexes + caching

export const SCHEMA_SQL = `
-- USERS (social, auth)
CREATE TABLE users (
  id UUID PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  wallet_address TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  premium_tier TEXT DEFAULT 'free' -- free | premium | guru_holder
);
CREATE INDEX idx_users_handle ON users(handle);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- WALLETS (observed, not owned)
CREATE TABLE wallets (
  address TEXT PRIMARY KEY,
  ens TEXT,
  chain TEXT NOT NULL,
  first_seen TIMESTAMPTZ,
  last_seen TIMESTAMPTZ,
  age_days INT,
  chains TEXT[], preferred_dexs TEXT[], preferred_categories TEXT[]
);
CREATE INDEX idx_wallets_chain ON wallets(chain);

-- TOKENS
CREATE TABLE tokens (
  address TEXT PRIMARY KEY,
  symbol TEXT NOT NULL, name TEXT, chain TEXT, category TEXT,
  price DOUBLE PRECISION, market_cap DOUBLE PRECISION, liquidity DOUBLE PRECISION,
  volume24h DOUBLE PRECISION, holders INT, holder_growth24h DOUBLE PRECISION,
  age_days INT, risk TEXT, concentration_top10 DOUBLE PRECISION,
  updated_at TIMESTAMPTZ
);
CREATE INDEX idx_tokens_symbol ON tokens(symbol);
CREATE INDEX idx_tokens_chain ON tokens(chain);
CREATE INDEX idx_tokens_mcap ON tokens(market_cap);

-- TRANSACTIONS (indexed, partitioned by month)
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  wallet_address TEXT REFERENCES wallets(address),
  token_address TEXT REFERENCES tokens(address),
  chain TEXT, dex TEXT, side TEXT,
  amount_token DOUBLE PRECISION, amount_usd DOUBLE PRECISION,
  price DOUBLE PRECISION, mcap_at_entry DOUBLE PRECISION,
  tx_hash TEXT, timestamp TIMESTAMPTZ,
  pnl DOUBLE PRECISION, roi DOUBLE PRECISION, hold_duration_sec INT
);
CREATE INDEX idx_tx_wallet_time ON transactions(wallet_address, timestamp DESC);
CREATE INDEX idx_tx_token_time ON transactions(token_address, timestamp DESC);
CREATE INDEX idx_tx_chain ON transactions(chain);

-- WALLET_POSITIONS (current)
CREATE TABLE wallet_positions (
  wallet_address TEXT REFERENCES wallets(address),
  token_address TEXT REFERENCES tokens(address),
  amount DOUBLE PRECISION, value_usd DOUBLE PRECISION,
  avg_entry DOUBLE PRECISION, current_price DOUBLE PRECISION,
  pnl DOUBLE PRECISION, roi DOUBLE PRECISION,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (wallet_address, token_address)
);

-- WALLET_SCORES (cached, incremental)
CREATE TABLE wallet_scores (
  wallet_address TEXT PRIMARY KEY REFERENCES wallets(address),
  total DOUBLE PRECISION,
  profitability DOUBLE PRECISION, consistency DOUBLE PRECISION,
  early_entries DOUBLE PRECISION, risk_management DOUBLE PRECISION,
  rug_avoidance DOUBLE PRECISION, timing DOUBLE PRECISION,
  longevity DOUBLE PRECISION, position_management DOUBLE PRECISION,
  reasoning JSONB,
  computed_at TIMESTAMPTZ,
  tier TEXT
);
CREATE INDEX idx_scores_total ON wallet_scores(total DESC);

-- WALLET_TRAITS & DNA
CREATE TABLE wallet_traits (
  wallet_address TEXT REFERENCES wallets(address),
  label TEXT, score DOUBLE PRECISION, confidence TEXT, description TEXT,
  PRIMARY KEY (wallet_address, label)
);

-- RELATIONSHIPS / CLUSTERING
CREATE TABLE wallet_relationships (
  source TEXT REFERENCES wallets(address),
  target TEXT REFERENCES wallets(address),
  strength DOUBLE PRECISION,
  signals TEXT[],
  label TEXT,
  detected_at TIMESTAMPTZ,
  PRIMARY KEY (source, target)
);
CREATE INDEX idx_rel_strength ON wallet_relationships(strength DESC);

-- WATCHLISTS
CREATE TABLE watchlists (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name TEXT, description TEXT,
  is_public BOOLEAN DEFAULT false,
  followers INT DEFAULT 0,
  created_at TIMESTAMPTZ
);
CREATE TABLE watchlist_wallets (
  watchlist_id UUID REFERENCES watchlists(id),
  wallet_address TEXT REFERENCES wallets(address),
  added_at TIMESTAMPTZ,
  PRIMARY KEY (watchlist_id, wallet_address)
);

-- ALERTS / NOTIFICATIONS
CREATE TABLE alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type TEXT, enabled BOOLEAN,
  threshold DOUBLE PRECISION,
  wallet_address TEXT, token_address TEXT,
  channel TEXT, -- browser | email | telegram | discord
  created_at TIMESTAMPTZ
);
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT, body TEXT, meta JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ
);

-- AI ANALYSES (grounded cache)
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY,
  wallet_address TEXT, token_address TEXT,
  query TEXT, answer TEXT, sources JSONB,
  created_at TIMESTAMPTZ
);
CREATE INDEX idx_ai_wallet ON ai_analyses(wallet_address);

-- LEADERBOARD SNAPSHOTS (daily)
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY,
  category TEXT, rank INT,
  wallet_address TEXT REFERENCES wallets(address),
  guru_score DOUBLE PRECISION, roi DOUBLE PRECISION,
  snapshot_date DATE
);
CREATE INDEX idx_lb_cat_date ON leaderboard_snapshots(category, snapshot_date);

-- PERFORMANCE: materialized views + incremental indexing via background workers (BullMQ / queues), caching via Redis, WebSockets for live feed
`;

// token service modular — §20
export interface TokenServiceConfig {
  provider: 'mock' | 'helius' | 'alchemy'
  gating: { minGuruForPremium: number, premiumPriceUSD: number }
}

export const TOKEN_SERVICE: TokenServiceConfig = {
  provider: 'mock',
  gating: { minGuruForPremium: 86, premiumPriceUSD: 49 }
}
