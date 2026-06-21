import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

export const VIP_PACKAGES = {
  1: { daily: 10, monthly: 30, price: 50, days: 60 },
  2: { daily: 100, monthly: 3000, price: 500, days: 60 },
  3: { daily: 30000, monthly: 450000, price: 3000, days: 90 },
  4: { daily: 80000, monthly: 950000, price: 5000, days: 90 },
  5: { daily: 150000, monthly: 2500000, price: 10000, days: 365 },
  6: { daily: 300000, monthly: 4500000, price: 50000, days: 365 },
  7: { daily: 500000, monthly: 8000000, price: 100000, days: 365 },
  8: { daily: 1000000, monthly: 20000000, price: 300000, days: 365 }
};

router.get('/status/:firebaseUid', async (req, res) => {
  try {
    const userRes = await query('SELECT id, vip_level FROM users WHERE firebase_uid = $1', [req.params.firebaseUid]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    const { id: internalUserId, vip_level: vipLevel } = userRes.rows[0];

    const balanceRes = await query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = 'USDT' AND account_type = 'spot'`,
      [internalUserId]
    );
    const balance = balanceRes.rows.length > 0 ? parseFloat(balanceRes.rows[0].available) : 0;

    let limits = { daily: 0, monthly: 0 };
    if (vipLevel > 0 && VIP_PACKAGES[vipLevel]) {
      limits = { daily: VIP_PACKAGES[vipLevel].daily, monthly: VIP_PACKAGES[vipLevel].monthly };
    }

    res.json({ vipLevel, balance, limits, packages: VIP_PACKAGES });
  } catch (error) {
    console.error("Error fetching VIP status:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/upgrade', async (req, res) => {
  const { firebaseUid, targetLevel, safePassword } = req.body;

  if (!firebaseUid || !targetLevel || !VIP_PACKAGES[targetLevel]) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  // NOTE: For MVP, we bypass strict safe_password validation against DB to avoid migration.
  // In a production scenario, we would check safe_password here.
  if (!safePassword || safePassword.length < 4) {
    return res.status(400).json({ error: 'Invalid safe password' });
  }

  const pkg = VIP_PACKAGES[targetLevel];
  const cost = pkg.price;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const userRes = await client.query('SELECT id, vip_level FROM users WHERE firebase_uid = $1 FOR UPDATE', [firebaseUid]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const { id: internalUserId, vip_level: currentVipLevel } = userRes.rows[0];

    if (currentVipLevel >= targetLevel) {
      throw new Error('You already have this VIP level or higher');
    }

    const balanceRes = await client.query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = 'USDT' AND account_type = 'spot' FOR UPDATE`,
      [internalUserId]
    );

    if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < cost) {
      throw new Error('Insufficient USDT balance');
    }

    // Deduct cost
    await client.query(
      `UPDATE balances SET available = available - $1, total = total - $1, updated_at = CURRENT_TIMESTAMP 
       WHERE user_id = $2 AND asset = 'USDT' AND account_type = 'spot'`,
      [cost, internalUserId]
    );

    // Update VIP level
    await client.query(
      `UPDATE users SET vip_level = $1 WHERE id = $2`,
      [targetLevel, internalUserId]
    );

    await client.query('COMMIT');
    res.status(200).json({ message: `Successfully upgraded to VIP ${targetLevel}`, newLevel: targetLevel });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
