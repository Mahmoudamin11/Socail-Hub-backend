import express from "express";
import { report } from "../controllers/report.js";
import { getUserReports } from "../controllers/report.js";

import {verifyToken} from "../verifyToken.js"

const router = express.Router();

// Report endpoint
router.post("/report", verifyToken, report);
router.get("/user-reports", verifyToken, getUserReports);

export default router;
