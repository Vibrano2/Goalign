import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// POST /api/auth/sync
// Called by the frontend right after a user logs in via Firebase.
// This ensures their Firebase UID exists in our relational database.
router.post('/sync', async (req, res) => {
  const { firebase_uid, email, display_name } = req.body;

  if (!firebase_uid || !email) {
    return res.status(400).json({ error: 'firebase_uid and email are required.' });
  }

  try {
    // Upsert user into PostgreSQL
    // If the firebase_uid conflicts, do nothing (or update last_login if we had that field).
    const result = await query(
      `INSERT INTO users (firebase_uid, email, display_name) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (firebase_uid) 
       DO UPDATE SET display_name = EXCLUDED.display_name
       RETURNING id, firebase_uid, email, display_name, vip_level`,
      [firebase_uid, email, display_name || null]
    );

    const user = result.rows[0];

    // Seed default balances if this was a brand new user
    // (We can check if it was newly inserted by checking if we need to insert balances)
    const balanceCheck = await query('SELECT id FROM balances WHERE user_id = $1 LIMIT 1', [user.id]);
    
    if (balanceCheck.rows.length === 0) {
      // Seed USDT, BTC, ETH balances for the 'spot' account
      const assets = ['USDT', 'BTC', 'ETH'];
      for (const asset of assets) {
        await query(
          `INSERT INTO balances (user_id, asset, account_type) VALUES ($1, $2, 'spot')`,
          [user.id, asset]
        );
      }
    }

    res.status(200).json({
      message: 'User synced successfully',
      user: user
    });
  } catch (err) {
    console.error('Error syncing user:', err);
    res.status(500).json({ error: 'Internal server error while syncing user.' });
  }
});

export default router;
