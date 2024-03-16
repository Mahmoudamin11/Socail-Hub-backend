import express from 'express';
import {
  createCommunity,
  sendInvitation,
  acceptInvitation,
} from '../controllers/community.js';
import {verifyToken} from "../verifyToken.js"




const router = express.Router();

// Create a community
router.post('/create', verifyToken, createCommunity);

// Send invitation to a user
router.post('/invite', verifyToken, sendInvitation);

// Accept invitation to a community
router.post('/accept-invitation', verifyToken, acceptInvitation);

export default router;
