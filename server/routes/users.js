import express from "express";
import {
  update,
  deleteUser,
  getUser,
  subscribe,
  unsubscribe,
  likeOnVideo,
  dislikeOnVideo,
  sendFriendRequest,
  acceptFriendRequest,
  getMutualFriends,
  blockUser,
  unblockUser,
  advancedUserSearch,
  getRandomUsers
} from "../controllers/user.js";
import { verifyToken } from "../verifyToken.js";

const router = express.Router();

// Update user
router.put("/:id", verifyToken, update);

// Delete user
router.delete("/:id", verifyToken, deleteUser);

// Get a user
router.get("/find/:id", getUser);
router.get("/getRandomUsers",verifyToken, getRandomUsers);

router.get("/getMutual/:id",verifyToken, getMutualFriends);

// Subscribe a user
router.put("/sub/:id", verifyToken, subscribe);

// Unsubscribe a user
router.put("/unsub/:id", verifyToken, unsubscribe);

// Like a video
router.put("/like/:videoId", verifyToken, likeOnVideo);

// Dislike a video
router.put("/dislike/:videoId", verifyToken, dislikeOnVideo);

// Send friend request
router.put("/send-request/:receiverId", verifyToken, sendFriendRequest);

// Accept friend request
router.put("/accept-request/:senderId", verifyToken, acceptFriendRequest);


// Block user route
router.post("/block",verifyToken, blockUser);
router.post("/Search_Users_Name",verifyToken,advancedUserSearch );

router.post("/unblock",verifyToken, unblockUser);



export default router;
