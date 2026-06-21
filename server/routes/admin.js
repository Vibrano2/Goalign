import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  const firebaseUid = req.headers['x-user-uid'];
  if (!firebaseUid) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const userRes = await query('SELECT is_admin FROM users WHERE firebase_uid = $1', [firebaseUid]);
    if (userRes.rows.length === 0 || !userRes.rows[0].is_admin) {
      return res.status(403).json({ error: 'Forbidden: Admins only' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

// Protect all admin routes
router.use(requireAdmin);

// GET /api/admin/users
// Fetch all users with their balances
router.get('/users', async (req, res) => {
  try {
    const usersRes = await query(`
      SELECT 
        u.id, u.firebase_uid, u.email, u.display_name, u.vip_level, u.is_admin, u.created_at,
        json_agg(json_build_object('asset', b.asset, 'total', b.total, 'available', b.available)) as balances
      FROM users u
      LEFT JOIN balances b ON u.id = b.user_id AND b.account_type = 'spot'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.status(200).json({ users: usersRes.rows });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/admin/user/:id/vip
// Update a user's VIP level
router.post('/user/:id/vip', async (req, res) => {
  const { level } = req.body;
  if (level === undefined || level < 0 || level > 5) {
    return res.status(400).json({ error: 'Invalid VIP level' });
  }

  try {
    await query('UPDATE users SET vip_level = $1 WHERE id = $2', [level, req.params.id]);
    res.status(200).json({ message: `VIP level updated to ${level}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update VIP level' });
  }
});

// POST /api/admin/user/:id/fund
// Manually add/subtract funds from a user's spot balance
router.post('/user/:id/fund', async (req, res) => {
  const { asset, amount } = req.body;
  if (!asset || amount === undefined) {
    return res.status(400).json({ error: 'Missing asset or amount' });
  }

  try {
    // Upsert balance
    await query(`
      INSERT INTO balances (user_id, asset, account_type, total, available) 
      VALUES ($1, $2, 'spot', $3, $3)
      ON CONFLICT (user_id, asset, account_type) 
      DO UPDATE SET 
        total = balances.total + EXCLUDED.total,
        available = balances.available + EXCLUDED.available
    `, [req.params.id, asset, parseFloat(amount)]);

    res.status(200).json({ message: `Successfully funded ${amount} ${asset}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fund user' });
  }
});

export default router;
