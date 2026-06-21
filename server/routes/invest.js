import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'invest.js endpoints' });
});

export default router;
