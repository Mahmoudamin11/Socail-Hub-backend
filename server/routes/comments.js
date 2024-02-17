import express from "express";
import { addComment, deleteComment, getCommentsByObjectId } from "../controllers/comment.js";
import {verifyToken} from "../verifyToken.js"
const router = express.Router();

router.post("/", verifyToken, addComment)
router.delete("/:id", verifyToken, deleteComment)
router.get("/:objectId", getCommentsByObjectId)

export default router;
