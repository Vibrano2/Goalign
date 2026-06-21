import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'trade.js endpoints' });
});

export default router;
