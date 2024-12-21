// routes/calls.js
import express from 'express';
import { initiateCall } from '../controllers/callController.js';
import { verifyToken } from '../verifyToken.js';

const router = express.Router();

router.post('/initiate', verifyToken, initiateCall);

export default router;
