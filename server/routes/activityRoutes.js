import express from 'express';
import { incrementLikes, incrementComments, incrementViews } from '../controllers/activityController.js';
import { verifyToken } from '../verifyToken.js';

const router = express.Router();

// Increment likes
router.put('/likes', verifyToken, incrementLikes);

// Increment comments
router.put('/comments', verifyToken, incrementComments);

// Increment views
router.put('/views', verifyToken, incrementViews);

export default router;
