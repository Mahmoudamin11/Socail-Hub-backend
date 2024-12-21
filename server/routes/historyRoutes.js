// historyRoutes.js

import express from "express";
import { verifyToken } from "../verifyToken.js";
import { getUserHistory, addHistory } from '../controllers/historyController.js';

const router = express.Router();

// Get purchase history
router.post('/add', verifyToken, addHistory);

// Get usage history
router.get('/usage', verifyToken, getUserHistory);

export default router;
