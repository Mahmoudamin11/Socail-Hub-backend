import express from "express";
import { report } from "../controllers/report.js";
import {verifyToken} from "../verifyToken.js"

const router = express.Router();

// Report endpoint
router.post("/report", verifyToken, report);
router.post("/report", verifyToken, report);

export default router;
