import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import walletRoutes from './routes/wallet.js';
import tradeRoutes from './routes/trade.js';
import futuresRoutes from './routes/futures.js';
import investRoutes from './routes/invest.js';
import transferRoutes from './routes/transfer.js';
import vipRoutes from './routes/vip.js';
import earnRoutes from './routes/earn.js';
import kycRoutes from './routes/kyc.js';
import adminRoutes from './routes/admin.js';
import p2pRoutes from './routes/p2p.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/futures', futuresRoutes);
app.use('/api/invest', investRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/vip', vipRoutes);
app.use('/api/earn', earnRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/p2p', p2pRoutes);

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
