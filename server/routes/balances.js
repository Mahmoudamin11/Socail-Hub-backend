import express from 'express';
import { getBalance, deductCoins, bonusCoins } from '../controllers/balance.js';
import { verifyToken } from '../verifyToken.js';

const router = express.Router();

// Get user's balance
router.get('/get-balance', verifyToken, getBalance);

// Deduct coins from user's balance
router.put('/deduct-coins', verifyToken, deductCoins);

// Give bonus coins to the user
router.put('/bonus-coins', verifyToken, bonusCoins);

export default router;
