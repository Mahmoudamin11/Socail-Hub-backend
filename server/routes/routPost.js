import express from "express";
import {
  addPost,
  deletePost,
  random,
  updatePost,
  
  getPostsById,
  likePost,
  dislikePost,
  savePost,
  unsavePost,
  copyUrl,
  getSavedPosts
  
} from "../controllers/Post.js";
import { verifyToken } from "../verifyToken.js";

const router = express.Router();

//update user
router.post("/", verifyToken,addPost);

//delete user
router.delete("/:id", verifyToken,deletePost);

//get a user
router.get("/find/:id", getPostsById);

router.put("/:id",verifyToken,updatePost)

router.get("/random/:id",random);
router.post("/savePost/:id",verifyToken,savePost);
router.post("/unsavePost/:id",verifyToken,unsavePost);

router.post("/:id/like", verifyToken, likePost);
router.post("/:id/dislike", verifyToken, dislikePost);
router.get("/:id/copyUrl", copyUrl);
router.get("/getSavedPosts",verifyToken,getSavedPosts);


//dislike a video


export default router;
