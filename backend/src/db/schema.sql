CREATE TABLE IF NOT EXISTS chain_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  facility_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  tx_hash TEXT,
  block_height BIGINT,
  contract_hash TEXT,
  source TEXT NOT NULL DEFAULT 'local',
  raw_event JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chain_events_created_at ON chain_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chain_events_facility_id ON chain_events (facility_id);
CREATE INDEX IF NOT EXISTS idx_chain_events_event_type ON chain_events (event_type);
