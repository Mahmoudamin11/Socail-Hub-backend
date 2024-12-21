// server/routes/chatRoutes.js
import express from 'express';
import { createChat } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chatBot', createChat);

export default router;
