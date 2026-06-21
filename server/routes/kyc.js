import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// GET /api/kyc/status/:firebaseUid
// Fetch the user's KYC status
router.get('/status/:firebaseUid', async (req, res) => {
  try {
    const userRes = await query(
      'SELECT kyc_status FROM users WHERE firebase_uid = $1',
      [req.params.firebaseUid]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ status: userRes.rows[0].kyc_status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch KYC status' });
  }
});

// POST /api/kyc/submit
// Submit KYC details and instantly verify (for MVP)
router.post('/submit', async (req, res) => {
  const { user_id, full_name, dob, country, document_type } = req.body;

  if (!user_id || !full_name || !dob || !country || !document_type) {
    return res.status(400).json({ error: 'Missing required KYC parameters' });
  }

  try {
    // In a real app, you would save these details to a 'kyc_applications' table and set status to 'pending'
    // For this MVP, we will auto-approve the KYC to demonstrate the verified state
    await query(
      `UPDATE users SET kyc_status = 'verified', updated_at = CURRENT_TIMESTAMP WHERE firebase_uid = $1`,
      [user_id]
    );

    res.status(200).json({ message: 'KYC Verification Successful', status: 'verified' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit KYC application' });
  }
});

export default router;
