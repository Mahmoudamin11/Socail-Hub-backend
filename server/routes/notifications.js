// notificationRoutes.js

import express from "express";
import {verifyToken} from "../verifyToken.js"

const router = express.Router();
import { createNotificationsForSubscribersOrFollowers,newNotifications,getNotificationsByUserId,getNotificationsByUser,markNotificationsAsRead } from '../controllers/notification.js';

// Create a notification
router.post('/', verifyToken,createNotificationsForSubscribersOrFollowers);

router.get('/:userId',verifyToken, getNotificationsByUserId);
router.get('/New/:userId',verifyToken,newNotifications );
router.get('/MarkIsRead/:userId',verifyToken,markNotificationsAsRead );


// Get notifications for a user
router.get('/:userId', verifyToken,getNotificationsByUser);

export default router;
