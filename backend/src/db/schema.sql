CREATE TABLE IF NOT EXISTS facilities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  onchain_package_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  escrow_balance_cache TEXT NOT NULL DEFAULT '0',
  escrow_state JSONB NOT NULL DEFAULT '{}',
  covenant_ok INTEGER NOT NULL DEFAULT 0,
  covenant_warning INTEGER NOT NULL DEFAULT 0,
  covenant_breach INTEGER NOT NULL DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS covenants (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  threshold DOUBLE PRECISION NOT NULL,
  cadence TEXT NOT NULL,
  source_quote TEXT NOT NULL DEFAULT '',
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  human_verified BOOLEAN NOT NULL DEFAULT FALSE,
  onchain_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_covenants_facility_id ON covenants (facility_id);

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT,
  sha256 TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  x402_payment_ref TEXT,
  onchain_receipt_tx TEXT,
  raw_payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_facility_id ON evidence (facility_id, created_at DESC);

CREATE TABLE IF NOT EXISTS actions (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_ids JSONB NOT NULL DEFAULT '[]',
  proposed_by_agent TEXT NOT NULL,
  onchain_action_id TEXT,
  propose_tx_hash TEXT,
  execution_tx_hash TEXT,
  params_hash TEXT,
  reasoning_summary TEXT,
  required_approval_weight INTEGER NOT NULL DEFAULT 1,
  current_approval_weight INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_actions_facility_id ON actions (facility_id);
CREATE INDEX IF NOT EXISTS idx_actions_status ON actions (status);

CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL REFERENCES actions(id) ON DELETE CASCADE,
  approver TEXT NOT NULL,
  weight INTEGER NOT NULL DEFAULT 1,
  tx_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approvals_action_id ON approvals (action_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  facility_id TEXT NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
  decision_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action_type TEXT,
  reasoning_summary TEXT NOT NULL DEFAULT '',
  policy_outcome TEXT NOT NULL DEFAULT '',
  evidence_hashes JSONB NOT NULL DEFAULT '[]',
  approval_txs JSONB NOT NULL DEFAULT '[]',
  execution_tx TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_facility_id ON audit_log (facility_id, created_at DESC);

CREATE TABLE IF NOT EXISTS x402_payments (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  amount_motes TEXT NOT NULL,
  budget_remaining_motes TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  response_hash TEXT NOT NULL,
  facility_id TEXT REFERENCES facilities(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_x402_payments_facility_id ON x402_payments (facility_id, created_at DESC);

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
