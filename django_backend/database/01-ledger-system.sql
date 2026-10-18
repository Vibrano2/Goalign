-- =============================================================================
-- GOALIGN PHASE 1 MIGRATION — Safe to apply to existing databases
-- Run this ONCE. All statements are idempotent (IF NOT EXISTS / ADD CONSTRAINT
-- checks existence first).
-- =============================================================================

-- 1. Core Ledger Tables
CREATE TABLE IF NOT EXISTS ledger_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_id VARCHAR(255) UNIQUE,           -- Idempotency key
    transaction_type VARCHAR(50) NOT NULL,      -- e.g. MOCK_DEPOSIT, WITHDRAWAL_REQUEST, SPOT_TRADE_SETTLEMENT
    status VARCHAR(20) DEFAULT 'completed',     -- pending | completed | failed | reversed
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ledger_transaction_id UUID NOT NULL REFERENCES ledger_transactions(id) ON DELETE RESTRICT,
    user_id INT REFERENCES users(id) ON DELETE RESTRICT,  -- NULL = system account
    account_type VARCHAR(50) DEFAULT 'spot',               -- spot | futures | system_*
    asset VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('debit', 'credit')),
    amount DECIMAL(30, 8) NOT NULL CHECK (amount > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ledger entries are IMMUTABLE: no UPDATE or DELETE allowed.
-- Corrections must be made via reversal entries (new ledger_transaction of type REVERSAL).

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_entries_tx_id   ON ledger_entries(ledger_transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_txn_ref_id      ON ledger_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_txn_type        ON ledger_transactions(transaction_type);

-- 3. Add account_type to balances if not present (supports spot vs futures separation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balances' AND column_name = 'account_type'
  ) THEN
    ALTER TABLE balances ADD COLUMN account_type VARCHAR(50) DEFAULT 'spot';
  END IF;
END $$;

-- 4. Update balances unique constraint to include account_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'balances_user_id_asset_account_type_key'
  ) THEN
    ALTER TABLE balances ADD CONSTRAINT balances_user_id_asset_account_type_key
      UNIQUE (user_id, asset, account_type);
  END IF;
END $$;

-- 5. Add updated_at to balances if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'balances' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE balances ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- 6. Positive balance constraints (protect against accounting bugs)
--
--    PRE-FLIGHT VALIDATION: Abort if any existing balance rows violate the
--    constraints we are about to add. Financial data is NEVER modified silently.
--
--    If this block raises an exception, a human must review and explicitly reconcile
--    the affected rows using the procedure in RECONCILIATION NOTE below before
--    re-running this migration.
--
DO $$
DECLARE
  v_bad_row RECORD;
  v_count INT := 0;
  v_report TEXT := '';
BEGIN
  -- Collect all rows that would violate the forthcoming CHECK constraints
  FOR v_bad_row IN
    SELECT id, user_id, asset, account_type,
           available::TEXT, locked::TEXT, total::TEXT
    FROM   balances
    WHERE  available < 0 OR locked < 0 OR total < 0
    ORDER  BY user_id, asset
  LOOP
    v_count := v_count + 1;
    v_report := v_report || format(
      E'\n  id=%s user_id=%s asset=%s account_type=%s available=%s locked=%s total=%s',
      v_bad_row.id, v_bad_row.user_id, v_bad_row.asset,
      v_bad_row.account_type, v_bad_row.available,
      v_bad_row.locked, v_bad_row.total
    );
  END LOOP;

  IF v_count > 0 THEN
    RAISE EXCEPTION
      E'MIGRATION ABORTED: % balance row(s) have negative values that would violate '
      'the CHECK constraints being added. This indicates a pre-existing accounting bug. '
      'DO NOT auto-correct these values. Have a human review and reconcile using the '
      'explicit procedure in 01-ledger-system.sql (search RECONCILIATION NOTE). '
      'Affected rows:%',
      v_count, v_report;
  END IF;
END $$;

-- RECONCILIATION NOTE (read-only — do not execute blindly):
-- If the preflight above fails, investigate each flagged row:
--   1. Determine how the negative balance arose (look at ledger_entries for the user/asset).
--   2. Post a REVERSAL ledger transaction to correct the balance to its true value.
--   3. Only if no ledger history exists (pre-ledger dev data) and after explicit
--      human approval, run the following targeted correction for THAT specific row:
--
--   UPDATE balances SET
--     available = GREATEST(available, 0),
--     locked    = GREATEST(locked, 0),
--     total     = GREATEST(total, 0)
--   WHERE id = <specific_row_id_reviewed_by_human>;
--
--   Then re-run this migration. This corrective UPDATE must be logged with:
--     - Date, operator name, reason for correction
--     - Original and corrected values
--

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_available_positive') THEN
    ALTER TABLE balances ADD CONSTRAINT check_available_positive CHECK (available >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_locked_positive') THEN
    ALTER TABLE balances ADD CONSTRAINT check_locked_positive CHECK (locked >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_total_positive') THEN
    ALTER TABLE balances ADD CONSTRAINT check_total_positive CHECK (total >= 0);
  END IF;
END $$;

-- 7. Support paper-trading position statuses in the positions table
DO $$
BEGIN
  -- If there is a CHECK constraint on status, we need to update it.
  -- Drop old constraint if it doesn't include paper statuses.
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'positions_status_check') THEN
    ALTER TABLE positions DROP CONSTRAINT positions_status_check;
  END IF;
  ALTER TABLE positions ADD CONSTRAINT positions_status_check
    CHECK (status IN ('open', 'closed', 'liquidated', 'open_paper', 'closed_paper'));
END $$;

-- =============================================================================
-- MIGRATION COMPLETE
-- Apply with: psql -U <user> -d <db> -f server/migrations/01-ledger-system.sql
-- =============================================================================
