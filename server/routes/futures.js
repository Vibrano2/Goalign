import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

// Simulated market price oracle
const getMarketPrice = (symbol) => {
  const prices = { 'BTCUSDT': 65000, 'ETHUSDT': 3500, 'SOLUSDT': 150 };
  return prices[symbol] || 1;
};

// POST /api/futures/open
router.post('/open', async (req, res) => {
  const { user_id, symbol, side, leverage, margin } = req.body;

  if (!user_id || !symbol || !side || !leverage || !margin) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const orderMargin = parseFloat(margin);
  const orderLeverage = parseInt(leverage);
  if (orderMargin <= 0 || orderLeverage < 1 || orderLeverage > 100) {
    return res.status(400).json({ error: 'Invalid margin or leverage' });
  }

  const quoteAsset = symbol.endsWith('USDT') ? 'USDT' : 'USD';
  const entryPrice = getMarketPrice(symbol);
  const size = orderMargin * orderLeverage;

  // Liquidation Price calculation (Simplified)
  // Long: Entry - (Entry / Leverage)
  // Short: Entry + (Entry / Leverage)
  const marginRatio = 1 / orderLeverage;
  const maintenanceMargin = 0.005; // 0.5% buffer
  let liquidationPrice;
  if (side === 'long') {
    liquidationPrice = entryPrice * (1 - marginRatio + maintenanceMargin);
  } else {
    liquidationPrice = entryPrice * (1 + marginRatio - maintenanceMargin);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 0. Resolve internal user id
    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [user_id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // 1. Lock User Futures Balances
    const balanceRes = await client.query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = $2 AND account_type = 'futures' FOR UPDATE`,
      [internalUserId, quoteAsset]
    );

    if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < orderMargin) {
      throw new Error(`Insufficient ${quoteAsset} in futures wallet`);
    }

    // Move from available to locked
    await client.query(
      `UPDATE balances 
       SET available = available - $1, locked = locked + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND asset = $3 AND account_type = 'futures'`,
      [orderMargin, internalUserId, quoteAsset]
    );

    // 2. Insert Position
    const posRes = await client.query(
      `INSERT INTO positions (user_id, symbol, side, leverage, margin, entry_price, size, liquidation_price, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open') RETURNING id`,
      [internalUserId, symbol, side, orderLeverage, orderMargin, entryPrice, size, liquidationPrice]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Position opened', positionId: posRes.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/futures/positions/:firebaseUid
router.get('/positions/:firebaseUid', async (req, res) => {
  try {
    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [req.params.firebaseUid]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const internalUserId = userRes.rows[0].id;

    const result = await query(
      `SELECT * FROM positions WHERE user_id = $1 AND status = 'open' ORDER BY created_at DESC`,
      [internalUserId]
    );
    res.status(200).json({ positions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

// POST /api/futures/close
router.post('/close', async (req, res) => {
  const { user_id, position_id } = req.body;
  if (!user_id || !position_id) return res.status(400).json({ error: 'Missing parameters' });

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [user_id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // Fetch position
    const posRes = await client.query(
      `SELECT * FROM positions WHERE id = $1 AND user_id = $2 AND status = 'open' FOR UPDATE`,
      [position_id, internalUserId]
    );

    if (posRes.rows.length === 0) throw new Error('Position not found or already closed');
    const pos = posRes.rows[0];

    const currentPrice = getMarketPrice(pos.symbol);
    const quoteAsset = pos.symbol.endsWith('USDT') ? 'USDT' : 'USD';

    // Calculate PNL
    // Size = Margin * Leverage
    // PNL = (Current Price - Entry Price) / Entry Price * Size (for long)
    let pnl = 0;
    if (pos.side === 'long') {
      pnl = ((currentPrice - pos.entry_price) / pos.entry_price) * pos.size;
    } else {
      pnl = ((pos.entry_price - currentPrice) / pos.entry_price) * pos.size;
    }

    const margin = parseFloat(pos.margin);
    let finalReturn = margin + pnl;

    // Check liquidation just in case
    if (finalReturn <= 0) {
      finalReturn = 0; // Liquidated, return nothing
    }

    // Update balance: remove locked margin entirely
    await client.query(
      `UPDATE balances SET locked = locked - $1, total = total - $1 WHERE user_id = $2 AND asset = $3 AND account_type = 'futures'`,
      [margin, internalUserId, quoteAsset]
    );

    // Credit back margin + pnl to available
    if (finalReturn > 0) {
      await client.query(
        `UPDATE balances SET available = available + $1, total = total + $1 WHERE user_id = $2 AND asset = $3 AND account_type = 'futures'`,
        [finalReturn, internalUserId, quoteAsset]
      );
    }

    // Mark closed
    await client.query(
      `UPDATE positions SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [position_id]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Position closed successfully', pnl: pnl.toFixed(4) });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
