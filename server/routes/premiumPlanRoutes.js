import express from 'express';
import { subscribePremiumPlan ,collectStatisticsAndGrantCoins} from '../controllers/premiumPlanController.js';
import { verifyToken } from "../verifyToken.js";

const router = express.Router();

// Subscribe to a premium plan
router.post('/subscribe', verifyToken, subscribePremiumPlan);
router.post('/Statistics', verifyToken, collectStatisticsAndGrantCoins);


export default router;
