import express from 'express';
import { subscribePremiumPlan ,getCurrentUserPlanExpiration,transferCoins,collectStatisticsAndGrantCoins,getPremiumPlanType} from '../controllers/premiumPlanController.js';
import { toggleGhostMode } from '../controllers/Ghost.js'; // Import the toggleGhostMode function

import { verifyToken } from "../verifyToken.js";

const router = express.Router();

// Subscribe to a premium plan
router.post('/subscribe', verifyToken, subscribePremiumPlan);
router.post('/Statistics', verifyToken, collectStatisticsAndGrantCoins);
router.post('/transfer', verifyToken,transferCoins );
router.get('/PlanType/:userId', verifyToken, getPremiumPlanType);
router.post('/ghost-mode', verifyToken, toggleGhostMode); // New route for ghost mode

router.get('/premium/expiration',verifyToken, getCurrentUserPlanExpiration);

export default router;
