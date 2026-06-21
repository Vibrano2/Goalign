import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

// Mock APY Rates
const getApyRate = (asset) => {
  const rates = { 'USDT': 0.12, 'BTC': 0.05, 'ETH': 0.04 }; // 12%, 5%, 4%
  return rates[asset] || 0.02;
};

// POST /api/earn/subscribe
router.post('/subscribe', async (req, res) => {
  const { user_id, asset, amount } = req.body;

  if (!user_id || !asset || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const subAmount = parseFloat(amount);
  const apy = getApyRate(asset);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Resolve user internal id
    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [user_id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // Check Earn Wallet Balance
    const balanceRes = await client.query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = $2 AND account_type = 'earn' FOR UPDATE`,
      [internalUserId, asset]
    );

    if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < subAmount) {
      throw new Error(`Insufficient ${asset} in Earn wallet`);
    }

    // Move to locked
    await client.query(
      `UPDATE balances SET available = available - $1, locked = locked + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND asset = $3 AND account_type = 'earn'`,
      [subAmount, internalUserId, asset]
    );

    // Create stake
    await client.query(
      `INSERT INTO stakes (user_id, asset, amount, apy, status) VALUES ($1, $2, $3, $4, 'active')`,
      [internalUserId, asset, subAmount, apy]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Subscribed successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/earn/subscriptions/:firebaseUid
router.get('/subscriptions/:firebaseUid', async (req, res) => {
  try {
    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [req.params.firebaseUid]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const internalUserId = userRes.rows[0].id;

    const result = await query(
      `SELECT * FROM stakes WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [internalUserId]
    );
    
    // Mathematically calculate live APY interest for each active stake
    const now = new Date();
    const subs = result.rows.map(stake => {
      const createdAt = new Date(stake.created_at);
      const secondsElapsed = (now - createdAt) / 1000;
      const yearsElapsed = secondsElapsed / (365 * 24 * 60 * 60);
      const principal = parseFloat(stake.amount);
      const apy = parseFloat(stake.apy);
      
      const earned = principal * apy * yearsElapsed;
      return {
        ...stake,
        earned: earned.toFixed(8)
      };
    });

    res.status(200).json({ subscriptions: subs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// POST /api/earn/redeem
router.post('/redeem', async (req, res) => {
  const { user_id, stake_id } = req.body;
  if (!user_id || !stake_id) return res.status(400).json({ error: 'Missing parameters' });

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [user_id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // Fetch stake
    const stakeRes = await client.query(
      `SELECT * FROM stakes WHERE id = $1 AND user_id = $2 AND status = 'active' FOR UPDATE`,
      [stake_id, internalUserId]
    );

    if (stakeRes.rows.length === 0) throw new Error('Stake not found or already redeemed');
    const stake = stakeRes.rows[0];

    // Calculate final interest
    const now = new Date();
    const createdAt = new Date(stake.created_at);
    const secondsElapsed = (now - createdAt) / 1000;
    const yearsElapsed = secondsElapsed / (365 * 24 * 60 * 60);
    const principal = parseFloat(stake.amount);
    const apy = parseFloat(stake.apy);
    const earned = principal * apy * yearsElapsed;

    // Update balances: Remove locked principal, Add (principal + earned) to available/total
    await client.query(
      `UPDATE balances SET locked = locked - $1, available = available + $1 + $2, total = total + $2 
       WHERE user_id = $3 AND asset = $4 AND account_type = 'earn'`,
      [principal, earned, internalUserId, stake.asset]
    );

    // Mark redeemed
    await client.query(
      `UPDATE stakes SET status = 'redeemed', redeemed_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [stake_id]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Redeemed successfully', principal, earned: earned.toFixed(8) });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
