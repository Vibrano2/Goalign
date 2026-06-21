import express from 'express';
import { query, getClient } from '../db.js';

const router = express.Router();

// Seed MOCK_ADS into database if empty
router.post('/seed', async (req, res) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Check if empty
    const checkRes = await client.query('SELECT count(*) FROM p2p_ads');
    if (parseInt(checkRes.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.json({ message: 'Database already seeded' });
    }

    // We need a dummy user to own these ads
    const dummyUserRes = await client.query('SELECT id FROM users LIMIT 1');
    let merchantId = 1;
    if (dummyUserRes.rows.length > 0) {
      merchantId = dummyUserRes.rows[0].id;
    }

    const mockAds = [
      { type: 'sell', asset: 'USDT', fiat: 'USD', price: 1.01, available: 15000, min: 100, max: 5000, methods: ['Bank Transfer', 'Zelle'] },
      { type: 'sell', asset: 'USDT', fiat: 'USD', price: 1.02, available: 5000, min: 50, max: 2000, methods: ['PayPal'] },
      { type: 'sell', asset: 'USDT', fiat: 'USD', price: 1.00, available: 800, min: 10, max: 800, methods: ['Skrill', 'Neteller'] },
      { type: 'buy', asset: 'USDT', fiat: 'USD', price: 0.99, available: 50000, min: 1000, max: 20000, methods: ['Bank Transfer'] },
      { type: 'buy', asset: 'USDT', fiat: 'USD', price: 0.98, available: 3000, min: 100, max: 3000, methods: ['CashApp', 'Zelle'] },
    ];

    for (let ad of mockAds) {
      await client.query(
        `INSERT INTO p2p_ads (user_id, type, asset, fiat, price, total_amount, available_amount, min_limit, max_limit, payment_methods, status)
         VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, 'active')`,
        [merchantId, ad.type, ad.asset, ad.fiat, ad.price, ad.available, ad.min, ad.max, ad.methods]
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Mock ads seeded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/p2p/ads
// Fetch available P2P ads
router.get('/ads', async (req, res) => {
  const { type, asset, fiat } = req.query;
  try {
    // Basic fallback mock data in case DB is offline or empty for presentation purposes
    let dbAds = [];
    try {
      let sql = `
        SELECT a.*, u.display_name as merchant_name, u.kyc_status
        FROM p2p_ads a
        JOIN users u ON a.user_id = u.id
        WHERE a.status = 'active'
      `;
      const params = [];
      
      if (type) {
        params.push(type);
        sql += ` AND a.type = $${params.length}`;
      }
      if (asset) {
        params.push(asset);
        sql += ` AND a.asset = $${params.length}`;
      }
      if (fiat) {
        params.push(fiat);
        sql += ` AND a.fiat = $${params.length}`;
      }
      
      sql += ` ORDER BY a.price ${type === 'buy' ? 'DESC' : 'ASC'}`;
      
      const result = await query(sql, params);
      dbAds = result.rows.map(row => ({
        id: row.id,
        type: row.type,
        merchant: row.merchant_name || 'Verified Merchant',
        verified: row.kyc_status === 'verified',
        orders: Math.floor(Math.random() * 2000) + 100, // mock stats
        completion: (Math.random() * 5 + 95).toFixed(1), // mock stats
        price: parseFloat(row.price),
        fiat: row.fiat,
        asset: row.asset,
        available: parseFloat(row.available_amount),
        min: parseFloat(row.min_limit),
        max: parseFloat(row.max_limit),
        methods: row.payment_methods
      }));
    } catch (dbErr) {
      console.warn("DB not reachable, returning fallback mock ads.");
    }

    // Fallback if no ads found (either DB is empty or offline)
    if (dbAds.length === 0) {
      const MOCK_ADS = [
        { id: 1, type: 'sell', merchant: 'CryptoKing', verified: true, orders: 1450, completion: 99.5, price: 1.01, fiat: 'USD', asset: 'USDT', available: 15000, min: 100, max: 5000, methods: ['Bank Transfer', 'Zelle'] },
        { id: 2, type: 'sell', merchant: 'FastTrade', verified: true, orders: 890, completion: 98.2, price: 1.02, fiat: 'USD', asset: 'USDT', available: 5000, min: 50, max: 2000, methods: ['PayPal'] },
        { id: 3, type: 'sell', merchant: 'GlobalEx', verified: false, orders: 340, completion: 95.0, price: 1.00, fiat: 'USD', asset: 'USDT', available: 800, min: 10, max: 800, methods: ['Skrill', 'Neteller'] },
        { id: 4, type: 'buy', merchant: 'WhaleBuyer', verified: true, orders: 2100, completion: 100, price: 0.99, fiat: 'USD', asset: 'USDT', available: 50000, min: 1000, max: 20000, methods: ['Bank Transfer'] },
        { id: 5, type: 'buy', merchant: 'QuickCash', verified: true, orders: 560, completion: 97.4, price: 0.98, fiat: 'USD', asset: 'USDT', available: 3000, min: 100, max: 3000, methods: ['CashApp', 'Zelle'] },
      ];
      dbAds = MOCK_ADS.filter(ad => 
        (!type || ad.type === type) &&
        (!asset || ad.asset === asset) &&
        (!fiat || ad.fiat === fiat)
      );
    }

    res.status(200).json({ ads: dbAds });
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching ads' });
  }
});

// POST /api/p2p/order
// Place a P2P order
router.post('/order', async (req, res) => {
  const { firebaseUid, adId, amount, method } = req.body;
  
  if (!firebaseUid || !adId || !amount) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Find user
    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1 FOR UPDATE', [firebaseUid]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // Find Ad
    const adRes = await client.query('SELECT * FROM p2p_ads WHERE id = $1 AND status = $2 FOR UPDATE', [adId, 'active']);
    if (adRes.rows.length === 0) throw new Error('Ad not found or inactive');
    const ad = adRes.rows[0];

    const fiatAmount = parseFloat(amount);
    if (fiatAmount < parseFloat(ad.min_limit) || fiatAmount > parseFloat(ad.max_limit)) {
      throw new Error(`Amount out of limits (${ad.min_limit} - ${ad.max_limit})`);
    }

    const price = parseFloat(ad.price);
    const cryptoAmount = fiatAmount / price;

    if (cryptoAmount > parseFloat(ad.available_amount)) {
      throw new Error('Insufficient crypto available in ad');
    }

    // Determine buyer and seller
    let buyerId, sellerId;
    if (ad.type === 'sell') {
      buyerId = internalUserId;
      sellerId = ad.user_id;
    } else {
      buyerId = ad.user_id;
      sellerId = internalUserId;
      
      // If user is selling to a "buy" ad, check their spot balance
      const balanceRes = await client.query(
        `SELECT available FROM balances WHERE user_id = $1 AND asset = $2 AND account_type = 'spot' FOR UPDATE`,
        [internalUserId, ad.asset]
      );
      if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < cryptoAmount) {
        throw new Error(`Insufficient ${ad.asset} balance to sell`);
      }
      // Deduct from seller's available balance and add to locked
      await client.query(
        `UPDATE balances SET available = available - $1, locked = locked + $1 WHERE user_id = $2 AND asset = $3 AND account_type = 'spot'`,
        [cryptoAmount, internalUserId, ad.asset]
      );
    }

    // Update Ad available amount
    await client.query(
      `UPDATE p2p_ads SET available_amount = available_amount - $1 WHERE id = $2`,
      [cryptoAmount, ad.id]
    );

    // Create Order
    const orderRes = await client.query(
      `INSERT INTO p2p_orders (ad_id, buyer_id, seller_id, asset, fiat, crypto_amount, fiat_amount, price, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending') RETURNING id`,
      [ad.id, buyerId, sellerId, ad.asset, ad.fiat, cryptoAmount, fiatAmount, price, method || 'Bank Transfer']
    );

    await client.query('COMMIT');
    res.status(200).json({ message: 'Order created successfully', orderId: orderRes.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/p2p/ads
// Create a new P2P ad
router.post('/ads', async (req, res) => {
  const { firebaseUid, type, asset, fiat, price, available, min, max, methods } = req.body;
  if (!firebaseUid || !type || !asset || !fiat || !price || !available || !min || !max || !methods) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Find user
    const userRes = await client.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
    if (userRes.rows.length === 0) throw new Error('User not found');
    const internalUserId = userRes.rows[0].id;

    // If type is 'sell', verify they have enough balance
    if (type === 'sell') {
      const balanceRes = await client.query(
        `SELECT available FROM balances WHERE user_id = $1 AND asset = $2 AND account_type = 'spot' FOR UPDATE`,
        [internalUserId, asset]
      );
      if (balanceRes.rows.length === 0 || parseFloat(balanceRes.rows[0].available) < parseFloat(available)) {
        throw new Error(`Insufficient ${asset} balance to post sell ad`);
      }
      // Lock the balance
      await client.query(
        `UPDATE balances SET available = available - $1, locked = locked + $1 WHERE user_id = $2 AND asset = $3 AND account_type = 'spot'`,
        [parseFloat(available), internalUserId, asset]
      );
    }

    // Insert Ad
    const adRes = await client.query(
      `INSERT INTO p2p_ads (user_id, type, asset, fiat, price, total_amount, available_amount, min_limit, max_limit, payment_methods, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'active') RETURNING id`,
      [internalUserId, type, asset, fiat, price, available, available, min, max, methods]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Ad created successfully', adId: adRes.rows[0].id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// GET /api/p2p/orders/:firebaseUid
// Fetch user's orders
router.get('/orders/:firebaseUid', async (req, res) => {
  const { firebaseUid } = req.params;
  try {
    const userRes = await query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const internalUserId = userRes.rows[0].id;

    const sql = `
      SELECT o.*, a.type as ad_type,
        b.display_name as buyer_name, s.display_name as seller_name
      FROM p2p_orders o
      JOIN p2p_ads a ON o.ad_id = a.id
      JOIN users b ON o.buyer_id = b.id
      JOIN users s ON o.seller_id = s.id
      WHERE o.buyer_id = $1 OR o.seller_id = $1
      ORDER BY o.created_at DESC
    `;
    const result = await query(sql, [internalUserId]);

    const orders = result.rows.map(row => ({
      id: row.id,
      role: row.buyer_id === internalUserId ? 'buyer' : 'seller',
      counterparty: row.buyer_id === internalUserId ? row.seller_name : row.buyer_name,
      asset: row.asset,
      fiat: row.fiat,
      cryptoAmount: parseFloat(row.crypto_amount),
      fiatAmount: parseFloat(row.fiat_amount),
      price: parseFloat(row.price),
      status: row.status,
      method: row.payment_method,
      createdAt: row.created_at
    }));

    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching orders' });
  }
});

export default router;
