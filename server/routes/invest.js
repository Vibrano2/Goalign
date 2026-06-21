import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

// Mock APY Rates for Pledge
const getPledgeApy = (asset) => {
  const rates = { 'USDT': 0.18, 'BTC': 0.08, 'ETH': 0.06 }; // Higher APY for pledge
  return rates[asset] || 0.05;
};

// Quantify Plans
const QUANTIFY_PLANS = [
  { id: 1, title: 'USDT Arbitrage 1 day quantitative trading', days: 1, dailyInterest: 0.28, min: 10, max: 100, soldOut: 12 },
  { id: 2, title: 'USDT Arbitrage 2 days quantitative trading', days: 2, dailyInterest: 0.35, min: 100, max: 500, soldOut: 45 },
  { id: 3, title: 'USDT Arbitrage 30 days quantitative trading', days: 30, dailyInterest: 0.50, min: 500, max: 1000, soldOut: 78 },
  { id: 4, title: 'USDT Arbitrage 90 days quantitative trading', days: 90, dailyInterest: 0.80, min: 1000, max: 5000, soldOut: 89 },
  { id: 5, title: 'USDT Arbitrage 180 days quantitative trading', days: 180, dailyInterest: 1.20, min: 5000, max: 10000, soldOut: 95 },
  { id: 6, title: 'USDT Arbitrage 360 days quantitative trading', days: 360, dailyInterest: 2.00, min: 10000, max: 50000, soldOut: 98 },
];

// GET /api/invest/quantify-plans
router.get('/quantify-plans', (req, res) => {
  res.status(200).json({ plans: QUANTIFY_PLANS });
});

// POST /api/invest/quantify/buy
router.post('/quantify/buy', async (req, res) => {
  const { firebaseUid, planId, amount } = req.body;

  if (!firebaseUid || !planId || !amount) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const plan = QUANTIFY_PLANS.find(p => p.id === parseInt(planId));
  if (!plan) return res.status(404).json({ error: 'Plan not found' });

  const purchaseAmount = parseFloat(amount);
  if (purchaseAmount < plan.min || purchaseAmount > plan.max) {
    return res.status(400).json({ error: `Amount must be between ${plan.min} and ${plan.max} USDT` });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1 FOR UPDATE', [firebaseUid]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // Check balance
    const balanceRes = await client.query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = 'USDT' AND account_type = 'spot' FOR UPDATE`,
      [internalUserId]
    );

    if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < purchaseAmount) {
      throw new Error('Insufficient USDT balance');
    }

    // Deduct available, increment locked
    await client.query(
      `UPDATE balances SET available = available - $1, locked = locked + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND asset = 'USDT' AND account_type = 'spot'`,
      [purchaseAmount, internalUserId]
    );

    // Create stake record as "quantify"
    // Using stake table, but distinguishing by putting planId in notes or just mapping APY
    // Since we don't have a specific quantify table, we use stakes and store dailyInterest as APY * 365
    const annualApy = (plan.dailyInterest * 365) / 100;
    
    await client.query(
      `INSERT INTO stakes (user_id, asset, amount, apy, status) VALUES ($1, $2, $3, $4, 'active')`,
      [internalUserId, 'USDT', purchaseAmount, annualApy]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: `Successfully purchased ${plan.title}` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});
// GET /api/invest/pledges/:firebaseUid
router.get('/pledges/:firebaseUid', async (req, res) => {
  try {
    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [req.params.firebaseUid]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const internalUserId = userRes.rows[0].id;

    const result = await query(
      `SELECT * FROM stakes WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC`,
      [internalUserId]
    );
    
    const now = new Date();
    const pledges = result.rows.map(stake => {
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

    res.status(200).json({ pledges });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pledges' });
  }
});

// POST /api/invest/pledge
router.post('/pledge', async (req, res) => {
  const { user_id, asset, amount } = req.body;

  if (!user_id || !asset || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const pledgeAmount = parseFloat(amount);
  const apy = getPledgeApy(asset);

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [user_id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // Deduct from Spot Wallet
    const balanceRes = await client.query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = $2 AND account_type = 'spot' FOR UPDATE`,
      [internalUserId, asset]
    );

    if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < pledgeAmount) {
      throw new Error(`Insufficient ${asset} in Spot wallet to pledge`);
    }

    await client.query(
      `UPDATE balances SET available = available - $1, locked = locked + $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND asset = $3 AND account_type = 'spot'`,
      [pledgeAmount, internalUserId, asset]
    );

    // Create stake record
    await client.query(
      `INSERT INTO stakes (user_id, asset, amount, apy, status) VALUES ($1, $2, $3, $4, 'active')`,
      [internalUserId, asset, pledgeAmount, apy]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Pledged successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/invest/redeem
router.post('/redeem', async (req, res) => {
  const { user_id, stake_id } = req.body;
  if (!user_id || !stake_id) return res.status(400).json({ error: 'Missing parameters' });

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [user_id]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    const stakeRes = await client.query(
      `SELECT * FROM stakes WHERE id = $1 AND user_id = $2 AND status = 'active' FOR UPDATE`,
      [stake_id, internalUserId]
    );

    if (stakeRes.rows.length === 0) throw new Error('Pledge not found or already redeemed');
    const stake = stakeRes.rows[0];

    const now = new Date();
    const createdAt = new Date(stake.created_at);
    const yearsElapsed = ((now - createdAt) / 1000) / (365 * 24 * 60 * 60);
    const principal = parseFloat(stake.amount);
    const apy = parseFloat(stake.apy);
    const earned = principal * apy * yearsElapsed;

    // Restore to spot wallet
    await client.query(
      `UPDATE balances SET locked = locked - $1, available = available + $1 + $2, total = total + $2 
       WHERE user_id = $3 AND asset = $4 AND account_type = 'spot'`,
      [principal, earned, internalUserId, stake.asset]
    );

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
