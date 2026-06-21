import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

// GET /api/wallet/balances/:userId
// Fetch all balances for a specific user
router.get('/balances/:userId', async (req, res) => {
  const { userId } = req.params;
  
  try {
    const result = await query(
      'SELECT asset, account_type, total, available, locked FROM balances WHERE user_id = $1 ORDER BY asset ASC',
      [userId]
    );
    res.status(200).json({ balances: result.rows });
  } catch (err) {
    console.error('Error fetching balances:', err);
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// POST /api/wallet/deposit
// Endpoint for handling incoming deposits (Crypto or Fiat Webhook)
router.post('/deposit', async (req, res) => {
  const { user_id, asset, amount, txid, account_type = 'spot' } = req.body;

  if (!user_id || !asset || !amount || !txid) {
    return res.status(400).json({ error: 'Missing required deposit parameters' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Deposit amount must be greater than zero' });
  }

  try {
    // In a real production app, we would verify the txid isn't already processed
    // to prevent double-spending attacks.

    const result = await query(
      `UPDATE balances 
       SET total = total + $1, available = available + $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND asset = $3 AND account_type = $4
       RETURNING *`,
      [amount, user_id, asset.toUpperCase(), account_type]
    );

    if (result.rows.length === 0) {
      // If the user didn't have a row for this asset, create it.
      const newBalance = await query(
        `INSERT INTO balances (user_id, asset, account_type, total, available) 
         VALUES ($1, $2, $3, $4, $4) RETURNING *`,
        [user_id, asset.toUpperCase(), account_type, amount]
      );
      return res.status(200).json({ message: 'Deposit successful (new asset)', balance: newBalance.rows[0] });
    }

    res.status(200).json({ message: 'Deposit successful', balance: result.rows[0] });
  } catch (err) {
    console.error('Error processing deposit:', err);
    res.status(500).json({ error: 'Failed to process deposit' });
  }
});

// POST /api/wallet/withdraw
// Process withdrawal with overdraft protection
router.post('/withdraw', async (req, res) => {
  const { user_id, asset, amount, address, network, pin } = req.body;

  if (!user_id || !asset || !amount || !address || !network) {
    return res.status(400).json({ error: 'Missing required withdrawal parameters' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'Withdrawal amount must be greater than zero' });
  }

  // TODO: Add actual security PIN validation here against the user's saved PIN
  if (pin !== '123456') { // Mock PIN check
    // return res.status(403).json({ error: 'Invalid Security PIN' });
  }

  // Use a transaction to safely deduct balance
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // 1. Lock the row for update to prevent concurrent race conditions
    const balanceResult = await client.query(
      `SELECT available FROM balances WHERE user_id = $1 AND asset = $2 AND account_type = 'spot' FOR UPDATE`,
      [user_id, asset.toUpperCase()]
    );

    if (balanceResult.rows.length === 0) {
      throw new Error('Asset balance not found');
    }

    const available = parseFloat(balanceResult.rows[0].available);
    const withdrawAmount = parseFloat(amount);

    // 2. Validate sufficient funds
    if (available < withdrawAmount) {
      throw new Error('Insufficient funds');
    }

    // 3. Deduct the balance
    await client.query(
      `UPDATE balances 
       SET total = total - $1, available = available - $1, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND asset = $3 AND account_type = 'spot'`,
      [withdrawAmount, user_id, asset.toUpperCase()]
    );

    // 4. (Mock) Dispatch to Blockchain via TronWeb or similar provider here
    const mockTxid = `TX_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

    await client.query('COMMIT');
    
    res.status(200).json({ 
      message: 'Withdrawal processed successfully', 
      txid: mockTxid,
      deducted: withdrawAmount 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Withdrawal error:', err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
