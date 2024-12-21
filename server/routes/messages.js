// routes/messages.js
import express from 'express';
import { sendMessage, getConversation, sendCommunityMessage, getGroupConversations, markMessageAsRead } from '../controllers/message.js';
import { verifyToken } from "../verifyToken.js";

const router = express.Router();

router.post('/', verifyToken, sendMessage);
router.get('/conversation', verifyToken, getConversation);
router.put('/:messageId/mark-as-read', verifyToken, markMessageAsRead);
router.get('/groupConversations', verifyToken, getGroupConversations);
router.post('/sendCommunityMessage', verifyToken, sendCommunityMessage);

export default router;
