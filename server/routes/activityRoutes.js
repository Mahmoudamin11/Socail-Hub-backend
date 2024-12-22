import express from 'express';
import { incrementLikes, incrementComments, incrementViews } from '../controllers/activityController.js';
import { verifyToken } from '../verifyToken.js';

const router = express.Router();

// Increment likes
router.put('/icrementlikes', verifyToken, incrementLikes);

// Increment comments
router.put('/icrementcomments', verifyToken, incrementComments);

// Increment views
router.put('/icrementviews', verifyToken, incrementViews);

export default router;
