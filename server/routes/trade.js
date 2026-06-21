import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

// Simulated market price oracle (In production, this would be an internal service listening to Binance)
const getMarketPrice = (symbol) => {
  // Mock prices for simulation
  const prices = {
    'BTCUSDT': 65000,
    'ETHUSDT': 3500,
    'SOLUSDT': 150
  };
  return prices[symbol] || 1;
};

// POST /api/trade/order
// Place a new trade order
router.post('/order', async (req, res) => {
  const { user_id, symbol, side, type, price, amount } = req.body;

  if (!user_id || !symbol || !side || !type || !amount) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  // VIP Taker Fees: Level 0 -> 5
  const VIP_TAKER_FEES = [0.0010, 0.0009, 0.0008, 0.0006, 0.0004, 0.0002];

  // Determine base and quote assets (e.g., BTCUSDT -> Base: BTC, Quote: USDT)
  const quoteAsset = symbol.endsWith('USDT') ? 'USDT' : 'USD';
  const baseAsset = symbol.replace(quoteAsset, '');

  const orderPrice = type === 'market' ? getMarketPrice(symbol) : parseFloat(price);
  const orderAmount = parseFloat(amount);
  
  if (orderAmount <= 0 || orderPrice <= 0) {
    return res.status(400).json({ error: 'Invalid amount or price' });
  }

  // The asset to lock: If BUY, lock USDT (amount * price). If SELL, lock Base Asset (amount).
  const assetToLock = side === 'buy' ? quoteAsset : baseAsset;
  const lockAmount = side === 'buy' ? (orderAmount * orderPrice) : orderAmount;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 0. Resolve User & VIP Level
    const userRes = await client.query('SELECT id, vip_level FROM users WHERE firebase_uid = $1', [user_id]);
    if (userRes.rows.length === 0) {
      throw new Error('User not found in database');
    }
    const internalUserId = userRes.rows[0].id;
    const userVipLevel = userRes.rows[0].vip_level || 0;
    
    // Safely get fee rate (cap max level to 5)
    const feeRate = VIP_TAKER_FEES[Math.min(userVipLevel, 5)];

    // 1. Lock User Balances (Overdraft Protection)
    const balanceRes = await client.query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = $2 AND account_type = 'spot' FOR UPDATE`,
      [internalUserId, assetToLock]
    );

    if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < lockAmount) {
      throw new Error(`Insufficient ${assetToLock} balance`);
    }

    // Move from available to locked
    await client.query(
      `UPDATE balances 
       SET available = available - $1, locked = locked + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND asset = $3 AND account_type = 'spot'`,
      [lockAmount, internalUserId, assetToLock]
    );

    // 2. Insert Order
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, symbol, side, type, price, amount, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [internalUserId, symbol, side, type, orderPrice, orderAmount, type === 'market' ? 'closed' : 'open']
    );
    const orderId = orderRes.rows[0].id;

    // 3. Simulated Execution (If MARKET, execute instantly)
    if (type === 'market') {
      const receiveAsset = side === 'buy' ? baseAsset : quoteAsset;
      const receiveAmount = side === 'buy' ? orderAmount : (orderAmount * orderPrice);
      
      // Calculate dynamic VIP fee
      const feeAmount = receiveAmount * feeRate;
      const netReceiveAmount = receiveAmount - feeAmount;

      // Deduct locked balance permanently
      await client.query(
        `UPDATE balances 
         SET locked = locked - $1, total = total - $1
         WHERE user_id = $2 AND asset = $3 AND account_type = 'spot'`,
        [lockAmount, internalUserId, assetToLock]
      );

      // Upsert receiving asset
      const targetBalance = await client.query(
        `UPDATE balances 
         SET available = available + $1, total = total + $1
         WHERE user_id = $2 AND asset = $3 AND account_type = 'spot' RETURNING id`,
        [netReceiveAmount, internalUserId, receiveAsset]
      );

      if (targetBalance.rows.length === 0) {
        // Create balance if they don't have it
        await client.query(
          `INSERT INTO balances (user_id, asset, account_type, total, available) 
           VALUES ($1, $2, 'spot', $3, $3)`,
          [internalUserId, receiveAsset, netReceiveAmount]
        );
      }

      // Record trade
      await client.query(
        `INSERT INTO trades (order_id, user_id, symbol, side, price, amount, fee, fee_asset) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, internalUserId, symbol, side, orderPrice, orderAmount, feeAmount, receiveAsset]
      );
    }

    await client.query('COMMIT');

    res.status(200).json({ 
      message: 'Order placed successfully',
      orderId,
      status: type === 'market' ? 'executed' : 'open'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order error:', err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/trade/orders/:userId
// GET /api/trade/orders/:firebaseUid
// Fetch user orders
router.get('/orders/:firebaseUid', async (req, res) => {
  try {
    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [req.params.firebaseUid]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const internalUserId = userRes.rows[0].id;

    const result = await query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [internalUserId]
    );
    res.status(200).json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
