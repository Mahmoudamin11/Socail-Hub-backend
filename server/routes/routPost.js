import express from "express";
import {
  addPost,
  deletePost,
  random,
  updatePost,
  MatualFrind,
  getPostsById,
  likePost,
  dislikePost,
} from "../controllers/Post.js";
import { verifyToken } from "../verifyToken.js";

const router = express.Router();

//update user
router.post("/", verifyToken, addPost);

//delete user
router.delete("/:id", verifyToken, deletePost);

//get a user
router.get("/find/:id", getPostsById);

router.put("/:id",verifyToken, updatePost)

router.get("/random/:id",random);

router.post("/:id/like", verifyToken, likePost);
router.post("/:id/dislike", verifyToken, dislikePost);


//dislike a video
router.get("/matual", verifyToken, MatualFrind);


export default router;
