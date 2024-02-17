import { createError } from "../error.js";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Post from "../models/Post.js";




export const update = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id,
        {
          $set: req.body,
        },
        { new: true }
      );
      res.status(200).json(updatedUser);
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can update only your account!"));
  }
};
export const deleteUser = async (req, res, next) => {
  if (req.params.id === req.user.id) {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.status(200).json("User has been deleted.");
    } catch (err) {
      next(err);
    }
  } else {
    return next(createError(403, "You can delete only your account!"));
  }
};


export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    res.status(200).json(user);
  } catch (err) {
    next(err);
  }
};
export const subscribe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const videoOwnerId = req.params.id;

    // Check if the current user is trying to subscribe to their own channel
    if (userId === videoOwnerId) {
      return res.status(400).json("You cannot subscribe to your own channel.");
    }

    // Update the user who owns the channel (add the subscriber's ID)
    await User.findByIdAndUpdate(videoOwnerId, {
      $push: { SubscribersOrFollowers: userId }
    });

    // Update the current user (add the channel owner's ID to subscribed channels)
    await User.findByIdAndUpdate(userId, {
      $push: { SubscriberedOrFollowed: videoOwnerId }
    });

    res.status(200).json("Subscription successful.");
  } catch (err) {
    next(err);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const videoOwnerId = req.params.id;

    // Check if the current user is trying to unsubscribe from their own channel
    if (userId === videoOwnerId) {
      return res.status(400).json("You cannot unsubscribe from your own channel.");
    }

    // Update the user who owns the channel (remove the subscriber's ID)
    await User.findByIdAndUpdate(videoOwnerId, {
      $pull: { SubscribersOrFollowers: userId }
    });

    // Update the current user (remove the channel owner's ID from subscribed channels)
    await User.findByIdAndUpdate(userId, {
      $pull: { SubscriberedOrFollowed: videoOwnerId }
    });

    res.status(200).json("Unsubscription successful.");
  } catch (err) {
    next(err);
  }
};




export const like = async (req, res, next) => {
  const userId = req.user.id;
  const videoId = req.params.videoId;
  const postId = req.params.postId; // Ensure the parameter name matches exactly

  try {
    if (postId) {
      // If postId is provided, update the post
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { likes: userId },
        $pull: { dislikes: userId }
      });
      res.status(200).json({ message: "The post has been liked." }); // Return a JSON response
    } else if (videoId) {
      // If videoId is provided, update the video
      await Video.findByIdAndUpdate(videoId, {
        $addToSet: { likes: userId },
        $pull: { dislikes: userId }
      });
      res.status(200).json({ message: "The video has been liked." }); // Return a JSON response
    } else {
      // Handle the case when neither postId nor videoId is provided
      res.status(400).json({ error: "Invalid request: postId or videoId is required." }); // Return a JSON response
    }
  } catch (err) {
    next(err);
  }
};

export const dislike = async (req, res, next) => {
    const id = req.user.id;
    const videoId = req.params.videoId;
    try {
      await Video.findByIdAndUpdate(videoId,{
        $addToSet:{dislikes:id},
        $pull:{likes:id}
      })
      res.status(200).json("The video has been disliked.")
  } catch (err) {
    next(err);
  }
};
