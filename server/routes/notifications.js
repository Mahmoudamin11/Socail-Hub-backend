// notificationRoutes.js

import express from "express";
import {verifyToken} from "../verifyToken.js"

const router = express.Router();
import { createNotificationsForSubscribersOrFollowers,getNotificationsByUserId,getNotificationsByUser } from '../controllers/notification.js';

// Create a notification
router.post('/', verifyToken,createNotificationsForSubscribersOrFollowers);

router.get('/:userId', getNotificationsByUserId);


// Get notifications for a user
router.get('/:userId', verifyToken,getNotificationsByUser);

export default router;
