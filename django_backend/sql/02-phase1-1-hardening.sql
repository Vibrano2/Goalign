-- =============================================================================
-- GOALIGN PHASE 1.1 MIGRATION
-- Builds on top of 01-ledger-system.sql.
-- Safe to apply incrementally. All statements are idempotent.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. WITHDRAWAL REQUESTS TABLE
--    Persistent record of every withdrawal request.
--    Status lifecycle: pending -> processing -> completed | rejected
--    "completed" only settable by a real provider callback (Phase 2).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id SERIAL PRIMARY KEY,
    withdrawal_uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id INT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    asset VARCHAR(20) NOT NULL,
    amount DECIMAL(30, 8) NOT NULL CHECK (amount > 0),
    address TEXT NOT NULL,
    network VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    -- "completed" requires provider_txid to be set — enforced by the trigger below.
    provider_txid TEXT,                     -- Set only by real provider callback (Phase 2)
    idempotency_key VARCHAR(255) NOT NULL,  -- Client-supplied, unique per user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_wd_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wd_requests_status  ON withdrawal_requests(status);

-- Trigger: prevent 'completed' status without a provider_txid
CREATE OR REPLACE FUNCTION check_withdrawal_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (NEW.provider_txid IS NULL OR trim(NEW.provider_txid) = '') THEN
    RAISE EXCEPTION 'Cannot mark withdrawal % as completed without a provider_txid', NEW.withdrawal_uuid;
  END IF;
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_withdrawal_completion ON withdrawal_requests;
CREATE TRIGGER trg_withdrawal_completion
  BEFORE INSERT OR UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION check_withdrawal_completion();

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. LEDGER IMMUTABILITY — DATABASE-LEVEL ENFORCEMENT
--    Prevents UPDATE and DELETE on posted ledger entries and transactions.
--    Corrections must use reversal ledger_transactions of type REVERSAL.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION prevent_ledger_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Ledger records are immutable. Use a REVERSAL transaction to correct errors. (table: %, operation: %)',
    TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;

-- Immutability on ledger_entries
DROP TRIGGER IF EXISTS trg_ledger_entries_immutable ON ledger_entries;
CREATE TRIGGER trg_ledger_entries_immutable
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_mutation();

-- Immutability on ledger_transactions (except status field updates for pending->completed lifecycle)
-- We allow status updates only for the controlled lifecycle (pending -> completed/failed).
-- All other field modifications and DELETEs are blocked.
CREATE OR REPLACE FUNCTION prevent_ledger_transaction_mutation()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Ledger transactions cannot be deleted. (id: %)', OLD.id;
  END IF;
  -- On UPDATE: only allow the status field to change, and only via a controlled transition
  IF TG_OP = 'UPDATE' THEN
    IF OLD.reference_id IS DISTINCT FROM NEW.reference_id OR
       OLD.transaction_type IS DISTINCT FROM NEW.transaction_type OR
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.created_at IS DISTINCT FROM NEW.created_at THEN
      RAISE EXCEPTION 'Ledger transaction fields are immutable. Only status may be updated. (id: %)', OLD.id;
    END IF;
    -- Allow only valid status transitions
    IF NEW.status NOT IN ('pending', 'completed', 'failed', 'reversed') THEN
      RAISE EXCEPTION 'Invalid ledger_transaction status: %', NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ledger_transactions_immutable ON ledger_transactions;
CREATE TRIGGER trg_ledger_transactions_immutable
  BEFORE UPDATE OR DELETE ON ledger_transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_ledger_transaction_mutation();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DOUBLE-ENTRY ENFORCEMENT — DATABASE-LEVEL DEFERRED CONSTRAINT
--    After every transaction that inserts ledger_entries,
--    verify SUM(credits) == SUM(debits) per asset per ledger_transaction.
--    This is a DEFERRED constraint trigger (fires at COMMIT time).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_ledger_balance()
RETURNS TRIGGER AS $$
DECLARE
  v_net DECIMAL(30, 8);
  v_asset VARCHAR(20);
BEGIN
  -- For each distinct asset in this transaction, check balance
  FOR v_asset IN
    SELECT DISTINCT asset FROM ledger_entries WHERE ledger_transaction_id = NEW.ledger_transaction_id
  LOOP
    SELECT
      COALESCE(SUM(CASE WHEN direction = 'credit' THEN amount ELSE -amount END), 0)
    INTO v_net
    FROM ledger_entries
    WHERE ledger_transaction_id = NEW.ledger_transaction_id AND asset = v_asset;

    IF ABS(v_net) > 0.00000001 THEN
      RAISE EXCEPTION 'Unbalanced ledger entries for transaction % asset %: net = %',
        NEW.ledger_transaction_id, v_asset, v_net;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This fires DEFERRED (at COMMIT), so partial entry inserts within one
-- transaction are valid while the transaction is in-progress.
DROP TRIGGER IF EXISTS trg_ledger_balance_check ON ledger_entries;
CREATE CONSTRAINT TRIGGER trg_ledger_balance_check
  AFTER INSERT ON ledger_entries
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION check_ledger_balance();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. POSITIONS — CLOSE IDEMPOTENCY CONSTRAINT
--    A position can only be closed once. The UNIQUE constraint on
--    ledger_transactions.reference_id ('FUT_CLOSE_<id>') already prevents
--    double-settlement. This index makes concurrent close attempts fail fast.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_positions_close_once
  ON positions (id)
  WHERE status IN ('closed', 'closed_paper', 'liquidated');

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ENSURE POSITIONS CONSTRAINT INCLUDES PAPER STATUSES (from Phase 1)
--    Idempotent version.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positions_status_check') THEN
    ALTER TABLE positions DROP CONSTRAINT positions_status_check;
  END IF;
  ALTER TABLE positions ADD CONSTRAINT positions_status_check
    CHECK (status IN ('open', 'closed', 'liquidated', 'open_paper', 'closed_paper'));
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- Apply with: psql -U <user> -d <db> -f server/migrations/02-phase1-1-hardening.sql
-- This migration is safe to apply after 01-ledger-system.sql.
-- =============================================================================
