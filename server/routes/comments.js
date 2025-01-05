import express from "express";
import { addComment, deleteComment, getReplies,addReply, getCommentsByObjectId } from "../controllers/comment.js";
import {verifyToken} from "../verifyToken.js"
const router = express.Router();

router.post("/", verifyToken, addComment)
router.post("/addReply", verifyToken, addReply)
router.delete("/:id", verifyToken, deleteComment)
router.get("/:objectId",verifyToken, getCommentsByObjectId)
router.get('/replies/:commentId',verifyToken, getReplies);

export default router;
