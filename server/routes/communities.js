import express from 'express';
import {
  createCommunity,
  sendInvitation,
  acceptInvitation,
  deleteCommunityFromMyCommunities,
  getCommunityById,
  exitCommunity,
} from '../controllers/community.js';
import { verifyToken } from '../verifyToken.js';

const router = express.Router();

// Routes

// Create a community
router.post('/create', verifyToken, createCommunity);

// Send invitation to a user
router.post('/invite', verifyToken, sendInvitation);

// Accept invitation to a community
router.post('/accept-invitation', verifyToken, acceptInvitation);

// Delete a community from user's communities
router.delete('/delete-community/:communityId', verifyToken, deleteCommunityFromMyCommunities);

// Exit a community
router.post('/exit-community/:communityId', verifyToken, exitCommunity);

// Get a community by ID
router.get('/community/:communityId', verifyToken, getCommunityById);

export default router;
